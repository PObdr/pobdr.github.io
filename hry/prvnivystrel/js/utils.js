export const $ = id => document.getElementById(id);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

export const fold = s => String(s)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export const fmt = s => {
  s = Math.round(s);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
};

export const dist = (a, b) => Math.hypot(
  (a.lat - b.lat) * 111195,
  (a.lon - b.lon) * 71350
);
