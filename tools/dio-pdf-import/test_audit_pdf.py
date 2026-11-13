from pathlib import Path
import tempfile
import unittest

from audit_pdf import resolve_source, select_pages


class PdfInputTests(unittest.TestCase):
  def test_pilot_limit(self):
    self.assertEqual(list(select_pages(25, 'pilot')), list(range(8)))

  def test_short_document(self):
    self.assertEqual(list(select_pages(3, 'pilot')), [0, 1, 2])

  def test_all_pages(self):
    self.assertEqual(list(select_pages(25, 'all')), list(range(25)))

  def test_unknown_mode(self):
    with self.assertRaises(ValueError):
      select_pages(10, 'invalid')

  def test_rejects_unlisted_and_external_paths(self):
    with tempfile.TemporaryDirectory() as temp:
      root = Path(temp)
      for name in ['../other.pdf', '/tmp/other.pdf', 'anything.pdf']:
        with self.subTest(name=name), self.assertRaises(ValueError):
          resolve_source(root, name)

  def test_missing_input(self):
    with tempfile.TemporaryDirectory() as temp:
      with self.assertRaises(ValueError):
        resolve_source(Path(temp), 'VL_6.2_2017.pdf')

  def test_external_symlink(self):
    with tempfile.TemporaryDirectory() as temp:
      root = Path(temp)
      base = root / 'files'
      base.mkdir()
      target = root / 'outside.pdf'
      target.write_bytes(b'not-a-pdf')
      (base / 'VL_6.2_2017.pdf').symlink_to(target)
      with self.assertRaises(ValueError):
        resolve_source(base, 'VL_6.2_2017.pdf')


if __name__ == '__main__':
  unittest.main()
