import { fromWgs, toWgs, jtskFrame, northAngle, rose } from './jtsk.js';

export function createMap(id) {
  const world = 40075016.68557849;
  const projection = {
    project: (p) => L.point(...fromWgs(p.lng, p.lat)),
    unproject: (p) => {
      const [lon, lat] = toWgs(p.x, p.y);
      return L.latLng(lat, lon);
    }
  };
  const crs = L.extend({}, L.CRS, {
    code: 'EPSG:5514', projection,
    transformation: new L.Transformation(1 / world, 0, -1 / world, 0),
    infinite: true,
    distance: (a, b) => projection.project(a).distanceTo(projection.project(b))
  });
  const map = L.map(id, {
    crs, minZoom: 10, maxZoom: 22,
    maxBounds: [[48, 11.8], [51.2, 18.9]]
  }).setView([50.0755, 14.4378], 17);
  const background = L.tileLayer.wms('https://ags.cuzk.gov.cz/arcgis1/services/ZTM/MapServer/WMSServer', {
    layers: '0', format: 'image/png', version: '1.1.1', crs,
    transparent: false, attribution: '© ČÚZK – ZTM; EPSG:5514'
  }).addTo(map);
  const compass = L.control({ position: 'topright' });
  let container;
  function updateCompass() {
    if (!container) return;
    const center = map.getCenter();
    const angle = northAngle(center.lng, center.lat);
    container.innerHTML = `<svg width="120" height="112" viewBox="-60 -56 120 112" role="img" aria-label="Růžice: N zeměpisný sever, Ns sever sítě S-JTSK">${rose(angle, 26)}</svg><div>N: zeměpisný; Ns: síť 5514</div>`;
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
    readout.textContent = 'EPSG:5514 – souřadnice E, N v metrech';
    return readout;
  };
  map.on('mousemove', ({ latlng }) => {
    const [east, north] = fromWgs(latlng.lng, latlng.lat);
    readout.textContent = `5514: E ${east.toFixed(2)}; N ${north.toFixed(2)} m`;
  });
  coordinates.addTo(map);
  background.on('tileerror', () => {
    readout.textContent = 'Podklad ČÚZK se nenačetl; vektorová geometrie zůstává v EPSG:5514.';
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
  const frame = jtskFrame(bbox);
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
      const [lon, lat] = toWgs(frame.left, frame.top);
      const [lon2, lat2] = toWgs(frame.right, frame.bottom);
      const a = this.map.project([lat, lon]).subtract(this.map.getPixelOrigin());
      const b = this.map.project([lat2, lon2]).subtract(this.map.getPixelOrigin());
      L.DomUtil.setPosition(svg, a);
      svg.style.width = `${b.x - a.x}px`;
      svg.style.height = `${b.y - a.y}px`;
    }
  });
  return new Overlay();
}
