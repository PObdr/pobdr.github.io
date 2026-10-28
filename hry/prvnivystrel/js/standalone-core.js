const ROOT = 'https://pv-standalone.invalid/project/';
const pattern = () => /\b(?:from\s*|import\s*\(\s*|import\s*)(['"])(\.[^'"\n]+)\1/g;

export function resolveModule(ref, from) {
  const u = new URL(ref, new URL(from, ROOT));
  if (!u.href.startsWith(ROOT)) throw Error('Import mimo aplikaci: ' + ref);
  return decodeURIComponent(u.pathname.slice('/project/'.length));
}

export function dependencies(code, from) {
  if (/\bimport\s*\(\s*[^\s'"`]/.test(code) || /\bimport\s*\(\s*`/.test(code)) {
    throw Error('Nepodporovaný vypočítaný import: ' + from);
  }
  return [...code.matchAll(pattern())].map(m => resolveModule(m[2], from));
}

function replaceOne(code, before, after) {
  if (code.split(before).length !== 2) {
    throw Error('Změnilo se rozhraní exportu: ' + before);
  }
  return code.replace(before, after);
}

export function rewriteModule(code, path, known) {
  if (path === 'js/edition-shell.js') {
    code = replaceOne(code, 'frame.src=url.href;', 'frame.srcdoc=globalThis.__pvFrame(year,view);');
    code = replaceOne(
      code,
      "history[push?'pushState':'replaceState'](null,'',url);",
      "try{history[push?'pushState':'replaceState'](null,'',url)}catch{}"
    );
  }

  if (path === 'js/edition-view.js') {
    code = code.replace(/\blocation\.search\b/g, '(globalThis.__pvSearch??location.search)');
  }

  if (path === 'js/edition-map-view.js') {
    code = replaceOne(
      code,
      'new URL(encodeURIComponent(s.photo),m.photoBaseURL).href',
      'globalThis.__pvPhoto(s.photo)'
    );
  }

  return code
    .replace(/\bimport\.meta\.url\b/g, JSON.stringify(new URL(path, ROOT).href))
    .replace(pattern(), (all, q, ref) => {
      const p = resolveModule(ref, path);
      if (!known.has(p)) throw Error('Chybí modul ' + p);
      return all.replace(ref, 'pv/' + p);
    });
}

const safe = value => JSON.stringify(value).replace(/</g, '\\u003c');

export const serializeModel = model => JSON.stringify(
  model,
  (_, v) => v instanceof Map ? {__pvType: 'Map', entries: [...v]} : v
);

export function inlineDocument(html, styles) {
  html = html
    .replace(/<script\b[^>]*\btype\s*=\s*(['"])module\1[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<a\b(?=[^>]*\bdata-export-tool\b)[^>]*>[\s\S]*?<\/a\s*>/gi, '');

  return html.replace(/<link\b[^>]*>/gi, tag => {
    const href = /\bhref\s*=\s*(['"])(.*?)\1/i.exec(tag)?.[2];
    if (!href || !/\brel\s*=\s*(['"])stylesheet\1/i.test(tag)) return tag;
    if (/^https:\/\//i.test(href)) return tag;

    const path = resolveModule('./' + href, 'index.html');
    if (typeof styles[path] !== 'string') throw Error('Chybí styl ' + path);
    if (/@import\b|url\s*\(/i.test(styles[path])) {
      throw Error('Styl obsahuje další závislost: ' + path);
    }

    return '<style>' + styles[path].replace(/<\/style/gi, '<\\/style') + '</style>' +
      (/\bdata-station-styles\b/.test(tag) ? '<link data-station-styles="1">' : '');
  });
}

function bootstrap() {
  const pack = JSON.parse(document.getElementById('pv-data').textContent);
  globalThis.__pvPack = pack;
  globalThis.__pvRegistry = pack.registry;
  globalThis.__pvModel = JSON.parse(
    pack.model,
    (_, v) => v?.__pvType === 'Map' && Array.isArray(v.entries) ? new Map(v.entries) : v
  );

  function install(entry, search) {
    const host = globalThis.__pvPack ? globalThis : parent, p = host.__pvPack;
    globalThis.__pvRegistry = host.__pvRegistry;
    globalThis.__pvModel = host.__pvModel;
    globalThis.__pvSearch = search;

    const urls = new Map();
    globalThis.__pvPhoto = name => {
      if (!urls.has(name)) {
        const a = p.photos[name];
        if (!a) throw Error('Chybí vložená fotografie: ' + name);
        urls.set(name, URL.createObjectURL(new Blob([
          Uint8Array.from(atob(a.base64), c => c.charCodeAt(0))
        ], {type: a.type})));
      }
      return urls.get(name);
    };

    const original = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.hostname === 'pv-standalone.invalid') {
        return Promise.reject(Error('Chybí vložený podklad: ' + url.pathname));
      }
      return original(input, init);
    };

    const imports = {};
    for (const [path, source] of Object.entries(p.modules)) {
      imports['pv/' + path] = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
    }
    const map = document.createElement('script');
    map.type = 'importmap';
    map.textContent = JSON.stringify({imports});
    document.head.append(map);
    const start = document.createElement('script');
    start.type = 'module';
    start.textContent = 'import ' + JSON.stringify('pv/' + entry) + ';';
    document.body.append(start);
  }

  globalThis.__pvFrame = (year, view) => {
    if (year !== pack.year || !['map', 'histogram'].includes(view)) {
      throw Error('Ročník není součástí exportu.');
    }
    const code = '(' + install.toString() + ')(' + JSON.stringify('js/edition-view.js') + ',' +
      JSON.stringify('?' + new URLSearchParams({year, view})) + ');';
    return pack.frameHTML.replace(/<\/body\s*>/i, () => '<script>' + code + '</' + 'script></body>');
  };

  install('js/edition-shell.js', location.search);
}

export function buildStandalone({indexHTML, frameHTML, styles, modules, model, entry, photos = {}}) {
  const known = new Set(Object.keys(modules)), rewritten = {};
  for (const [path, code] of Object.entries(modules)) {
    dependencies(code, path);
    rewritten[path] = rewriteModule(code, path, known);
  }

  const pack = {
    schema: 1,
    year: entry.year,
    created: new Date().toISOString(),
    registry: {schemaVersion: 1, editions: [entry]},
    model: serializeModel(model),
    modules: rewritten,
    photos,
    frameHTML: inlineDocument(frameHTML, styles)
  },
    html = inlineDocument(indexHTML, styles),
    tail = '<script type="application/json" id="pv-data">' + safe(pack) + '</' +
      'script><script>(' + bootstrap.toString() + ')();</' + 'script>';

  if (!/<\/body\s*>/i.test(html) || !/<\/body\s*>/i.test(pack.frameHTML)) {
    throw Error('Chybí tělo HTML.');
  }
  return html.replace(/<\/body\s*>/i, () => tail + '</body>');
}
