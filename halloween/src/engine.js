'use strict';
/* Core: constants, easing, deterministic randomness, colour, sprites, overlays. */
const W = 1920, H = 1080, FPS = 30;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const Ease = {
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  smooth: t => t * t * (3 - 2 * t),
};
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); }
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; const a = hash1(i + seed * 57.31), b = hash1(i + 1 + seed * 57.31); return a + (b - a) * (f * f * (3 - 2 * f)); }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const _rc = {};
function rgba(hex, a = 1) { const c = _rc[hex] || (_rc[hex] = hexRgb(hex)); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function mixHex(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return `rgb(${lerp(x[0], y[0], t) | 0},${lerp(x[1], y[1], t) | 0},${lerp(x[2], y[2], t) | 0})`; }

/* sprites */
let SPR = {}, GRAIN = [];
function radialSprite(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
}
function initEngine() {
  SPR.warm = radialSprite(256, [[0, 'rgba(255,214,140,1)'], [0.2, 'rgba(255,170,80,0.55)'], [0.55, 'rgba(255,130,40,0.15)'], [1, 'rgba(255,120,30,0)']]);
  SPR.cool = radialSprite(256, [[0, 'rgba(200,220,255,0.9)'], [0.3, 'rgba(150,180,240,0.3)'], [1, 'rgba(120,150,220,0)']]);
  SPR.fog = radialSprite(256, [[0, 'rgba(190,205,230,0.5)'], [0.5, 'rgba(170,185,215,0.2)'], [1, 'rgba(160,175,210,0)']]);
  SPR.dust = radialSprite(64, [[0, 'rgba(255,240,210,0.9)'], [1, 'rgba(255,240,210,0)']]);
  SPR.dark = radialSprite(256, [[0, 'rgba(0,0,0,0.8)'], [1, 'rgba(0,0,0,0)']]);
  const r = rng(99);
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const id = g.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); GRAIN.push(c);
  }
}
function glow(g, x, y, r, a = 1, spr = SPR.warm) { if (a <= 0 || r <= 0) return; const o = g.globalAlpha; g.globalAlpha = o * a; g.drawImage(spr, x - r, y - r, r * 2, r * 2); g.globalAlpha = o; }
function addGlow(g, x, y, r, a = 1, spr = SPR.warm) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, r, a, spr); g.restore(); }
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => gr.addColorStop(s[0], s[1])); return gr; }
function rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(s => gr.addColorStop(s[0], s[1])); return gr; }
function poly(g, pts, close = true) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); }
function rect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
function ell(g, x, y, rx, ry, fill, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); g.fillStyle = fill; g.fill(); }

/* overlays */
function grain(g, frame, amt = 0.08) {
  const c = GRAIN[frame % GRAIN.length];
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amt;
  g.translate(-((hash1(frame) * 256) | 0), -((hash1(frame * 3.7) * 256) | 0));
  g.fillStyle = g.createPattern(c, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore();
}
function vignette(g, a = 0.7) {
  g.fillStyle = rad(g, W / 2, H / 2, H * 0.35, W * 0.62, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${a})`]]);
  g.fillRect(0, 0, W, H);
}
/* soft drifting fog band */
function fogBand(g, y, h, t, a = 0.5, seed = 1, speed = 12, spr = SPR.fog, x0 = -200, x1 = W + 200) {
  if (a <= 0) return;
  const n = Math.ceil((x1 - x0) / 150) + 2;
  for (let i = 0; i < n; i++) {
    const s = seed * 100 + i;
    const x = x0 + ((i * 150 + t * speed * (0.6 + hash1(s) * 0.8) + hash1(s * 2) * 150) % (x1 - x0 + 300)) - 150;
    const yy = y + (hash1(s * 3) - 0.5) * h + Math.sin(t * 0.3 + i) * h * 0.08;
    const r = h * (1.2 + hash1(s * 5) * 1.2);
    glow(g, x, yy, r, a * (0.5 + 0.5 * hash1(s * 7)), spr);
  }
}
/* falling / drifting leaves */
function leaves(g, t, n, a = 1, seed = 3, area = [0, 0, W, H], colors = ['#b5481c', '#d8892b', '#8a3a16', '#c9a13a']) {
  for (let i = 0; i < n; i++) {
    const s = seed * 1000 + i;
    const sp = 30 + hash1(s) * 60;
    const x = area[0] + ((hash1(s * 2) * area[2] + t * sp * (hash1(s * 5) - 0.3) * 2) % area[2] + area[2]) % area[2];
    const y = area[1] + ((hash1(s * 3) * area[3] + t * sp) % area[3]);
    const rot = t * (1 + hash1(s * 7) * 3) + i;
    const sz = 5 + hash1(s * 11) * 9;
    g.save(); g.translate(x + Math.sin(t * 1.3 + i) * 20, y); g.rotate(rot); g.scale(1, Math.abs(Math.sin(rot * 1.3)) * 0.8 + 0.2);
    g.globalAlpha = a * 0.85; g.fillStyle = colors[i % colors.length];
    g.beginPath(); g.moveTo(-sz, 0); g.quadraticCurveTo(0, -sz * 0.7, sz, 0); g.quadraticCurveTo(0, sz * 0.7, -sz, 0); g.fill();
    g.restore();
  }
}
function dust(g, t, n, a = 1, seed = 4, area = [0, 0, W, H]) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const s = seed * 500 + i;
    const x = area[0] + ((hash1(s) * area[2] + Math.sin(t * 0.2 + i) * 40 + t * 6) % area[2]);
    const y = area[1] + ((hash1(s * 2) * area[3] - t * (4 + hash1(s * 3) * 8)) % area[3] + area[3]) % area[3];
    glow(g, x, y, 2 + hash1(s * 4) * 4, a * (0.3 + 0.4 * Math.sin(t + i) ** 2), SPR.dust);
  }
  g.restore();
}
function flick(t, seed) { return 0.82 + 0.1 * Math.sin(t * 11 + seed) + 0.08 * noise1(t * 7, seed); }
