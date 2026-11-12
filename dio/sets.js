export const SETS = [
  { id: 'base', label: 'Základní podklad', description: 'Budovy a rozpoznané povrchy; vždy součástí.' },
  { id: 'transport', label: 'Doprava a parkování', description: 'Koleje, parkování, zastávky a dostupné záznamy značek.' },
  { id: 'equipment', label: 'Vybavení ulice', description: 'Lampy a čísla, patníky, zábradlí a mobiliář.' },
  { id: 'vegetation', label: 'Vegetace', description: 'Stromy, doložené koruny, keře a zeleň.' },
  { id: 'terrain', label: 'Terén a konstrukce', description: 'Zdi, ploty, opěrné konstrukce a svahy.' }
];
export const PRESETS = {
  dio: ['base', 'transport', 'equipment'],
  extended: SETS.map((s) => s.id)
};

export function setOf(f) {
  const c = f.category;
  const a = f.attrs || {};
  if (/^(Zakryté|Pomocná|Neurčené|Ostatní OSM)/.test(c)) return 'control';
  if (f.source === 'IPR plochy') {
    return [300, 401, 402, 403].includes(Number(a.CTVUK_KOD)) ? 'vegetation' : 'base';
  }
  if (f.source.startsWith('SMZ') || /Strom|Koruny|Keř|Živé ploty|Trávník|Záhon|vegetace|Zeleň|dřevin/i.test(c)) return 'vegetation';
  if (/Ploty|Opěrné|Hrany svahů|Bariéry \/ (wall|fence|city_wall|retaining_wall)/.test(c)) return 'terrain';
  if (/koleje|Vlečky|TSK|Parkování|Nástupiště|Označník|Přístřeš|Místa zastavení|Značky|Jízdenkové/i.test(c)) return 'transport';
  if (/Lampy|Čísla lamp|sloupy|Patníky|Zábradlí|Svodidla|Lavičky|Koše|Stojany|Studny|Bariéry/i.test(c) || f.source === 'THMP') return 'equipment';
  return 'base';
}

export function selectedSets(values) {
  return ['base', ...new Set((values || PRESETS.dio).filter((id) => SETS.some((s) => s.id === id) && id !== 'base'))];
}

export function selectedFeatures(raw, sets, diagnostic = false) {
  const selected = new Set(selectedSets(sets));
  return raw.filter((f) => selected.has(setOf(f)) || (diagnostic && setOf(f) === 'control'));
}

export function layerPath(category, set) {
  const label = SETS.find((s) => s.id === set)?.label || 'Kontrolní kresba';
  if (set === 'equipment' && /Lampy|Čísla lamp/.test(category)) return [label, 'Osvětlení', category];
  if (set === 'vegetation' && /Stromy|Koruny/.test(category)) return [label, 'Stromy', category];
  if (set === 'transport' && /TSK|Parkování/.test(category)) return [label, 'Parkování', category];
  if (set === 'transport' && /Označník|Nástupiště|Přístřeš|Místa zastavení/.test(category)) return [label, 'Veřejná doprava', category];
  return [label, category];
}
