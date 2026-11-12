import { fromWgs, toWgs } from './jtsk.js';
import { rectangleFromThree, selectionBoundary, selectionBbox } from './selection.js';

export function createSelectionControl(map, { onStart, onComplete, onCancel, message }) {
  let points = [];
  let active = false;
  let preview;
  let baseline;
  let guide;
  const latlng = (p) => {
    const [lon, lat] = toWgs(...p);
    return [lat, lon];
  };

  function clear() {
    for (const layer of [preview, baseline, guide]) {
      if (layer) map.removeLayer(layer);
    }
    preview = baseline = guide = null;
  }

  function cancel() {
    if (!active) return;
    active = false;
    points = [];
    clear();
    map.getContainer().style.cursor = '';
    message('Výběr zrušen.');
    onCancel();
  }

  map.getContainer().addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cancel();
  });

  map.on('mousemove', ({ latlng: cursor }) => {
    if (!active || !points.length) return;
    const c = fromWgs(cursor.lng, cursor.lat);
    clear();
    if (points.length === 1) {
      baseline = L.polyline([points[0], c].map(latlng), {
        interactive: false, dashArray: '6 4'
      }).addTo(map);
      return;
    }
    const selection = rectangleFromThree(points[0], points[1], c, false);
    preview = L.polygon(selectionBoundary(selection, 8).map(latlng), {
      interactive: false, fillOpacity: 0.08
    }).addTo(map);
    const b = points[1];
    const u = [(b[0] - points[0][0]) / selection.width,
      (b[1] - points[0][1]) / selection.width];
    const n = [u[1], -u[0]];
    const h = (c[0] - b[0]) * n[0] + (c[1] - b[1]) * n[1];
    const snapped = [b[0] + h * n[0], b[1] + h * n[1]];
    guide = L.polyline([b, snapped, c].map(latlng), {
      interactive: false, dashArray: '4 4', color: '#2563eb'
    }).addTo(map);
    message(`${selection.width.toFixed(1)} × ${selection.height.toFixed(1)} m; třetí klik potvrdí kolmou šířku. Esc: zrušit.`);
  });

  map.on('click', ({ latlng: cursor }) => {
    if (!active) return;
    const p = fromWgs(cursor.lng, cursor.lat);
    if (!points.length) {
      points.push(p);
      message('2/3: Klikni na konec první hrany (5–550 m). Esc: zrušit.');
      return;
    }
    if (points.length === 1) {
      const width = Math.hypot(p[0] - points[0][0], p[1] - points[0][1]);
      if (width < 5 || width > 550) {
        message('První hrana musí mít 5–550 m. Klikni na jiný druhý bod.');
        return;
      }
      points.push(p);
      message('3/3: Urči kolmou šířku. Kurzor se promítá na kolmici v druhém bodě.');
      return;
    }
    try {
      const selection = rectangleFromThree(points[0], points[1], p);
      const bbox = selectionBbox(selection);
      active = false;
      clear();
      map.getContainer().style.cursor = '';
      onComplete(selection, bbox);
    } catch (error) {
      message(`${error.message}. Zvol jiný třetí bod; Esc: zrušit.`);
    }
  });

  return {
    start() {
      clear();
      points = [];
      active = true;
      map.getContainer().style.cursor = 'crosshair';
      onStart();
      map.getContainer().focus();
      message('1/3: Klikni na začátek první hrany. Esc: zrušit.');
    },
    cancel
  };
}
