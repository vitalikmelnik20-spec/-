'use strict';
/* Timeline, camera (Ken Burns), fades through black, grading, titles. */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let TL = null;

window.READY = (async () => {
  await Promise.all(['400 40px Serif', 'italic 400 40px Serif', '500 40px Sans', '600 40px Sans'].map(f => document.fonts.load(f)));
  TL = await (await fetch('timeline.json')).json();
  initEngine(); initFigures();
  return TL.total;
})();

function shotAt(T) {
  let lo = 0, hi = TL.shots.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (TL.shots[m].start <= T) lo = m; else hi = m - 1; }
  return TL.shots[lo];
}
function applyCam(g, cam, u) {
  const c = Object.assign({ z0: 1.02, z1: 1.1, f0: [W / 2, H / 2], f1: null }, cam || {});
  const e = Ease.inOutSine(u);
  const s = lerp(c.z0, c.z1, e);
  const f1 = c.f1 || c.f0;
  let fx = lerp(c.f0[0], f1[0], e), fy = lerp(c.f0[1], f1[1], e);
  const hw = W / (2 * s), hh = H / (2 * s);
  fx = clamp(fx, hw, W - hw); fy = clamp(fy, hh, H - hh);
  g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-fx, -fy);
}
function grade(g, mode) {
  if (!mode) return;
  g.save();
  if (mode === 'bw' || mode === 'sepia') {
    g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    if (mode === 'sepia') { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#e8d2b0'; g.fillRect(0, 0, W, H); }
    g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(40,36,30,0.25)'; g.fillRect(0, 0, W, H);
  } else if (mode === 'night') {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#c2c9e0'; g.fillRect(0, 0, W, H);
  } else if (mode === 'warm') {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#f4dcc0'; g.fillRect(0, 0, W, H);
  } else if (mode === 'vintage') {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#f0d8b4'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(60,40,30,0.18)'; g.fillRect(0, 0, W, H);
  }
  g.restore();
}
function reset(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowBlur = 0; g.lineCap = 'butt'; }

function drawFrame(n) {
  const T = n / FPS;
  const sh = shotAt(T);
  const lt = T - sh.start, u = clamp(lt / sh.dur);
  const S = SHOT[sh.id];
  reset(ctx);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (S) {
    ctx.save(); applyCam(ctx, S.cam, u); S.draw(ctx, lt, u, sh); ctx.restore();
    reset(ctx); grade(ctx, S.grade);
    if (S.post) { reset(ctx); S.post(ctx, lt, u, sh); }
  } else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '60px Sans'; ctx.fillText(sh.id, 100, 200); }
  reset(ctx);
  vignette(ctx, S && S.vig != null ? S.vig : 0.62);
  grain(ctx, n, 0.07);
  titles(ctx, T, sh, lt);
  subtitle(ctx, T);
  // fade through black at shot boundaries
  const fin = sh.fadeIn == null ? 0.45 : sh.fadeIn, fout = sh.fadeOut == null ? 0.45 : sh.fadeOut;
  let a = 0;
  if (fin > 0 && lt < fin) a = 1 - lt / fin;
  if (fout > 0 && lt > sh.dur - fout) a = Math.max(a, (lt - (sh.dur - fout)) / fout);
  if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`; ctx.fillRect(0, 0, W, H); }
}

const CHAPTERS = { F007: ['CHAPTER ONE', 'The Scarecrow of Orchard Lane'], F029: ['CHAPTER TWO', 'The Child Who Never Grew'], F051: ['CHAPTER THREE', 'Dorothy'],
  F062: ['CHAPTER FOUR', 'The Field'], F080: ['CHAPTER FIVE', 'Two Trick-or-Treaters'] };
function titles(g, T, sh, lt) {
  const ch = CHAPTERS[sh.id];
  if (ch) {
    const a = clamp((lt - 0.6) / 0.8) * (1 - clamp((lt - 4.6) / 0.8));
    if (a > 0) {
      g.save(); g.globalAlpha = a; g.textAlign = 'left';
      g.font = '600 22px Sans'; g.letterSpacing = '8px'; g.fillStyle = 'rgba(232,170,90,0.95)'; g.fillText(ch[0], 120, 930);
      g.font = 'italic 400 54px Serif'; g.letterSpacing = '0px'; g.fillStyle = 'rgba(245,236,220,0.96)'; g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 20; g.fillText(ch[1], 116, 992);
      g.restore();
    }
  }
  if (sh.id === 'F006') {
    const a = clamp((lt - 0.8) / 1.5) * (1 - clamp((lt - (sh.dur - 1.2)) / 0.8));
    g.save(); g.globalAlpha = a; g.textAlign = 'left'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 30;
    g.font = '600 26px Sans'; g.letterSpacing = '10px'; g.fillStyle = 'rgba(232,170,90,0.95)'; g.fillText('A HALLOWEEN STORY', 130, 330);
    g.font = '400 92px Serif'; g.letterSpacing = '2px'; g.fillStyle = '#f3ead8'; g.fillText('The Last', 124, 440); g.fillText('Trick-or-Treater', 124, 545);
    g.font = 'italic 400 60px Serif'; g.fillStyle = 'rgba(243,234,216,0.85)'; g.fillText('of Maple Falls', 128, 625);
    g.restore();
  }
}

function subAt(T) {
  const S = TL.subs; let lo = 0, hi = S.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m].s <= T) lo = m; else hi = m - 1; }
  return S[lo] && S[lo].s <= T && T < S[lo].e ? S[lo] : null;
}
function wrapText(g, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  if (lines.length === 2 && g.measureText(lines[1]).width < maxW * 0.35) { // balance
    const all = text.split(' '); const half = Math.ceil(all.length / 2); return [all.slice(0, half).join(' '), all.slice(half).join(' ')];
  }
  return lines;
}
function subtitle(g, T) {
  const c = subAt(T); if (!c) return;
  const a = clamp((T - c.s) / 0.12) * clamp((c.e - T) / 0.12);
  g.save(); g.globalAlpha = a; g.font = '600 46px Sans'; g.letterSpacing = '0.5px'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const lines = wrapText(g, c.text, 1500), lh = 60, y0 = 1010 - (lines.length - 1) * lh;
  lines.forEach((l, i) => {
    const y = y0 + i * lh, w = g.measureText(l).width;
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(960 - w / 2 - 18, y - 44, w + 36, 58, 10); g.fill();
    g.fillStyle = '#f7f1e6'; g.fillText(l, 960, y);
  });
  g.restore();
}
window.renderFrame = n => { drawFrame(n); return true; };
(async () => {
  await window.READY;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) window.renderFrame(Math.round(parseFloat(q.get('t')) * FPS));
  if (q.has('shot')) { const s = TL.shots.find(x => x.id === q.get('shot')); window.renderFrame(Math.round((s.start + s.dur * 0.5) * FPS)); }
})();
