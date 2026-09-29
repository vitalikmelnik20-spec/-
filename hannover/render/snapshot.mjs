// Render individual moments to PNG for review:  node render/snapshot.mjs 0.5 3.2 7.8 ...
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startServer, launch, openPage, grab } from './common.mjs';

const times = process.argv.slice(2).map(Number);
const out = path.join(ROOT, 'render', 'snapshots');
fs.mkdirSync(out, { recursive: true });
const { server, port } = await startServer();
const browser = await launch();
const page = await openPage(browser, port);
for (const t of times) {
  const n = Math.round(t * 60);
  const t0 = Date.now();
  const png = await grab(page, n);
  const f = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
  fs.writeFileSync(f, png);
  console.log(f, `${Date.now() - t0} ms`);
}
await browser.close(); server.close();
