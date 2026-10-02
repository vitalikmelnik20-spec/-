// Renders index.html frame by frame with headless Chromium (Playwright).
//   node render.mjs                  -> frames/0000.png … frames/0599.png (600 frames, 30 fps)
//   node render.mjs --at 1.5 4.8 ... -> snapshots/t1.50.png … (single moments for review)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30, FRAMES = 600;
const TYPES = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true, args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
let failed = false;
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); failed = true; });
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
await page.evaluate(() => window.READY);
const fontsOk = await page.evaluate(() => ['400 50px Anton', '900 50px Inter'].every(f => document.fonts.check(f)));
if (!fontsOk) { console.error('fonts did not load'); process.exit(1); }

async function shot(t, file) {
  await page.evaluate(t => window.render(t), t);
  fs.writeFileSync(file, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }));
}
const at = process.argv.indexOf('--at');
if (at > 0) {
  const dir = path.join(ROOT, 'snapshots'); fs.mkdirSync(dir, { recursive: true });
  for (const v of process.argv.slice(at + 1)) await shot(parseFloat(v), path.join(dir, `t${parseFloat(v).toFixed(2)}.png`));
} else {
  const dir = path.join(ROOT, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const t0 = Date.now();
  for (let n = 0; n < FRAMES; n++) {
    await shot(n / FPS, path.join(dir, String(n).padStart(4, '0') + '.png'));
    if (n % 60 === 59) process.stdout.write(`\r  ${n + 1}/${FRAMES} frames  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  console.log();
}
// counter check: the numbers must land exactly on their targets
const texts = await page.evaluate(() => [1.9, 2.9, 4.7, 5.9, 8.9, 9.4].map(t => { window.render(t); return [t, [...document.querySelectorAll('text')].map(e => e.textContent).filter(s => s.includes('€')).join(' | ')]; }));
texts.forEach(([t, s]) => console.log(`  t=${t}s: ${s}`));
await browser.close(); server.close();
if (failed) process.exit(1);
