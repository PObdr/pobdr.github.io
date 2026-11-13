import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from import_signs import extract, choose, validate_svg, render, NS


class ImportTests(unittest.TestCase):
  def test_zip(self):
    with tempfile.TemporaryDirectory() as folder:
      root = Path(folder)
      archive = root / 'source.zip'
      nested = io.BytesIO()
      with zipfile.ZipFile(nested, 'w') as bundle:
        bundle.writestr('B20a.dwg', b'AC1015fixture')
      with zipfile.ZipFile(archive, 'w') as bundle:
        bundle.writestr('group/A15.dwg', b'AC1015fixture')
        bundle.writestr('nested.zip', nested.getvalue())
      extract(archive, root / 'out')
      self.assertTrue((root / 'out/group/A15.dwg').exists())
      self.assertTrue((root / 'out/nested.zip.contents/B20a.dwg').exists())

  def test_unsafe_paths(self):
    for name in ['../escape', '/absolute', 'C:/escape', '..\\escape']:
      with self.subTest(name=name), tempfile.TemporaryDirectory() as folder:
        root = Path(folder)
        archive = root / 'bad.zip'
        with zipfile.ZipFile(archive, 'w') as bundle:
          bundle.writestr(name, b'unsafe')
        with self.assertRaises(ValueError):
          extract(archive, root / 'out')

  def test_svg(self):
    valid = f'<svg xmlns="{NS}" viewBox="0 0 10 10"><style>.a{{fill:url("#x")}}</style><path d="M0 0L1 1"/></svg>'
    self.assertEqual(validate_svg(valid).tag, '{' + NS + '}svg')
    for content in ['<script/>', '<image href="https://invalid/x"/>',
                    '<path onclick="x()"/>', '<path fill="url(https://invalid/x)"/>']:
      with self.subTest(content=content), self.assertRaises(ValueError):
        validate_svg(f'<svg xmlns="{NS}" viewBox="0 0 10 10">{content}</svg>')
    with self.assertRaises(ValueError):
      validate_svg(f'<svg xmlns="{NS}" viewBox="0 0 0 10"><path/></svg>')

  def test_selection(self):
    rows = [{'path': f'source/{name}.dwg', 'dwgHeader': 'AC1015'} for name in ['A15', 'P6', 'B20a', 'C4a', 'E13', 'IP22', 'extra']]
    selected = choose(rows, 4)
    self.assertEqual(len(selected), 4)
    self.assertEqual(len({row['path'] for row in selected}), 4)

  def test_real_svg_backend(self):
    try:
      import ezdxf
    except ImportError:
      self.skipTest('ezdxf installed by Actions, not available in local preparation environment')
    with tempfile.TemporaryDirectory() as folder:
      root = Path(folder)
      doc = ezdxf.new('R2010')
      doc.modelspace().add_circle((0, 0), 10, dxfattribs={'color': 1})
      doc.modelspace().add_lwpolyline([(0, 0), (5, 0), (5, 5)], dxfattribs={'color': 5})
      doc.saveas(root / 'test.dxf')
      render(root / 'test.dxf', root / 'test.svg', root / 'test.json')
      validate_svg((root / 'test.svg').read_text())
      self.assertEqual(json.loads((root / 'test.json').read_text())['modelEntities']['CIRCLE'], 1)


if __name__ == '__main__':
  unittest.main()
