import test from 'node:test';
import assert from 'node:assert/strict';
import {rewriteModule} from '../js/standalone-core.js';

test('history rewrite accepts double quotes and mixed quote styles', () => {
  const samples = [
    'history[push ? "pushState" : "replaceState"](null, "", url);',
    `history[push ? 'pushState' : "replaceState"](null, '', url);`
  ];
  for (const source of samples) {
    const result = rewriteModule('frame.src = url.href;\n' + source, 'js/edition-shell.js', new Set());
    assert.ok(result.includes('frame.srcdoc=globalThis.__pvFrame(year,view);'));
    assert.ok(result.includes("try{history[push?'pushState':'replaceState'](null,'',url)}catch{}"));
  }
});

test('view search rewrite accepts whitespace around the dot', () => {
  for (const source of ['location.search', 'location . search', 'location\n.\nsearch']) {
    assert.equal(
      rewriteModule(source, 'js/edition-view.js', new Set()),
      '(globalThis.__pvSearch??location.search)'
    );
  }
});

test('module URL rewrite accepts whitespace around dots', () => {
  for (const source of ['import.meta.url', 'import . meta . url', 'import\n.\nmeta\n.\nurl']) {
    assert.equal(
      rewriteModule(source, 'js/example.js', new Set()),
      '"https://pv-standalone.invalid/project/js/example.js"'
    );
  }
});
