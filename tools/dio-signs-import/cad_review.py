import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import unicodedata


def save(path, value):
  path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def repair_mtext(data):
  lines = data.splitlines(keepends=True)
  result, fixes = [], []
  entity, i = '', 0
  number = re.compile(rb'^\s*\d{1,4}\s*$')
  while i < len(lines):
    if entity == 'EOF' and all(not line.strip() for line in lines[i:]):
      result.extend(lines[i:])
      break
    if i + 1 >= len(lines) or not number.fullmatch(lines[i]) or int(lines[i]) > 1071:
      raise ValueError(f'Ambiguous DXF structure at physical line {i + 1}')
    code = int(lines[i])
    value = lines[i + 1].rstrip(b'\r\n')
    if code == 0:
      entity = value.decode('ascii', errors='strict')
    end = i + 2
    parts = [value]
    while end < len(lines) and not number.fullmatch(lines[end]):
      if entity != 'MTEXT' or code != 1 or len(parts[-1]) != 255:
        raise ValueError(f'Unrecognised text continuation at physical line {end + 1}')
      parts.append(lines[end].rstrip(b'\r\n'))
      end += 1
    if len(parts) == 1:
      result.extend(lines[i:end])
    else:
      joined = b''.join(parts)
      text = joined.decode('utf-8', errors='strict')
      chunks = [text[n:n + 250] for n in range(0, len(text), 250)]
      for n, chunk in enumerate(chunks):
        result.append(f'{3 if n + 1 < len(chunks) else 1}\n'.encode() + chunk.encode('utf-8') + b'\n')
      fixes.append({'physicalLine': i + 1, 'segmentBytes': [len(p) for p in parts],
        'joinedTextSha256': hashlib.sha256(joined).hexdigest(), 'characters': len(text)})
    i = end
  return b''.join(result), fixes


def read_document(path):
  import ezdxf
  original = path.read_bytes()
  audit = {'originalDxfSha256': hashlib.sha256(original).hexdigest(), 'loadMode': 'strict', 'fixes': []}
  try:
    return ezdxf.readfile(path), audit
  except ezdxf.DXFStructureError as error:
    corrected, fixes = repair_mtext(original)
    if not fixes:
      raise ValueError('No recognised MTEXT repair found') from error
    target = path.with_name(path.stem + '-mtext-fixed.dxf')
    target.write_bytes(corrected)
    audit.update({'loadMode': 'mtext-repaired', 'fixes': fixes,
      'repairedDxf': target.name, 'repairedDxfSha256': hashlib.sha256(corrected).hexdigest()})
    save(path.with_name(path.stem + '-repair.json'), audit)
    return ezdxf.readfile(target), audit


def sign_entities(entities, filled=False):
  def sign_layer(entity):
    name = unicodedata.normalize('NFKD', entity.dxf.get('layer', '0'))
    return ''.join(c for c in name if not unicodedata.combining(c)).strip().casefold() == 'znacka'
  allowed = {'HATCH', 'SOLID', 'TRACE'} if filled else None
  excluded = {'VIEWPORT', 'DIMENSION', 'LEADER', 'MLEADER', 'POINT'}
  return [e for e in entities if sign_layer(e) and e.dxftype() not in excluded and
    (allowed is None or e.dxftype() in allowed)]


def render_job(path, output, key):
  import ezdxf
  from ezdxf.addons.drawing import Frontend, RenderContext, config, layout, svg
  from import_signs import validate_svg
  doc, audit = read_document(path)
  views = []
  layouts = list(doc.layouts)
  specifications = [(doc.modelspace(), None, 'technical')]
  for space in layouts:
    entities = list(space.entities_in_redraw_order()) if hasattr(space, 'entities_in_redraw_order') else list(space)
    for filled in [False, True]:
      selected = sign_entities(entities, filled)
      if selected:
        specifications.append((space, selected, 'sign-filled' if filled else 'sign-geometry'))
  for index, (space, selected, kind) in enumerate(specifications):
    row = {'layout': space.name, 'kind': kind, 'reviewStatus': 'unreviewed'}
    try:
      target = space
      if selected is not None:
        target = doc.layouts.new(f'_DIOGEN_REVIEW_{index}')
        for entity in selected:
          target.add_entity(entity.copy())
      backend = svg.SVGBackend()
      Frontend(RenderContext(doc), backend,
        config=config.Configuration(background_policy=config.BackgroundPolicy.WHITE)).draw_layout(target)
      root = validate_svg(backend.get_string(layout.Page(0, 0, layout.Units.mm,
        margins=layout.Margins.all(0))))
      root.set('data-diogen-review', 'unreviewed')
      import xml.etree.ElementTree as ET
      ET.indent(root, space='  ')
      name = f'{key}-{index}-{kind}.svg'
      (output / name).write_text(ET.tostring(root, encoding='unicode'), encoding='utf-8')
      row.update({'svg': 'preview/' + name, 'status': 'candidate',
        'entities': dict(Counter(e.dxftype() for e in (selected if selected is not None else space)))})
    except Exception as error:
      row.update({'status': 'failed', 'error': str(error)})
    views.append(row)
  save(output / (key + '.json'), {'load': audit, 'views': views, 'unitsCode': int(doc.units),
    'ezdxf': ezdxf.__version__, 'fontResolutionVerified': False, 'multipleSignsSeparated': False,
    'fontStyles': [{'name': s.dxf.name, 'font': s.dxf.get('font', '')} for s in doc.styles],
    'warning': 'Layer/layout candidates only. INSERT contents, colours, fonts, multiple depictions and legal meaning require review.'})


def choose(rows, limit):
  rows = [r for r in rows if r.get('dwgHeader')]
  groups = defaultdict(list)
  for row in rows:
    groups[str(Path(row['path']).parent)].append(row)
  selected = []
  for code in ['A15', 'P6', 'B20a', 'C4a', 'E13', 'IP22', 'A5a']:
    match = next((r for r in rows if re.match(re.escape(code) + r'(?:[^A-Za-z0-9]|$)',
      Path(r['path']).stem, re.I)), None)
    if match and match not in selected:
      selected.append(match)
  while any(groups.values()):
    for group in groups.values():
      if group:
        row = group.pop(0)
        if row not in selected:
          selected.append(row)
  return selected if limit == 0 else selected[:limit]


def display_name(value):
  try:
    return value.encode('cp437').decode('cp852')
  except (UnicodeEncodeError, UnicodeDecodeError):
    return value


def batch(output, limit):
  data = json.loads((output / 'inventory.json').read_text(encoding='utf-8'))
  converter = shutil.which('dwgread')
  if not converter:
    raise ValueError('dwgread missing')
  folder = output / 'preview'
  folder.mkdir(exist_ok=True)
  rows = choose(data['files'], limit)
  def convert(row):
    key = row['sha256'][:16] + '-' + hashlib.sha256(row['path'].encode()).hexdigest()[:8]
    result = {'source': row, 'status': 'blocked', 'reviewStatus': 'unreviewed'}
    try:
      dxf = folder / (key + '.dxf')
      with (folder / (key + '-converter.log')).open('w') as log:
        process = subprocess.run([converter, '-O', 'DXF', '-o', str(dxf), str(output / row['path'])],
          stdout=log, stderr=subprocess.STDOUT, timeout=120)
      result['converterExitCode'] = process.returncode
      if not dxf.is_file() or not dxf.stat().st_size:
        raise ValueError('No DXF; see converter log')
      with (folder / (key + '-render.log')).open('w') as log:
        job = subprocess.run([sys.executable, str(Path(__file__).resolve()), 'render',
          '--dxf', str(dxf), '--output', str(folder), '--key', key],
          stdout=log, stderr=subprocess.STDOUT, timeout=180)
      if job.returncode:
        raise ValueError('Render/load failed; inspect render log and any repair audit')
      details = json.loads((folder / (key + '.json')).read_text(encoding='utf-8'))
      candidates = [v for v in details['views'] if v.get('svg') and v['kind'] != 'technical']
      result.update({'status': 'extracted-unreviewed' if candidates else 'no-sign-candidate',
        'details': details, 'candidateViews': len(candidates)})
    except Exception as error:
      result['error'] = str(error)
    return result
  results = []
  with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(convert, row) for row in rows]
    for future in as_completed(futures):
      results.append(future.result())
      print(f'Processed {len(results)}/{len(rows)} DWG files', flush=True)
      results.sort(key=lambda r: r['source']['path'])
      save(output / 'pilot.json', {'sourceArchiveSha256': data['archiveSha256'],
        'results': results, 'scheduled': len(rows), 'catalogueComplete': False, 'automaticPublication': False})
  cards = []
  for row in results:
    figures = '\n'.join(f'<figure><figcaption>{html.escape(v["layout"] + " / " + v["kind"])}</figcaption>'
      f'<img src="{v["svg"]}" alt="Unreviewed candidate"></figure>' for v in row.get('details', {}).get('views', []) if 'svg' in v)
    cards.append('<article>\n<h2>' + html.escape(display_name(row['source']['path'])) + '</h2>\n<p>' +
      html.escape(row['status'] + ': ' + row.get('error', 'unreviewed')) + '</p>\n' + figures + '\n</article>')
  gallery = """<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <title>DIOGEN — srovnání CAD a značek</title>
    <style>
      body {
        font: 16px sans-serif;
        margin: 24px;
      }
      article {
        border-bottom: 1px solid #aaa;
        margin-bottom: 24px;
      }
      figure {
        display: inline-block;
        width: 30%;
        vertical-align: top;
      }
      img {
        width: 100%;
        height: 260px;
        object-fit: contain;
      }
      h2 {
        overflow-wrap: anywhere;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <h1>Neověřené kandidáty značek</h1>
    <p>Původní výkres, oddělená geometrie a výplně. Nejde o schválený katalog.</p>
""" + '\n'.join(cards) + '\n  </body>\n</html>\n'
  (output / 'index.html').write_text(gallery, encoding='utf-8')
  count = sum(r['status'] == 'extracted-unreviewed' for r in results)
  (output / 'summary.md').write_text(f'# DIOGEN: rozšířený pilot\n\nDWG: {len(results)}; '
    f's kandidáty značek: {count}; blokované či bez kandidáta: {len(results) - count}.\n\n'
    'Výstupy nejsou schválené. Opravy MTEXT jsou v samostatných protokolech.\n', encoding='utf-8')
  if not count:
    raise ValueError('No sign candidates; inspect artifact')


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('stage', choices=['batch', 'render'])
  parser.add_argument('--output', type=Path, required=True)
  parser.add_argument('--limit', type=int, default=64)
  parser.add_argument('--dxf', type=Path)
  parser.add_argument('--key')
  args = parser.parse_args()
  if not 0 <= args.limit <= 1024:
    parser.error('limit must be 0 (all) or 1–1024')
  if args.stage == 'render':
    render_job(args.dxf, args.output, args.key)
  else:
    batch(args.output, args.limit)


if __name__ == '__main__':
  main()
