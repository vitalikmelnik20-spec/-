'use strict';
/* Reusable sets. Every set draws a full 1920x1080 frame for local time t. */
const LP = {
  porch: (dx = -1, k = 1) => ({ light: { x: dx, y: -0.7, c: `rgba(255,178,90,${0.5 * k})`, d: 'rgba(4,6,16,0.62)' }, amb: 'rgba(22,28,58,0.3)' }),
  moon: (dx = 1) => ({ light: { x: dx, y: -0.5, c: 'rgba(150,180,250,0.32)', d: 'rgba(2,4,14,0.72)' }, amb: 'rgba(18,26,64,0.5)' }),
  day: (dx = -1) => ({ light: { x: dx, y: -0.8, c: 'rgba(255,244,220,0.22)', d: 'rgba(0,0,0,0.28)' } }),
  lamp: (dx = -1) => ({ light: { x: dx, y: -0.3, c: 'rgba(255,190,110,0.42)', d: 'rgba(12,6,4,0.58)' }, amb: 'rgba(40,20,10,0.12)' }),
  soft: (dx = -1) => ({ light: { x: dx, y: -0.6, c: 'rgba(255,230,200,0.25)', d: 'rgba(10,8,8,0.4)' } }),
  dark: (dx = -1) => ({ light: { x: dx, y: -0.5, c: 'rgba(120,150,220,0.2)', d: 'rgba(0,0,6,0.8)' }, amb: 'rgba(10,14,34,0.6)' }),
};
function fig(g, f) { if (!f) return; person(g, f.x, f.y, f.h, f); }
function figs(g, list) { (list || []).forEach(f => fig(g, f)); }

/* ---- view from inside the open front door, onto the porch -------------- */
function porchDoor(g, t, o = {}) {
  const VP = [960, 520];
  sky(g, 'night', { horizon: 560, moon: o.moon === false ? null : [1380, 250, 34], t });
  treeline(g, 470, '#0b0f1a', 3, 70);
  for (let i = 0; i < 5; i++) bareTree(g, 380 + i * 300 + hash1(i) * 80, 520, 260 + hash1(i * 3) * 120, 40 + i, '#0a0d16');
  grassField(g, 520, 700, t, { base: '#1a2030', far: '#1a2232', near: '#0c1018', tipFar: '#3a4458', tipNear: '#1a2030', rows: 14, nearH: 40 });
  fogBand(g, 560, 70, t, o.fog == null ? 0.55 : o.fog, 2, 14);
  // porch ceiling
  g.fillStyle = lin(g, 0, 60, 0, 230, [[0, '#0e0c0c'], [1, '#2a2019']]); poly(g, [[0, 0], [W, 0], [W, 200], [1440, 215], [480, 215], [0, 200]]); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let k = -12; k <= 12; k++) { g.beginPath(); g.moveTo(VP[0] + k * 40, 215); g.lineTo(VP[0] + k * 160, 0); g.stroke(); }
  // porch floor
  const fl = lin(g, 0, 770, 0, H, [[0, '#3a2a1e'], [1, '#1a120c']]);
  g.fillStyle = fl; poly(g, [[0, 800], [W, 800], [W, H], [0, H]]); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2;
  for (let k = -30; k <= 30; k++) { g.beginPath(); g.moveTo(VP[0] + k * 20, 800); g.lineTo(VP[0] + k * 160, H + 300); g.stroke(); }
  // posts & railing
  const post = (x) => { g.fillStyle = '#8a8478'; g.fillRect(x - 16, 200, 32, 610); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 6, 200, 10, 610); };
  g.strokeStyle = '#7a7468'; g.lineWidth = 12; g.beginPath(); g.moveTo(300, 668); g.lineTo(800, 668); g.moveTo(1120, 668); g.lineTo(1620, 668); g.stroke();
  g.lineWidth = 6; for (let x = 310; x < 1620; x += 30) { if (x > 790 && x < 1130) continue; g.beginPath(); g.moveTo(x, 672); g.lineTo(x, 800); g.stroke(); }
  post(480); post(1440); post(800); post(1120);
  g.fillStyle = '#6a6458'; g.fillRect(300, 196, 1320, 22);
  // pumpkins by the steps
  if (o.pumpkins !== false) [[740, 820, 70], [1180, 822, 64], [640, 812, 48], [1290, 816, 52]].forEach((p, i) => jackOLantern(g, p[0], p[1], p[2], t, { lit: o.lit !== false, seed: i * 7 + 1, smoke: o.smoke }));
  // warm pool of porch light on the boards
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, 700, 820, 20, 700, [[0, `rgba(255,170,80,${0.28 * (o.lamp == null ? 1 : o.lamp)})`], [1, 'rgba(255,150,60,0)']]); g.fillRect(0, 600, W, H - 600); g.restore();
  figs(g, o.back); // figures behind (e.g. in the yard)
  figs(g, o.figures);
  if (o.lamp !== 0) porchLamp(g, 330, 330, 2.2, t, o.lamp == null ? 1 : o.lamp);
  leaves(g, t, o.leaves == null ? 8 : o.leaves, 0.8, 5, [300, 500, 1320, 580]);
  // door frame (dark interior)
  const jamb = '#2a1d15';
  g.fillStyle = lin(g, 0, 0, 300, 0, [[0, '#050404'], [1, '#110c0a']]); g.fillRect(0, 0, 300, H);
  g.fillStyle = lin(g, 1620, 0, W, 0, [[0, '#110c0a'], [1, '#050404']]); g.fillRect(1620, 0, W - 1620, H);
  g.fillStyle = '#0a0706'; g.fillRect(0, 0, W, 70);
  g.fillStyle = jamb; g.fillRect(262, 50, 42, H); g.fillRect(1616, 50, 42, H); g.fillRect(262, 50, 1396, 28);
  g.fillStyle = 'rgba(255,190,110,0.12)'; g.fillRect(262, 50, 8, H); g.fillRect(1650, 50, 8, H);
  // the door itself (open fraction)
  const op = o.door == null ? 1 : o.door;
  const fx = lerp(300, 1760, Ease.inOutSine(op));
  g.fillStyle = '#1e140f'; poly(g, [[1620, 70], [fx, 70 - (fx - 1620) * 0.06], [fx, H + (fx - 1620) * 0.1], [1620, H]]); g.fill();
  if (op < 1) { g.fillStyle = '#2a1c14'; g.fillRect(Math.min(fx, 1620), 70, Math.abs(1620 - fx), H); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 4; g.strokeRect(Math.min(fx, 1620) + 60, 160, Math.abs(1620 - fx) - 120, 300); }
  figs(g, o.front); // foreground (inside) figures
}

/* ---- the porch seen from the yard (frontal, medium) --------------------- */
function porchFront(g, t, o = {}) {
  const tod = o.tod || 'night', night = tod === 'night' || tod === 'dusk';
  const wall = night ? '#565e70' : '#e6e2d8';
  g.fillStyle = lin(g, 0, 0, 0, 840, [[0, mixHex(wall, '#000', 0.35)], [1, wall]]); g.fillRect(0, 0, W, 860);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 3; for (let y = 40; y < 840; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // window + door
  const wx = o.winX || 1300;
  g.fillStyle = '#15161b'; g.fillRect(wx - 190, 200, 60, 420); g.fillRect(wx + 130, 200, 60, 420);
  g.fillStyle = o.winLit === false ? '#141820' : 'rgba(255,196,116,1)'; g.fillRect(wx - 125, 210, 250, 400);
  if (o.winLit !== false) addGlow(g, wx, 420, 420, 0.35);
  g.strokeStyle = wall; g.lineWidth = 12; g.beginPath(); g.moveTo(wx, 210); g.lineTo(wx, 610); g.moveTo(wx - 125, 410); g.lineTo(wx + 125, 410); g.stroke();
  const dx = o.doorX || 520;
  g.fillStyle = '#1b1411'; g.fillRect(dx - 120, 180, 240, 660); g.fillStyle = '#2a1f18'; g.fillRect(dx - 100, 210, 200, 260); g.fillRect(dx - 100, 500, 200, 300);
  ell(g, dx + 80, 540, 9, 9, '#b08a4a');
  // porch floor & ceiling
  g.fillStyle = lin(g, 0, 840, 0, H, [[0, '#3c2c20'], [1, '#150e0a']]); g.fillRect(0, 840, W, H - 840);
  g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; for (let k = 0; k < 8; k++) { const y = 850 + k * k * 4 + k * 10; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = '#1c1a1e'; g.fillRect(0, 0, W, 40);
  const la = o.lamp == null ? 1 : o.lamp;
  if (night) porchLamp(g, dx + 200, 300, 2.4, t, la);
  if (o.swing) {
    const sx = o.swing;
    g.strokeStyle = 'rgba(40,34,28,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx - 260, 0); g.lineTo(sx - 250, 640); g.moveTo(sx + 260, 0); g.lineTo(sx + 250, 640); g.stroke();
    g.fillStyle = '#5a4030'; g.fillRect(sx - 280, 640, 560, 26); g.fillRect(sx - 280, 520, 560, 18); for (let k = 0; k < 9; k++) g.fillRect(sx - 270 + k * 66, 520, 10, 130);
    g.fillStyle = '#3a2a20'; g.fillRect(sx - 280, 664, 560, 12);
  }
  if (o.chair) { const cx = o.chair; g.fillStyle = '#4a3426'; g.fillRect(cx - 110, 560, 22, 300); g.fillRect(cx + 88, 560, 22, 300); g.fillRect(cx - 110, 700, 220, 22); for (let k = 0; k < 4; k++) g.fillRect(cx - 100 + k * 60, 560, 12, 140); g.fillRect(cx - 110, 550, 220, 16); }
  if (night && la > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, dx + 200, 300, 20, 1100, [[0, `rgba(255,170,80,${0.22 * la})`], [1, 'rgba(255,150,60,0)']]); g.fillRect(0, 0, W, H); g.restore(); }
  (o.pumpkins || []).forEach((p, i) => jackOLantern(g, p[0], p[1], p[2], t, { lit: p[3] != null ? p[3] : o.lit !== false, seed: i * 11 + 3, smoke: o.smoke }));
  figs(g, o.figures);
  // railing in the foreground
  if (o.rail !== false) {
    g.fillStyle = night ? '#5a5a5e' : '#d8d4ca'; g.fillRect(0, 880, W, 16);
    g.fillStyle = night ? '#4a4a50' : '#c8c4ba'; for (let x = 10; x < W; x += 44) { if (o.gap && x > o.gap[0] && x < o.gap[1]) continue; g.fillRect(x, 896, 14, 190); }
    g.fillStyle = night ? '#626268' : '#e0dcd2'; g.fillRect(0, 870, W, 12);
  }
  figs(g, o.front);
}

/* ---- the farmhouse exterior (wide) ------------------------------------ */
function houseExt(g, t, o = {}) {
  const tod = o.tod || 'night';
  const skyT = { night: 'night', dusk: 'dusk', day: 'day', sunrise: 'sunrise', summer: 'summer', overcast: 'overcast', old: 'night' }[tod];
  const hz = o.horizon || 760;
  sky(g, skyT, { horizon: hz, moon: o.moon, t, clouds: o.clouds || 0, cloudCol: tod === 'day' ? 'rgba(255,255,255,0.35)' : null });
  const dark = tod === 'night' || tod === 'old' ? 0.75 : tod === 'dusk' ? 0.45 : tod === 'sunrise' ? 0.3 : 0;
  treeline(g, hz - 30, mixHex('#3a4a3a', '#070a12', 0.2 + dark * 0.8), 7, 50);
  const hx = o.x || 960, hs = o.s || 900;
  const cols = o.season === 'summer' ? ['#3a6a2a', '#4a7a32', '#2e5a22', '#5a8a3a'] : o.season === 'bare' ? null : ['#9a3b1a', '#c2641f', '#d99a2e', '#7a2a14'];
  (o.trees || [[hx - hs * 0.85, hz + 40, 520], [hx + hs * 0.95, hz + 60, 600]]).forEach((tr, i) => cols ? mapleTree(g, tr[0], tr[1], tr[2], 30 + i, cols, dark) : bareTree(g, tr[0], tr[1], tr[2], 30 + i, mixHex('#2a2420', '#07080c', dark)));
  const gcol = { night: ['#1a2030', '#0a0d14'], dusk: ['#3a3040', '#141018'], day: ['#8a8a5a', '#5a5a3a'], sunrise: ['#6a5a4a', '#2a2420'], summer: ['#7a9a4a', '#4a6a2a'], overcast: ['#7a7a60', '#4a4a3a'], old: ['#1a1a1a', '#0a0a0a'] }[tod];
  grassField(g, hz, H, t, { far: gcol[0], near: gcol[1], tipFar: mixHex(gcol[0], '#fff', 0.15), tipNear: gcol[1], rows: 18, nearH: 70, frost: o.frost });
  if (o.houseOn !== false) house(g, hx, hz + hs * 0.2, hs, t, { light: tod === 'old' ? 'night' : tod, windows: o.windows, pumpkins: o.pumpkins, porchLight: o.porchLight, pumpkinsLit: o.pumpkinsLit, doorOpen: o.doorOpen });
  figs(g, o.figures);
  if (o.fog) fogBand(g, hz + 40, 90, t, o.fog, 9, 10);
  if (o.leaves) leaves(g, t, o.leaves, 0.9, 7);
  if (o.ghosts) o.ghosts.forEach(p => { fig(g, p); });
}

/* ---- the field behind the house -------------------------------------- */
function fieldScene(g, t, o = {}) {
  const tod = o.tod || 'night', hz = o.horizon || 600;
  sky(g, tod === 'summer' ? 'summer' : tod === 'day' ? 'overcast' : tod, { horizon: hz, moon: o.moon === false ? null : (o.moon || (tod === 'night' ? [1500, 190, 40] : null)), t, sun: o.sun });
  const dk = tod === 'night' ? 1 : tod === 'sunrise' ? 0.4 : 0;
  treeline(g, hz - 10, mixHex('#4a4a44', '#070a12', dk * 0.9 + 0.1), 11, 45);
  for (let i = 0; i < 9; i++) bareTree(g, 60 + i * 230 + hash1(i * 5) * 90, hz + 5, 180 + hash1(i) * 140, 60 + i, mixHex('#3a3632', '#080a10', dk * 0.9 + 0.1), 0.8);
  if (o.houseAt) house(g, o.houseAt[0], o.houseAt[1], o.houseAt[2], t, { light: tod === 'night' ? 'night' : tod, windows: o.houseWin || [0, 0, 0, 0.8, 0], pumpkins: o.housePumpkins, porchLight: o.housePorch });
  const pal = { night: ['#1c2436', '#0a0d15', '#4a5670', '#1a2232'], day: ['#8a8662', '#4e4a36', '#b8b088', '#6a6446'], sunrise: ['#8a6a48', '#2e2418', '#e0b070', '#5a4028'], summer: ['#b0a050', '#6a7a30', '#e8d890', '#8a8a40'] }[tod] || null;
  const p = pal || ['#1c2436', '#0a0d15', '#4a5670', '#1a2232'];
  grassField(g, hz, H, t, { far: p[0], near: p[1], tipFar: p[2], tipNear: p[3], rows: 30, nearH: o.nearH || 170, frost: o.frost, still: o.still });
  if (o.stones) o.stones.forEach(s => { g.fillStyle = '#6a6a64'; g.fillRect(s[0], s[1], s[2], s[2] * 0.3); });
  figs(g, o.behind);
  if (o.fence) fence(g, o.fence, tod === 'night' ? '#161a22' : '#3a3026');
  if (o.well) wellProp(g, o.well[0], o.well[1], o.well[2], t, o.wellOpen);
  figs(g, o.figures);
  (o.beams || []).forEach(b => beam(g, b[0], b[1], b[2], b[3], b[4] || 0.16, b[5] == null ? 0.6 : b[5]));
  if (o.fog !== 0) { fogBand(g, hz + 30, 70, t, o.fog == null ? 0.5 : o.fog, 4, 9); if (o.lowFog) fogBand(g, o.lowFog, 110, t, 0.45, 8, 6); }
  figs(g, o.front);
  if (o.breath) o.breath.forEach(b => { for (let k = 0; k < 4; k++) glow(g, b[0] + k * 10 + Math.sin(t + k) * 6, b[1] - k * 14 - (t * 12 % 14), 16 + k * 8, 0.2 * (1 - k / 4), SPR.fog); });
}
function wellProp(g, x, y, s, t, open) {
  // round stone well with rotting boards
  const r = 150 * s;
  g.fillStyle = '#2a2a2e'; g.beginPath(); g.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI); g.lineTo(x - r, y - 90 * s); g.ellipse(x, y - 90 * s, r, r * 0.35, 0, Math.PI, 0, true); g.closePath(); g.fill();
  const rs = rng(5);
  for (let row = 0; row < 4; row++) for (let k = 0; k < 9; k++) {
    const a = Math.PI * (k / 9 + (row % 2) * 0.055), ex = x - Math.cos(a) * r, ey = y - row * 22 * s + Math.sin(a) * r * 0.35;
    ell(g, ex, ey - 11 * s, 18 * s, 10 * s, mixHex('#5a5a5e', '#2a2a30', rs()));
  }
  if (!open) {
    for (let k = -3; k <= 3; k++) { g.save(); g.translate(x + k * 42 * s, y - 95 * s); g.rotate((rs() - 0.5) * 0.12); g.fillStyle = mixHex('#6a6660', '#3a3834', rs()); g.fillRect(-20 * s, -r * 0.34, 38 * s, r * 0.68); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.strokeRect(-20 * s, -r * 0.34, 38 * s, r * 0.68); g.restore(); }
  } else { ell(g, x, y - 92 * s, r * 0.85, r * 0.28, '#050506'); }
  // brambles
  g.strokeStyle = '#1a1c14'; g.lineWidth = 3 * s; for (let k = 0; k < 14; k++) { const bx = x + (rs() - 0.5) * r * 2.4; g.beginPath(); g.moveTo(bx, y + 10 * s); g.quadraticCurveTo(bx + (rs() - 0.5) * 80 * s, y - 60 * s, bx + (rs() - 0.5) * 120 * s, y - (40 + rs() * 90) * s); g.stroke(); }
}

/* ---- interiors ---------------------------------------------------------- */
function room(g, t, o = {}) {
  const wallC = o.wall || '#5a4636', floorY = o.floorY || 820;
  g.fillStyle = lin(g, 0, 0, 0, floorY, [[0, mixHex(wallC, '#000', 0.55)], [1, wallC]]); g.fillRect(0, 0, W, floorY);
  if (o.paper) { g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 3; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, floorY - 250); g.stroke(); } }
  g.fillStyle = mixHex(wallC, '#1a0e08', 0.5); g.fillRect(0, floorY - 250, W, 250);
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, floorY - 256, W, 8);
  g.fillStyle = lin(g, 0, floorY, 0, H, [[0, o.floor || '#3a2618'], [1, '#120a06']]); g.fillRect(0, floorY, W, H - floorY);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; for (let k = 0; k < 14; k++) { g.beginPath(); g.moveTo(960 + (k - 7) * 60, floorY); g.lineTo(960 + (k - 7) * 400, H); g.stroke(); }
  (o.windows || []).forEach(w => windowPane(g, t, w));
  if (o.door) { const d = o.door; g.fillStyle = '#1a120d'; g.fillRect(d[0] - 110, floorY - 560, 220, 560); g.fillStyle = '#281b13'; g.fillRect(d[0] - 90, floorY - 530, 180, 230); g.fillRect(d[0] - 90, floorY - 280, 180, 250); ell(g, d[0] + 70, floorY - 280, 8, 8, '#a8844a'); if (d[1]) { g.fillStyle = 'rgba(255,190,110,0.5)'; g.fillRect(d[0] - 110, floorY - 4, 220, 6); } }
  if (o.clock) wallClock(g, o.clock[0], o.clock[1], o.clock[2], o.clock[3] || [11, 47], t);
  if (o.lamp) { const l = o.lamp; addGlow(g, l[0], l[1], 700, 0.55); g.fillStyle = '#d8b88a'; poly(g, [[l[0] - 60, l[1] - 40], [l[0] + 60, l[1] - 40], [l[0] + 85, l[1] + 40], [l[0] - 85, l[1] + 40]]); g.fill(); }
  if (o.hanging) { const l = o.hanging; g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.moveTo(l[0], 0); g.lineTo(l[0], l[1] - 40); g.stroke(); addGlow(g, l[0], l[1], 800, 0.6); g.fillStyle = '#3a2a1a'; poly(g, [[l[0] - 30, l[1] - 40], [l[0] + 30, l[1] - 40], [l[0] + 110, l[1] + 20], [l[0] - 110, l[1] + 20]]); g.fill(); ell(g, l[0], l[1] + 22, 60, 12, '#ffe6b0'); }
}
function windowPane(g, t, w) {
  const [x, y, ww, hh, out] = w;
  g.fillStyle = '#1a120c'; g.fillRect(x - 16, y - 16, ww + 32, hh + 32);
  g.save(); g.beginPath(); g.rect(x, y, ww, hh); g.clip();
  if (out === 'night') { g.fillStyle = lin(g, 0, y, 0, y + hh, [[0, '#0a1020'], [1, '#1a2438']]); g.fillRect(x, y, ww, hh); glow(g, x + ww * 0.7, y + hh * 0.25, 60, 0.6, SPR.cool); treeline(g, y + hh * 0.75, '#05070c', 2, 30, 20, x, x + ww); }
  else if (out === 'field') { g.fillStyle = lin(g, 0, y, 0, y + hh, [[0, '#0a1020'], [0.6, '#1a2438'], [0.61, '#141a26'], [1, '#0a0e16']]); g.fillRect(x, y, ww, hh); ell(g, x + ww * 0.75, y + hh * 0.2, 16, 16, '#e8ecef'); addGlow(g, x + ww * 0.75, y + hh * 0.2, 80, 0.3, SPR.cool); fogBand(g, y + hh * 0.65, 30, t, 0.4, 3, 8, SPR.fog, x - 50, x + ww + 50); }
  else if (out === 'spring') { g.fillStyle = lin(g, 0, y, 0, y + hh, [[0, '#cfe0ea'], [1, '#e8eedc']]); g.fillRect(x, y, ww, hh); addGlow(g, x + ww / 2, y + hh / 2, ww, 0.25); }
  else if (out === 'day') { g.fillStyle = lin(g, 0, y, 0, y + hh, [[0, '#b8cadc'], [1, '#e8dcc0']]); g.fillRect(x, y, ww, hh); }
  else if (out === 'dusk') { g.fillStyle = lin(g, 0, y, 0, y + hh, [[0, '#2a2a44'], [1, '#c07a4a']]); g.fillRect(x, y, ww, hh); }
  g.restore();
  g.strokeStyle = '#1a120c'; g.lineWidth = 10; g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + hh); g.moveTo(x, y + hh / 2); g.lineTo(x + ww, y + hh / 2); g.stroke();
  if (w[5]) { g.fillStyle = 'rgba(230,220,200,0.35)'; g.fillRect(x - 30, y - 20, 70, hh + 40); g.fillRect(x + ww - 40, y - 20, 70, hh + 40); }
}
function wallClock(g, x, y, r, hm, t) {
  ell(g, x + r * 0.05, y + r * 0.08, r * 1.1, r * 1.1, 'rgba(0,0,0,0.35)');
  ell(g, x, y, r * 1.08, r * 1.08, '#3a2616'); ell(g, x, y, r * 0.95, r * 0.95, '#efe6cf');
  g.strokeStyle = '#2a2018'; g.lineCap = 'round';
  for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, big = k % 5 === 0; g.lineWidth = big ? r * 0.04 : r * 0.012; g.beginPath(); g.moveTo(x + Math.sin(a) * r * (big ? 0.76 : 0.84), y - Math.cos(a) * r * (big ? 0.76 : 0.84)); g.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); g.stroke(); }
  const [hh, mm] = hm; const sec = (t % 60);
  const ha = ((hh % 12) + mm / 60) / 12 * TAU, ma = (mm + sec / 60) / 60 * TAU, sa = sec / 60 * TAU;
  g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); g.stroke();
  g.lineWidth = r * 0.045; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ma) * r * 0.75, y - Math.cos(ma) * r * 0.75); g.stroke();
  g.strokeStyle = '#8a2a1a'; g.lineWidth = r * 0.015; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(sa) * r * 0.8, y - Math.cos(sa) * r * 0.8); g.stroke();
  ell(g, x, y, r * 0.05, r * 0.05, '#2a2018');
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.5, r * 0.25, -0.6, 0, TAU); g.fill();
}
function table(g, x, y, w, col = '#4a3020') { g.fillStyle = col; g.fillRect(x - w / 2, y, w, 26); g.fillStyle = mixHex(col, '#000', 0.3); g.fillRect(x - w / 2 + 30, y + 26, 22, H - y); g.fillRect(x + w / 2 - 52, y + 26, 22, H - y); }
function teacup(g, x, y, s = 1, steam = 0, t = 0) { ell(g, x, y + 10 * s, 44 * s, 10 * s, '#d8d0c4'); g.fillStyle = '#ece6da'; g.beginPath(); g.moveTo(x - 30 * s, y - 30 * s); g.lineTo(x + 30 * s, y - 30 * s); g.quadraticCurveTo(x + 28 * s, y + 6 * s, x, y + 6 * s); g.quadraticCurveTo(x - 28 * s, y + 6 * s, x - 30 * s, y - 30 * s); g.fill(); ell(g, x, y - 30 * s, 30 * s, 7 * s, '#7a4a2a');
  if (steam) for (let k = 0; k < 5; k++) glow(g, x + Math.sin(t * 1.5 + k) * 8 * s, y - (40 + k * 25 + (t * 20 % 25)) * s, (10 + k * 5) * s, steam * 0.25 * (1 - k / 5), SPR.fog); }
function kettle(g, x, y, s, steam, t) { g.fillStyle = '#3a3a40'; g.beginPath(); g.ellipse(x, y - 50 * s, 70 * s, 60 * s, 0, 0, TAU); g.fill(); g.fillRect(x - 70 * s, y - 50 * s, 140 * s, 50 * s); g.strokeStyle = '#2a2a2e'; g.lineWidth = 10 * s; g.beginPath(); g.arc(x, y - 110 * s, 45 * s, Math.PI, TAU); g.stroke(); g.beginPath(); g.moveTo(x + 60 * s, y - 50 * s); g.lineTo(x + 115 * s, y - 95 * s); g.stroke(); addGlow(g, x - 30 * s, y - 70 * s, 40 * s, 0.25); if (steam) for (let k = 0; k < 6; k++) glow(g, x + 120 * s + k * 12 * s + Math.sin(t * 2 + k) * 8, y - (100 + k * 26 + (t * 30 % 26)) * s, (14 + k * 7) * s, steam * 0.3 * (1 - k / 6), SPR.fog); }
function stove(g, x, y) { g.fillStyle = '#d8d0c0'; g.fillRect(x - 170, y - 300, 340, 300); g.fillStyle = '#2a2a2a'; g.fillRect(x - 170, y - 300, 340, 14); g.fillStyle = '#b8b0a0'; g.fillRect(x - 150, y - 250, 300, 200); g.fillStyle = '#1a1a1a'; [-100, -30, 40, 110].forEach(k => ell(g, x + k, y - 275, 10, 10, '#1a1a1a')); }

/* ---- other locations --------------------------------------------------- */
function church(g, t, o = {}) {
  const tod = o.tod || 'spring';
  sky(g, tod, { horizon: 700, t, clouds: 4, cloudCol: 'rgba(255,255,255,0.3)' });
  g.fillStyle = mixHex('#6a8a4a', '#2a2a2a', tod === 'overcast' ? 0.4 : 0); g.beginPath(); g.moveTo(0, 820); g.quadraticCurveTo(900, 560, W, 760); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  const cx = o.x || 1000, cy = o.y || 690, s = o.s || 1;
  g.fillStyle = '#f2f0ea'; g.fillRect(cx - 170 * s, cy - 260 * s, 340 * s, 260 * s);
  g.fillStyle = '#4a4a50'; poly(g, [[cx - 190 * s, cy - 255 * s], [cx + 190 * s, cy - 255 * s], [cx, cy - 400 * s]]); g.fill();
  g.fillStyle = '#f2f0ea'; g.fillRect(cx - 45 * s, cy - 520 * s, 90 * s, 280 * s); g.fillStyle = '#4a4a50'; poly(g, [[cx - 55 * s, cy - 515 * s], [cx + 55 * s, cy - 515 * s], [cx, cy - 690 * s]]); g.fill();
  g.fillStyle = '#2a2a30'; g.fillRect(cx - 40 * s, cy - 150 * s, 80 * s, 150 * s); [-110, 110].forEach(k => { g.fillStyle = '#3a4a5a'; g.fillRect(cx + k * s - 22 * s, cy - 210 * s, 44 * s, 110 * s); });
  g.fillStyle = '#d8d4c8'; for (let k = 0; k < 3; k++) g.fillRect(cx - (60 + k * 14) * s, cy + k * 12 * s, (120 + k * 28) * s, 12 * s);
  (o.blossom ? [[300, 800, 360], [1650, 780, 400], [560, 760, 260]] : []).forEach((tr, i) => mapleTree(g, tr[0], tr[1], tr[2], 90 + i, ['#e8c8d0', '#f0dce0', '#d8a8b8', '#c8d8a8']));
  if (o.cars) for (let k = 0; k < o.cars; k++) { const x = 120 + k * 150, y = 880 + (k % 2) * 30; g.fillStyle = ['#5a2a2a', '#2a3a5a', '#3a3a3a', '#6a6a60', '#2a4a3a'][k % 5]; g.beginPath(); g.roundRect(x, y - 40, 130, 40, 10); g.fill(); g.beginPath(); g.roundRect(x + 25, y - 70, 75, 34, 10); g.fill(); ell(g, x + 28, y, 14, 14, '#111'); ell(g, x + 102, y, 14, 14, '#111'); }
  figs(g, o.figures);
}
function cemetery(g, t, o = {}) {
  sky(g, o.tod || 'lateafternoon', { horizon: 640, t, clouds: 3, cloudCol: 'rgba(255,230,200,0.2)' });
  treeline(g, 620, '#3a3024', 21, 50);
  g.fillStyle = lin(g, 0, 600, 0, H, [[0, '#5a5030'], [1, '#2a2416']]); g.beginPath(); g.moveTo(0, 700); g.quadraticCurveTo(960, 560, W, 680); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  [[200, 700, 560, 1], [1720, 680, 620, 2], [1400, 640, 380, 3]].forEach(tr => mapleTree(g, tr[0], tr[1], tr[2], 70 + tr[3], ['#b8401a', '#d88a2a', '#8a2a12', '#e0a83a'], 0.1));
  const r = rng(12);
  for (let k = 0; k < 16; k++) { const x = 100 + r() * 1700, y = 700 + r() * 250, s = 0.5 + (y - 700) / 250; if (o.clear && Math.abs(x - o.clear) < 260) continue; headstone(g, x, y, s * 60, r); }
  if (o.path) { g.fillStyle = 'rgba(120,90,60,0.5)'; g.beginPath(); g.moveTo(860, 640); g.lineTo(1060, 640); g.lineTo(1400, H); g.lineTo(520, H); g.fill(); }
  figs(g, o.figures);
  leaves(g, t, 14, 0.9, 9);
}
function headstone(g, x, y, s, r) { g.fillStyle = mixHex('#8a8a86', '#5a5a58', r ? r() : 0.5); g.beginPath(); g.moveTo(x - s * 0.4, y); g.lineTo(x - s * 0.4, y - s * 0.8); g.quadraticCurveTo(x, y - s * 1.2, x + s * 0.4, y - s * 0.8); g.lineTo(x + s * 0.4, y); g.fill(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + s * 0.25, y - s * 0.85, s * 0.15, s * 0.85); }
function winterScene(g, t, o = {}) {
  sky(g, 'winter', { horizon: 640, t });
  treeline(g, 620, '#5a6068', 4, 40);
  g.fillStyle = lin(g, 0, 600, 0, H, [[0, '#dfe4ea'], [1, '#b8c0ca']]); g.fillRect(0, 600, W, H);
  (o.houses || [[1300, 640, 360], [1700, 620, 260], [500, 630, 300]]).forEach((hh, i) => { const [x, y, s] = hh; g.fillStyle = ['#c8c0b0', '#a84a3a', '#d8d4c8'][i % 3]; g.fillRect(x - s / 2, y - s * 0.55, s, s * 0.55); g.fillStyle = '#f4f6f8'; poly(g, [[x - s * 0.58, y - s * 0.52], [x + s * 0.58, y - s * 0.52], [x, y - s * 0.95]]); g.fill(); g.fillStyle = '#3a3a3a'; g.fillRect(x + s * 0.2, y - s * 0.95, s * 0.08, s * 0.25); for (let k = 0; k < 5; k++) glow(g, x + s * 0.24 + k * 10, y - s * (1.0 + k * 0.1) - (t * 10 % 20), 20 + k * 8, 0.25, SPR.fog); g.fillStyle = 'rgba(255,210,140,0.9)'; g.fillRect(x - s * 0.3, y - s * 0.4, s * 0.12, s * 0.14); });
  for (let i = 0; i < 10; i++) bareTree(g, 80 + i * 200 + hash1(i) * 60, 650 + hash1(i * 2) * 60, 200 + hash1(i * 3) * 120, 200 + i, '#2a2a30', 0.8);
  if (o.road) { g.fillStyle = '#8a8e96'; g.beginPath(); g.moveTo(900, 620); g.lineTo(1000, 620); g.lineTo(1500, H); g.lineTo(400, H); g.fill(); g.fillStyle = 'rgba(240,244,248,0.7)'; g.fillRect(400, H - 30, 1100, 30); }
  if (o.fence) fence(g, o.fence, '#3a3430');
  figs(g, o.figures);
  // snowfall
  for (let i = 0; i < 90; i++) { const x = (hash1(i) * W + Math.sin(t + i) * 30) % W, y = (hash1(i * 3) * H + t * (40 + hash1(i * 5) * 40)) % H; ell(g, x, y, 2.5, 2.5, 'rgba(255,255,255,0.8)'); }
}
