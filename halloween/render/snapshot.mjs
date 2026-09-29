// Render review stills:  node render/snapshot.mjs F001 V03 ...  (mid-shot)  or  node render/snapshot.mjs --all
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startServer, launch, openPage, grab } from './common.mjs';
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json')));
let ids = process.argv.slice(2);
if (ids[0] === '--all') ids = tl.shots.map(s => s.id);
const out = path.join(ROOT, 'render/snapshots'); fs.mkdirSync(out, { recursive: true });
const { server, port } = await startServer(); const browser = await launch(); const page = await openPage(browser, port);
for (const spec of ids) {
  const [id, at] = spec.split('@'); const s = tl.shots.find(x => x.id === id);
  const t = s.start + (at ? parseFloat(at) * s.dur : s.dur * 0.5);
  fs.writeFileSync(path.join(out, `${spec.replace('@', '_')}.jpg`), await grab(page, Math.round(t * 30), 'jpeg', 0.85));
}
await browser.close(); server.close(); console.log('ok', ids.length);
