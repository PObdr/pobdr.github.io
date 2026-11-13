import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from filled_export import export, asset_stem, unique_name, source_svg

SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0L1 1"/></svg>'


def prepare(root, views):
  work = root / 'work'
  (work / 'preview').mkdir(parents=True)
  source = {'path': 'source/tabulky/E11b-S časovým poplatkem (1000x500).dwg',
    'sha256': 'a' * 64, 'dwgHeader': 'AC1024'}
  (work / 'inventory.json').write_text(json.dumps({'archiveSha256': 'archive', 'files': [source]}))
  (work / 'pilot.json').write_text(json.dumps({'scheduled': 1, 'results': [{
    'source': source, 'status': 'extracted-unreviewed', 'details': {'views': views}}]}))
  return work


class FilledExportTests(unittest.TestCase):
  def test_names_variants_and_collision(self):
    self.assertEqual(asset_stem('E11b-S časovým poplatkem (1000x500).dwg'),
      'E11b-s-casovym-poplatkem-1000x500')
    self.assertEqual(asset_stem('P6-1-Stůj, dej přednost v jízdě! (700).dwg'),
      'P6-1-stuj-dej-prednost-v-jizde-700')
    self.assertTrue(asset_stem('IP11bdf-Parkoviště.dwg').startswith('IP11bdf-'))
    self.assertEqual(asset_stem('E11b-S ƒasov∞m poplatkem (1000x500).dwg'),
      'E11b-s-casovym-poplatkem-1000x500')
    self.assertNotEqual(asset_stem('P6-1-Stop (700).dwg'), asset_stem('P6-2-Stop (700).dwg'))
    used = set()
    self.assertEqual(unique_name('E11b', used), 'E11b.svg')
    self.assertEqual(unique_name('e11b', used), 'e11b--2.svg')

  def test_only_filled_and_no_source_binaries(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      views = [{'kind': kind, 'layout': 'E11 b', 'status': 'candidate', 'svg': f'preview/{kind}.svg'}
        for kind in ['technical', 'sign-geometry', 'sign-filled']]
      work = prepare(root, views)
      for view in views:
        (work / view['svg']).write_text(SVG)
      (work / 'source.zip').write_bytes(b'archive')
      (work / 'preview/source.dxf').write_bytes(b'dxf')
      (work / 'preview/source.dwg').write_bytes(b'dwg')
      (work / 'preview/render.log').write_text('diagnostic')
      result = export(work, root / 'export')
      self.assertEqual(result['svgCount'], 1)
      self.assertTrue(result['fullSourceProcessed'])
      self.assertEqual(result['assets'][0]['svg'], 'svg/E11b-s-casovym-poplatkem-1000x500.svg')
      self.assertEqual(result['assets'][0]['svgSha256'], hashlib.sha256(SVG.encode()).hexdigest())
      self.assertEqual((root / 'export'/result['assets'][0]['svg']).read_text(), SVG)
      self.assertTrue((root / 'export/reports/render.log').is_file())
      self.assertFalse(any(p.suffix.lower() in ['.zip', '.dwg', '.dxf'] for p in (root / 'export').rglob('*')))
      self.assertEqual((work / 'source.zip').read_bytes(), b'archive')
      self.assertNotIn('technical.svg', (root / 'export/index.html').read_text())

  def test_multiple_layouts_keep_distinct_names(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      views = [{'kind': 'sign-filled', 'layout': name, 'status': 'candidate', 'svg': f'preview/{i}.svg'}
        for i, name in enumerate(['Varianta A', 'Varianta B'])]
      work = prepare(root, views)
      for view in views:
        (work / view['svg']).write_text(SVG)
      result = export(work, root / 'export')
      self.assertEqual(result['svgCount'], 2)
      self.assertEqual(len({a['svg'] for a in result['assets']}), 2)
      self.assertTrue(all('--varianta-' in a['svg'] for a in result['assets']))

  def test_missing_reports_and_files_are_not_success(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      work = prepare(root, [{'kind': 'sign-filled', 'svg': 'preview/missing.svg'}])
      result = export(work, root / 'partial')
      self.assertEqual(result['status'], 'partial-unreviewed')
      self.assertEqual(result['svgCount'], 0)
      (work / 'pilot.json').unlink()
      result = export(work, root / 'absent')
      self.assertFalse(result['fullSourceProcessed'])
      self.assertTrue(json.loads((root / 'absent/issues.json').read_text()))

  def test_unsafe_paths_and_overlapping_directories(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      work = prepare(root, [])
      for relative in ['../other.svg', '/tmp/other.svg', 'preview/file.dxf']:
        with self.subTest(relative=relative), self.assertRaises(ValueError):
          source_svg(work, relative)
      with self.assertRaises(ValueError):
        export(work, work / 'export')


if __name__ == '__main__':
  unittest.main()
