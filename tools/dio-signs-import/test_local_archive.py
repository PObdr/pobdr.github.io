import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from import_signs import download, inventory, digest


class LocalArchiveTests(unittest.TestCase):
  def test_local_inventory_never_downloads(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      archive = root / 'uploaded.zip'
      with zipfile.ZipFile(archive, 'w') as bundle:
        bundle.writestr('A15.dwg', b'AC1015-fixture')
      original = archive.read_bytes()
      output = root / 'out'
      output.mkdir()
      with patch('import_signs.urllib.request.urlopen', side_effect=AssertionError('network forbidden')) as network:
        inventory(output, archive)
        network.assert_not_called()
      data = json.loads((output / 'inventory.json').read_text())
      self.assertEqual(data['acquisition']['mode'], 'repository-file')
      self.assertEqual(data['archiveSha256'], digest(archive))
      self.assertEqual((output / 'source.zip').read_bytes(), original)
      self.assertEqual(archive.read_bytes(), original)
      self.assertEqual(len(data['files']), 1)

  def test_missing_or_invalid_local_archive_has_no_network_fallback(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      invalid = root / 'bad.zip'
      invalid.write_text('Not a ZIP')
      with patch('import_signs.urllib.request.urlopen', side_effect=AssertionError('network forbidden')) as network:
        for archive in [root / 'missing.zip', invalid]:
          with self.subTest(archive=archive), self.assertRaises(ValueError):
            download(root / 'target.zip', archive)
        network.assert_not_called()
      self.assertFalse((root / 'target.zip').exists())

  def test_cli_archive_option(self):
    with tempfile.TemporaryDirectory() as directory:
      root = Path(directory)
      archive = root / 'uploaded.zip'
      with zipfile.ZipFile(archive, 'w') as bundle:
        bundle.writestr('A15.dwg', b'AC1015-fixture')
      result = subprocess.run([sys.executable, str(Path(__file__).with_name('import_signs.py')),
        'inventory', '--archive', str(archive), '--output', str(root / 'out')],
        capture_output=True, text=True, timeout=10)
      self.assertEqual(result.returncode, 0, result.stderr)
      self.assertTrue((root / 'out/inventory.json').is_file())


if __name__ == '__main__':
  unittest.main()
