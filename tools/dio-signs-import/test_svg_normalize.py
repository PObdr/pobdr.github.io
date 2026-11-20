import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

from filled_export import export
from svg_normalize import normalize_svg, PALETTE, colour_key


SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">{}</svg>'
BACKGROUND = '<rect x="0" y="0" width="100" height="100" fill="#ffffff" fill-opacity="1.0"/>'
TRIANGLE = '<path fill="#ff0000" d="M50 10 L90 90 H10 Z"/><path fill="#ffffff" d="M50 22 L80 84 H20 Z"/>'


class NormalizationTests(unittest.TestCase):
  def test_palette(self):
    for name, value in PALETTE.items():
      normalized, audit = normalize_svg(SVG.format(f'<path fill="{value}" d="M0 0H10V10Z"/>'))
      self.assertEqual(audit['unknownColours'], [])
    self.assertEqual(colour_key('rgb(255, 0, 0)'), '#ff0000')
    self.assertEqual(colour_key('#f00'), '#ff0000')
    self.assertIsNone(colour_key('rgb(300, 0, 0)'))

  def test_css_and_attributes(self):
    source = SVG.format('<defs><style>.a {fill: #0000ff; stroke: rgb(255, 0, 0) !important;}</style></defs><path class="a" style="color: lime; fill: none" d="M0 0H10V10Z"/>')
    output, audit = normalize_svg(source)
    for value in ['#00539C', '#C41E30 !important', '#00704A', 'fill: none']:
      self.assertIn(value, output)
    self.assertEqual(len(audit['colourChanges']), 3)

  def test_white_inside_and_transparent_corners(self):
    output, audit = normalize_svg(SVG.format(BACKGROUND + TRIANGLE), renderer_background=True)
    image = Image.open(io.BytesIO(cairosvg.svg2png(bytestring=output.encode(), output_width=200, output_height=200))).convert('RGBA')
    self.assertEqual(image.getpixel((0, 0))[3], 0)
    self.assertEqual(image.getpixel((100, 120)), (255, 255, 255, 255))
    self.assertLess(audit['outputViewBox'][2], 100)
    self.assertIn('FFFFFF', output)
    self.assertIn('#C41E30', output)

  def test_no_background_deletion_without_provenance(self):
    output, audit = normalize_svg(SVG.format(BACKGROUND + TRIANGLE))
    self.assertIn('rect', output)
    self.assertEqual(audit['background'], 'not-proven-preserved')

  def test_nested_or_smaller_white_rect_is_preserved(self):
    for rectangle in ['<g>' + BACKGROUND + '</g>', BACKGROUND.replace('width="100"', 'width="90"')]:
      output, audit = normalize_svg(SVG.format(rectangle + TRIANGLE), renderer_background=True)
      self.assertIn('rect', output)
      self.assertEqual(audit['background'], 'not-proven-preserved')

  def test_unknown_magenta_is_not_guessed(self):
    source = SVG.format('<path fill="#ff00ff" d="M0 0H10V10Z"/>')
    output, audit = normalize_svg(source)
    self.assertEqual(output, source)
    self.assertEqual(audit['unknownColours'], ['#ff00ff'])

  def test_noop_preserves_bytes_and_hash(self):
    source = SVG.format('<path fill="#000000" d="M0 0H10V10Z"/>')
    output, audit = normalize_svg(source)
    self.assertEqual(output, source)
    self.assertEqual(audit['outputSvgSha256'], hashlib.sha256(output.encode()).hexdigest())

  def test_no_global_clipping_or_white_replacement(self):
    source = SVG.format(BACKGROUND + '<circle cx="50" cy="50" r="30" fill="white"/>')
    output, audit = normalize_svg(source, renderer_background=True)
    self.assertNotIn('clipPath', output)
    self.assertIn('circle', output)
    self.assertIn('#FFFFFF', output)

  def test_unsafe_content_rejected(self):
    for content in ['<script/>', '<image href="https://example.invalid/x"/>', '<path fill="url(https://example.invalid/x)"/>', '<style>@import "file:///x";</style>']:
      with self.subTest(content=content), self.assertRaises(ValueError):
        normalize_svg(SVG.format(content))

  def test_empty_sign_rejected_after_background_removal(self):
    with self.assertRaises(ValueError):
      normalize_svg(SVG.format(BACKGROUND), renderer_background=True)

  def test_export_integration(self):
    with tempfile.TemporaryDirectory() as folder:
      root = Path(folder)
      work = root / 'work'
      (work / 'preview').mkdir(parents=True)
      source = SVG.format(BACKGROUND + TRIANGLE)
      (work / 'preview/sign.svg').write_text(source, encoding='utf-8')
      original = {'path': 'A1.dwg', 'sha256': 'a' * 64, 'dwgHeader': 'AC1024'}
      (work / 'inventory.json').write_text(json.dumps({'files': [original]}))
      view = {'kind': 'sign-filled', 'svg': 'preview/sign.svg', 'colourProfile': 'cz-vl61-direct-aci249-black-v1'}
      (work / 'pilot.json').write_text(json.dumps({'scheduled': 1, 'results': [{'source': original, 'details': {'views': [view]}}]}))
      destination = root / 'export'
      manifest = export(work, destination)
      self.assertEqual(manifest['svgCount'], 1)
      item = manifest['assets'][0]
      self.assertEqual((destination / item['originalSvg']).read_text(), source)
      self.assertEqual((work / 'preview/sign.svg').read_text(), source)
      self.assertEqual(item['svgSha256'], hashlib.sha256((destination / item['svg']).read_bytes()).hexdigest())
      self.assertTrue((destination / item['normalizationAudit']).is_file())
      self.assertIn('conic-gradient', (destination / 'index.html').read_text())
      self.assertFalse(any(path.suffix in ['.dwg', '.dxf', '.zip'] for path in destination.rglob('*')))


if __name__ == '__main__':
  unittest.main()
