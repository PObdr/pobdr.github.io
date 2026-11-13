import copy
import json
from pathlib import Path
import tempfile
import unittest

from cad_review import sign_colour_copy, render_job


class Attributes:
  def __init__(self, values):
    self.values = values

  def get(self, name, default=None):
    return self.values.get(name, default)

  def all_existing_dxf_attribs(self):
    return dict(self.values)


class Entity:
  def __init__(self, **values):
    self.dxf = Attributes({'handle': 'B7BA', 'layer': 'Značka', **values})
    self.rgb = None

  def dxftype(self):
    return 'HATCH'

  def copy(self):
    return copy.deepcopy(self)


class ColourTests(unittest.TestCase):
  def test_direct_249_is_black_in_copy_only(self):
    entity = Entity(color=249)
    before = entity.dxf.all_existing_dxf_attribs()
    copied, audit = sign_colour_copy(entity)
    self.assertEqual(copied.rgb, (0, 0, 0))
    self.assertIsNone(entity.rgb)
    self.assertEqual(entity.dxf.all_existing_dxf_attribs(), before)
    self.assertTrue(audit['applied'])
    self.assertEqual(audit['sourceHandle'], 'B7BA')

  def test_all_other_indices_unchanged(self):
    for index in range(257):
      if index == 249:
        continue
      with self.subTest(index=index):
        copied, audit = sign_colour_copy(Entity(color=index))
        self.assertFalse(audit['applied'])
        self.assertIsNone(copied.rgb)

  def test_explicit_rgb_and_other_layers_unchanged(self):
    for entity in [Entity(color=249, true_color=0x581317), Entity(color=249, true_color=0),
                   Entity(color=249, layer='Kóty'), Entity(color=249, layer='0')]:
      copied, audit = sign_colour_copy(entity)
      self.assertFalse(audit['applied'])
      self.assertEqual(copied.dxf.all_existing_dxf_attribs(), entity.dxf.all_existing_dxf_attribs())

  def test_actual_backend_preserves_red_grey_and_true_rgb(self):
    try:
      import ezdxf
    except ImportError:
      self.skipTest('ezdxf backend is installed in Actions')
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      doc = ezdxf.new('R2010')
      doc.layers.new('Značka')
      for index, colour in enumerate([249, 1, 252, 249]):
        hatch = doc.modelspace().add_hatch(color=colour, dxfattribs={'layer': 'Značka'})
        if index == 3:
          hatch.rgb = (88, 19, 23)
        x = index * 20
        hatch.paths.add_polyline_path([(x, 0), (x + 10, 0), (x + 10, 10), (x, 10)], is_closed=True)
      source = root / 'test.dxf'
      doc.saveas(source)
      original = source.read_bytes()
      render_job(source, root, 'colour')
      self.assertEqual(source.read_bytes(), original)
      data = json.loads((root / 'colour.json').read_text())
      view = next(v for v in data['views'] if v['kind'] == 'sign-filled' and 'svg' in v)
      self.assertEqual(sum(c['applied'] for c in view['colourAudit']), 1)
      svg = (root / Path(view['svg']).name).read_text().lower()
      for colour in ['#000000', '#ff0000', '#581317']:
        self.assertIn(colour, svg)
      technical = next(v for v in data['views'] if v['kind'] == 'technical')
      self.assertEqual(technical['colourProfile'], 'source')
      self.assertEqual(technical['colourAudit'], [])


if __name__ == '__main__':
  unittest.main()
