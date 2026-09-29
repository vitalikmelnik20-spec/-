// Render all 1800 frames (1080x1920 @ 60 fps, every frame drawn — no duplication)
// with N parallel headless-Chrome pages. Each worker pipes its contiguous frame
// range as PNG into its own FFmpeg process (near-lossless intermediate segment).
//   node render/render.mjs [--workers 4]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { ROOT, startServer, launch, openPage, grab } from './common.mjs';

const FPS = 60, DURATION = 30, TOTAL = FPS * DURATION;
const argW = process.argv.indexOf('--workers');
const WORKERS = argW > 0 ? parseInt(process.argv[argW + 1]) : Math.max(1, Math.min(6, os.cpus().length));
const segDir = path.join(ROOT, 'render', 'segments');
fs.rmSync(segDir, { recursive: true, force: true });
fs.mkdirSync(segDir, { recursive: true });

const { server, port } = await startServer();
const browser = await launch();
const t0 = Date.now();
let done = 0;

async function worker(k, from, to) {
  const page = await openPage(browser, port);
  const out = path.join(segDir, `seg_${String(k).padStart(2, '0')}.mkv`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '4', '-pix_fmt', 'yuv444p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exit ${c} (segment ${k})`)))));
  for (let n = from; n < to; n++) {
    const png = await grab(page, n);
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  frames ${done}/${TOTAL}  ${(done / el).toFixed(1)} fps  ETA ${((TOTAL - done) / (done / el)).toFixed(0)}s   `);
    }
  }
  ff.stdin.end();
  await closed;
  await page.close();
  return { file: out, frames: to - from };
}

const per = Math.ceil(TOTAL / WORKERS);
const jobs = [];
for (let k = 0; k < WORKERS; k++) {
  const from = k * per, to = Math.min(TOTAL, from + per);
  if (from < to) jobs.push(worker(k, from, to));
}
const segs = await Promise.all(jobs);
await browser.close(); server.close();
fs.writeFileSync(path.join(segDir, 'list.txt'), segs.map(s => `file '${path.basename(s.file)}'`).join('\n') + '\n');
const total = segs.reduce((a, s) => a + s.frames, 0);
console.log(`\n  rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s using ${WORKERS} workers`);
if (total !== TOTAL || process.exitCode) { console.error('frame count mismatch or page errors'); process.exit(1); }
