"""Build content-addressed Prague lighting tiles. Never infer a district from an ID."""
import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
import tempfile
import urllib.error
import urllib.request
import zipfile
from datetime import datetime, timezone
from pyproj import Transformer

SOURCE = "https://opendata-storage.praha.eu/enoproxio/Verejne_osvetleni_MHMP.zip"
SCHEMA = "https://opendata-storage.praha.eu/EVM_verejne_osvetleni/Verejne_osvetleni_schema.json"
REQUIRED = {"CISLO_SLOUP", "DRUH_SLOUP", "NAZEV_SLOUP_UPRAVENO", "KATASTRALNI_UZEMI", "SOURADNICE_X", "SOURADNICE_Y"}

def write_json(path, value):
  path.parent.mkdir(parents=True, exist_ok=True)
  text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
  if path.exists() and path.read_text(encoding="utf-8") == text:
    return
  temporary = path.with_suffix(path.suffix + ".tmp")
  temporary.write_text(text, encoding="utf-8")
  os.replace(temporary, path)

def build(raw, out, previous, headers=None):
  try:
    text = raw.decode("utf-8-sig")
  except UnicodeDecodeError:
    text = raw.decode("cp1250")
  reader = csv.DictReader(io.StringIO(text), delimiter=";")
  if not REQUIRED.issubset(reader.fieldnames or []):
    raise ValueError("Unexpected CSV columns; old data retained")
  transformer = Transformer.from_crs(5514, 4326, always_xy=True, allow_ballpark=False)
  tiles = {}
  rejected = []
  ids = set()
  count = 0
  for row in reader:
    count += 1
    identifier = row["CISLO_SLOUP"].strip()
    if not identifier or identifier in ids:
      raise ValueError("Missing or duplicate ID; old data retained")
    ids.add(identifier)
    try:
      x = float(row["SOURADNICE_X"].replace(",", "."))
      y = float(row["SOURADNICE_Y"].replace(",", "."))
      if not (-780000 < x < -690000 and -1100000 < y < -990000):
        raise ValueError("Out of range, possibly reversed axes")
      lon, lat = transformer.transform(x, y, errcheck=True)
      if not (math.isfinite(lon) and math.isfinite(lat) and 14 < lon < 15 and 49.7 < lat < 50.4):
        raise ValueError("Invalid transformed position")
    except (ValueError, OverflowError):
      rejected.append({"id": identifier, "x": row["SOURADNICE_X"], "y": row["SOURADNICE_Y"]})
      continue
    key = f"{math.floor(lon * 100)}_{math.floor(lat * 100)}"
    tiles.setdefault(key, []).append({
      "id": identifier,
      "lon": round(lon, 8),
      "lat": round(lat, 8),
      "type": row["DRUH_SLOUP"],
      "description": row["NAZEV_SLOUP_UPRAVENO"],
      "cadastre": row["KATASTRALNI_UZEMI"]
    })
  valid = count - len(rejected)
  if count < 100000 or valid / count < 0.98:
    raise ValueError("Unexpected record count/coordinate quality; old data retained")
  if previous.get("valid") and valid < previous["valid"] * 0.9:
    raise ValueError("More than 10 percent of positions disappeared; manual review required")
  manifest_tiles = {}
  for key, rows in sorted(tiles.items()):
    rows.sort(key=lambda r: r["id"])
    content = json.dumps(rows, ensure_ascii=False, indent=2) + "\n"
    digest = hashlib.sha256(content.encode()).hexdigest()[:20]
    filename = f"tiles/{key}-{digest}.json"
    write_json(out / filename, rows)
    manifest_tiles[key] = filename
  now = datetime.now(timezone.utc).isoformat()
  digest = hashlib.sha256(raw).hexdigest()
  manifest = {
    "version": 1,
    "source": SOURCE,
    "schema": SCHEMA,
    "sha256": digest,
    "checked": now,
    "changed": previous.get("changed", now) if previous.get("sha256") == digest else now,
    "etag": (headers or {}).get("ETag"),
    "last_modified": (headers or {}).get("Last-Modified"),
    "source_crs": "EPSG:5514; inferred from export and validated range",
    "total": count,
    "valid": valid,
    "rejected": len(rejected),
    "tile_degrees": 0.01,
    "tiles": manifest_tiles
  }
  write_json(out / "rejected.json", rejected)
  write_json(out / "manifest.json", manifest)
  return manifest

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--csv", type=Path)
  parser.add_argument("--out", type=Path, default=Path("dio/data/lamps"))
  args = parser.parse_args()
  manifest_path = args.out / "manifest.json"
  previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
  complete = bool(previous) and all((args.out / name).is_file() for name in previous.get("tiles", {}).values())
  if not complete:
    previous = {}
  if args.csv:
    result = build(args.csv.read_bytes(), args.out, previous)
  else:
    headers = {"User-Agent": "PObdr-DIO-lighting-update/1.0"}
    if previous.get("etag"):
      headers["If-None-Match"] = previous["etag"]
    if previous.get("last_modified"):
      headers["If-Modified-Since"] = previous["last_modified"]
    try:
      with urllib.request.urlopen(urllib.request.Request(SOURCE, headers=headers), timeout=120) as response:
        archive = response.read(50000001)
        if len(archive) > 50000000:
          raise ValueError("Archive exceeds 50 MB")
        response_headers = {"ETag": response.headers.get("ETag"), "Last-Modified": response.headers.get("Last-Modified")}
    except urllib.error.HTTPError as error:
      if error.code != 304 or not previous:
        raise
      previous["checked"] = datetime.now(timezone.utc).isoformat()
      write_json(manifest_path, previous)
      print("Source unchanged (HTTP 304)")
      return
    with zipfile.ZipFile(io.BytesIO(archive)) as zipped:
      entries = [f for f in zipped.infolist() if f.filename.lower().endswith(".csv")]
      if len(entries) != 1 or entries[0].file_size > 50000000:
        raise ValueError("Expected one CSV up to 50 MB")
      raw = zipped.read(entries[0])
    if previous.get("sha256") == hashlib.sha256(raw).hexdigest():
      previous.update({"checked": datetime.now(timezone.utc).isoformat(), "etag": response_headers.get("ETag"), "last_modified": response_headers.get("Last-Modified")})
      write_json(manifest_path, previous)
      print("CSV content unchanged")
      return
    # Publish manifest only after the complete dataset passes validation.
    with tempfile.TemporaryDirectory() as directory:
      stage = Path(directory)
      result = build(raw, stage, previous, response_headers)
      for file in stage.rglob("*.json"):
        if file.name != "manifest.json":
          write_json(args.out / file.relative_to(stage), json.loads(file.read_text()))
      write_json(manifest_path, result)
  print(json.dumps({key: result[key] for key in ["total", "valid", "rejected"]}))

if __name__ == "__main__":
  main()
