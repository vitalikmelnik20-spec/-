'use strict';
/* ---------------------------------------------------------------------------
 * Core engine: constants, easing, deterministic randomness, colour helpers,
 * a tiny perspective camera for the 3D map, text + overlay primitives.
 * Everything is a pure function of time -> fully deterministic rendering.
 * ------------------------------------------------------------------------- */
const W = 1080, H = 1920, FPS = 60, DURATION = 30;
const BPM = 120, BEAT = 60 / BPM;
const TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const mix2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

const Ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inOutQuint: t => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inOutQuart: t => (t < 0.5 ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  smooth: t => t * t * (3 - 2 * t),
};

/* deterministic randomness */
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); }
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash1(i + seed * 57.31), b = hash1(i + 1 + seed * 57.31);
  return a + (b - a) * (f * f * (3 - 2 * f));
}

/* colours */
const C = {
  bg: '#05060a', bg2: '#0b0e16', navy: '#101725', ink: '#141a28',
  gold: '#e8b45a', gold2: '#ffd78a', amber: '#f0922e', cream: '#f5ead6',
  dim: '#7d6d52', white: '#fff8ec',
};
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const _rgbCache = {};
function rgba(hex, a) { const c = _rgbCache[hex] || (_rgbCache[hex] = hexRgb(hex)); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function mixRgb(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgbStr(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }

/* ---------------------------------------------------------------------------
 * Perspective camera over a ground plane (z up, y north, units = km).
 * pitch 0 = straight down, yaw rotates around the target.
 * ------------------------------------------------------------------------- */
class Cam {
  constructor() { this.tx = 0; this.ty = 0; this.tz = 0; this.d = 10; this.pitch = 0; this.yaw = 0; this.f = 1900; this.cx = W / 2; this.cy = H / 2; }
  setup() {
    this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch);
    this.cyw = Math.cos(this.yaw); this.syw = Math.sin(this.yaw);
    this.near = this.d * 0.03;
    this.px = this.tx + this.d * this.sp * this.syw;
    this.py = this.ty - this.d * this.sp * this.cyw;
    this.pz = this.tz + this.d * this.cp;
    return this;
  }
  view(x, y, z) {
    const dx = x - this.tx, dy = y - this.ty, dz = z - this.tz;
    const xr = dx * this.cyw + dy * this.syw;
    const yr = -dx * this.syw + dy * this.cyw;
    return [xr, yr * this.cp + dz * this.sp, yr * this.sp - dz * this.cp + this.d];
  }
  proj(x, y, z) {
    const v = this.view(x, y, z);
    if (v[2] < this.near) return null;
    const s = this.f / v[2];
    return [this.cx + v[0] * s, this.cy - v[1] * s, v[2], s];
  }
  toScreen(v) { const s = this.f / v[2]; return [this.cx + v[0] * s, this.cy - v[1] * s, v[2]]; }
  /* project a closed polygon with near-plane clipping */
  projPoly(pts, z = 0) {
    const v = pts.map(p => this.view(p[0], p[1], p.length > 2 ? p[2] : z));
    const out = [], n = v.length, near = this.near;
    for (let i = 0; i < n; i++) {
      const a = v[i], b = v[(i + 1) % n];
      const ain = a[2] >= near, bin = b[2] >= near;
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (near - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near]);
      }
    }
    return out.map(q => this.toScreen(q));
  }
  /* project an open polyline -> list of screen-space runs */
  projLine(pts, z = 0) {
    const runs = []; let cur = null; const near = this.near;
    let prev = null;
    for (const p of pts) {
      const v = this.view(p[0], p[1], p.length > 2 ? p[2] : z);
      if (prev) {
        const ain = prev[2] >= near, bin = v[2] >= near;
        if (ain && bin) { cur.push(this.toScreen(v)); }
        else if (ain && !bin) { const t = (near - prev[2]) / (v[2] - prev[2]); cur.push(this.toScreen([prev[0] + (v[0] - prev[0]) * t, prev[1] + (v[1] - prev[1]) * t, near])); cur = null; }
        else if (!ain && bin) { const t = (near - prev[2]) / (v[2] - prev[2]); cur = [this.toScreen([prev[0] + (v[0] - prev[0]) * t, prev[1] + (v[1] - prev[1]) * t, near]), this.toScreen(v)]; runs.push(cur); }
      } else if (v[2] >= near) { cur = [this.toScreen(v)]; runs.push(cur); }
      prev = v;
    }
    return runs;
  }
}

function pathPoly(ctx, sp, close = true) {
  if (!sp.length) return;
  ctx.moveTo(sp[0][0], sp[0][1]);
  for (let i = 1; i < sp.length; i++) ctx.lineTo(sp[i][0], sp[i][1]);
  if (close) ctx.closePath();
}

/* ---------------------------------------------------------------------------
 * Text
 * ------------------------------------------------------------------------- */
const FONT = {
  black: s => `900 ${s}px MS`, xbold: s => `800 ${s}px MS`, bold: s => `700 ${s}px MS`,
  semi: s => `600 ${s}px MS`, med: s => `500 ${s}px MS`, reg: s => `400 ${s}px MS`, light: s => `300 ${s}px MS`,
  serif: s => `italic 400 ${s}px SerifD`, serifR: s => `400 ${s}px SerifD`,
};

function setText(ctx, font, spacing = 0, align = 'center', base = 'alphabetic') {
  ctx.font = font; ctx.letterSpacing = spacing + 'px'; ctx.textAlign = align; ctx.textBaseline = base;
}

/* Masked slide-up reveal of one line: p in [0,1] */
function revealLine(ctx, str, x, y, size, p, opts = {}) {
  if (p <= 0) return;
  const font = opts.font || FONT.black(size);
  setText(ctx, font, opts.spacing || 0, opts.align || 'center');
  const e = Ease.outExpo(clamp(p));
  const m = ctx.measureText(str);
  const w = m.width + 40;
  const x0 = opts.align === 'left' ? x - 20 : opts.align === 'right' ? x - w + 20 : x - w / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y - size * 1.05, w, size * 1.35); ctx.clip();
  ctx.globalAlpha = (opts.alpha == null ? 1 : opts.alpha) * clamp(p * 3);
  if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = opts.glowBlur || 30; }
  ctx.fillStyle = opts.color || C.cream;
  ctx.fillText(str, x, y + (1 - e) * size * 1.2);
  ctx.restore();
}

/* Per-character kinetic reveal (stagger, rise, fade) */
function kineticChars(ctx, str, x, y, size, t0, t, opts = {}) {
  const font = opts.font || FONT.black(size);
  setText(ctx, font, 0, 'left');
  const sp = opts.spacing || 0;
  const chars = [...str];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let cx = opts.align === 'left' ? x : x - total / 2;
  const stagger = opts.stagger || 0.03, dur = opts.dur || 0.5;
  ctx.save();
  ctx.fillStyle = opts.color || C.cream;
  if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = opts.glowBlur || 24; }
  chars.forEach((ch, i) => {
    const p = clamp((t - t0 - i * stagger) / dur);
    if (p > 0) {
      const e = Ease.outQuint(p);
      ctx.globalAlpha = (opts.alpha == null ? 1 : opts.alpha) * clamp(p * 2.2);
      const dy = (1 - e) * (opts.rise == null ? size * 0.6 : opts.rise);
      const sc = lerp(opts.fromScale || 1, 1, e);
      ctx.save();
      ctx.translate(cx + widths[i] / 2, y + dy);
      ctx.scale(sc, sc);
      ctx.fillText(ch, -widths[i] / 2, 0);
      ctx.restore();
    }
    cx += widths[i] + sp;
  });
  ctx.restore();
  return total;
}

/* A fading exit multiplier */
function outFade(t, a, b) { return 1 - Ease.inCubic(prog(t, a, b)); }

/* ---------------------------------------------------------------------------
 * Overlays: grain, vignette, particles, light rays, glow sprite
 * ------------------------------------------------------------------------- */
let GRAIN = [], SPRITE_GLOW = null, SPRITE_PUFF = null, SPRITE_FLARE = null;
function initOverlays() {
  const r = rng(1337);
  for (let k = 0; k < 8; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const id = g.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); GRAIN.push(c);
  }
  SPRITE_GLOW = radialSprite(128, [[0, 'rgba(255,220,150,1)'], [0.25, 'rgba(255,190,100,0.55)'], [1, 'rgba(255,160,60,0)']]);
  SPRITE_PUFF = radialSprite(128, [[0, 'rgba(255,245,230,0.55)'], [0.5, 'rgba(255,240,220,0.18)'], [1, 'rgba(255,240,220,0)']]);
  SPRITE_FLARE = radialSprite(256, [[0, 'rgba(255,250,235,1)'], [0.08, 'rgba(255,225,160,0.9)'], [0.3, 'rgba(255,170,70,0.25)'], [1, 'rgba(255,140,40,0)']]);
}
function radialSprite(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
}
function glow(ctx, x, y, r, a = 1, sprite = SPRITE_GLOW) {
  if (a <= 0 || r <= 0) return;
  ctx.globalAlpha = a; ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
}

function drawGrain(ctx, frame, amount = 0.06) {
  const g = GRAIN[frame % GRAIN.length];
  const ox = (hash1(frame * 3.1) * 256) | 0, oy = (hash1(frame * 7.7) * 256) | 0;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = amount;
  ctx.translate(-ox, -oy);
  ctx.fillStyle = ctx.createPattern(g, 'repeat');
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
function drawVignette(ctx, strength = 0.75) {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* floating golden dust, deterministic */
function drawDust(ctx, t, n = 50, alpha = 1, seed = 5) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const s = seed * 1000 + i;
    const depth = 0.3 + hash1(s * 1.3) * 0.7;
    const x = ((hash1(s) * W + t * (8 + 26 * depth) * (hash1(s * 2.1) - 0.5) * 2) % W + W) % W;
    const y = ((hash1(s * 3.7) * H - t * (10 + 40 * depth)) % H + H) % H;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + hash1(s * 5) * 2) + i);
    glow(ctx, x, y, 3 + depth * 9, alpha * (0.15 + 0.35 * tw) * depth);
  }
  ctx.restore();
}
/* volumetric light rays from a point */
function drawRays(ctx, x, y, t, alpha, len = 1600, n = 14, spread = TAU, rot = 0, color = [255, 200, 120]) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * spread + Math.sin(t * 0.4 + i * 1.7) * 0.05 + (spread < TAU ? -spread / 2 : 0);
    const w = 0.025 + 0.05 * hash1(i * 9.1);
    const L = len * (0.6 + 0.4 * hash1(i * 4.3));
    const g = ctx.createRadialGradient(x, y, 0, x, y, L);
    const ai = alpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 2.3)));
    g.addColorStop(0, rgbStr(color, 0.28 * ai)); g.addColorStop(1, rgbStr(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L);
    ctx.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
/* full-frame warm flash */
function flash(ctx, a, color = [255, 225, 170]) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgbStr(color, clamp(a)); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function fillBg(ctx, top = '#070810', bottom = '#030305') {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* dark legibility band behind text */
function textScrim(ctx, y, h, a = 0.6) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, 'rgba(3,4,8,0)'); g.addColorStop(0.5, `rgba(3,4,8,${a})`); g.addColorStop(1, 'rgba(3,4,8,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - h, W, h * 2);
}
