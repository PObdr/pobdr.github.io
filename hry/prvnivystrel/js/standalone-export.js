import {loadYears, loadEdition} from './edition-loader.js';
import {editionsFrom} from './edition-model.js';
import {dependencies, buildStandalone} from './standalone-core.js';

const $ = id => document.getElementById(id),
  base = new URL('../', import.meta.url);
const stub = "export async function loadYears(){return globalThis.__pvRegistry}export async function loadEdition(entry){if(entry.year!==globalThis.__pvModel.edition.year)throw Error('Ročník není součástí exportu.');return globalThis.__pvModel}";

async function response(path) {
  const u = new URL(path, base);
  if (!u.href.startsWith(base.href)) throw Error('Cesta mimo aplikaci.');

  const r = await fetch(u, {
    cache: 'no-cache',
    signal: AbortSignal.timeout(60000)
  });
  if (!r.ok) throw Error(path + ': ' + r.status);
  return r;
}

async function modules() {
  const codes = {}, todo = ['js/edition-shell.js', 'js/edition-view.js'];

  while (todo.length) {
    const path = todo.shift();
    if (Object.hasOwn(codes, path)) continue;

    const code = path === 'js/edition-loader.js'
      ? stub
      : await (await response(path)).text();
    codes[path] = code;
    todo.push(...dependencies(code, path));
  }

  return codes;
}

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 32768) {
    s += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(s);
}

async function main() {
  const entries = editionsFrom(await loadYears());
  for (const e of entries) {
    const o = document.createElement('option');
    o.value = e.year;
    o.textContent = e.year;
    $('year').append(o);
  }

  $('build').disabled = false;
  $('status').textContent = 'Ročníky jsou načtené. Vyber ročník a můžeš začít sestavovat export.';
  $('build').onclick = async () => {
    const entry = entries.find(e => e.year === +$('year').value);
    $('build').disabled = true;
    $('year').disabled = true;
    $('save').hidden = true;

    try {
      if (!HTMLScriptElement.supports?.('importmap')) {
        throw Error('Prohlížeč nepodporuje import maps.');
      }
      $('status').textContent = 'Načítám ročník ' + entry.year + '…';

      const model = await loadEdition(entry),
        [indexHTML, frameHTML, css, stationCSS, codes] = await Promise.all([
          (await response('index.html')).text(),
          (await response('edition-view.html')).text(),
          (await response('edition.css')).text(),
          (await response('stations.css')).text(),
          modules()
        ]),
        photos = {};

      model.photoBaseURL = 'https://pv-standalone.invalid/project/foto/';
      if ($('photos').checked) {
        const names = [...new Set(
          [...model.stations.values()].map(s => s.photo).filter(Boolean)
        )];
        let cursor = 0, done = 0;

        async function worker() {
          while (cursor < names.length) {
            const name = names[cursor++];
            if (/[\/\\]/.test(name) || !/[.](jpe?g|png|webp)$/i.test(name)) {
              throw Error('Neplatná fotografie ' + name);
            }

            const r = await response('data/' + entry.year + '/foto/' + encodeURIComponent(name)),
              bytes = new Uint8Array(await r.arrayBuffer());
            if (!bytes.length) throw Error('Prázdná fotografie ' + name);

            photos[name] = {
              type: /\.png$/i.test(name)
                ? 'image/png'
                : /\.webp$/i.test(name) ? 'image/webp' : 'image/jpeg',
              base64: base64(bytes)
            };
            $('status').textContent = 'Fotografie ' + (++done) + '/' + names.length;
          }
        }

        await Promise.all(Array.from({length: Math.min(3, names.length)}, worker));
      } else {
        for (const s of model.stations.values()) s.photo = null;
      }

      const standaloneIndex = indexHTML.replace(
        /<label\b(?=[^>]*\bclass="year-picker")[^>]*>/,
        '<label class="year-picker" hidden>'
      );
      const html = buildStandalone({
        indexHTML: standaloneIndex,
        frameHTML,
        styles: {'edition.css': css, 'stations.css': stationCSS},
        modules: codes,
        model,
        entry,
        photos
      }), blob = new Blob([html], {type: 'text/html;charset=utf-8'});

      if ($('save').dataset.url) URL.revokeObjectURL($('save').dataset.url);
      $('save').href = URL.createObjectURL(blob);
      $('save').dataset.url = $('save').href;
      $('save').download = 'prvni-vystrel-' + entry.year + '-standalone.html';
      $('save').hidden = false;
      $('status').textContent = 'Připraveno: ' + (blob.size / 1024 / 1024).toFixed(2) +
        ' MB. Stáhni výsledné HTML.';
    } catch (e) {
      $('status').textContent = 'Export selhal: ' + e.message;
      console.error(e);
    } finally {
      $('build').disabled = false;
      $('year').disabled = false;
    }
  };
}

main().catch(e => {
  $('status').textContent = 'Chyba načítání ročníků: ' + e.message;
  console.error(e);
});
