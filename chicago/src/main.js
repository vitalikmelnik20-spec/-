'use strict';
/* Bootstrap: fonts, timeline (voice cues), cached artwork; then frame n -> drawFrame(t = n / FPS). */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
window.READY = (async () => {
  const faces = ['900 50px MS', '800 50px MS', '700 50px MS', '600 50px MS', '500 50px MS', '400 50px MS'];
  await Promise.all(faces.map(f => document.fonts.load(f, 'CHICAGO$0123456789≈–~’•')));
  const tl = await (await fetch('timeline.json')).json();
  initOverlays(); initArt(); initScenes(tl);
  return true;
})();
window.renderFrame = n => { drawFrame(ctx, n / FPS, n); return true; };
(async () => { await window.READY; const q = new URLSearchParams(location.search); if (q.has('t')) window.renderFrame(Math.round(parseFloat(q.get('t')) * FPS)); })();
