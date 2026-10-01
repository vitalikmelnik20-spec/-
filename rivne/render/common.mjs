// Shared helpers: a tiny static file server for the project and a browser page factory.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.ttf': 'font/ttf', '.json': 'application/json' };

export function startServer() {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

export async function launch() {
  return chromium.launch({
    headless: true,
    args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'],
  });
}

export async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/src/index.html`);
  await page.evaluate(() => window.READY);
  return page;
}

/* render frame n and return PNG bytes of the canvas */
export async function grab(page, n, type = 'png') {
  const b64 = await page.evaluate(([n, type]) => {
    window.renderFrame(n);
    return document.getElementById('c').toDataURL(type === 'png' ? 'image/png' : 'image/jpeg', 0.95).split(',')[1];
  }, [n, type]);
  return Buffer.from(b64, 'base64');
}
