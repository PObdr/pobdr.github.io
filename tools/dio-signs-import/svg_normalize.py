import hashlib
import io
import math
import re
import xml.etree.ElementTree as ET

from sign_face import remove_page_with_white_face


PROFILE = 'diogen-srgb-v1'
PALETTE = {
  'blue': '#00539C',
  'red': '#C41E30',
  'green': '#00704A',
  'yellow': '#F4C400',
  'brown': '#70442A',
  'orange': '#E07018',
  'white': '#FFFFFF',
  'black': '#000000',
  'grey': '#808080'
}
ALIASES = {
  '#0000ff': 'blue', '#00539c': 'blue',
  '#ff0000': 'red', '#c51e2b': 'red', '#c41e30': 'red',
  '#00ff00': 'green', '#008000': 'green', '#00704a': 'green',
  '#ffff00': 'yellow', '#ffd300': 'yellow', '#f4c400': 'yellow',
  '#a52a2a': 'brown', '#70442a': 'brown',
  '#ff7f00': 'orange', '#ffa500': 'orange', '#e07018': 'orange',
  '#ffffff': 'white', '#000000': 'black', '#808080': 'grey'
}
DECLARATION = re.compile(r'(\b(?:fill|stroke|color)\s*:\s*)([^;}]+)', re.I)
NUMBER = re.compile(r'^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*$', re.I)


def local(node):
  return node.tag.rsplit('}', 1)[-1]


def colour_key(value):
  value = value.strip().lower()
  names = {name: code for name, code in {
    'red': '#ff0000', 'blue': '#0000ff', 'green': '#008000',
    'lime': '#00ff00', 'yellow': '#ffff00', 'brown': '#a52a2a',
    'orange': '#ffa500', 'white': '#ffffff', 'black': '#000000',
    'gray': '#808080', 'grey': '#808080'
  }.items()}
  if value in names:
    return names[value]
  if re.fullmatch(r'#[0-9a-f]{3}', value):
    return '#' + ''.join(char * 2 for char in value[1:])
  if re.fullmatch(r'#[0-9a-f]{6}', value):
    return value
  match = re.fullmatch(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', value)
  if match and all(int(part) <= 255 for part in match.groups()):
    return '#' + ''.join(f'{int(part):02x}' for part in match.groups())
  return None


def number(value):
  if not NUMBER.fullmatch(value):
    raise ValueError('Non-numeric renderer rectangle')
  result = float(value)
  if not math.isfinite(result):
    raise ValueError('Non-finite coordinate')
  return result


def remove_renderer_background(root, box):
  drawable = [node for node in root if local(node) not in ['defs', 'title', 'desc', 'metadata']]
  if not drawable:
    return False
  node = drawable[0]
  allowed = {'x', 'y', 'width', 'height', 'fill', 'fill-opacity'}
  if local(node) != 'rect' or not set(node.attrib).issubset(allowed):
    return False
  if colour_key(node.get('fill', '')) != '#ffffff' or node.get('fill-opacity', '1') not in ['1', '1.0', '1.000']:
    return False
  try:
    bounds = [number(node.get(key, '0')) for key in ['x', 'y', 'width', 'height']]
  except ValueError:
    return False
  if not all(math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-8) for a, b in zip(bounds, box)):
    return False
  root.remove(node)
  return True


def crop_transparent_margin(root, box):
  import cairosvg
  from PIL import Image
  factor = 1024 / max(box[2:])
  width, height = [max(1, round(size * factor)) for size in box[2:]]
  png = cairosvg.svg2png(bytestring=ET.tostring(root), output_width=width, output_height=height)
  alpha = Image.open(io.BytesIO(png)).convert('RGBA').getchannel('A')
  bounds = alpha.getbbox()
  if bounds is None:
    raise ValueError('Empty rendered sign')
  left, top, right, bottom = bounds
  left, top = max(0, left - 2), max(0, top - 2)
  right, bottom = min(width, right + 2), min(height, bottom + 2)
  result = [box[0] + left * box[2] / width, box[1] + top * box[3] / height,
    (right - left) * box[2] / width, (bottom - top) * box[3] / height]
  root.set('viewBox', ' '.join(f'{value:.12g}' for value in result))
  for attribute, original, cropped in [('width', box[2], result[2]), ('height', box[3], result[3])]:
    match = re.fullmatch(r'([\d.]+)(mm|cm|in|px|pt)?', root.get(attribute, ''))
    if match:
      root.set(attribute, f'{float(match[1]) * cropped / original:.12g}' + (match[2] or ''))
  return result


def normalize_svg(source, renderer_background=False):
  if len(source) > 25000000 or re.search(r'<!DOCTYPE|<!ENTITY', source, re.I):
    raise ValueError('Unsafe or oversized SVG')
  root = ET.fromstring(source)
  if local(root) != 'svg':
    raise ValueError('Not SVG')
  box = [number(part) for part in re.split(r'[\s,]+', root.get('viewBox', '').strip()) if part]
  if len(box) != 4 or min(box[2:]) <= 0 or max(abs(n) for n in box) > 1e9:
    raise ValueError('Invalid viewBox')
  for node in root.iter():
    if local(node) in ['script', 'foreignObject', 'image', 'use', 'filter', 'animate', 'set']:
      raise ValueError('Unsupported active, referenced or filtered SVG content')
    for key, value in node.attrib.items():
      if (key.rsplit('}', 1)[-1].lower().startswith('on') or
          key.rsplit('}', 1)[-1] in ['href', 'base', 'src'] or
          re.search(r'url\s*\(', value, re.I)):
        raise ValueError('Referenced or active SVG content')
    css = (node.text or '') if local(node) == 'style' else node.get('style', '')
    if re.search(r'@import|@font-face|\\|url\s*\(', css, re.I):
      raise ValueError('Unsupported CSS resources')
  removed = renderer_background and remove_page_with_white_face(root, remove_renderer_background, box)
  changes, unknown = {}, set()

  def colour(value):
    original = value
    raw = value.strip()
    important = bool(re.search(r'\s*!important$', raw, re.I))
    raw = re.sub(r'\s*!important$', '', raw, flags=re.I).strip()
    if raw.lower() in ['none', 'transparent', 'inherit', 'currentcolor']:
      return original
    key = colour_key(raw)
    family = ALIASES.get(key)
    if family is None:
      unknown.add(raw)
      return original
    target = PALETTE[family]
    if key != target.lower():
      changes[(key, target, family)] = changes.get((key, target, family), 0) + 1
    return target + (' !important' if important else '')

  def css(text):
    return DECLARATION.sub(lambda match: match[1] + colour(match[2]), text)

  for node in root.iter():
    for key in ['fill', 'stroke', 'color']:
      if key in node.attrib:
        node.set(key, colour(node.get(key)))
    if 'style' in node.attrib:
      node.set('style', css(node.get('style')))
    if local(node) == 'style' and node.text:
      node.text = css(node.text)
  crop = None
  if removed:
    crop = crop_transparent_margin(root, box)
  changed = removed or bool(changes)
  if changed:
    ET.indent(root, space='  ')
    output = ET.tostring(root, encoding='unicode') + '\n'
  else:
    output = source
  audit = {
    'profile': PROFILE,
    'palettePurpose': 'display-srgb-not-normative-manufacturing-colour',
    'palette': PALETTE,
    'sourceSvgSha256': hashlib.sha256(source.encode('utf-8')).hexdigest(),
    'outputSvgSha256': hashlib.sha256(output.encode('utf-8')).hexdigest(),
    'colourChanges': [
      {'source': old, 'target': new, 'name': name, 'occurrences': count}
      for (old, new, name), count in sorted(changes.items())
    ],
    'unknownColours': sorted(unknown),
    'background': 'renderer-page-rectangle-removed' if removed else 'not-proven-preserved',
    'sourceViewBox': box,
    'outputViewBox': crop or box,
    'cropMethod': 'alpha-1024px-padding-2px' if crop else 'unchanged',
    'shapeClipping': 'none-no-guessed-sign-outline',
    'whiteFace': 'closed-source-contour-v1' if removed else 'not-proven-background-preserved',
    'reviewStatus': 'unreviewed'
  }
  return output, audit
