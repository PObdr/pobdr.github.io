import json
from pathlib import Path
import tempfile
import unittest

from cad_review import repair_mtext, sign_entities, choose, read_document, render_job

FIRST = r'\A1;\PVýška písma min. 63 mm, ve výjimečných případech lze použít výšku písma 49 mm {\H1.83333x; }\P(např. při umístění pod dopravní značkou parkoviště nebo v pěší zóně). {\H1.74603x; }\PNápis se umísťuje do středu textovéh'
LAST = r'o pole, diakritika se přitom nezohledňuje.{\H1.75132x; }\PE ... 1/7 h, h ... výška písma{\H1.77337x; }'


class Entity:
  def __init__(self, kind, layer):
    self.kind, self.dxf = kind, {'layer': layer}

  def dxftype(self):
    return self.kind


class ReviewTests(unittest.TestCase):
  def test_known_wrap(self):
    self.assertEqual(len(FIRST.encode()), 255)
    data = ('0\nMTEXT\n1\n' + FIRST + '\n' + LAST + '\n7\nStandard\n0\nEOF\n').encode()
    fixed, audit = repair_mtext(data)
    self.assertEqual(len(audit), 1)
    lines = fixed.decode().splitlines()
    values = [lines[i + 1] for i in range(0, len(lines), 2) if lines[i].strip() in ['1', '3']]
    self.assertEqual(''.join(values), FIRST + LAST)
    self.assertTrue(all(len(value) <= 250 for value in values))
    self.assertEqual(repair_mtext(fixed), (fixed, []))

  def test_other_signs_and_multiple_wraps(self):
    text = 'a' * 765 + 'END'
    parts = [text[i:i + 255] for i in range(0, len(text), 255)]
    fixed, audit = repair_mtext(('0\nMTEXT\n1\n' + '\n'.join(parts) + '\n0\nEOF\n').encode())
    self.assertEqual(len(audit), 1)
    self.assertIn(b'END', fixed)
    self.assertEqual(audit[0]['characters'], len(text))

  def test_unknown_damage_is_blocked(self):
    for data in [b'0\nLINE\n1\nabc\ncontinuation\n0\nEOF\n',
                 b'0\nMTEXT\n1\nshort\ncontinuation\n0\nEOF\n', b'not a dxf']:
      with self.subTest(data=data), self.assertRaises(ValueError):
        repair_mtext(data)

  def test_layer_selection(self):
    hatch = Entity('HATCH', 'Značka')
    shape = Entity('LWPOLYLINE', 'Značka')
    insert = Entity('INSERT', 'Znacka')
    entities = [hatch, shape, insert, Entity('DIMENSION', 'Značka'),
      Entity('VIEWPORT', 'Značka'), Entity('LINE', 'Kóty'), Entity('MTEXT', 'Rozpiska')]
    self.assertEqual(sign_entities(entities), [hatch, shape, insert])
    self.assertEqual(sign_entities(entities, True), [hatch])

  def test_larger_stratified_batch(self):
    rows = [{'path': f'source/{group}/{number}.dwg', 'dwgHeader': 'AC1024', 'sha256': f'{group}-{number}'}
      for group in range(12) for number in range(10)]
    selected = choose(rows, 64)
    self.assertEqual(len(selected), 64)
    self.assertEqual(len({r['path'] for r in selected}), 64)
    self.assertEqual(len({Path(r['path']).parent for r in selected}), 12)
    self.assertEqual(len(choose(rows, 0)), 120)

  def test_actual_backend_repair_and_filled_paperspace(self):
    try:
      import ezdxf
    except ImportError:
      self.skipTest('Actual ezdxf backend is installed in Actions')
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      doc = ezdxf.new('R2010')
      doc.layers.new('Značka')
      doc.layers.new('Kóty')
      doc.modelspace().add_mtext('PLACEHOLDER', dxfattribs={'layer': 'Kóty'})
      space = doc.layouts.new('Filled sign')
      hatch = space.add_hatch(color=1, dxfattribs={'layer': 'Značka'})
      hatch.paths.add_polyline_path([(0, 0), (100, 0), (100, 100), (0, 100)], is_closed=True)
      space.add_line((-1000, -1000), (1000, 1000), dxfattribs={'layer': 'Kóty'})
      path = root / 'test.dxf'
      doc.saveas(path)
      text = path.read_text()
      self.assertIn('\nPLACEHOLDER\n', text)
      path.write_text(text.replace('\nPLACEHOLDER\n', '\n' + FIRST + '\n' + LAST + '\n'))
      loaded, audit = read_document(path)
      self.assertEqual(audit['loadMode'], 'mtext-repaired')
      self.assertEqual(loaded.modelspace().query('MTEXT')[0].text, FIRST + LAST)
      render_job(path, root, 'test')
      report = json.loads((root / 'test.json').read_text())
      filled = [v for v in report['views'] if v['kind'] == 'sign-filled' and 'svg' in v]
      self.assertTrue(filled)
      self.assertEqual(filled[0]['entities'], {'HATCH': 1})


if __name__ == '__main__':
  unittest.main()
