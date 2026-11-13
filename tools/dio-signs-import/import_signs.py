import argparse
from collections import Counter
import hashlib
import html
import json
import logging
import math
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

SOURCE = 'https://pjpk.rsd.cz/data/USR_001_2_10_VL/Otevrene_soubory_dwg_VL_6.1_vcetne_informace.zip'
SOURCE_PAGE = 'https://md.gov.cz/Ministerstvo/Zadost-o-poskytnuti-informace-(1)/Poskytnute-informace/Graficka-podoba-dopravnich-znacek'
NS = 'http://www.w3.org/2000/svg'


def save(path, value):
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def digest(path):
  result = hashlib.sha256()
  with path.open('rb') as stream:
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
      result.update(chunk)
  return result.hexdigest()


def download(path):
  request = urllib.request.Request(SOURCE, headers={'User-Agent': 'DIOGEN-signs-audit/1.0'})
  size = 0
  with urllib.request.urlopen(request, timeout=120) as response, path.open('wb') as target:
    if urllib.parse.urlparse(response.url).scheme != 'https':
      raise ValueError('Non-HTTPS source redirect')
    for chunk in iter(lambda: response.read(1024 * 1024), b''):
      size += len(chunk)
      if size > 256 * 1024 * 1024:
        raise ValueError('Source ZIP exceeds 256 MiB')
      target.write(chunk)
  if not zipfile.is_zipfile(path):
    raise ValueError('Downloaded response is not a ZIP archive')


def extract(archive, destination, budget=None, depth=0):
  if budget is None:
    budget = {'bytes': 0, 'files': 0}
  if depth > 2:
    raise ValueError('Nested ZIP depth exceeds limit')
  destination.mkdir(parents=True, exist_ok=True)
  nested = []
  with zipfile.ZipFile(archive) as bundle:
    for item in bundle.infolist():
      name = item.filename.replace('\\', '/')
      relative = PurePosixPath(name)
      mode = stat.S_IFMT(item.external_attr >> 16)
      if relative.is_absolute() or '..' in relative.parts or ':' in name or mode == stat.S_IFLNK:
        raise ValueError('Unsafe ZIP entry: ' + name)
      if name.endswith('/'):
        continue
      budget['files'] += 1
      budget['bytes'] += item.file_size
      if budget['files'] > 20000 or budget['bytes'] > 1536 * 1024 * 1024 or item.file_size > 100 * 1024 * 1024:
        raise ValueError('ZIP extraction limit exceeded')
      target = destination.joinpath(*relative.parts)
      if target.exists():
        raise ValueError('Duplicate ZIP entry: ' + name)
      target.parent.mkdir(parents=True, exist_ok=True)
      with bundle.open(item) as reader, target.open('wb') as writer:
        shutil.copyfileobj(reader, writer)
      if target.suffix.lower() == '.zip':
        nested.append(target)
  for child in nested:
    extract(child, child.with_name(child.name + '.contents'), budget, depth + 1)


def inventory(output):
  archive = output / 'source.zip'
  download(archive)
  extract(archive, output / 'source')
  rows = []
  for path in sorted((output / 'source').rglob('*')):
    if not path.is_file():
      continue
    with path.open('rb') as stream:
      header = stream.read(6).decode('ascii', errors='replace')
    rows.append({'path': path.relative_to(output).as_posix(), 'bytes': path.stat().st_size,
      'sha256': digest(path), 'dwgHeader': header if path.suffix.lower() == '.dwg' else None})
  if not any(row['dwgHeader'] for row in rows):
    raise ValueError('No DWG files found in source archive')
  save(output / 'inventory.json', {'source': SOURCE, 'sourcePage': SOURCE_PAGE,
    'archiveSha256': digest(archive), 'files': rows,
    'reviewStatus': 'unreviewed', 'catalogueComplete': False})


def choose(rows, limit):
  files = [row for row in rows if row['dwgHeader']]
  selected = []
  for code in ['A15', 'P6', 'B20A', 'C4A', 'E13', 'IP22']:
    for row in files:
      stem = re.sub(r'[^A-Z0-9]', '', Path(row['path']).stem.upper())
      if code in stem and row not in selected:
        selected.append(row)
        break
  for i in range(min(limit, len(files))):
    row = files[i * len(files) // min(limit, len(files))]
    if row not in selected:
      selected.append(row)
  return selected[:limit]


def validate_svg(text):
  root = ET.fromstring(text)
  if root.tag != '{' + NS + '}svg':
    raise ValueError('Not an SVG document')
  box = [float(value) for value in root.get('viewBox', '').replace(',', ' ').split()]
  if len(box) != 4 or not all(math.isfinite(value) for value in box) or min(box[2:]) <= 0:
    raise ValueError('Invalid SVG viewBox')
  shapes = 0
  for node in root.iter():
    tag = node.tag.rsplit('}', 1)[-1]
    if tag in ['script', 'foreignObject', 'image', 'iframe']:
      raise ValueError('Unsupported active or raster SVG content')
    shapes += tag in ['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse']
    for key, value in node.attrib.items():
      key = key.rsplit('}', 1)[-1].lower()
      if key.startswith('on') or (key == 'href' and not value.startswith('#')):
        raise ValueError('Active or external SVG attribute')
    css = ((node.text or '') if tag == 'style' else '') + ' '.join(node.attrib.values())
    if re.search(r'@import', css, re.I):
      raise ValueError('External CSS reference')
    for reference in re.findall(r'url\(\s*([^)]*)\)', css, re.I):
      if not reference.strip().strip("\"'").startswith('#'):
        raise ValueError('External CSS reference')
  if not shapes:
    raise ValueError('SVG contains no vector geometry')
  return root


def render(dxf, target, info):
  import ezdxf
  from ezdxf.addons.drawing import Frontend, RenderContext, config, layout, svg
  doc = ezdxf.readfile(dxf)
  model = doc.modelspace()
  backend = svg.SVGBackend()
  cfg = config.Configuration(background_policy=config.BackgroundPolicy.WHITE)
  Frontend(RenderContext(doc), backend, config=cfg).draw_layout(model)
  text = backend.get_string(layout.Page(0, 0, layout.Units.mm, margins=layout.Margins.all(0)))
  root = validate_svg(text)
  root.set('data-diogen-review', 'unreviewed')
  ET.indent(root, space='  ')
  target.write_text(ET.tostring(root, encoding='unicode'), encoding='utf-8')
  save(info, {'ezdxf': ezdxf.__version__, 'unitsCode': int(doc.units),
    'modelEntities': dict(Counter(entity.dxftype() for entity in model)),
    'layers': [layer.dxf.name for layer in doc.layers],
    'blocks': [block.name for block in doc.blocks],
    'fontStyles': [{'name': style.dxf.name, 'font': style.dxf.get('font', ''),
      'bigfont': style.dxf.get('bigfont', '')} for style in doc.styles],
    'fontResolutionVerified': False, 'layoutExported': 'Model',
    'warning': 'Whole modelspace preview; not an isolated, approved sign model. Colours, fonts, entities, orientation and dimensions require review.'})


def pilot(output, limit):
  data = json.loads((output / 'inventory.json').read_text(encoding='utf-8'))
  converter = shutil.which('dwgread')
  if not converter:
    raise ValueError('dwgread is not installed')
  previews = output / 'preview'
  previews.mkdir(exist_ok=True)
  rows = []
  for source in choose(data['files'], limit):
    key = source['sha256'][:16]
    row = {'source': source, 'status': 'failed', 'reviewStatus': 'unreviewed'}
    try:
      dxf = previews / (key + '.dxf')
      target = previews / (key + '.svg')
      info = previews / (key + '.json')
      with (previews / (key + '-converter.log')).open('w') as log:
        conversion = subprocess.run([converter, '-O', 'DXF', '-o', str(dxf), str(output / source['path'])],
          stdout=log, stderr=subprocess.STDOUT, timeout=120)
      row['converterExitCode'] = conversion.returncode
      if not dxf.is_file() or dxf.stat().st_size == 0:
        raise ValueError('Converter produced no DXF; see converter log')
      with (previews / (key + '-render.log')).open('w') as log:
        job = subprocess.run([sys.executable, str(Path(__file__).resolve()), 'render',
          '--dxf', str(dxf), '--svg', str(target), '--info', str(info)],
          stdout=log, stderr=subprocess.STDOUT, timeout=120)
      if job.returncode:
        raise ValueError('SVG rendering failed; see render log')
      validate_svg(target.read_text(encoding='utf-8'))
      row.update({'status': 'draft' if conversion.returncode == 0 else 'draft-with-converter-warning',
        'svg': target.relative_to(output).as_posix(), 'svgSha256': digest(target),
        'details': json.loads(info.read_text(encoding='utf-8'))})
    except Exception as error:
      row['error'] = str(error)
    rows.append(row)
    save(output / 'pilot.json', {'sourceArchiveSha256': data['archiveSha256'], 'results': rows,
      'catalogueComplete': False, 'automaticPublication': False})
  cards = []
  for row in rows:
    image = '<img src="' + row['svg'] + '" alt="CAD preview">' if 'svg' in row else ''
    cards.append('    <article>\n      <h2>' + html.escape(row['source']['path']) + '</h2>\n      ' + image +
      '<p>' + html.escape(row['status'] + ': ' + row.get('error', 'Unreviewed; fonts and sign isolation not verified')) + '</p>\n    </article>')
  gallery = """<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <title>DIOGEN — zkušební převod DWG</title>
    <style>
      body {
        font: 16px sans-serif;
        margin: 24px;
      }
      article {
        border: 1px solid #aaa;
        padding: 16px;
        margin: 16px 0;
      }
      img {
        max-width: 100%;
        height: 300px;
      }
      h2 {
        font-size: 16px;
        overflow-wrap: anywhere;
      }
    </style>
  </head>
  <body>
    <h1>Neověřené CAD náhledy</h1>
    <p>Ověřit geometrii, barvy, fonty a podmínky převzetí.</p>
""" + '\n'.join(cards) + '\n  </body>\n</html>\n'
  (output / 'index.html').write_text(gallery, encoding='utf-8')
  converted = sum('svg' in row for row in rows)
  (output / 'summary.md').write_text(f'# DIOGEN: DWG pilot\n\nInventář: {len(data["files"])} souborů. '
    f'Pokusů o převod: {len(rows)}. SVG náhledů: {converted}.\n\n'
    'Všechny výstupy jsou neověřené. Kompletní katalog ani publikace do aplikace nebyly provedeny.\n', encoding='utf-8')
  if not converted:
    raise ValueError('No SVG previews produced; inspect artifact logs')


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('stage', choices=['inventory', 'pilot', 'render'])
  parser.add_argument('--output', type=Path)
  parser.add_argument('--limit', type=int, choices=range(1, 13), default=8)
  parser.add_argument('--dxf', type=Path)
  parser.add_argument('--svg', type=Path)
  parser.add_argument('--info', type=Path)
  args = parser.parse_args()
  logging.basicConfig(level=logging.INFO)
  if args.stage == 'render':
    render(args.dxf, args.svg, args.info)
    return
  if not args.output:
    parser.error('--output is required')
  args.output.mkdir(parents=True, exist_ok=True)
  try:
    inventory(args.output) if args.stage == 'inventory' else pilot(args.output, args.limit)
  except Exception as error:
    save(args.output / ('error-' + args.stage + '.json'), {'error': str(error), 'stage': args.stage})
    raise


if __name__ == '__main__':
  main()
