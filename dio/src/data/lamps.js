import { frame } from '../core/model.js';

const memory = new Map();
const base = new URL('../../data/lamps/', import.meta.url);

async function getJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Osvětlení: HTTP ${response.status}; datová úloha možná ještě neběžela`);
  return response.json();
}

export async function loadLamps(bbox, progress = () => {}) {
  const manifest = await getJson(new URL('manifest.json', base), { cache: 'no-cache' });
  if (manifest.version !== 1) throw new Error('Nepodporovaná verze lamp');
  const [w, s, e, n] = bbox;
  const keys = [];
  for (let x = Math.floor(w * 100); x <= Math.floor(e * 100); x += 1) {
    for (let y = Math.floor(s * 100); y <= Math.floor(n * 100); y += 1) {
      if (manifest.tiles[`${x}_${y}`]) keys.push(`${x}_${y}`);
    }
  }
  const { project } = frame(bbox);
  const features = [];
  let completed = 0;
  for (const key of keys) {
    const path = manifest.tiles[key];
    if (!/^tiles\/[0-9]+_[0-9]+-[a-f0-9]+\.json$/.test(path)) throw new Error('Neplatná cesta dlaždice');
    const url = new URL(path, base).href;
    if (!memory.has(url)) {
      memory.set(url, await getJson(url, { cache: 'force-cache' }));
      if (memory.size > 64) memory.delete(memory.keys().next().value);
    }
    for (const row of memory.get(url)) {
      if (row.lon < w || row.lon > e || row.lat < s || row.lat > n) continue;
      const lamp = ['stožár elektrického osvětlení', 'stožár plynového osvětlení', 'osvětlení přechodu'].includes(row.type);
      const attrs = { lamp_number: row.id, ref: row.id, device_type: row.type, description: row.description, cadastre: row.cadastre, source_url: manifest.source, source_version: manifest.sha256, checked: manifest.checked };
      const feature = { id: `THMP:${row.id}`, source: 'THMP', category: lamp ? 'Lampy' : `Neurčené / osvětlení / ${row.type || 'neurčeno'}`, kind: 'point', coords: project([row.lon, row.lat]), attrs };
      features.push(feature);
      features.push({ ...feature, id: `THMP-label:${row.id}`, category: lamp ? 'Čísla lamp' : 'Neurčené / čísla zařízení' });
    }
    completed += 1;
    progress(`THMP: ${completed}/${keys.length} dlaždic; kontrola zdroje ${manifest.checked.slice(0, 10)}`);
  }
  return features;
}
