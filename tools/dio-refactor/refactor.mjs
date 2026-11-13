import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const config = JSON.parse(fs.readFileSync(new URL('./layout.json', import.meta.url)));
const posix = path.posix;
const run = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const assert = (ok, message) => {
  if (!ok) {
    throw new Error(message);
  }
};

export function reference(value, before, after, moves = config.moves) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return value;
  const match = /^([^?#]*)(.*)$/.exec(value);
  if (!match[1]) return value;
  const absolute = match[1].startsWith('/');
  const target = posix.normalize(absolute ? match[1].slice(1) : posix.join(posix.dirname(before), match[1]));
  if (absolute) return `/${moves[target] || target}${match[2]}`;
  const result = posix.relative(posix.dirname(after), moves[target] || target) || '.';
  const relative = result.startsWith('.') ? result : `./${result}`;
  return relative + (match[1].endsWith('/') && !relative.endsWith('/') ? '/' : '') + match[2];
}

export function rewrite(text, before, after, moves = config.moves) {
  const ref = (value) => reference(value, before, after, moves);
  if (/\.(?:m?js)$/.test(before)) {
    text = text.replace(/(\b(?:from|import)\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g,
      (_, prefix, quote, value) => prefix + quote + ref(value) + quote);
    text = text.replace(/(\bnew\s+URL\(\s*)(['"])([^'"]+)\2(\s*,\s*import\.meta\.url\s*\))/g,
      (_, prefix, quote, value, suffix) => prefix + quote + ref(value) + quote + suffix);
  }
  if (/\.html$/.test(before)) {
    text = text.replace(/(\b(?:href|src)=)(['"])([^'"]+)\2/g,
      (_, prefix, quote, value) => prefix + quote + ref(value) + quote);
  }
  if (/\.css$/.test(before)) {
    text = text.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,
      (_, quote, value) => `url(${quote}${ref(value)}${quote})`);
  }
  if (/\.md$/.test(before)) {
    text = text.replace(/(\]\()([^\s)]+)(\))/g, (_, a, value, b) => a + ref(value) + b);
    for (const [oldName, newName] of Object.entries(moves)) {
      text = text.split(oldName).join(newName);
    }
  }
  return text;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const name = posix.join(dir, entry.name);
    return entry.isDirectory() ? walk(name) : [name];
  });
}

function units(after) {
  const files = Object.keys(config.moves).filter((name) => name.endsWith('.mjs'));
  execFileSync(process.execPath, ['--experimental-default-type=module', '--test',
    ...files.map((name) => after ? config.moves[name] : name)], { stdio: 'inherit' });
}

function validate() {
  const font = run(['hash-object', config.font]);
  assert(font === config.fontBlob, 'Font changed or is missing');
  const files = walk('dio');
  const localExists = (value, name) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return;
    const target = value.split(/[?#]/)[0];
    const resolved = target.startsWith('/') ? target.slice(1) : posix.join(posix.dirname(name), target);
    assert(fs.existsSync(resolved), `Missing reference: ${name} -> ${value}`);
  };
  for (const name of files.filter((file) => /\.(?:m?js)$/.test(file))) {
    execFileSync(process.execPath, ['--experimental-default-type=module', '--check', name]);
    const text = fs.readFileSync(name, 'utf8');
    for (const match of text.matchAll(/(?:\b(?:from|import)\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\1/g)) {
      localExists(match[2], name);
    }
  }
  for (const name of files.filter((file) => /\.(?:html|md)$/.test(file))) {
    const text = fs.readFileSync(name, 'utf8');
    const expression = name.endsWith('.html') ? /\b(?:href|src)=['"]([^'"]+)['"]/g : /\]\(([^\s)]+)\)/g;
    for (const match of text.matchAll(expression)) localExists(match[1], name);
  }
  const lamps = fs.readFileSync('dio/src/data/lamps.js', 'utf8');
  assert(lamps.includes("new URL('../../data/lamps/', import.meta.url)"), 'Lamp data URL moved incorrectly');
  for (const name of Object.keys(config.moves)) assert(!fs.existsSync(name), `Old path remains: ${name}`);
  units(true);
}

export function apply() {
  const report = [];
  for (const [before, after] of Object.entries(config.moves)) {
    assert(fs.existsSync(before) && !fs.existsSync(after), `Unsafe move: ${before}`);
  }
  units(false);
  const index = fs.readFileSync('dio/index.html', 'utf8');
  const readme = fs.readFileSync('dio/README.md', 'utf8');
  for (const [before, after] of Object.entries(config.moves)) {
    const original = fs.readFileSync(before, 'utf8');
    fs.mkdirSync(posix.dirname(after), { recursive: true });
    fs.writeFileSync(after, rewrite(original, before, after));
    fs.unlinkSync(before);
    report.push({ before, after });
  }
  fs.writeFileSync('dio/index.html', rewrite(index, 'dio/index.html', 'dio/index.html'));
  fs.writeFileSync('dio/README.md', '# DIOGEN\n\n' + rewrite(readme, 'dio/README.md', 'dio/README.md') + `
## Struktura

- src/: aplikační moduly podle odpovědností; vstup src/app.js.
- styles/: styly rozhraní; assets/: statické obrázky a ikona.
- tests/unit/: Node testy; tests/browser/: testy vyžadující prohlížeč.
- docs/: podrobnosti geometrie, zdrojů, parkování a přechodů.
- fonts/Bahnschrift.ttf: zachovaná uživatelská kopie fontu.
- data/lamps/: generovaná data; stávající workflow a cache se nemění.

Úklid nepřidává knihovnu značek ani nezapojuje písmo do renderování.
`);
  validate();
  fs.writeFileSync('dio/docs/REFACTOR.json', JSON.stringify({
    version: 1, sourceParent: config.expectedParent, moves: report,
    fontBlob: config.fontBlob, functionalChanges: false
  }, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--validate')) {
    validate();
  } else if (!fs.existsSync('dio/docs/REFACTOR.json')) {
    assert(run(['rev-parse', 'HEAD^']) === config.expectedParent, 'Repository changed since approval');
    assert(run(['status', '--porcelain']) === '', 'Working tree is not clean');
    assert(run(['hash-object', config.font]) === config.fontBlob, 'Unexpected font');
    const known = new Set([...Object.keys(config.moves), 'dio/index.html', 'dio/README.md', 'dio/PROJECTION-LICENSE.txt']);
    for (const name of fs.readdirSync('dio')) {
      const full = `dio/${name}`;
      if (fs.statSync(full).isFile()) assert(known.has(full), `Unreviewed root file: ${full}`);
    }
    apply();
  } else {
    validate();
  }
}
