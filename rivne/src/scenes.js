'use strict';
/* Рівне за 40 секунд — 5 фактів. Bright, saturated motion design: every fact
 * has its own colour world, a beat-locked zoom pulse, camera kicks on cuts and
 * colour-stripe wipes between scenes. All drawing is a pure function of t. */
const WHITE = '#ffffff', INK = '#0b0b14', YEL = '#ffd60a', BLU = '#0057b7';
const T = { hook: 0, f1: 4, f2: 10, f3: 16.5, f4: 23, f5: 29.5, out: 35, end: 40 }; // overridden by timeline.json
let SUBS = [];
const KEYS = ['hook', 'f1', 'f2', 'f3', 'f4', 'f5', 'out'];
/* per-scene palette: [top, bottom, accent, accent2] */
const PAL = {
  hook: ['#1d3bff', '#7a00ff', YEL, '#00e5ff'],
  f1: ['#ff7a00', '#ff1f6b', YEL, '#ffe8c2'],
  f2: ['#00c8ff', '#0040ff', '#ffe14d', '#b8f3ff'],
  f3: ['#00d26a', '#006b5b', '#ff4fa3', '#d6ffe6'],
  f4: ['#ffb300', '#c2185b', '#fff176', '#ffe0a3'],
  f5: ['#8a2bff', '#ff0a8c', '#00f0ff', '#f2d9ff'],
  out: ['#0057b7', '#2a7bff', YEL, '#ffffff'],
};

/* ---------------- geography ---------------- */
const UA_LL = [
  [22.15, 48.40], [22.56, 49.08], [22.75, 49.35], [22.68, 49.57], [23.20, 50.00], [23.70, 50.38], [24.10, 50.60],
  [24.05, 50.85], [23.80, 51.10], [23.60, 51.50], [24.40, 51.88], [25.20, 51.95], [26.20, 51.85], [27.20, 51.60],
  [28.00, 51.58], [28.80, 51.50], [29.30, 51.38], [30.10, 51.45], [30.55, 51.25], [30.65, 51.60], [30.95, 52.05],
  [31.80, 52.10], [32.30, 52.30], [33.20, 52.36], [34.10, 51.95], [34.40, 51.70], [34.20, 51.25], [35.10, 51.20],
  [35.40, 50.80], [35.70, 50.35], [36.60, 50.25], [37.50, 50.35], [38.00, 49.95], [38.50, 49.95], [39.20, 49.85],
  [40.10, 49.60], [40.15, 49.25], [39.70, 48.80], [39.90, 48.30], [39.75, 47.85], [38.80, 47.85], [38.25, 47.55],
  [38.20, 47.10], [37.40, 47.00], [36.70, 46.75], [35.90, 46.65], [35.20, 46.35], [34.80, 46.17], [35.05, 45.80],
  [35.40, 45.35], [35.90, 45.40], [36.40, 45.45], [36.60, 45.35], [36.40, 45.10], [35.40, 45.03], [34.95, 44.85],
  [34.40, 44.67], [34.15, 44.50], [33.80, 44.39], [33.50, 44.60], [33.60, 44.95], [33.40, 45.20], [32.90, 45.35],
  [32.50, 45.35], [32.70, 45.50], [33.20, 45.85], [33.70, 46.10], [32.90, 46.10], [32.00, 46.25], [31.60, 46.25],
  [31.50, 46.55], [30.80, 46.50], [30.40, 46.05], [29.90, 45.70], [29.70, 45.25], [29.20, 45.40], [28.90, 45.30],
  [28.20, 45.47], [28.50, 45.90], [28.90, 46.45], [29.60, 46.40], [30.10, 46.45], [29.90, 46.80], [29.60, 47.35],
  [29.20, 47.50], [29.20, 47.95], [28.40, 48.20], [27.60, 48.45], [26.70, 48.30], [26.20, 48.00], [25.20, 47.90],
  [24.60, 47.95], [23.90, 47.95], [23.10, 48.10], [22.60, 48.10],
];
const RIVNE = [26.25, 50.62];
const uaK = 52, uaC = [31.2, 48.6];
const proj = (ll, cx = 540, cy = 1000, k = uaK) => [cx + (ll[0] - uaC[0]) * Math.cos(49 * Math.PI / 180) * k, cy - (ll[1] - uaC[1]) * k * 1.0];
function chaikinC(p, it = 2) { for (let k = 0; k < it; k++) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } p = q; } return p; }
const UA = chaikinC(UA_LL, 2);
function plen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function partial(p, f) { const tot = plen(p) * clamp(f); const out = [p[0]]; let acc = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + s >= tot) { const u = (tot - acc) / (s || 1); out.push([lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]); break; } out.push(p[i]); acc += s; } return out; }
function stroke(g, pts, col, w, close = false) { if (pts.length < 2) return; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }

function ukraine(g, t, o) {
  const sc = o.scale || 1, fx = o.focus || [540, 1000];
  g.save(); g.translate(0, o.dy || 0); g.translate(fx[0], fx[1]); g.scale(sc, sc); g.translate(-fx[0], -fx[1]);
  const pts = UA.map(p => proj(p));
  // two-tone flag fill, clipped to the outline
  g.save(); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 40; g.fillStyle = BLU; g.globalAlpha = o.fill == null ? 1 : o.fill; g.fill(); g.shadowBlur = 0; g.clip();
  const ys = proj([0, 48.6])[1]; g.fillStyle = YEL; g.fillRect(0, ys, W, H);
  g.restore();
  stroke(g, partial(pts.concat([pts[0]]), o.draw == null ? 1 : o.draw), WHITE, 6 / sc);
  const h = proj(RIVNE);
  if (o.pin) {
    for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; g.beginPath(); g.arc(h[0], h[1], (12 + ph * 90) / sc, 0, TAU); g.strokeStyle = `rgba(255,255,255,${(1 - ph) * o.pin})`; g.lineWidth = 4 / sc; g.stroke(); }
    pin(g, h[0], h[1], o.pin / sc * 1.1);
  }
  g.restore();
  return h;
}
function pin(g, x, y, s) {
  if (s <= 0) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
  g.fillStyle = '#ff2d55'; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-34, -40, -34, -84, 0, -84); g.bezierCurveTo(34, -84, 34, -40, 0, 0); g.fill();
  g.shadowColor = 'transparent'; g.fillStyle = WHITE; g.beginPath(); g.arc(0, -56, 12, 0, TAU); g.fill();
  g.restore();
}

/* ---------------- shared look ---------------- */
function bgFor(g, key, t) {
  const p = PAL[key];
  const gr = g.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, p[0]); gr.addColorStop(1, p[1]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // slow rotating sunburst
  g.save(); g.translate(540, 900); g.rotate(t * 0.12); g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillStyle = i % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-180, -2200); g.lineTo(180, -2200); g.closePath(); g.fill(); }
  g.restore();
  // drifting bokeh
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 18; i++) {
    const s = i * 13.7 + KEYS.indexOf(key) * 101;
    const x = (hash1(s) * W + Math.sin(t * 0.5 + i) * 60), y = ((hash1(s * 2.3) * H - t * (30 + 50 * hash1(s * 5))) % H + H) % H;
    const r = 30 + hash1(s * 7) * 110;
    g.fillStyle = `rgba(255,255,255,${0.04 + 0.06 * hash1(s * 9)})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.restore();
}
function fit(g, text, fontFn, size, maxW, spacing = 0) { setText(g, fontFn(size), spacing); const w = g.measureText(text).width; return w > maxW ? Math.floor(size * maxW / w) : size; }
/* big punchy headline: scale-slam with a hard drop shadow */
function slam(g, str, x, y, size, p, opts = {}) {
  if (p <= 0) return;
  const e = Ease.outBack(clamp(p)), sz = fit(g, str, opts.fontFn || FONT.black, size, opts.maxW || 980, opts.spacing || 0);
  g.save(); g.translate(x, y); const s = lerp(opts.from || 2.2, 1, Ease.outExpo(clamp(p))) * (0.92 + 0.08 * e); g.scale(s, s); g.rotate((opts.rot || 0) * (1 - Ease.outExpo(clamp(p))));
  setText(g, (opts.fontFn || FONT.black)(sz), opts.spacing || 0, 'center', 'middle'); g.globalAlpha = clamp(p * 4);
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillText(str, 8, 10);
  if (opts.outline) { g.lineWidth = opts.outline; g.strokeStyle = INK; g.lineJoin = 'round'; g.strokeText(str, 0, 0); }
  g.fillStyle = opts.color || WHITE; g.fillText(str, 0, 0);
  g.restore();
}
function sticker(g, str, x, y, size, p, bg, fg = INK, rot = -0.06) {
  if (p <= 0) return;
  const e = Ease.outBack(clamp(p));
  setText(g, FONT.black(size), 2, 'center', 'middle'); const w = g.measureText(str).width + size * 1.1, h = size * 1.6;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(e, e);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.roundRect(-w / 2 + 8, -h / 2 + 10, w, h, h / 2); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill();
  g.fillStyle = fg; g.fillText(str, 0, size * 0.04); g.restore();
}
function factHeader(g, t, n, key, title, sub) {
  const t0 = T[key], pal = PAL[key];
  // progress segments
  for (let i = 1; i <= 5; i++) {
    const x = 120 + (i - 1) * 172, f = i < n ? 1 : i === n ? Ease.outCubic(prog(t, t0, T[KEYS[n + 1]])) : 0;
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.roundRect(x, 150, 152, 12, 6); g.fill();
    if (f > 0) { g.fillStyle = WHITE; g.beginPath(); g.roundRect(x, 150, 152 * f, 12, 6); g.fill(); }
  }
  // number medallion spinning in
  const p = prog(t, t0 + 0.05, t0 + 0.5), e = Ease.outBack(p);
  if (p > 0) {
    g.save(); g.translate(540, 300); g.rotate((1 - Ease.outExpo(p)) * -2.5); g.scale(e, e);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(6, 10, 92, 0, TAU); g.fill();
    g.fillStyle = pal[2]; g.beginPath(); g.arc(0, 0, 92, 0, TAU); g.fill();
    g.lineWidth = 8; g.strokeStyle = WHITE; g.stroke();
    setText(g, FONT.black(120), 0, 'center', 'middle'); g.fillStyle = INK; g.fillText(String(n), 0, 8);
    g.restore();
  }
  slam(g, title, 540, 500, 104, prog(t, t0 + 0.2, t0 + 0.65), { color: WHITE, spacing: 1, rot: 0.08 });
  if (sub) sticker(g, sub, 540, 612, 38, prog(t, t0 + 0.45, t0 + 0.85), pal[2], INK, -0.03);
}

/* ---------------- scenes ---------------- */
function S_hook(g, t) {
  bgFor(g, 'hook', t);
  const h0 = proj(RIVNE);
  const z = lerp(0.85, 1.9, Ease.inOutCubic(prog(t, 1.2, T.f1 + 0.2)));
  drawRays(g, h0[0], h0[1] + 300, t, 0.9 * (1 - prog(t, 2.5, 4)), 1600, 18, TAU, t * 0.3, [255, 240, 120]);
  ukraine(g, t, { draw: Ease.outCubic(prog(t, 0, 1.0)), fill: prog(t, 0.3, 0.9), pin: Ease.outBack(prog(t, 0.7, 1.1)), scale: z, focus: h0, dy: 300 });
  const p = prog(t, 0.15, 0.55);
  if (p > 0) {
    const e = Ease.outExpo(p);
    g.save(); g.translate(540, 470); g.scale(lerp(3, 1, e), lerp(3, 1, e)); g.rotate(lerp(-0.2, 0, e));
    setText(g, FONT.black(230), lerp(60, 6, e), 'center', 'middle'); g.globalAlpha = clamp(p * 4);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillText('РІВНЕ', 10, 14);
    g.fillStyle = YEL; g.fillText('РІВНЕ', 0, 0); g.restore();
    if (t < 0.6) flash(g, 0.7 * Math.exp(-(t - 0.15) * 12), [255, 250, 200]);
  }
  sticker(g, '5 ФАКТІВ', 540, 660, 64, prog(t, 0.85, 1.25), WHITE, '#1d3bff', -0.05);
  kineticChars(g, 'які тебе здивують', 540, 800, 64, 1.3, t, { font: FONT.serif(72), color: WHITE, stagger: 0.03, dur: 0.4, rise: 40 });
}

function S_f1(g, t) {
  const lt = t - T.f1, pal = PAL.f1;
  bgFor(g, 'f1', t);
  factHeader(g, t, 1, 'f1', 'ПЕРША ЗГАДКА', 'ЛІТОПИС');
  // parchment scroll unrolling
  const u = Ease.outCubic(prog(lt, 0.3, 1.1));
  const sw = 820 * u, cx = 540, cy = 990;
  if (u > 0) {
    g.save(); g.translate(cx, cy); g.rotate(-0.03);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-sw / 2 + 10, -230 + 14, sw, 460);
    const pg = g.createLinearGradient(0, -230, 0, 230); pg.addColorStop(0, '#fff3d6'); pg.addColorStop(1, '#f3d9a4');
    g.fillStyle = pg; g.fillRect(-sw / 2, -230, sw, 460);
    // old script lines
    g.save(); g.beginPath(); g.rect(-sw / 2, -230, sw, 460); g.clip(); g.strokeStyle = 'rgba(120,60,20,0.35)'; g.lineWidth = 6; g.lineCap = 'round';
    for (let r = 0; r < 4; r++) { const y = -170 + r * 34; let x = -370; const rr = rng(r + 3); while (x < 370) { const l = 20 + rr() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); x += l + 16; } }
    for (let r = 0; r < 3; r++) { const y = 130 + r * 34; let x = -370; const rr = rng(r + 9); while (x < 370) { const l = 20 + rr() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); x += l + 16; } }
    g.restore();
    // rollers
    [-1, 1].forEach(s => { const rg = g.createLinearGradient(s * sw / 2 - 26, 0, s * sw / 2 + 26, 0); rg.addColorStop(0, '#8a4b1c'); rg.addColorStop(0.5, '#d48c4a'); rg.addColorStop(1, '#6a3510'); g.fillStyle = rg; g.beginPath(); g.roundRect(s * sw / 2 - 26, -260, 52, 520, 20); g.fill(); });
    g.restore();
  }
  // slot-machine year
  const digits = [1, 2, 8, 3];
  setText(g, FONT.black(210), 0, 'center', 'middle');
  digits.forEach((d, i) => {
    const st = 0.8 + i * 0.22, p = prog(lt, st, st + 0.9); if (p <= 0) return;
    const roll = (1 - Ease.outCubic(p)) * (10 + i * 4) + d; // value shown (fractional)
    const x = cx - 240 + i * 160, y = cy + 12;
    g.save(); g.beginPath(); g.rect(x - 80, y - 120, 160, 240); g.clip();
    for (let k = -1; k <= 1; k++) {
      const v = Math.floor(roll) + k, off = (roll - Math.floor(roll)) * 220;
      g.globalAlpha = clamp(p * 3);
      g.fillStyle = '#5a2400'; g.fillText(String(((v % 10) + 10) % 10), x, y - k * 220 + off);
    }
    g.restore();
  });
  sticker(g, 'ПОНАД 740 РОКІВ', 540, 1300, 56, prog(lt, 2.3, 2.7), YEL, INK, 0.05);
}

function palace(g, x, y, s, p, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const rise = Ease.outCubic(clamp(p)), hClip = 520 * rise;
  g.beginPath(); g.rect(-600, -hClip, 1200, hClip + 2); g.clip();
  g.fillStyle = col;
  g.fillRect(-380, -200, 760, 200);                 // main body
  g.fillRect(-470, -150, 90, 150); g.fillRect(380, -150, 90, 150); // wings
  g.fillRect(-150, -300, 300, 100);                 // central block
  g.beginPath(); g.moveTo(-170, -300); g.lineTo(0, -380); g.lineTo(170, -300); g.closePath(); g.fill(); // pediment
  g.beginPath(); g.moveTo(-60, -380); g.quadraticCurveTo(0, -470, 60, -380); g.fill(); g.fillRect(-6, -500, 12, 60); // cupola + spire
  [-1, 1].forEach(sd => { g.fillRect(sd * 330 - 40, -320, 80, 120); g.beginPath(); g.moveTo(sd * 330 - 50, -320); g.lineTo(sd * 330, -400); g.lineTo(sd * 330 + 50, -320); g.fill(); });
  // windows (lit)
  g.fillStyle = 'rgba(255,240,170,0.95)';
  for (let i = -5; i <= 5; i++) { if (i === 0) continue; g.fillRect(i * 62 - 14, -170, 28, 50); g.fillRect(i * 62 - 14, -90, 28, 50); }
  for (let i = -1; i <= 1; i++) g.fillRect(i * 80 - 16, -280, 32, 60);
  g.beginPath(); g.arc(0, -60, 34, Math.PI, TAU); g.lineTo(34, 0); g.lineTo(-34, 0); g.fill();
  g.restore();
}
function S_f2(g, t) {
  const lt = t - T.f2, pal = PAL.f2;
  bgFor(g, 'f2', t);
  // sun
  g.save(); g.globalCompositeOperation = 'screen'; glow(g, 820, 760, 260, 0.9, SPRITE_SUN); g.restore();
  factHeader(g, t, 2, 'f2', 'ПАЛАЦ НА ОСТРОВІ', 'КНЯЗІ ЛЮБОМИРСЬКІ');
  const wl = 1180; // waterline
  // island
  const ip = Ease.outBack(prog(lt, 0.2, 0.8));
  g.save(); g.translate(540, wl); g.scale(ip, ip);
  g.fillStyle = '#2bd46a'; g.beginPath(); g.ellipse(0, 0, 470, 70, 0, Math.PI, TAU); g.fill();
  g.fillStyle = '#16a34a'; g.beginPath(); g.ellipse(0, 6, 470, 40, 0, 0, Math.PI); g.fill();
  // trees
  for (let i = 0; i < 9; i++) { if (i > 2 && i < 6) continue; const tx = -420 + i * 105; g.fillStyle = '#0f7a3a'; g.beginPath(); g.arc(tx, -40, 40 + (i % 3) * 8, 0, TAU); g.fill(); }
  g.restore();
  palace(g, 540, wl - 40, 0.92, prog(lt, 0.6, 1.8), '#ffffff');
  // water with moving waves + reflection
  const wg = g.createLinearGradient(0, wl, 0, H); wg.addColorStop(0, '#0090ff'); wg.addColorStop(1, '#0020a0');
  g.fillStyle = wg; g.fillRect(0, wl, W, H - wl);
  for (let r = 0; r < 9; r++) {
    const y = wl + 20 + r * 34, amp = 6 + r * 1.5, sp = 1.5 + r * 0.2;
    g.beginPath(); for (let x = 0; x <= W; x += 12) { const yy = y + Math.sin(x * 0.02 + t * sp * 3 + r) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.strokeStyle = `rgba(255,255,255,${0.5 - r * 0.04})`; g.lineWidth = 4; g.stroke();
  }
  // shimmering reflection of the palace windows
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const x = 220 + i * 25, y = wl + 30 + hash1(i) * 90; glow(g, x + Math.sin(t * 4 + i) * 10, y, 14, 0.35 * prog(lt, 1.2, 1.8), SPRITE_SUN); }
  g.restore();
  sticker(g, 'РІЧКА УСТЯ', 540, 1360, 44, prog(lt, 1.6, 2.0), WHITE, '#0040ff', 0.04);
}

function heart(g, x, y, s, col, a = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a; g.fillStyle = col;
  g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-30, -10, -18, -38, 0, -22); g.bezierCurveTo(18, -38, 30, -10, 0, 12); g.fill(); g.restore();
}
function S_f3(g, t) {
  const lt = t - T.f3, pal = PAL.f3;
  // tunnel world: vanishing point
  const vx = 540, vy = 960;
  const gr = g.createRadialGradient(vx, vy, 10, vx, vy, 1300); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.08, '#b6ff7a'); gr.addColorStop(0.35, '#00b84f'); gr.addColorStop(1, '#003d22');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const speed = 1.25, N = 16;
  // arches of foliage flying towards the camera
  for (let k = N - 1; k >= 0; k--) {
    const z = ((k - lt * speed) % N + N) % N + 0.4; // 0.4..16.4
    const s = 520 / z;
    const a = clamp((16.4 - z) / 3) * clamp(z / 0.9);
    g.save(); g.globalAlpha = a; g.translate(vx, vy + s * 0.25);
    g.lineWidth = s * 0.55; g.strokeStyle = k % 2 ? '#0b8f3e' : '#12a84a';
    g.beginPath(); g.moveTo(-s * 1.1, s * 1.6); g.lineTo(-s * 1.1, 0); g.arc(0, 0, s * 1.1, Math.PI, TAU); g.lineTo(s * 1.1, s * 1.6); g.stroke();
    // leaf clusters
    for (let i = 0; i < 10; i++) { const an = Math.PI + (i / 9) * Math.PI; g.fillStyle = i % 2 ? '#29d36a' : '#067a33'; g.beginPath(); g.arc(Math.cos(an) * s * 1.1, Math.sin(an) * s * 1.1, s * 0.22, 0, TAU); g.fill(); }
    g.restore();
  }
  // rails converging
  g.save(); g.strokeStyle = '#d9d2c3'; g.lineWidth = 10;
  [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(vx + sd * 12, vy + 40); g.lineTo(vx + sd * 330, H + 40); g.stroke(); });
  for (let k = 0; k < 14; k++) { const z = ((k - lt * speed * 3) % 14 + 14) % 14 + 0.3; const y = vy + 40 + 880 / z * 0.6; const w = 12 + 330 * (y - vy - 40) / (H - vy); g.fillStyle = 'rgba(90,60,40,0.8)'; g.fillRect(vx - w * 1.2, y, w * 2.4, 6 + 40 / z); }
  g.restore();
  // floating hearts
  g.save(); g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 22; i++) {
    const u = (hash1(i * 3.3) + lt * (0.12 + hash1(i) * 0.12)) % 1;
    const x = 120 + hash1(i * 7.1) * 840 + Math.sin(lt * 2 + i) * 30, y = H - 200 - u * 1500;
    heart(g, x, y, 1.2 + hash1(i * 5) * 1.8, i % 3 ? pal[2] : WHITE, clamp(prog(lt, 0.3, 0.8)) * (1 - u) * 0.95);
  }
  g.restore();
  factHeader(g, t, 3, 'f3', 'ТУНЕЛЬ КОХАННЯ', 'КЛЕВАНЬ · РІВНЕНЩИНА');
  const p = prog(lt, 3.7, 4.1);
  if (p > 0) { const e = Ease.outBack(p); g.save(); g.translate(540, 1260); g.scale(e * (1 + 0.06 * Math.sin(lt * 9)), e * (1 + 0.06 * Math.sin(lt * 9))); heart(g, 0, 40, 5.5, pal[2]); setText(g, FONT.black(44), 1, 'center', 'middle'); g.fillStyle = WHITE; g.fillText('ВЕСЬ СВІТ', 0, -4); g.restore(); }
}

function amberStone(g, x, y, r, rot, seed, a = 1, bug = false) {
  const rr = rng(seed); const pts = []; const n = 9;
  for (let i = 0; i < n; i++) { const an = rot + i / n * TAU; const rad = r * (0.75 + rr() * 0.3); pts.push([x + Math.cos(an) * rad, y + Math.sin(an) * rad * 0.85]); }
  g.save(); g.globalAlpha = a;
  g.shadowColor = 'rgba(255,140,0,0.8)'; g.shadowBlur = r * 0.6;
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r * 1.1);
  gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.3, '#ffc233'); gr.addColorStop(0.75, '#e86a00'); gr.addColorStop(1, '#8a2c00');
  g.fillStyle = gr; poly(g, pts); g.fill(); g.shadowBlur = 0;
  // facets
  g.strokeStyle = 'rgba(255,255,220,0.45)'; g.lineWidth = Math.max(1.5, r * 0.025);
  for (let i = 0; i < n; i += 2) { g.beginPath(); g.moveTo(x - r * 0.15, y - r * 0.1); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
  if (bug) { // a tiny insect frozen inside
    g.save(); g.translate(x + r * 0.05, y + r * 0.1); g.rotate(rot * 0.3); g.fillStyle = 'rgba(70,25,0,0.75)'; g.strokeStyle = 'rgba(70,25,0,0.75)'; g.lineWidth = r * 0.02;
    g.beginPath(); g.ellipse(0, 0, r * 0.13, r * 0.06, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(r * 0.15, 0, r * 0.04, 0, TAU); g.fill();
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * r * 0.05, 0); g.lineTo(k * r * 0.08, r * 0.12); g.moveTo(k * r * 0.05, 0); g.lineTo(k * r * 0.08, -r * 0.12); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-r * 0.02, -r * 0.1, r * 0.14, r * 0.05, -0.5, 0, TAU); g.fill();
    g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.35, r * 0.18, r * 0.08, -0.6, 0, TAU); g.fill();
  g.restore();
}
function S_f4(g, t) {
  const lt = t - T.f4;
  bgFor(g, 'f4', t);
  drawRays(g, 540, 1000, t, 0.8, 1500, 20, TAU, t * 0.25, [255, 230, 120]);
  factHeader(g, t, 4, 'f4', 'БУРШТИНОВИЙ КРАЙ', 'СОНЯЧНИЙ КАМІНЬ');
  // orbiting small stones
  for (let i = 0; i < 7; i++) {
    const an = i / 7 * TAU + lt * 0.6, R = 360 + 40 * Math.sin(lt + i);
    const p = Ease.outBack(prog(lt, 0.3 + i * 0.08, 0.8 + i * 0.08));
    if (p > 0) amberStone(g, 540 + Math.cos(an) * R, 1000 + Math.sin(an) * R * 0.55, 46 * p, lt * 0.8 + i, 20 + i);
  }
  const p = Ease.outBack(prog(lt, 0.4, 1.1));
  if (p > 0) { const bob = Math.sin(lt * 2.2) * 14; amberStone(g, 540, 1000 + bob, 230 * p, 0.2 + lt * 0.15, 7, 1, true); }
  // sparkles
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const ph = (lt * 0.9 + hash1(i)) % 1; const x = 200 + hash1(i * 3) * 680, y = 700 + hash1(i * 5) * 620; glow(g, x, y, 10 + 26 * Math.sin(ph * Math.PI), Math.sin(ph * Math.PI) * prog(lt, 0.6, 1)); }
  g.restore();
  sticker(g, 'ПОЛІСЬКИЙ БУРШТИН', 540, 1330, 48, prog(lt, 1.6, 2.0), WHITE, '#c2185b', -0.04);
}

function S_f5(g, t) {
  const lt = t - T.f5, pal = PAL.f5;
  bgFor(g, 'f5', t);
  factHeader(g, t, 5, 'f5', 'БАЗАЛЬТОВІ СТОВПИ', 'БЕРЕСТОВЕЦЬ');
  // isometric hexagonal columns rising
  const iso = (x, y, z) => [540 + (x - y) * 52, 1130 + (x + y) * 30 - z];
  const cols = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { if (Math.abs(i) + Math.abs(j) > 6) continue; cols.push([i * 1.15 + (j % 2) * 0.55, j * 1.0, 120 + hash1(i * 7 + j * 13) * 260 - (Math.abs(i) + Math.abs(j)) * 25, hash1(i * 3 + j * 17)]); }
  cols.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  cols.forEach(([x, y, h, s]) => {
    const r = Ease.outBack(prog(lt, 0.2 + s * 0.9, 0.7 + s * 0.9)) * h; if (r <= 2) return;
    const hex = []; for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + Math.PI / 6; hex.push([x + Math.cos(an) * 0.55, y + Math.sin(an) * 0.55]); }
    // side faces (only the 3 front-facing)
    for (let k = 0; k < 6; k++) {
      const a = hex[k], b = hex[(k + 1) % 6]; const nx = (a[0] + b[0]) / 2 - x, ny = (a[1] + b[1]) / 2 - y; if (nx + ny < -0.05) continue;
      const shade = nx > ny ? '#3b2a66' : '#251a45';
      g.fillStyle = shade; poly(g, [iso(a[0], a[1], 0), iso(b[0], b[1], 0), iso(b[0], b[1], r), iso(a[0], a[1], r)]); g.fill();
    }
    const top = hex.map(p => iso(p[0], p[1], r));
    const tg = g.createLinearGradient(top[3][0], top[3][1], top[0][0], top[0][1]); tg.addColorStop(0, s > 0.75 ? pal[2] : '#6f5bb5'); tg.addColorStop(1, s > 0.75 ? '#7af7ff' : '#9b88e0');
    g.fillStyle = tg; poly(g, top); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2; poly(g, top); g.stroke();
  });
  const m = Math.round(Ease.outCubic(prog(lt, 1.0, 2.6)) * 500);
  const pn = prog(lt, 1.0, 1.3);
  if (pn > 0) {
    g.save(); g.translate(540, 1370); const e = Ease.outBack(pn); g.scale(e, e); g.rotate(-0.04);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.roundRect(-330 + 8, -90 + 10, 660, 180, 40); g.fill();
    g.fillStyle = WHITE; g.beginPath(); g.roundRect(-330, -90, 660, 180, 40); g.fill();
    setText(g, FONT.black(110), 0, 'center', 'middle'); g.fillStyle = '#8a2bff'; g.fillText(`${m}+`, -80, -6);
    setText(g, FONT.black(40), 2, 'left', 'middle'); g.fillStyle = INK; g.fillText('МЛН', 110, -28); g.fillText('РОКІВ', 110, 22);
    g.restore();
  }
}

function S_out(g, t) {
  const lt = t - T.out;
  bgFor(g, 'out', t);
  const h0 = proj(RIVNE);
  ukraine(g, t, { draw: 1, pin: 1, fill: 1, scale: lerp(2.6, 1.3, Ease.inOutCubic(prog(lt, 0, 1.4))), focus: h0, dy: 280 });
  // confetti
  for (let i = 0; i < 70; i++) {
    const x = hash1(i * 2.7) * W + Math.sin(lt * 2 + i) * 40, y = -40 + ((hash1(i * 4.1) * 600 + lt * (260 + hash1(i) * 300)) % (H + 80));
    g.save(); g.translate(x, y); g.rotate(lt * 4 + i); g.fillStyle = i % 2 ? YEL : WHITE; g.globalAlpha = prog(lt, 0.2, 0.5); g.fillRect(-9, -5, 18, 10); g.restore();
  }
  const p = prog(lt, 0.2, 0.6), e = Ease.outExpo(p);
  if (p > 0) {
    g.save(); g.translate(540, 360); g.scale(lerp(2.2, 1, e), lerp(2.2, 1, e)); setText(g, '900 150px MS, Emoji', lerp(30, 4, e), 'center', 'middle'); g.globalAlpha = clamp(p * 3);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillText('РІВНЕ 🇺🇦', 8, 12); g.fillStyle = WHITE; g.fillText('РІВНЕ 🇺🇦', 0, 0); g.restore();
  }
  kineticChars(g, 'А ти вже був тут?', 540, 520, 76, T.out + 0.7, t, { font: FONT.serif(84), color: YEL, stagger: 0.03, dur: 0.4, rise: 40 });
  const bp = prog(lt, 1.6, 2.0);
  if (bp > 0) { sticker(g, 'ПИШИ В КОМЕНТАРЯХ 👇', 540, 660, 46, bp, YEL, INK, -0.03); }
}

/* ---- transition: three colour stripes sweep diagonally, revealing the next world ---- */
function stripeWipe(g, t, t0, key) {
  const p = prog(t, t0 - 0.28, t0 + 0.28); if (p <= 0 || p >= 1) return;
  const pal = PAL[key];
  g.save(); g.translate(540, 960); g.rotate(-0.5);
  [[pal[2], 0], [WHITE, 0.08], [pal[0], 0.16]].forEach(([c, d]) => {
    const e = Ease.inOutCubic(clamp((p - d) / (1 - 0.16)));
    const x = lerp(-1700, 1700, e);
    g.fillStyle = c; g.fillRect(x - 340, -1500, 680, 3000);
  });
  g.restore();
}

/* ---- karaoke captions ---- */
function captions(g, t) {
  const c = SUBS.find(s => t >= s.s && t < s.e); if (!c) return;
  const words = c.text.split(' ');
  const total = c.text.length; let acc = 0; const k = (t - c.s) / Math.max(0.3, c.e - c.s - 0.15);
  const pop = Ease.outBack(clamp((t - c.s) / 0.14));
  g.save(); setText(g, FONT.black(66), 0, 'left');
  const lines = []; let cur = [], w = 0; const sp = g.measureText(' ').width;
  words.forEach(wd => { const ww = g.measureText(wd).width; if (w + ww > 960 && cur.length) { lines.push(cur); cur = []; w = 0; } cur.push([wd, ww, acc / total]); w += ww + sp; acc += wd.length + 1; });
  lines.push(cur);
  g.globalAlpha = clamp((c.e - t) / 0.08);
  g.translate(540, 1600); g.scale(pop, pop); g.translate(-540, -1600);
  lines.forEach((ln, li) => {
    const lw = ln.reduce((s, x) => s + x[1], 0) + sp * (ln.length - 1); let x = 540 - lw / 2; const y = 1600 + li * 84;
    ln.forEach(([wd, ww, f]) => {
      const on = k >= f && k < f + (wd.length + 1) / total + 0.02;
      g.lineWidth = 14; g.strokeStyle = INK; g.lineJoin = 'round'; g.strokeText(wd, x, y);
      g.fillStyle = on ? YEL : WHITE; g.fillText(wd, x, y);
      x += ww + sp;
    });
  });
  g.restore();
}

/* ---- compositor ---- */
let SPRITE_SUN = null;
function initScenes(tl) {
  SPRITE_SUN = radialSprite(256, [[0, 'rgba(255,255,230,1)'], [0.2, 'rgba(255,240,150,0.8)'], [1, 'rgba(255,220,100,0)']]);
  if (tl) { Object.assign(T, tl.scenes); SUBS = tl.subs; }
}
function drawFrame(ctx, tIn, frameIn) {
  const t = Math.min(tIn, T.end - 0.5), frame = Math.min(frameIn, Math.round((T.end - 0.5) * FPS));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let ki = 0; for (let i = 0; i < KEYS.length; i++) if (t >= T[KEYS[i]]) ki = i;
  const key = KEYS[ki], S = { hook: S_hook, f1: S_f1, f2: S_f2, f3: S_f3, f4: S_f4, f5: S_f5, out: S_out }[key];
  // camera: beat pulse (120 BPM) + a decaying kick on every cut
  const bt = (t % BEAT) / BEAT, pulse = t > 0.5 && t < T.end - 1 ? 0.012 * Math.exp(-bt * 7) : 0;
  const since = t - T[key], kick = ki ? Math.exp(-since * 6) : 0;
  const zoom = 1 + pulse + 0.06 * kick;
  const sx = (noise1(t * 18, 1) - 0.5) * 36 * kick, sy = (noise1(t * 18, 2) - 0.5) * 36 * kick;
  ctx.translate(540 + sx, 960 + sy); ctx.scale(zoom, zoom); ctx.rotate(0.02 * kick * Math.sin(t * 30)); ctx.translate(-540, -960);
  S(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  KEYS.slice(1).forEach(k => stripeWipe(ctx, t, T[k], k));
  drawVignette(ctx, 0.35);
  captions(ctx, t);
  // brand tag
  ctx.save(); ctx.globalAlpha = 0.85 * prog(t, 1, 1.4) * (1 - prog(t, T.out - 0.3, T.out)); setText(ctx, FONT.xbold(26), 8); ctx.fillStyle = WHITE; ctx.fillText('РІВНЕ ЗА 40 СЕКУНД', 540, 112); ctx.restore();
  drawGrain(ctx, frame, 0.035);
}
