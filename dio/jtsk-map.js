import { toWgs, jtskFrame } from './jtsk.js';
import { selectionBoundary } from './selection.js';
import { projectPreview } from './jtsk-preview.js';

export function createMap(id) {
  const map = L.map(id, {
    minZoom: 10, maxZoom: 22,
    maxBounds: [[48, 11.8], [51.2, 18.9]]
  }).setView([50.0755, 14.4378], 17);
  const background = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19, maxZoom: 22,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  background.on('tileerror', () => {
    map.fire('dio:basemaperror');
  });
  L.control.scale({ imperial: false }).addTo(map);
  return map;
}

export function gridSelection(bbox, selection) {
  if (selection) {
    return L.polygon(selectionBoundary(selection, 16).map((p) => {
      const [lon, lat] = toWgs(...p);
      return [lat, lon];
    }), { fill: false, interactive: false });
  }
  const f = jtskFrame(bbox);
  const corners = [[f.left, f.top], [f.right, f.top], [f.right, f.bottom], [f.left, f.bottom]];
  return L.polygon(corners.map((p) => {
    const [lon, lat] = toWgs(...p);
    return [lat, lon];
  }), { fill: false, interactive: false });
}

export function gridOverlay(svg, bbox, selection) {
  const preview = projectPreview(svg, bbox, selection);
  const Overlay = L.Layer.extend({
    onAdd(map) {
      this.map = map;
      svg.style.position = 'absolute';
      svg.classList.add('leaflet-image-layer', 'leaflet-interactive', 'leaflet-zoom-hide');
      map.getPane('overlayPane').append(svg);
      map.on('zoom viewreset moveend', this.update, this);
      this.update();
    },
    onRemove(map) {
      map.off('zoom viewreset moveend', this.update, this);
      svg.remove();
    },
    update() {
      const origin = L.CRS.EPSG3857.unproject(L.point(preview.left, preview.top));
      const position = this.map.project(origin).subtract(this.map.getPixelOrigin());
      const pixelsPerMetre = this.map.options.crs.scale(this.map.getZoom()) / (2 * Math.PI * 6378137);
      L.DomUtil.setPosition(svg, position);
      svg.style.width = `${preview.width * pixelsPerMetre}px`;
      svg.style.height = `${preview.height * pixelsPerMetre}px`;
    }
  });
  return new Overlay();
}
