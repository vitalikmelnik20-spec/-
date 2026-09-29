// Render every frame (1920x1080 @ 30 fps) with parallel headless-Chrome pages.
// Each worker renders a contiguous frame range and pipes JPEG frames into its own
// FFmpeg process (near-lossless intermediate segment).   node render/render.mjs [--workers 4]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { ROOT, startServer, launch, openPage, grab } from './common.mjs';

const FPS = 30;
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json')));
const TOTAL = Math.round(tl.total * FPS);
const aw = process.argv.indexOf('--workers');
const WORKERS = aw > 0 ? parseInt(process.argv[aw + 1]) : Math.max(1, Math.min(6, os.cpus().length));
const segDir = path.join(ROOT, 'render/segments');
fs.rmSync(segDir, { recursive: true, force: true }); fs.mkdirSync(segDir, { recursive: true });
const { server, port } = await startServer();
const browser = await launch();
const t0 = Date.now(); let done = 0;
const CHUNK = Math.ceil(TOTAL / (WORKERS * 4));  // more, smaller jobs = better load balance
const jobs = []; for (let s = 0; s < TOTAL; s += CHUNK) jobs.push([jobs.length, s, Math.min(TOTAL, s + CHUNK)]);
async function worker() {
  const page = await openPage(browser, port);
  while (jobs.length) {
    const [k, from, to] = jobs.shift();
    const out = path.join(segDir, `seg_${String(k).padStart(3, '0')}.mkv`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
    for (let n = from; n < to; n++) {
      const jpg = await grab(page, n, 'jpeg', 0.94);
      if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 300 === 0) { const el = (Date.now() - t0) / 1000; process.stdout.write(`\r  frames ${done}/${TOTAL}  ${(done / el).toFixed(1)} fps  ETA ${((TOTAL - done) / (done / el) / 60).toFixed(1)} min   `); }
    }
    ff.stdin.end(); await closed;
  }
  await page.close();
}
const nSeg = jobs.length;
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close(); server.close();
fs.writeFileSync(path.join(segDir, 'list.txt'), Array.from({ length: nSeg }, (_, k) => `file 'seg_${String(k).padStart(3, '0')}.mkv'`).join('\n') + '\n');
console.log(`\n  rendered ${done} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min with ${WORKERS} workers`);
if (done !== TOTAL || process.exitCode) process.exit(1);
