import io
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

from svg_normalize import normalize_svg


SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{}</svg>'
PAGE = '<rect width="100" height="100" fill="#ffffff"/>'
RING = '<g fill-rule="evenodd"><path fill="#ff0000" d="M50 10 L90 90 H10 Z M50 25 L75 80 H25 Z"/><path fill="black" d="M48 40 H52 V65 H48 Z"/></g>'


def image(source):
  png = cairosvg.svg2png(bytestring=source.encode(), output_width=300, output_height=300)
  return Image.open(io.BytesIO(png)).convert('RGBA')


class SignFaceTests(unittest.TestCase):
  def test_triangle_hole_is_white_and_outside_transparent(self):
    output, audit = normalize_svg(SVG.format(PAGE + RING), renderer_background=True)
    pixels = image(output)
    self.assertEqual(pixels.getpixel((150, 220)), (255, 255, 255, 255))
    self.assertEqual(pixels.getpixel((150, 150)), (0, 0, 0, 255))
    self.assertEqual(pixels.getpixel((0, 0))[3], 0)
    self.assertEqual(audit['whiteFace'], 'closed-source-contour-v1')

  def test_actual_a3_geometry(self):
    source = (Path(__file__).parent / 'fixtures/A3-face.svg').read_text()
    root = ET.fromstring(source)
    ns = '{http://www.w3.org/2000/svg}'
    root.insert(1, ET.Element(ns + 'rect', {
      'x': '0', 'y': '0', 'width': '1000000', 'height': '871795', 'fill': '#ffffff'
    }))
    output, audit = normalize_svg(ET.tostring(root, encoding='unicode'), renderer_background=True)
    pixels = image(output)
    self.assertEqual(pixels.getpixel((150, 100)), (255, 255, 255, 255))
    self.assertEqual(pixels.getpixel((150, 190)), (0, 0, 0, 255))
    self.assertEqual(pixels.getpixel((0, 0))[3], 0)
    self.assertEqual(audit['background'], 'renderer-page-rectangle-removed')
    original_paths = [node.get('d') for node in root.iter() if node.tag.endswith('path')]
    output_paths = [node.get('d') for node in ET.fromstring(output).iter()
      if node.tag.endswith('path') and node.get('data-diogen-white-face') is None]
    self.assertEqual(output_paths, original_paths)

  def test_round_compound_contour(self):
    circle = '<path fill="#ff0000" fill-rule="evenodd" d="M50 10 A40 40 0 1 1 49.99 10 Z M50 20 A30 30 0 1 1 49.99 20 Z"/>'
    output, audit = normalize_svg(SVG.format(PAGE + circle), renderer_background=True)
    self.assertEqual(image(output).getpixel((150, 150)), (255, 255, 255, 255))
    self.assertEqual(image(output).getpixel((0, 0))[3], 0)

  def test_unknown_open_contour_preserves_page(self):
    source = SVG.format(PAGE + '<path stroke="black" fill="none" d="M10 10 L90 90"/>')
    output, audit = normalize_svg(source, renderer_background=True)
    self.assertEqual(audit['background'], 'not-proven-preserved')
    self.assertEqual(image(output).getpixel((0, 0)), (255, 255, 255, 255))

  def test_artwork_outside_candidate_preserves_page(self):
    output, audit = normalize_svg(SVG.format(PAGE + RING + '<circle cx="5" cy="5" r="3" fill="black"/>'), renderer_background=True)
    self.assertEqual(audit['background'], 'not-proven-preserved')
    self.assertNotIn('data-diogen-white-face', output)

  def test_transformed_contour(self):
    output, audit = normalize_svg(SVG.format(PAGE + '<g transform="translate(10 10) scale(.8)">' + RING + '</g>'), renderer_background=True)
    self.assertEqual(audit['whiteFace'], 'closed-source-contour-v1')
    self.assertEqual(image(output).getpixel((150, 220)), (255, 255, 255, 255))

  def test_explicit_white_circle(self):
    output, audit = normalize_svg(SVG.format(PAGE + '<circle cx="50" cy="50" r="30" fill="white"/>'), renderer_background=True)
    self.assertEqual(audit['background'], 'renderer-page-rectangle-removed')
    self.assertEqual(image(output).getpixel((150, 150)), (255, 255, 255, 255))

  def test_no_provenance_no_change_to_background(self):
    output, audit = normalize_svg(SVG.format(PAGE + RING))
    self.assertEqual(audit['background'], 'not-proven-preserved')
    self.assertNotIn('data-diogen-white-face', output)


if __name__ == '__main__':
  unittest.main()
