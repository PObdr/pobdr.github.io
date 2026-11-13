import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.env.DIO_TEST_DEPENDENCIES, 'package.json'));
const { chromium } = require('playwright');
const base = process.cwd();
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (relative === '/__test__') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>DIO refactor tests</title>');
    return;
  }
  const target = path.resolve(base, '.' + relative, relative.endsWith('/') ? 'index.html' : '');
  if (!target.startsWith(base + path.sep) || !fs.existsSync(target)) {
    response.writeHead(404).end();
    return;
  }
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.html': 'text/html' };
  response.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  response.end(fs.readFileSync(target));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(origin + '/__test__');
  const modulePath = process.argv.includes('--before') ?
    '/dio/crossing-mask.browser-test.js' : '/dio/tests/browser/crossing-mask.browser-test.js';
  const result = await page.evaluate(async (url) => (await import(url)).runTests(), origin + modulePath);
  const font = await page.evaluate(async () => {
    const face = new FontFace('DIOGEN font check', 'url(/dio/fonts/Bahnschrift.ttf)');
    await face.load();
    return face.status;
  });
  if (result.status !== 'passed' || font !== 'loaded') throw new Error('Browser/font regression');
  console.log(JSON.stringify({ crossingMask: result, font, liveServices: false }));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
