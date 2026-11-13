import argparse
import hashlib
import json
import os
from pathlib import Path


SOURCES = {
  'VL_6.1_Zmena_c._1_brezen_2025.pdf',
  'VL_6.1_2019_FINAL.pdf',
  'VL_6.2_2017.pdf',
  'VL_6.3_2017.pdf',
  'VL6.3_Dodatek_c.1_unor_2026.pdf'
}


def select_pages(count, mode):
  if mode not in {'pilot', 'all'}:
    raise ValueError('Unknown export mode')
  return range(min(count, 8) if mode == 'pilot' else count)


def resolve_source(directory, name):
  if name not in SOURCES:
    raise ValueError('Source PDF is not allowed')
  base = directory.resolve()
  source = (base / name).resolve()
  if source.parent != base or not source.is_file():
    raise ValueError('Source PDF is missing or external')
  return source


def write_json(path, value):
  path.write_text(
    json.dumps(value, ensure_ascii=False, indent=2) + '\n',
    encoding='utf-8'
  )


def run(name, mode, output):
  import pymupdf

  output.mkdir(parents=True, exist_ok=False)
  manifest = {
    'status': 'in-progress',
    'source': name,
    'mode': mode,
    'pages': [],
    'issues': [],
    'signTemplatesCreated': False,
    'automaticallyPublished': False
  }
  try:
    source = resolve_source(Path('dio/files'), name)
    manifest['sourceSha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
    manifest['rendererVersion'] = pymupdf.VersionBind
    manifest['revision'] = os.environ.get('GITHUB_SHA')
    with pymupdf.open(source) as document:
      if document.needs_pass:
        raise ValueError('Encrypted PDF requires a password')
      manifest['pageCount'] = len(document)
      selected = set(select_pages(len(document), mode))
      for index in range(len(document)):
        page = document[index]
        text = page.get_text('text')
        prefix = f'page-{index + 1:04d}'
        record = {
          'page': index + 1,
          'widthPt': page.rect.width,
          'heightPt': page.rect.height,
          'vectorPathCount': len(page.get_drawings()),
          'displayedImageCount': len(page.get_image_info()),
          'textCharacters': len(text),
          'exported': False
        }
        manifest['pages'].append(record)
        (output / (prefix + '.txt')).write_text(text, encoding='utf-8')
        if index not in selected:
          continue
        try:
          for suffix, outlines in [('paths', True), ('text', False)]:
            svg = page.get_svg_image(text_as_path=outlines)
            (output / f'{prefix}-{suffix}.svg').write_text(svg, encoding='utf-8')
          scale = min(1.5, 1400 / max(page.rect.width, page.rect.height))
          pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
          pixmap.save(output / (prefix + '.png'))
          record['exported'] = True
        except Exception as error:
          manifest['issues'].append({'page': index + 1, 'error': str(error)})
      manifest['status'] = 'partial' if manifest['issues'] else 'complete-unreviewed'
  except Exception as error:
    manifest['issues'].append({'stage': 'document-audit', 'error': str(error)})
    manifest['status'] = 'failed'
  finally:
    write_json(output / 'manifest.json', manifest)
    exported = sum(page['exported'] for page in manifest['pages'])
    summary = (
      '# DIO PDF audit and page export\n\n'
      f'Status: {manifest["status"]}\n\n'
      f'Inspected pages: {len(manifest["pages"])}; exported pages: {exported}; '
      f'issues: {len(manifest["issues"])}.\n\n'
      'These are full-page conversions, not individual signs or approved templates. '
      'Text SVG requires matching fonts. Paths SVG preserves glyph outlines. '
      'Raster content remains raster; no tracing or OCR was performed. '
      'Vector paths may include borders and dimensions, not only sign artwork.\n'
    )
    (output / 'summary.md').write_text(summary, encoding='utf-8')
  return 0 if manifest['status'] == 'complete-unreviewed' else 1


if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('--source', required=True, choices=sorted(SOURCES))
  parser.add_argument('--mode', choices=['pilot', 'all'], default='pilot')
  parser.add_argument('--output', type=Path, required=True)
  args = parser.parse_args()
  raise SystemExit(run(args.source, args.mode, args.output))
