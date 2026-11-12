const NS = 'http://www.w3.org/2000/svg';
const MASK_ID = 'dio-crossing-sidewalk-mask';

export function sidewalkAreas(raw) {
  return raw.filter((feature) => feature.kind === 'area' &&
    feature.source === 'IPR plochy' && Number(feature.attrs?.CTVUK_KOD) === 702 &&
    feature.coords.some((ring) => ring.length >= 3));
}

function pathData(rings) {
  return rings.filter((ring) => ring.length >= 3).map((ring) =>
    `M ${ring.map((p) => p.join(',')).join(' L ')} Z`).join(' ');
}

export function applyCrossingMask(doc, raw, frame) {
  const root = doc.documentElement;
  const crossings = [...root.querySelectorAll('path[data-crossing]')];
  const sidewalks = sidewalkAreas(raw);
  if (!crossings.length || !sidewalks.length) return;
  root.querySelector(`#${MASK_ID}`)?.remove();
  const mask = doc.createElementNS(NS, 'mask');
  mask.setAttribute('id', MASK_ID);
  mask.setAttribute('data-crossing-mask', 'EPSG:5514');
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
  mask.setAttribute('style', 'mask-type:luminance');
  mask.setAttribute('x', '0');
  mask.setAttribute('y', '0');
  mask.setAttribute('width', frame.width);
  mask.setAttribute('height', frame.height);
  const boundary = [];
  const corners = [[0, 0], [frame.width, 0], [frame.width, frame.height], [0, frame.height]];
  for (let i = 0; i < 4; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    for (let j = 0; j < 8; j += 1) {
      boundary.push([a[0] + (b[0] - a[0]) * j / 8, a[1] + (b[1] - a[1]) * j / 8]);
    }
  }
  const background = doc.createElementNS(NS, 'path');
  background.setAttribute('d', pathData([boundary]));
  background.setAttribute('fill', 'white');
  background.setAttribute('stroke', 'none');
  mask.append(background);
  for (const feature of sidewalks) {
    const path = doc.createElementNS(NS, 'path');
    path.setAttribute('d', pathData(feature.coords));
    path.setAttribute('fill', 'black');
    path.setAttribute('stroke', 'none');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('data-source-id', feature.id);
    mask.append(path);
  }
  let defs = root.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS(NS, 'defs');
    root.insertBefore(defs, root.firstChild);
  }
  defs.append(mask);
  for (const path of crossings) {
    path.setAttribute('mask', `url(#${MASK_ID})`);
    path.setAttribute('data-crossing-clip', 'IPR 702 sidewalk polygons');
  }
}

export function projectCrossingMasks(svg, projection, projectPath) {
  for (const mask of svg.querySelectorAll('mask[data-crossing-mask]')) {
    if (mask.getAttribute('data-crossing-mask') !== 'EPSG:5514') {
      throw new Error('Maska přechodů již byla přeprojektována');
    }
    for (const path of mask.querySelectorAll('path')) {
      path.setAttribute('d', projectPath(path.getAttribute('d'), projection.point));
    }
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', projection.width);
    mask.setAttribute('height', projection.height);
    mask.setAttribute('data-crossing-mask', 'EPSG:3857');
  }
}
