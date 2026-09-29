'use strict';
/* Environment painting: skies, trees, fields, fences, pumpkins, the farmhouse. */
const SKY = {
  night: ['#060913', '#0f1628', '#1f2b45'], dusk: ['#1b1a33', '#5a3b52', '#d0784a'], day: ['#7ea3c8', '#b9cde0', '#f0e2c4'],
  overcast: ['#8a929c', '#a9b0b6', '#c9ccca'], sunrise: ['#3a4a6a', '#c98a6a', '#ffd89a'], winter: ['#9aa6b4', '#c3cad2', '#e2e4e4'],
  spring: ['#8fb0cf', '#c4d6e2', '#eef0e2'], summer: ['#5f9ad0', '#a6c9e6', '#f2e6c4'], lateafternoon: ['#6d8cb0', '#d4b48a', '#f4c98a'],
};
function sky(g, tod, o = {}) {
  const c = SKY[tod] || SKY.night; const hz = o.horizon || H * 0.6;
  g.fillStyle = lin(g, 0, 0, 0, hz, [[0, c[0]], [0.6, c[1]], [1, c[2]]]); g.fillRect(0, 0, W, hz + 4);
  if (tod === 'night' && o.stars !== false) {
    for (let i = 0; i < 160; i++) { const x = hash1(i * 3.1) * W, y = hash1(i * 7.3) * hz * 0.8; const tw = 0.5 + 0.5 * Math.sin((o.t || 0) * (1 + hash1(i)) * 2 + i); glow(g, x, y, 1.5 + hash1(i * 9) * 2.5, 0.25 + 0.5 * tw * hash1(i * 5), SPR.dust); }
  }
  if (o.moon) {
    const [mx, my, mr] = o.moon;
    addGlow(g, mx, my, mr * 7, 0.35, SPR.cool);
    ell(g, mx, my, mr, mr, '#eef0e6');
    g.fillStyle = 'rgba(180,185,190,0.35)'; ell(g, mx - mr * 0.3, my - mr * 0.2, mr * 0.25, mr * 0.2, 'rgba(170,175,185,0.35)'); ell(g, mx + mr * 0.25, my + mr * 0.3, mr * 0.18, mr * 0.15, 'rgba(170,175,185,0.3)');
  }
  if (o.sun) { addGlow(g, o.sun[0], o.sun[1], o.sun[2] * 8, 0.6); ell(g, o.sun[0], o.sun[1], o.sun[2], o.sun[2], '#fff2cc'); }
  if (o.clouds) {
    for (let i = 0; i < o.clouds; i++) {
      const x = ((hash1(i * 5) * W * 1.4 + (o.t || 0) * 8) % (W * 1.4)) - W * 0.2, y = hash1(i * 7) * hz * 0.55 + 40;
      g.fillStyle = o.cloudCol || 'rgba(160,170,190,0.12)';
      for (let k = 0; k < 6; k++) ell(g, x + k * 60, y + Math.sin(k) * 12, 110 - k * 6, 26, o.cloudCol || 'rgba(150,165,190,0.1)');
    }
  }
}
function groundFill(g, y, c1, c2) { g.fillStyle = lin(g, 0, y, 0, H, [[0, c1], [1, c2]]); g.fillRect(0, y, W, H - y); }

function treeline(g, y, col, seed = 1, amp = 60, step = 26, x0 = -50, x1 = W + 50) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x0, H); g.lineTo(x0, y);
  for (let x = x0; x <= x1; x += step) { const h = amp * (0.4 + 0.6 * noise1(x * 0.01, seed)) + amp * 0.3 * hash1(x + seed); g.quadraticCurveTo(x + step / 2, y - h * 1.2, x + step, y - h * 0.6 * noise1(x * 0.02 + 5, seed)); }
  g.lineTo(x1, H); g.closePath(); g.fill();
}
function bareTree(g, x, y, h, seed, col = '#0b0d14', w = 1) {
  const r = rng(seed);
  const br = (x0, y0, a, L, d) => {
    const x1 = x0 + Math.sin(a) * L, y1 = y0 - Math.cos(a) * L;
    g.lineWidth = Math.max(0.8, d * 2.4 * w * (h / 400)); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    if (d > 0) { const n = 2 + (r() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) br(x1, y1, a + (r() - 0.5) * 1.3, L * (0.62 + r() * 0.2), d - 1); }
  };
  g.strokeStyle = col; g.lineCap = 'round'; br(x, y, (r() - 0.5) * 0.15, h * 0.35, 6);
}
function mapleTree(g, x, y, h, seed, cols = ['#9a3b1a', '#c2641f', '#d99a2e', '#7a2a14'], dark = 0) {
  const r = rng(seed);
  g.fillStyle = mixHex('#3a2a20', '#0a0a10', dark); g.beginPath(); g.moveTo(x - h * 0.03, y); g.lineTo(x - h * 0.015, y - h * 0.5); g.lineTo(x + h * 0.015, y - h * 0.5); g.lineTo(x + h * 0.03, y); g.fill();
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * h * 0.33;
    const cx = x + Math.cos(a) * d * 1.1, cy = y - h * 0.62 + Math.sin(a) * d * 0.8;
    ell(g, cx, cy, h * (0.1 + r() * 0.08), h * (0.08 + r() * 0.06), mixHex(cols[i % cols.length], '#05060c', dark));
  }
}
/* tall dry grass: rows from far (y0) to near (y1) */
function grassField(g, y0, y1, t, o = {}) {
  const base = o.base || '#2a2c34', tip = o.tip || '#6a6a70', n = o.rows || 26;
  g.fillStyle = lin(g, 0, y0, 0, y1, [[0, o.far || base], [1, o.near || '#101218']]); g.fillRect(0, y0, W, H - y0);
  g.lineCap = 'round';
  for (let rI = 0; rI < n; rI++) {
    const k = rI / (n - 1); const yy = lerp(y0, y1, Math.pow(k, 1.6));
    const bh = lerp(6, o.nearH || 140, Math.pow(k, 2)); const step = lerp(5, 16, k);
    g.strokeStyle = mixHex(o.tipFar || tip, o.tipNear || '#2e2e36', k); g.lineWidth = lerp(0.8, 3, k);
    g.globalAlpha = 0.8;
    g.beginPath();
    for (let x = -20 + hash1(rI) * step; x < W + 20; x += step * (0.6 + hash1(x + rI) * 0.8)) {
      const sway = (o.still ? 0 : Math.sin(t * 1.2 + x * 0.01 + rI) * bh * 0.08) + (hash1(x * 3 + rI) - 0.5) * bh * 0.3;
      const hh = bh * (0.6 + hash1(x + rI * 7) * 0.6);
      g.moveTo(x, yy); g.quadraticCurveTo(x + sway * 0.3, yy - hh * 0.5, x + sway, yy - hh);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  if (o.frost) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lin(g, 0, y0, 0, y1, [[0, 'rgba(120,140,170,0.25)'], [1, 'rgba(120,140,170,0.1)']]); g.fillRect(0, y0, W, H - y0); g.restore(); }
}
function fence(g, pts, col = '#2a2420', hMul = 1, rail = true) {
  // pts: [[x,y,scale],...] posts
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    const [x, y, s] = pts[i];
    g.lineWidth = 9 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2 * s, y - 95 * s * hMul); g.stroke();
    if (rail && i < pts.length - 1) {
      const [x2, y2, s2] = pts[i + 1];
      [0.4, 0.78].forEach((f, k) => { g.lineWidth = 7 * (s + s2) / 2; g.beginPath(); g.moveTo(x, y - 95 * s * hMul * f); g.lineTo(x2, y2 - 95 * s2 * hMul * (f + (k ? -0.08 : 0.06))); g.stroke(); });
    }
  }
}
function jackOLantern(g, x, y, s, t, o = {}) {
  const lit = o.lit !== false, seed = o.seed || x;
  const f = lit ? flick(t, seed) : 0;
  if (lit) addGlow(g, x, y - s * 0.4, s * 3.2, 0.5 * f);
  const body = lit ? rad(g, x - s * 0.2, y - s * 0.6, s * 0.1, s * 1.1, [[0, '#e8883a'], [1, '#8a3a12']]) : rad(g, x - s * 0.2, y - s * 0.6, s * 0.1, s * 1.1, [[0, '#8a5a38'], [1, '#3a2016']]);
  g.fillStyle = body; g.beginPath(); g.ellipse(x, y - s * 0.45, s * 0.62, s * 0.47, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(60,25,10,0.4)'; g.lineWidth = s * 0.03; [-0.3, 0, 0.3].forEach(k => { g.beginPath(); g.ellipse(x + k * s * 0.6, y - s * 0.45, s * (0.3 - Math.abs(k) * 0.4), s * 0.46, 0, 0, TAU); g.stroke(); });
  g.fillStyle = '#3a4a22'; g.fillRect(x - s * 0.04, y - s * 1.0, s * 0.08, s * 0.14);
  const face = lit ? `rgba(255,${(200 + 40 * f) | 0},110,${0.95})` : 'rgba(20,10,8,0.9)';
  g.fillStyle = face;
  const v = o.face || (seed % 3 | 0);
  poly(g, [[x - s * 0.3, y - s * 0.55], [x - s * 0.12, y - s * 0.55], [x - s * 0.21, y - s * 0.72]]); g.fill();
  poly(g, [[x + s * 0.12, y - s * 0.55], [x + s * 0.3, y - s * 0.55], [x + s * 0.21, y - s * 0.72]]); g.fill();
  g.beginPath();
  if (v === 0) { g.moveTo(x - s * 0.35, y - s * 0.38); g.quadraticCurveTo(x, y - s * 0.12, x + s * 0.35, y - s * 0.38); g.quadraticCurveTo(x, y - s * 0.26, x - s * 0.35, y - s * 0.38); }
  else { g.moveTo(x - s * 0.32, y - s * 0.36); for (let k = 0; k <= 6; k++) g.lineTo(x - s * 0.32 + k * s * 0.107, y - s * (k % 2 ? 0.26 : 0.36)); g.quadraticCurveTo(x, y - s * 0.12, x - s * 0.32, y - s * 0.36); }
  g.fill();
  if (o.smoke) { for (let k = 0; k < 6; k++) glow(g, x + Math.sin(t * 0.8 + k) * s * 0.2 * k * 0.3, y - s * (1.1 + k * 0.35 + (t * 0.3 % 0.35)), s * (0.2 + k * 0.08), 0.12 * (1 - k / 6), SPR.fog); }
}
function porchLamp(g, x, y, s, t, a = 1) {
  if (a > 0) { addGlow(g, x, y, 420 * s, 0.55 * a * flick(t * 0.3, 7)); addGlow(g, x, y, 90 * s, 0.9 * a); }
  g.fillStyle = '#1a1614'; g.fillRect(x - 10 * s, y - 26 * s, 20 * s, 8 * s);
  g.fillStyle = a > 0 ? '#ffe3a0' : '#4a4640'; g.beginPath(); g.moveTo(x - 12 * s, y - 18 * s); g.lineTo(x + 12 * s, y - 18 * s); g.lineTo(x + 9 * s, y + 14 * s); g.lineTo(x - 9 * s, y + 14 * s); g.fill();
}

/* New England farmhouse, side-gabled with full-width front porch. (x,y) = bottom centre; s = width px */
function house(g, x, y, s, t, o = {}) {
  const u = s / 1000;
  const L = o.light || 'night';
  const wall = { night: '#7d8698', dusk: '#b9a8a8', day: '#ece8df', sunrise: '#e8d6c0', summer: '#f1ede4', overcast: '#d6d6d2', old: '#8a8274' }[L] || '#7d8698';
  const roof = { night: '#1d2130', dusk: '#302a36', day: '#3a3a40', sunrise: '#3a3440', summer: '#3a3a40', overcast: '#44464c', old: '#2a2622' }[L] || '#1d2130';
  const shutter = '#15161b';
  const top = y - 640 * u;
  // side ell
  g.fillStyle = mixHex(wall, '#000', 0.12); g.fillRect(x + 420 * u, y - 330 * u, 330 * u, 330 * u);
  g.fillStyle = roof; poly(g, [[x + 400 * u, y - 330 * u], [x + 770 * u, y - 330 * u], [x + 740 * u, y - 450 * u], [x + 430 * u, y - 450 * u]]); g.fill();
  // chimney
  g.fillStyle = '#4a2e28'; g.fillRect(x + 220 * u, top - 130 * u, 55 * u, 150 * u);
  // main block
  g.fillStyle = wall; g.fillRect(x - 450 * u, y - 560 * u, 900 * u, 560 * u);
  g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 2 * u; for (let k = 1; k < 28; k++) { g.beginPath(); g.moveTo(x - 450 * u, y - k * 20 * u); g.lineTo(x + 450 * u, y - k * 20 * u); g.stroke(); }
  g.fillStyle = roof; poly(g, [[x - 490 * u, y - 555 * u], [x + 490 * u, y - 555 * u], [x + 380 * u, top - 60 * u], [x - 380 * u, top - 60 * u]]); g.fill();
  // windows
  const win = (wx, wy, lit) => {
    g.fillStyle = shutter; g.fillRect(wx - 62 * u, wy, 28 * u, 150 * u); g.fillRect(wx + 34 * u, wy, 28 * u, 150 * u);
    g.fillStyle = lit ? `rgba(255,${190 + (lit * 30 | 0)},110,1)` : (L === 'day' || L === 'summer' ? '#3a4452' : '#10131c'); g.fillRect(wx - 30 * u, wy + 4 * u, 60 * u, 142 * u);
    g.strokeStyle = wall; g.lineWidth = 5 * u; g.beginPath(); g.moveTo(wx, wy + 4 * u); g.lineTo(wx, wy + 146 * u); g.moveTo(wx - 30 * u, wy + 75 * u); g.lineTo(wx + 30 * u, wy + 75 * u); g.stroke();
    if (lit) addGlow(g, wx, wy + 75 * u, 130 * u, 0.35 * lit);
  };
  const lw = o.windows || [0, 0, 0, 0, 0];
  [-280, 0, 280].forEach((wx, i) => win(x + wx * u, y - 520 * u, lw[i]));
  [-300, 300].forEach((wx, i) => win(x + wx * u, y - 290 * u, lw[3 + i]));
  // door
  g.fillStyle = '#1b1411'; g.fillRect(x - 45 * u, y - 280 * u, 90 * u, 250 * u);
  if (o.doorOpen) { g.fillStyle = 'rgba(255,200,120,0.95)'; g.fillRect(x - 40 * u, y - 275 * u, 70 * u, 245 * u); addGlow(g, x, y - 150 * u, 200 * u, 0.5); }
  // porch
  const py = y - 330 * u;
  g.fillStyle = roof; poly(g, [[x - 480 * u, py + 10 * u], [x + 480 * u, py + 10 * u], [x + 450 * u, py - 40 * u], [x - 450 * u, py - 40 * u]]); g.fill();
  g.fillStyle = mixHex(wall, '#000', 0.25); g.fillRect(x - 470 * u, y - 30 * u, 940 * u, 30 * u);
  g.fillStyle = wall; for (let k = 0; k < 6; k++) g.fillRect(x + (-460 + k * 184) * u, py + 10 * u, 16 * u, 310 * u);
  g.strokeStyle = wall; g.lineWidth = 6 * u; g.beginPath(); g.moveTo(x - 460 * u, y - 110 * u); g.lineTo(x - 70 * u, y - 110 * u); g.moveTo(x + 70 * u, y - 110 * u); g.lineTo(x + 460 * u, y - 110 * u); g.stroke();
  g.lineWidth = 3 * u; for (let k = -450; k < 450; k += 22) { if (Math.abs(k) < 75) continue; g.beginPath(); g.moveTo(x + k * u, y - 110 * u); g.lineTo(x + k * u, y - 32 * u); g.stroke(); }
  // swing
  g.strokeStyle = 'rgba(30,25,20,0.8)'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x - 380 * u, py + 12 * u); g.lineTo(x - 380 * u, y - 150 * u); g.moveTo(x - 220 * u, py + 12 * u); g.lineTo(x - 220 * u, y - 150 * u); g.stroke();
  g.fillStyle = '#5a4030'; g.fillRect(x - 390 * u, y - 155 * u, 180 * u, 16 * u); g.fillRect(x - 390 * u, y - 205 * u, 180 * u, 10 * u);
  // steps
  g.fillStyle = mixHex(wall, '#000', 0.35); for (let k = 0; k < 3; k++) g.fillRect(x - (80 + k * 12) * u, y + k * 16 * u - 20 * u, (160 + k * 24) * u, 16 * u);
  // porch light
  if (o.porchLight !== false && L !== 'day' && L !== 'summer') porchLamp(g, x + 80 * u, y - 260 * u, 1.3 * u * 1.6, t, o.porchLight === 0 ? 0 : 1);
  // pumpkins
  (o.pumpkins || []).forEach((p, i) => jackOLantern(g, x + p[0] * u, y + p[1] * u, (p[2] || 44) * u, t, { lit: o.pumpkinsLit !== false, seed: i * 13 + 5, smoke: o.smoke }));
}
