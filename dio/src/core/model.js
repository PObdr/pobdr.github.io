import { markedCrossing } from '../crossings/crossings.js';

export function frame(bbox) {
  const [west, south, east, north] = bbox;
  const y = 6371008.8 * Math.PI / 180;
  const x = y * Math.cos((south + north) * Math.PI / 360);
  return {
    width: (east - west) * x,
    height: (north - south) * y,
    project: ([lon, lat]) => [(lon - west) * x, (north - lat) * y]
  };
}

const points = new Map([
  [26015, 'Trakční sloupy'], [75240, 'Označníky'], [75241, 'Označníky na objektu'],
  [74110, 'Patníky'], [83130, 'Stromy'], [76010, 'Ostatní sloupy'],
  [75245, 'Jízdenkové automaty'], [98110, 'Studny']
]);
const lines = new Map([
  [55010, 'Tramvajové koleje'], [51100, 'Železniční koleje'], [55018, 'Vlečky'],
  [61530, 'Zábradlí'], [71522, 'Svodidla'], [71540, 'Svodidla'],
  [61209, 'Ploty a zdi'], [61210, 'Ploty a zdi'], [71210, 'Ploty a zdi'],
  [81210, 'Ploty a zdi'], [91210, 'Ploty a zdi'], [61422, 'Opěrné zdi'],
  [71422, 'Opěrné zdi'], [81422, 'Opěrné zdi'], [81214, 'Živé ploty'],
  [42105, 'Hrany svahů'], [42107, 'Hrany svahů'], [91853, 'Odvodňovací žlaby'],
  [31800, 'Obrysy budov IPR'], [81800, 'Chodníky IPR'], [76420, 'Portály tunelů'],
  [71800, 'Komunikace a přístřešky IPR'], [61423, 'Vjezdy']
]);
const hidden = new Set([21950, 71850, 76430, 91850, 55015, 21910, 60409, 60410, 71430, 71810, 81810, 91852]);
const auxiliary = new Set([99810, 99811, 99812, 1950, 1980, 1981, 42100, 60408]);

export function classify(source, a, kind) {
  if (source.startsWith('SMZ')) {
    return ({ 70: 'Stromy', 50: 'Keře', 20: 'Zeleň v nádobách', 100: 'Popínavé dřeviny', 60: 'Skupiny stromů', 80: 'Stromořadí', 130: 'Živé ploty', 120: 'Trávníky', 10: 'Záhony' })[a.KOD_SK_VP] || 'Ostatní vegetace';
  }
  if (source.startsWith('TSK')) return source;
  if (source === 'IPR plochy') return a.CTVUK_KOD === 601 ? 'Budovy IPR' : `Plochy / ${a.CTVUK_POPIS || a.CTVUK_KOD}`;
  if (source.startsWith('IPR')) {
    const code = Number(a.CTMTP_KOD);
    if (hidden.has(code)) return `Zakryté a podzemní / ${a.CTMTP_POPIS || code}`;
    if (auxiliary.has(code)) return `Pomocná kresba / ${a.CTMTP_POPIS || code}`;
    return (kind === 'point' ? points : lines).get(code) || `Neurčené / ${a.CTMTP_POPIS || code}`;
  }
  if (a.location === 'underground' || (a.tunnel && a.tunnel !== 'no')) return 'Zakryté a podzemní / OSM';
  if (source === 'OSM' && markedCrossing(a)) return 'Přechody OSM – doložené značení';
  if (a.traffic_sign) return 'Značky OSM – neověřené';
  if (a.natural === 'tree') return 'Stromy';
  if (a.natural === 'tree_row') return 'Stromořadí';
  if (a.highway === 'street_lamp') return 'Lampy';
  if (a.barrier === 'bollard') return 'Patníky';
  if (a.public_transport === 'stop_position') return 'Místa zastavení vozidel';
  if (a.highway === 'bus_stop') return 'Označníky';
  if (a.public_transport === 'platform' || a.railway === 'platform') return 'Nástupiště';
  if (a.amenity === 'shelter') return 'Přístřešky';
  if (a.building) return 'Budovy OSM';
  if (a.railway === 'tram') return 'Tramvajové koleje';
  if (a.railway === 'rail') return 'Železniční koleje';
  if (a.barrier) return `Bariéry / ${a.barrier}`;
  if (a.vending === 'public_transport_tickets') return 'Jízdenkové automaty';
  const amenities = { bench: 'Lavičky', waste_basket: 'Koše', bicycle_parking: 'Stojany na kola', parking: 'Parkování OSM' };
  if (amenities[a.amenity]) return amenities[a.amenity];
  if (a.highway) return `Komunikace OSM / ${a.highway}`;
  return `Ostatní OSM / ${a.amenity || a.natural || a.man_made || a.railway || 'objekty'}`;
}

export const visibleByDefault = (category) => !/^(Zakryté|Pomocná|Neurčené|Ostatní OSM|Komunikace OSM \/)/.test(category);
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}

export function reconcile(raw, decisions = {}) {
  const output = raw.map((f) => ({ ...f, members: [f.id], suppressed: false }));
  const candidates = [];
  const pointTypes = new Set(['Stromy', 'Lampy', 'Jízdenkové automaty']);
  for (const type of pointTypes) {
    const group = output.filter((f) => f.category === type && f.kind === 'point');
    const eligible = (a, b) => a.source !== b.source && a.id !== b.id;
    for (const a of group) {
      const near = group.filter((b) => eligible(a, b) && distance(a.coords, b.coords) <= 2);
      for (const b of near) {
        if (a.id >= b.id) continue;
        const reverse = group.filter((c) => eligible(b, c) && distance(b.coords, c.coords) <= 2);
        const key = [a.id, b.id].sort().join('|');
        const d = distance(a.coords, b.coords);
        const speciesA = a.attrs.TAXON_DRUH || a.attrs.species;
        const speciesB = b.attrs.TAXON_DRUH || b.attrs.species;
        const conflict = Boolean(speciesA && speciesB && speciesA.toLowerCase() !== speciesB.toLowerCase());
        const candidate = { key, a: a.id, b: b.id, distance: d, conflict, auto: near.length === 1 && reverse.length === 1 && d <= 1 && !conflict };
        candidates.push(candidate);
        const choice = decisions[key];
        if (choice === 'separate' || !(choice === 'merge' || candidate.auto)) continue;
        if (a.suppressed || b.suppressed || a.members.length > 1 || b.members.length > 1) continue;
        const rank = (f) => f.source.startsWith('IPR') ? 0 : f.source.startsWith('SMZ') ? 1 : 2;
        const [keep, drop] = rank(a) <= rank(b) ? [a, b] : [b, a];
        keep.members.push(drop.id);
        drop.suppressed = true;
        drop.reason = `Sloučeno do ${keep.id}; rozdíl ${d.toFixed(2)} m`;
      }
    }
  }
  // Suppress only complete OSM rail paths with dense, direction-compatible IPR coverage.
  for (const rail of output.filter((f) => f.source === 'OSM' && f.kind === 'line' && /^(Tramvajové|Železniční) koleje$/.test(f.category))) {
    const refs = output.filter((f) => f.source === 'IPR linie' && f.category === rail.category);
    const key = `rail|${rail.id}`;
    let total = 0;
    let covered = 0;
    const paths = rail.coords;
    for (const path of paths) {
      for (let i = 1; i < path.length; i += 1) {
        const a = path[i - 1];
        const b = path[i];
        const length = distance(a, b);
        const count = Math.max(1, Math.ceil(length / 0.5));
        for (let k = 0; k <= count; k += 1) {
          const p = [a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count];
          const found = refs.some((f) => f.coords.some((line) => line.slice(1).some((v, j) => {
            const u = line[j];
            const denominator = length * distance(u, v);
            const parallel = denominator > 0 && Math.abs(((b[0] - a[0]) * (v[0] - u[0]) + (b[1] - a[1]) * (v[1] - u[1])) / denominator) > 0.98;
            return parallel && segmentDistance(p, u, v) <= 0.5;
          })));
          total += 1;
          if (found) covered += 1;
        }
      }
    }
    if (total && covered === total && decisions[key] !== 'separate') {
      rail.suppressed = true;
      rail.reason = 'Dvojí kresba kolejí: všechny vzorky po nejvýše 0,5 m mají souběžnou osu IPR do 0,5 m; není sloučením identity.';
    }
  }
  return { output, candidates };
}
