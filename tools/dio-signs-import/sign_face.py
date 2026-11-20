import copy
import io
import re
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image, ImageChops, ImageFilter


GEOMETRY = {'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text'}


def local(node):
  return node.tag.rsplit('}', 1)[-1]


def alpha(root):
  box = [float(value) for value in re.split(r'[\s,]+', root.get('viewBox').strip())]
  factor = 1024 / max(box[2:])
  size = [max(1, round(value * factor)) for value in box[2:]]
  png = cairosvg.svg2png(bytestring=ET.tostring(root), output_width=size[0], output_height=size[1])
  return Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A')


def add_white_face(root):
  parents = {child: parent for parent in root.iter() for child in parent}
  shapes = []
  for node in root.iter():
    if local(node) not in GEOMETRY:
      continue
    ancestor = parents.get(node)
    hidden = False
    while ancestor is not None:
      if local(ancestor) in ['defs', 'clipPath', 'mask', 'symbol']:
        hidden = True
      ancestor = parents.get(ancestor)
    if not hidden:
      shapes.append(node)
  if not shapes:
    raise ValueError('Empty rendered sign')
  candidate = shapes[0]
  face = ET.Element(candidate.tag)
  compound = False
  if local(candidate) == 'path':
    path = candidate.get('d', '')
    match = re.match(r'^\s*M[^MmZz]*[Zz]', path)
    if not match:
      return False
    rest = path[match.end():].strip()
    compound = bool(rest and rest.startswith('M') and rest[-1:] in ['z', 'Z'])
    face.set('d', match[0])
  elif local(candidate) in ['rect', 'circle', 'ellipse', 'polygon']:
    for key in ['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'points']:
      if key in candidate.attrib:
        face.set(key, candidate.get(key))
  else:
    return False
  white = {'white', '#fff', '#ffffff'}
  explicit_white = any(node.get('fill', '').lower() in white for node in shapes)
  if not compound and not explicit_white:
    return False
  if 'transform' in candidate.attrib:
    face.set('transform', candidate.get('transform'))
  face.set('style', 'fill: #FFFFFF !important; stroke: none !important; fill-opacity: 1 !important; opacity: 1 !important; fill-rule: nonzero !important;')
  face.set('data-diogen-white-face', 'closed-source-contour-v1')
  parent = parents[candidate]
  index = list(parent).index(candidate)
  ink = alpha(root)
  if ink.getbbox() is None:
    raise ValueError('Empty rendered sign')
  parent.insert(index, face)
  mask_root = copy.deepcopy(root)
  mask_parents = {child: container for container in mask_root.iter() for child in container}
  for node in list(mask_root.iter()):
    if local(node) in GEOMETRY and node.get('data-diogen-white-face') is None:
      mask_parents[node].remove(node)
  try:
    mask = alpha(mask_root)
    opaque = mask.point(lambda value: 255 if value >= 250 else 0)
    if opaque.getbbox() is None:
      parent.remove(face)
      return False
    coverage = mask.point(lambda value: 255 if value > 0 else 0).filter(ImageFilter.MaxFilter(5))
    visible = ink.point(lambda value: 255 if value > 8 else 0)
    outside = ImageChops.subtract(visible, coverage)
    if outside.getbbox() is not None:
      parent.remove(face)
      return False
  except Exception:
    parent.remove(face)
    raise
  return True


def remove_page_with_white_face(root, remove_page, box):
  children = list(root)
  if not remove_page(root, box):
    return False
  page = next(node for node in children if node not in list(root))
  try:
    if add_white_face(root):
      return True
  except Exception as error:
    root.insert(children.index(page), page)
    raise ValueError('White face verification failed: ' + str(error)) from error
  root.insert(children.index(page), page)
  return False
