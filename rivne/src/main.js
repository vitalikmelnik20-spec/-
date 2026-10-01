'use strict';
/* Bootstrap: fonts + timeline (scene starts and subtitle cues from the real voice-over). */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
window.READY = (async () => {
  const faces = ['900 50px MS', '800 50px MS', '700 50px MS', '600 50px MS', '500 50px MS', 'italic 50px SerifD', '50px Emoji'];
  await Promise.all(faces.map(f => document.fonts.load(f, 'РівнеЇїІіЄєҐґʼ🇺🇦')));
  const tl = await (await fetch('timeline.json')).json();
  initOverlays(); initScenes(tl);
  return true;
})();
window.renderFrame = n => { drawFrame(ctx, n / FPS, n); return true; };
(async () => { await window.READY; const q = new URLSearchParams(location.search); if (q.has('t')) window.renderFrame(Math.round(parseFloat(q.get('t')) * FPS)); })();
