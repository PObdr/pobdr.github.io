import argparse
import hashlib
import html
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import unicodedata
import xml.etree.ElementTree as ET


def write_json(path, data):
  path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def display_name(value):
  try:
    return value.encode('cp437').decode('cp852')
  except (UnicodeEncodeError, UnicodeDecodeError):
    return value


def slug(value):
  text = unicodedata.normalize('NFKD', value).encode('ascii', errors='ignore').decode().lower()
  return re.sub(r'[^a-z0-9]+', '-', text).strip('-') or 'varianta'


def asset_stem(source):
  stem = Path(display_name(source)).stem
  match = re.match(r'^([A-Za-z]{1,4}\d+[a-z]{0,4})(?=[^A-Za-z0-9]|$)', stem)
  if match:
    result = match[1] + '-' + slug(stem[match.end():])
  else:
    result = slug(stem)
  return result[:160].rstrip('-')


def unique_name(stem, used):
  name, index = stem + '.svg', 2
  while name.casefold() in used:
    name = f'{stem}--{index}.svg'
    index += 1
  used.add(name.casefold())
  return name


def source_svg(work, relative):
  path = PurePosixPath(relative)
  if path.is_absolute() or '..' in path.parts or path.suffix.lower() != '.svg':
    raise ValueError('Unsafe SVG path')
  target = work.joinpath(*path.parts).resolve()
  if not target.is_relative_to(work.resolve()) or not target.is_file():
    raise ValueError('Missing or external SVG')
  root = ET.parse(target).getroot()
  if root.tag != '{http://www.w3.org/2000/svg}svg':
    raise ValueError('Not an SVG document')
  return target


def load_report(path, issues):
  try:
    return json.loads(path.read_text(encoding='utf-8'))
  except (OSError, ValueError) as error:
    issues.append({'type': 'report-unavailable', 'file': path.name, 'error': str(error)})
    return {}


def export(work, destination):
  work, destination = work.resolve(), destination.resolve()
  if destination.is_relative_to(work) or work.is_relative_to(destination):
    raise ValueError('Work and export directories must be separate')
  destination.mkdir(parents=True, exist_ok=False)
  assets, reports = destination / 'svg', destination / 'reports'
  assets.mkdir()
  reports.mkdir()
  issues, entries, used = [], [], set()
  inventory = load_report(work / 'inventory.json', issues)
  pilot = load_report(work / 'pilot.json', issues)
  rows = sorted(pilot.get('results', []), key=lambda row: row['source']['path'])
  processed = set()
  with_filled = set()
  for row in rows:
    original = row['source']
    path = original['path']
    processed.add(path)
    details = row.get('details', {})
    views = [view for view in details.get('views', []) if view.get('kind') == 'sign-filled' and view.get('svg')]
    if not views:
      issues.append({'type': 'no-filled-svg', 'source': display_name(path),
        'status': row.get('status'), 'error': row.get('error')})
    for view in details.get('views', []):
      if view.get('kind') == 'sign-filled' and view.get('status') == 'failed':
        issues.append({'type': 'filled-view-failed', 'source': display_name(path),
          'layout': view.get('layout'), 'error': view.get('error')})
    for view in views:
      try:
        source = source_svg(work, view['svg'])
        stem = asset_stem(path)
        if len(views) > 1:
          stem += '--' + slug(view.get('layout', 'varianta'))[:50]
        name = unique_name(stem, used)
        shutil.copyfile(source, assets / name)
        with_filled.add(path)
        entries.append({'id': hashlib.sha256((original['sha256'] + '\0' +
          view.get('layout', '') + '\0sign-filled').encode()).hexdigest(),
          'label': Path(display_name(path)).stem, 'svg': 'svg/' + name,
          'sourcePath': path, 'sourceDisplayPath': display_name(path),
          'sourceDwgSha256': original['sha256'],
          'sourceArchiveSha256': inventory.get('archiveSha256'),
          'layout': view.get('layout'), 'kind': 'sign-filled',
          'svgSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'unitsCode': details.get('unitsCode'),
          'loadMode': details.get('load', {}).get('loadMode'),
          'repairCount': len(details.get('load', {}).get('fixes', [])),
          'colourProfile': view.get('colourProfile'),
          'colourChanges': sum(bool(item.get('applied')) for item in view.get('colourAudit', [])),
          'reviewStatus': 'unreviewed'})
      except (OSError, ValueError, ET.ParseError) as error:
        issues.append({'type': 'export-failed', 'source': display_name(path), 'error': str(error)})
  for source in sorted((work / 'preview').glob('*')):
    if source.is_file() and not source.is_symlink() and source.suffix.lower() in ['.log', '.json']:
      shutil.copyfile(source, reports / source.name)
  for name in ['inventory.json', 'pilot.json', 'converter-version.txt',
               'converter-binary.sha256', 'libredwg-source.sha256',
               'python-packages.txt', 'project-font.sha256']:
    if (work / name).is_file():
      shutil.copyfile(work / name, reports / name)
  for source in work.glob('error-*.json'):
    if source.is_file():
      shutil.copyfile(source, reports / source.name)
  expected = {row['path'] for row in inventory.get('files', []) if row.get('dwgHeader')}
  complete = bool(expected) and expected.issubset(processed)
  manifest = {'version': 1, 'sourceArchiveSha256': inventory.get('archiveSha256'),
    'sourceDwgCount': len(expected), 'scheduledDwgCount': pilot.get('scheduled'),
    'processedDwgCount': len(processed), 'dwgWithFilledCount': len(with_filled),
    'svgCount': len(entries), 'fullSourceProcessed': complete,
    'status': 'complete-unreviewed' if complete and not issues else 'partial-unreviewed',
    'catalogueComplete': False, 'automaticPublication': False,
    'sourceBinariesIncluded': False, 'assets': entries}
  write_json(destination / 'catalog.json', manifest)
  write_json(destination / 'issues.json', issues)
  summary = f'# DIOGEN: vyplněné SVG\n\nDWG ve zdroji: {len(expected)}; zpracováno: {len(processed)}; '
  summary += f's vyplněným SVG: {len(with_filled)}; SVG souborů: {len(entries)}; upozornění: {len(issues)}.\n\n'
  summary += f'Stav: {manifest["status"]}. Modely nejsou schválené. Zdrojový ZIP, DWG ani DXF nejsou přiloženy.\n'
  (destination / 'summary.md').write_text(summary, encoding='utf-8')
  cards = []
  for entry in entries:
    cards.append('    <figure>\n      <a href="' + entry['svg'] + '">\n' +
      '        <img loading="lazy" src="' + entry['svg'] + '" alt="' + html.escape(entry['label'], quote=True) + '">\n' +
      '      </a>\n      <figcaption>' + html.escape(entry['label'] + ' / ' + str(entry['layout'])) + '</figcaption>\n    </figure>')
  gallery = """<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DIOGEN — vyplněné značky</title>
    <style>
      body {
        font: 16px sans-serif;
        margin: 24px;
      }
      figure {
        display: inline-block;
        width: 280px;
        margin: 12px;
        vertical-align: top;
      }
      img {
        width: 260px;
        height: 200px;
        object-fit: contain;
      }
      figcaption {
        overflow-wrap: anywhere;
      }
    </style>
  </head>
  <body>
    <h1>Vyplněné SVG — zatím neověřené modely</h1>
    <p><a href="catalog.json">Katalog a původ</a> · <a href="issues.json">Chyby a upozornění</a></p>
""" + '\n'.join(cards) + '\n  </body>\n</html>\n'
  (destination / 'index.html').write_text(gallery, encoding='utf-8')
  forbidden = {'.zip', '.dwg', '.dxf'}
  if any(path.suffix.lower() in forbidden for path in destination.rglob('*') if path.is_file()):
    raise ValueError('Source binary leaked into export')
  return manifest


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('--work', type=Path, required=True)
  parser.add_argument('--destination', type=Path, required=True)
  args = parser.parse_args()
  print(json.dumps({key: value for key, value in export(args.work, args.destination).items() if key != 'assets'}))
