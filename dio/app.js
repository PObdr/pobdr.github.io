const $ = (id) => document.getElementById(id);
const map = L.map('map').setView([50.0755, 14.4378], 17);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const base = 'https://gs-pub.praha.eu/arcgis/rest/services/dtmp/dtmp/MapServer';
const sources = [
  { id: 15, name: 'IPR plochy', kind: 'area' },
  { id: 10, name: 'IPR linie', kind: 'line' },
  { id: 9, name: 'IPR body', kind: 'point' }
];
let bounds = null;
let first = null;
let selecting = false;
let rectangle = null;
let overlay = null;
let data = null;

function status(text) {
  $('status').textContent = text;
}

function metrics(box) {
  const y = 6371008.8 * Math.PI / 180;
  const x = y * Math.cos(box.getCenter().lat * Math.PI / 180);
  return {
    width: (box.getEast() - box.getWest()) * x,
    height: (box.getNorth() - box.getSouth()) * y,
    project: ([lon, lat]) => [(lon - box.getWest()) * x, (box.getNorth() - lat) * y]
  };
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(json.error.message || 'Chyba služby');
  if (json.remark) throw new Error(json.remark);
  return json;
}

async function ipr(source, box) {
  const metadata = await request(`${base}/${source.id}?f=json`);
  const oid = metadata.objectIdField || metadata.fields?.find((field) => field.type === 'esriFieldTypeOID')?.name;
  if (!oid) throw new Error('Chybí identifikátor pro bezpečné stránkování');
  const features = [];
  for (let page = 0; page < 50; page += 1) {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      geometry: [box.getWest(), box.getSouth(), box.getEast(), box.getNorth()].join(','),
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      outFields: '*',
      returnGeometry: 'true',
      orderByFields: `${oid} ASC`,
      resultOffset: String(features.length),
      resultRecordCount: '1000'
    });
    const json = await request(`${base}/${source.id}/query?${params}`);
    features.push(...(json.features || []));
    if (!json.exceededTransferLimit) return features;
    if (!json.features?.length) throw new Error('Neúplná stránka');
  }
  throw new Error('Příliš mnoho prvků; zmenši výřez');
}

async function osm(box) {
  const bbox = [box.getSouth(), box.getWest(), box.getNorth(), box.getEast()].join(',');
  const keys = 'building|highway|traffic_sign|natural|barrier|amenity|public_transport|railway|man_made|emergency|power|leisure|landuse|waterway|tourism|historic|advertising|entrance';
  const query = `[out:json][timeout:60];(node[~"^(${keys})$"~"."](${bbox});way[~"^(${keys})$"~"."](${bbox}););out body geom;`;
  const json = await request('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: new URLSearchParams({ data: query })
  });
  return json.elements || [];
}

function osmCategory(tags) {
  if (tags.traffic_sign) return 'Dopravní značky – neověřeno';
  if (tags.natural === 'tree') return 'Stromy';
  if (tags.natural === 'tree_row') return 'Stromořadí';
  if (tags.barrier) return `Bariéry / ${tags.barrier}`;
  if (tags.public_transport || tags.highway === 'bus_stop' || tags.railway === 'tram_stop') {
    return `Zastávky / ${tags.public_transport || tags.highway || tags.railway}`;
  }
  if (tags.building) return 'Budovy';
  if (tags.highway === 'street_lamp') return 'Lampy';
  if (tags.highway === 'crossing') return 'Přechody – body';
  if (tags.highway) return `Komunikace / ${tags.highway} – osy nebo plochy`;
  for (const key of ['amenity', 'railway', 'natural', 'man_made', 'emergency', 'power', 'leisure', 'landuse', 'waterway', 'tourism', 'historic', 'advertising', 'entrance']) {
    if (tags[key]) return `${key} / ${tags[key]}`;
  }
  return 'Ostatní';
}

function aboveGround(tags) {
  return tags.location !== 'underground' && tags.tunnel !== 'yes' && !(Number(tags.layer) < 0);
}

function buildLayers(results) {
  const groups = new Map();
  function add(key, label, feature) {
    if (!groups.has(key)) groups.set(key, { key, label, visible: true, features: [] });
    groups.get(key).features.push(feature);
  }
  sources.forEach((source, index) => {
    if (results[index].status !== 'fulfilled') return;
    for (const feature of results[index].value) {
      const a = feature.attributes || {};
      const code = a.CTMTP_KOD ?? a.CTVUK_KOD ?? 'ostatni';
      const label = a.CTMTP_POPIS || a.CTVUK_POPIS || `Kód ${code}`;
      add(`ipr-${source.id}-${code}`, `${source.name} / ${code} / ${label}`, {
        kind: source.kind,
        geometry: feature.geometry,
        attributes: a
      });
    }
  });
  if (results[3].status === 'fulfilled') {
    for (const item of results[3].value) {
      const tags = item.tags || {};
      if (!aboveGround(tags)) continue;
      const category = osmCategory(tags);
      const geometry = item.type === 'node'
        ? { x: item.lon, y: item.lat }
        : { paths: [(item.geometry || []).map((p) => [p.lon, p.lat])] };
      const closed = item.nodes?.length > 3 && item.nodes[0] === item.nodes.at(-1);
      const area = closed && tags.area !== 'no' && (tags.area === 'yes' || tags.building || tags.landuse || tags.leisure || tags.amenity === 'parking' || tags.natural === 'water');
      if (area) geometry.rings = geometry.paths;
      add(`osm-${category}`, `OSM / ${category}`, {
        kind: item.type === 'node' ? 'point' : area ? 'area' : 'line',
        geometry,
        attributes: { osm_id: `${item.type}/${item.id}`, ...tags }
      });
    }
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'cs'));
}

function xml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[c]);
}

function svg(preview = false) {
  const { width, height, project } = metrics(data.box);
  const scale = Number($('scale').value);
  const path = (points, closed) => {
    if (!points?.length) return '';
    return `M ${points.map((p) => project(p).map((v) => v.toFixed(3)).join(',')).join(' L ')}${closed ? ' Z' : ''}`;
  };
  function featureMarkup(feature) {
    const g = feature.geometry;
    if (!g) return '';
    const title = `<title>${xml(JSON.stringify(feature.attributes))}</title>`;
    if (feature.kind === 'point') {
      if (!Number.isFinite(g.x) || !Number.isFinite(g.y)) return '';
      const [x, y] = project([g.x, g.y]);
      return `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)})">${title}<circle r="0.65" fill="white"/><path d="M -0.9 0 H 0.9 M 0 -0.9 V 0.9"/>${feature.attributes.traffic_sign ? `<text x="1.1" y="0" fill="currentColor" stroke="none" font-size="1.7">${xml(feature.attributes.traffic_sign)}</text>` : ''}</g>`;
    }
    const area = feature.kind === 'area';
    const parts = area ? g.rings : g.paths;
    return `<path d="${(parts || []).map((p) => path(p, area)).join(' ')}" fill="${area ? '#eeeeee' : 'none'}" fill-rule="evenodd">${title}</path>`;
  }
  const ordered = [...data.layers].sort((a, b) => {
    const rank = { area: 0, line: 1, point: 2 };
    return rank[a.features[0].kind] - rank[b.features[0].kind];
  });
  const layers = ordered.map((layer, index) => {
    const color = layer.features[0].kind === 'point' ? '#9f1239' : layer.features[0].kind === 'line' ? '#475569' : '#888888';
    return `  <g id="layer-${index}" inkscape:groupmode="layer" inkscape:label="${xml(layer.label)}" style="display:${layer.visible ? 'inline' : 'none'}" clip-path="url(#clip)" stroke="${color}" color="${color}" stroke-width="0.15" fill="none">
${layer.features.map(featureMarkup).join('\n')}
  </g>`;
  }).join('\n');
  const totalHeight = height + (preview ? 0 : 12);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width * 1000 / scale}mm" height="${totalHeight * 1000 / scale}mm" viewBox="0 0 ${width} ${totalHeight}" font-family="sans-serif">
  <title>DIO – pracovní podklad; ověřit v terénu</title>
  <desc>${xml(JSON.stringify({ bbox: data.box.toBBoxString(), date: data.date, errors: data.errors, projection: 'Local approximate equirectangular', warning: 'Incomplete data; symbolic point sizes; no cross-source deduplication; OSM relations omitted' }))}</desc>
  <defs>
    <clipPath id="clip"><rect width="${width}" height="${height}"/></clipPath>
  </defs>
  <g id="background" inkscape:groupmode="layer" inkscape:label="Pozadí">
    <rect width="${width}" height="${totalHeight}" fill="white"/>
  </g>
${layers}
  <g id="legend" inkscape:groupmode="layer" inkscape:label="Rám a zdroje">
    <rect width="${width}" height="${height}" fill="none" stroke="black" stroke-width="0.15"/>
    ${preview ? '' : `<text x="1" y="${height + 4}" font-size="${Math.min(1.8, width / 180)}">PRACOVNÍ PODKLAD – OVĚŘIT | 1:${scale} | IPR Praha; © OSM contributors, ODbL | ${data.date.slice(0, 10)}${data.errors.length ? ' | NEÚPLNÁ DATA' : ''}</text><path d="M 1 ${height + 7} h ${Math.min(10, width / 3)}" stroke="black" stroke-width="0.3"/><text x="1" y="${height + 10}" font-size="1.5">${Math.min(10, width / 3).toFixed(1)} m</text>`}
  </g>
</svg>`;
}

function refresh() {
  if (!data) return;
  if (overlay) map.removeLayer(overlay);
  const doc = new DOMParser().parseFromString(svg(true), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Neplatný SVG dokument');
  overlay = L.svgOverlay(doc.documentElement, data.box, { interactive: false }).addTo(map);
  if (rectangle) rectangle.bringToFront();
}

function layerControls() {
  $('layers').replaceChildren();
  for (const layer of data.layers) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = layer.visible;
    input.onchange = () => {
      layer.visible = input.checked;
      refresh();
    };
    label.append(input, ` ${layer.label} (${layer.features.length})`);
    $('layers').append(label);
  }
}

$('select').onclick = () => {
  selecting = true;
  first = null;
  bounds = null;
  data = null;
  $('load').disabled = true;
  $('export').disabled = true;
  $('layers').replaceChildren();
  if (overlay) map.removeLayer(overlay);
  if (rectangle) map.removeLayer(rectangle);
  map.getContainer().style.cursor = 'crosshair';
  status('Klikni na první a potom protilehlý roh.');
};

map.on('click', ({ latlng }) => {
  if (!selecting) return;
  if (!first) {
    first = latlng;
    status('Klikni na protilehlý roh.');
    return;
  }
  const box = L.latLngBounds(first, latlng);
  const { width, height } = metrics(box);
  selecting = false;
  map.getContainer().style.cursor = '';
  if (Math.min(width, height) < 5 || Math.max(width, height) > 550) {
    status('Vyber znovu: každá strana musí mít 5–550 m.');
    return;
  }
  bounds = box;
  rectangle = L.rectangle(box, { fillOpacity: 0.02 }).addTo(map);
  $('load').disabled = false;
  status(`Výřez ${Math.round(width)} × ${Math.round(height)} m.`);
});

$('load').onclick = async () => {
  if (!bounds) return;
  $('load').disabled = true;
  $('select').disabled = true;
  $('export').disabled = true;
  data = null;
  $('layers').replaceChildren();
  if (overlay) map.removeLayer(overlay);
  status('Načítám plochy, všechny polohopisné body a linie IPR a povrchové objekty OSM…');
  try {
    const results = await Promise.allSettled([...sources.map((s) => ipr(s, bounds)), osm(bounds)]);
    const names = [...sources.map((s) => s.name), 'OSM'];
    const errors = results.flatMap((r, i) => r.status === 'rejected' ? [`${names[i]}: ${r.reason.message}`] : []);
    if (errors.length === results.length) throw new Error(errors.join('\n'));
    data = { box: bounds, date: new Date().toISOString(), errors, layers: buildLayers(results) };
    layerControls();
    refresh();
    $('export').disabled = false;
    const count = data.layers.reduce((sum, layer) => sum + layer.features.length, 0);
    status(`${count} objektů v ${data.layers.length} vrstvách.\n${errors.length ? 'NEÚPLNÁ DATA:\n' + errors.join('\n') : 'Načteno; nejde o úplný pasport.'}`);
  } catch (error) {
    status(`Chyba: ${error.message}`);
  } finally {
    $('load').disabled = false;
    $('select').disabled = false;
  }
};

$('scale').onchange = refresh;
$('export').onclick = () => {
  if (!data) return;
  const url = URL.createObjectURL(new Blob([svg()], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dio-povrch-vrstvy.svg';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
