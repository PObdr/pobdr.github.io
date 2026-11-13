import { classify, frame } from '../core/model.js';
import { loadLamps } from './lamps.js';
import { selectedSets, selectedFeatures } from '../core/sets.js';

const root = 'https://gs-pub.praha.eu/arcgis/rest/services';
const definitions = [
  ['IPR plochy', 'dtmp/dtmp/MapServer/15', ['base', 'vegetation']],
  ['IPR linie', 'dtmp/dtmp/MapServer/10', ['transport', 'equipment', 'terrain', 'control']],
  ['IPR body', 'dtmp/dtmp/MapServer/9', ['equipment', 'vegetation', 'transport', 'control']],
  ['SMZ body', 'opk/smz_vegetacni_prvky/MapServer/0', ['vegetation']],
  ['SMZ linie', 'opk/smz_vegetacni_prvky/MapServer/1', ['vegetation']],
  ['SMZ plochy', 'opk/smz_vegetacni_prvky/MapServer/2', ['vegetation']],
  ['TSK úseky stání', 'dop/zony_placeneho_stani/MapServer/3', ['transport']],
  ['TSK ZTP 5', 'dop/zony_placeneho_stani/MapServer/5', ['transport']],
  ['TSK ZTP 6', 'dop/zony_placeneho_stani/MapServer/6', ['transport']],
  ['TSK zásobování', 'dop/zony_placeneho_stani/MapServer/7', ['transport']],
  ['TSK speciální stání', 'dop/zony_placeneho_stani/MapServer/8', ['transport']],
  ['TSK úseky zákazu stání', 'dop/zony_placeneho_stani/MapServer/9', ['transport']]
];
let cachedBox = '';
const cache = new Map();

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.error || json.remark) throw new Error(json.error?.message || json.remark);
  return json;
}

async function arcgis(path, bbox, progress) {
  const url = `${root}/${path}`;
  progress('metadata');
  const meta = await request(`${url}?f=json`);
  const oid = meta.objectIdField || meta.fields?.find((f) => f.type === 'esriFieldTypeOID')?.name;
  if (!oid) throw new Error('Chybí identifikátor pro stránkování');
  const features = [];
  for (let page = 0; page < 50; page += 1) {
    progress(`stránka ${page + 1}, zatím ${features.length} objektů`);
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
    if (!result.features?.length) throw new Error('Neúplná odpověď');
  }
  throw new Error('Zmenši výřez: příliš mnoho objektů');
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
  return (await request('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: new URLSearchParams({ data: q })
  })).elements || [];
}

export async function load(bbox, progress = () => {}, options = {}) {
  const selected = selectedSets(options.sets);
  const wanted = new Set([...selected, ...(options.diagnostic ? ['control'] : [])]);
  const boxKey = bbox.join(',');
  if (boxKey !== cachedBox) {
    cache.clear();
    cachedBox = boxKey;
  }
  const { project, width, height } = frame(bbox);
  function normalize(source, identity, attrs, geometry) {
    return normalizeGeometry(geometry, project).filter((f) => f.kind !== 'point' || (f.coords[0] >= 0 && f.coords[1] >= 0 && f.coords[0] <= width && f.coords[1] <= height)).map((f, i) => ({
      ...f, id: `${source}:${identity}:${i}`, source, category: classify(source, attrs, f.kind), attrs
    }));
  }
  const jobs = definitions.filter((d) => d[2].some((s) => wanted.has(s))).map(([name, path, sets]) => ({
    name, sets,
    run: async (notify) => {
      const result = await arcgis(path, bbox, notify);
      return result.features.flatMap((f) => normalize(name, f.attributes.ID_CENTRAL || f.attributes[result.oid], f.attributes, f.geometry));
    }
  }));
  jobs.push({ name: 'OSM', sets: selected, run: async () => (await osm(bbox)).flatMap((item) => {
    const a = item.tags || {};
    let geometry;
    if (item.type === 'node') geometry = { x: item.lon, y: item.lat };
    else {
      const path = (item.geometry || []).map((p) => [p.lon, p.lat]);
      const closed = item.nodes?.length > 3 && item.nodes[0] === item.nodes.at(-1);
      const area = closed && a.area !== 'no' && (a.area === 'yes' || a.building || a.landuse || a.leisure || a.amenity === 'parking' || a.natural === 'water');
      geometry = area ? { rings: [path] } : { paths: [path] };
    }
    return normalize('OSM', `${item.type}/${item.id}`, { ...a, osm_id: `${item.type}/${item.id}` }, geometry);
  }) });
  if (wanted.has('equipment')) jobs.push({ name: 'THMP', sets: ['equipment'], run: (notify) => loadLamps(bbox, notify) });
  const raw = [];
  const errors = [];
  const states = {};
  const notify = (job, text) => {
    states[job.name] = text;
    progress(Object.entries(states).map(([name, state]) => `${name}: ${state}`).join('\n'));
  };
  for (const job of jobs) states[job.name] = 'čeká';
  const queue = [...jobs];
  const failed = new Set();
  let success = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        let features = cache.get(job.name);
        if (!features) {
          notify(job, 'načítám');
          features = await job.run((text) => notify(job, text));
          cache.set(job.name, features);
        }
        raw.push(...features);
        success += 1;
        notify(job, `načteno ${features.length} (uloženo pro tento výřez)`);
      } catch (error) {
        failed.add(job.name);
        errors.push(`${job.name}: ${error.message}`);
        notify(job, `CHYBA: ${error.message}`);
      }
    }
  }));
  if (!success) throw new Error(errors.join('\n'));
  const coverage = Object.fromEntries(selected.map((id) => {
    const dependencies = jobs.filter((j) => j.sets.includes(id));
    const failures = dependencies.filter((j) => failed.has(j.name)).length;
    return [id, failures === 0 ? 'loaded' : failures === dependencies.length ? 'failed' : 'partial'];
  }));
  return {
    version: 2, bbox, raw: selectedFeatures(raw, selected, options.diagnostic), errors,
    date: new Date().toISOString(), decisions: {}, visibility: {}, selectedSets: selected, coverage
  };
}
