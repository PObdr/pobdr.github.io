import test from 'node:test';
import assert from 'node:assert/strict';
import {rewriteModule} from '../js/standalone-core.js';

const shellSamples = [
  "frame.src=url.href;history[push?'pushState':'replaceState'](null,'',url);",
  "frame.src = url.href;\nhistory[push ? 'pushState' : 'replaceState'](null, '', url);",
  "frame . src =\n url . href ;\nhistory [\n push ? 'pushState' : 'replaceState'\n] ( null, '', url ) ;"
];

for (const [index, source] of shellSamples.entries()) {
  test('shell rewrite accepts whitespace variant ' + index, () => {
    const result = rewriteModule(source, 'js/edition-shell.js', new Set());
    assert.ok(result.includes('frame.srcdoc=globalThis.__pvFrame(year,view);'));
    assert.ok(result.includes("try{history[push?'pushState':'replaceState'](null,'',url)}catch{}"));
  });
}

const photoSamples = [
  'new URL(encodeURIComponent(s.photo),m.photoBaseURL).href',
  'new URL(encodeURIComponent(s.photo), m.photoBaseURL).href',
  'new URL(\n  encodeURIComponent(s.photo),\n  m.photoBaseURL\n).href'
];

for (const [index, source] of photoSamples.entries()) {
  test('photo rewrite accepts whitespace variant ' + index, () => {
    assert.equal(
      rewriteModule(source, 'js/edition-map-view.js', new Set()),
      'globalThis.__pvPhoto(s.photo)'
    );
  });
}

test('missing and duplicate rewrite targets are rejected', () => {
  assert.throws(
    () => rewriteModule('', 'js/edition-shell.js', new Set()),
    /Změnilo se rozhraní exportu/
  );
  assert.throws(
    () => rewriteModule(shellSamples[0] + shellSamples[0], 'js/edition-shell.js', new Set()),
    /Změnilo se rozhraní exportu/
  );
  assert.throws(
    () => rewriteModule(photoSamples[0] + ';' + photoSamples[0], 'js/edition-map-view.js', new Set()),
    /Změnilo se rozhraní exportu/
  );
});
