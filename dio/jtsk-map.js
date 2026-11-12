import { fromWgs, toWgs, jtskFrame } from './jtsk.js';
import { rose } from './rose.js';
import { projectPreview } from './jtsk-preview.js';
import { gridAngleOnMap } from './preview-projection.js';

export function createMap(id) {
  const map = L.map(id, {
    minZoom: 10, maxZoom: 22,
    maxBounds: [[48, 11.8], [51.2, 18.9]]
  }).setView([50.0755, 14.4378], 17);
  const background = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19, maxZoom: 22,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const compass = L.control({ position: 'topright' });
  let container;
  function updateCompass() {
    if (!container) return;
    const center = map.getCenter();
    const gridAngle = gridAngleOnMap(center.lng, center.lat);
    container.innerHTML = `<svg width="120" height="112" viewBox="-60 -56 120 112" role="img" aria-label="Růžice: S zeměpisný sever, Ns sever sítě S-JTSK">${rose(0, 44, gridAngle)}</svg><div>S: zeměpisný; Ns: síť 5514</div>`;
  }
  compass.onAdd = () => {
    container = L.DomUtil.create('div', 'leaflet-control');
    container.style.cssText = 'background:white;padding:6px;font:11px sans-serif;text-align:center';
    L.DomEvent.disableClickPropagation(container);
    updateCompass();
    return container;
  };
  compass.addTo(map);
  map.on('moveend', updateCompass);
  const coordinates = L.control({ position: 'bottomleft' });
  let readout;
  coordinates.onAdd = () => {
    readout = L.DomUtil.create('div', 'leaflet-control');
    readout.style.cssText = 'background:white;padding:5px;font:12px monospace';
    readout.textContent = 'Náhled OSM; pracovní souřadnice EPSG:5514';
    return readout;
  };
  map.on('mousemove', ({ latlng }) => {
    const [east, north] = fromWgs(latlng.lng, latlng.lat);
    readout.textContent = `5514: E ${east.toFixed(2)}; N ${north.toFixed(2)} m`;
  });
  coordinates.addTo(map);
  background.on('tileerror', () => {
    readout.textContent = 'Podklad OSM se nenačetl; pracovní geometrie zůstává v EPSG:5514.';
  });
  L.control.scale({ imperial: false }).addTo(map);
  return map;
}

export function gridSelection(bbox) {
  const f = jtskFrame(bbox);
  const corners = [[f.left, f.top], [f.right, f.top], [f.right, f.bottom], [f.left, f.bottom]];
  return L.polygon(corners.map((p) => {
    const [lon, lat] = toWgs(...p);
    return [lat, lon];
  }), { fill: false, interactive: false });
}

export function gridOverlay(svg, bbox) {
  const preview = projectPreview(svg, bbox);
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
