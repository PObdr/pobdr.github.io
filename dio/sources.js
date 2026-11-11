import { classify, frame } from './model.js';

const root = 'https://gs-pub.praha.eu/arcgis/rest/services';
const definitions = [
  ['IPR plochy', 'dtmp/dtmp/MapServer/15'],
  ['IPR linie', 'dtmp/dtmp/MapServer/10'],
  ['IPR body', 'dtmp/dtmp/MapServer/9'],
  ['SMZ body', 'opk/smz_vegetacni_prvky/MapServer/0'],
  ['SMZ linie', 'opk/smz_vegetacni_prvky/MapServer/1'],
  ['SMZ plochy', 'opk/smz_vegetacni_prvky/MapServer/2'],
  ['TSK úseky stání', 'dop/zony_placeneho_stani/MapServer/3'],
  ['TSK ZTP 5', 'dop/zony_placeneho_stani/MapServer/5'],
  ['TSK ZTP 6', 'dop/zony_placeneho_stani/MapServer/6'],
  ['TSK zásobování', 'dop/zony_placeneho_stani/MapServer/7'],
  ['TSK speciální stání', 'dop/zony_placeneho_stani/MapServer/8'],
  ['TSK úseky zákazu stání', 'dop/zony_placeneho_stani/MapServer/9']
];

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.error || json.remark) throw new Error(json.error?.message || json.remark);
  return json;
}

async function arcgis(path, bbox) {
  const url = `${root}/${path}`;
  const meta = await request(`${url}?f=json`);
  const oid = meta.objectIdField || meta.fields?.find((f) => f.type === 'esriFieldTypeOID')?.name;
  if (!oid) throw new Error('Chybí OBJECTID pro stránkování');
  const features = [];
  for (let page = 0; page < 50; page += 1) {
    const params = new URLSearchParams({
      f: 'json', where: '1=1', geometry: bbox.join(','),
      geometryType: 'esriGeometryEnvelope', spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326', outSR: '4326', datumTransformation: '1623',
      outFields: '*', returnGeometry: 'true', orderByFields: `${oid} ASC`,
      resultOffset: String(features.length), resultRecordCount: '1000'
    });
    const result = await request(`${url}/query?${params}`);
    features.push(...(result.features || []));
    if (!result.exceededTransferLimit) return { features, oid };
    if (!result.features?.length) throw new Error('Prázdná stránka neúplné odpovědi');
  }
  throw new Error('Příliš mnoho objektů; zmenši výřez');
}

export function normalizeGeometry(g, project) {
  if (!g) return [];
  if (Number.isFinite(g.x) && Number.isFinite(g.y)) return [{ kind: 'point', coords: project([g.x, g.y]) }];
  if (g.points) return g.points.map((p) => ({ kind: 'point', coords: project(p) }));
  if (g.rings) return [{ kind: 'area', coords: g.rings.map((r) => r.map(project)) }];
  if (g.paths) return [{ kind: 'line', coords: g.paths.map((r) => r.map(project)) }];
  return [];
}

async function osm(bbox) {
  const [w, s, e, n] = bbox;
  const keys = 'building|highway|traffic_sign|natural|barrier|amenity|public_transport|railway|man_made|emergency|power|leisure|landuse|waterway|tourism|historic|advertising|entrance';
  const q = `[out:json][timeout:60];(node[~"^(${keys})$"~"."](${s},${w},${n},${e});way[~"^(${keys})$"~"."](${s},${w},${n},${e}););out body geom;`;
  const json = await request('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: new URLSearchParams({ data: q })
  });
  return json.elements || [];
}

export async function load(bbox, progress = () => {}) {
  const { project, width, height } = frame(bbox);
  const raw = [];
  const errors = [];
  function add(source, identity, attrs, geometry) {
    normalizeGeometry(geometry, project).forEach((f, i) => {
      if (f.kind === 'point' && (f.coords[0] < 0 || f.coords[1] < 0 || f.coords[0] > width || f.coords[1] > height)) return;
      const category = classify(source, attrs, f.kind);
      raw.push({ ...f, id: `${source}:${identity}:${i}`, source, category, attrs });
    });
  }
  let successes = 0;
  // Three workers bound load on public services; failures remain visible and do not cancel other sources.
  const queue = [...definitions];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const [source, path] = queue.shift();
      progress(source);
      try {
        const result = await arcgis(path, bbox);
        for (const f of result.features) {
          const a = f.attributes || {};
          add(source, a.ID_CENTRAL || a[result.oid], a, f.geometry);
        }
        successes += 1;
      } catch (error) {
        errors.push(`${source}: ${error.message}`);
      }
    }
  }));
  try {
    progress('OSM');
    for (const item of await osm(bbox)) {
      const a = item.tags || {};
      let geometry;
      if (item.type === 'node') geometry = { x: item.lon, y: item.lat };
      else {
        const path = (item.geometry || []).filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat)).map((p) => [p.lon, p.lat]);
        const closed = item.nodes?.length > 3 && item.nodes[0] === item.nodes.at(-1);
        const area = closed && a.area !== 'no' && (a.area === 'yes' || a.building || a.landuse || a.leisure || a.amenity === 'parking' || a.natural === 'water');
        geometry = area ? { rings: [path] } : { paths: [path] };
      }
      add('OSM', `${item.type}/${item.id}`, { ...a, osm_id: `${item.type}/${item.id}` }, geometry);
    }
    successes += 1;
  } catch (error) {
    errors.push(`OSM: ${error.message}`);
  }
  if (!successes) throw new Error(errors.join('\n'));
  return { version: 2, bbox, raw, errors, date: new Date().toISOString(), decisions: {}, visibility: {} };
}
