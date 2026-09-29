'use strict';
/* Page bootstrap. The renderer calls window.renderFrame(n) for every frame.
 * Open index.html?t=12.5 to preview one moment, or ?play to preview live. */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

window.READY = (async () => {
  const faces = ['900 50px MS', '800 50px MS', '700 50px MS', '600 50px MS', '500 50px MS', '400 50px MS', '300 50px MS',
    'italic 50px SerifD', '50px SerifD', '50px Emoji'];
  await Promise.all(faces.map(f => document.fonts.load(f, 'ЛьвівAБ🇺🇦')));
  await document.fonts.ready;
  initOverlays();
  initScenes();
  return true;
})();

window.renderFrame = frame => { drawFrame(ctx, frame / FPS, frame); return true; };

(async () => {
  await window.READY;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) window.renderFrame(Math.round(parseFloat(q.get('t')) * FPS));
  if (q.has('play')) {
    const t0 = performance.now();
    const loop = () => { const f = Math.floor((performance.now() - t0) / 1000 * FPS) % (DURATION * FPS); window.renderFrame(f); requestAnimationFrame(loop); };
    loop();
  }
})();
