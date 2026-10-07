'use strict';
/* ---------------------------------------------------------------------------
 * Chicago — the REAL cost of living (40 s, 1080x1920, 30 fps).
 * Scene windows are fixed by the edit; every price lands on the moment the
 * narrator says it (cues measured from the actual voice-over, timeline.json).
 * Text lives in the Shorts safe zone: y 240–1480, x 60–1020 (nothing vital on the right edge low down).
 * ------------------------------------------------------------------------- */
let SC = { hook: 0, rent: 3, food: 8, eat: 13, transit: 18, util: 23, total: 28, payoff: 34, cta: 37 };
let CUE = {}, VOICE = {}, DURS = {}, LINES = {};
const KEYS = ['hook', 'rent', 'food', 'eat', 'transit', 'util', 'total', 'payoff', 'cta'];
const FREEZE = 39.5; // final half-second hold

const money = v => '$' + Math.round(v).toLocaleString('en-US');
const easeLand = u => Ease.outCubic(u);

/* ---------------- typography ---------------- */
function bigText(g, str, x, y, size, o = {}) {
  setText(g, (o.font || FONT.black)(size), o.spacing || 0, o.align || 'center', 'alphabetic');
  g.save();
  g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = size * 0.25; g.shadowOffsetY = size * 0.06;
  g.lineWidth = size * (o.stroke == null ? 0.1 : o.stroke); g.strokeStyle = 'rgba(6,9,20,0.9)';
  if (g.lineWidth > 0) g.strokeText(str, x, y);
  g.shadowColor = 'transparent';
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * 0.35; }
  g.fillStyle = o.color || COL.white; g.fillText(str, x, y);
  g.restore();
}
function fitSize(g, str, fontFn, size, maxW) { setText(g, fontFn(size), 0); const w = g.measureText(str).width; return w > maxW ? Math.floor(size * maxW / w) : size; }
/* slam-in: scale overshoot + fade, p in 0..1 */
function slam(g, str, x, y, size, p, o = {}) {
  if (p <= 0) return;
  const e = Ease.outBack(clamp(p)), s = lerp(o.from || 1.7, 1, Ease.outExpo(clamp(p)));
  const sz = fitSize(g, str, o.font || FONT.black, size, o.maxW || 940);
  g.save(); g.globalAlpha *= clamp(p * 3); g.translate(x, y); g.scale(s * (0.94 + 0.06 * e), s * (0.94 + 0.06 * e)); g.rotate((o.rot || 0) * (1 - Ease.outExpo(clamp(p))));
  bigText(g, str, 0, 0, sz, o); g.restore();
}
function chip(g, str, x, y, size, bg, fg, p = 1, o = {}) {
  if (p <= 0) return;
  setText(g, (o.font || FONT.xbold)(size), o.spacing == null ? 2 : o.spacing, 'center', 'middle');
  const w = g.measureText(str).width + size * 1.3, h = size * 1.75, e = Ease.outBack(clamp(p));
  g.save(); g.globalAlpha *= clamp(p * 3); g.translate(x, y); g.scale(e, e);
  shadow(g, 24, 8, 0.35); g.fillStyle = bg; rr(g, -w / 2, -h / 2, w, h, h / 2); g.fill(); noShadow(g);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = 3; g.stroke(); }
  g.fillStyle = fg; g.fillText(str, 0, size * 0.04); g.restore();
  return w;
}
/* the price block used by every category: label chip, big counter, unit, footnote */
function priceBlock(g, t, o) {
  const { label, value, unit, tilde = true, t0, t1, color = COL.green, y = 650, foot, footT, size = 200 } = o;
  chip(g, label, 540, y - 222, 52, 'rgba(255,255,255,0.95)', '#0A0F1E', prog(t, o.labelT, o.labelT + 0.3));
  if (t >= t0) {
    const u = prog(t, t0, t1), v = u >= 1 ? value : value * easeLand(u);
    const land = t >= t1 ? 1 + 0.12 * Math.exp(-(t - t1) * 9) : 1;
    const str = (tilde ? '~' : '') + (o.fmt ? o.fmt(v, u) : money(v));
    g.save(); g.translate(540, y); g.scale(land, land);
    bigText(g, str, 0, 0, fitSize(g, str, FONT.black, size, 940), { color: u >= 1 ? color : COL.white, glow: u >= 1 ? (color === COL.green ? 'rgba(43,227,139,0.7)' : 'rgba(255,120,40,0.7)') : null, stroke: 0.07 });
    g.restore();
    if (unit) slam(g, unit, 540, y + 100, 64, prog(t, t1 - 0.05, t1 + 0.25), { font: FONT.xbold, color: COL.white, from: 1.4 });
  }
  if (foot) chip(g, foot, 540, y + 190, 34, 'rgba(10,15,30,0.78)', 'rgba(255,255,255,0.92)', prog(t, footT, footT + 0.3), { font: FONT.semi, spacing: 1, border: 'rgba(255,255,255,0.18)' });
  if (o.foot2) chip(g, o.foot2, 540, y + 258, 30, 'rgba(10,15,30,0.7)', 'rgba(255,255,255,0.8)', prog(t, o.foot2T, o.foot2T + 0.3), { font: FONT.med, spacing: 1 });
}
function scrimTop(g, h = 900, a = 0.55) { g.fillStyle = lin(g, 0, 0, 0, h, [[0, `rgba(5,8,18,${a})`], [0.7, `rgba(5,8,18,${a * 0.6})`], [1, 'rgba(5,8,18,0)']]); g.fillRect(0, 0, W, h); }
function floaters(g, t, n, seed, a = 0.25, colr = '43,227,139') { // drifting $ glyphs / digits for depth
  g.save(); setText(g, FONT.black(40), 0, 'center', 'middle');
  for (let i = 0; i < n; i++) {
    const s = seed * 100 + i, d = 0.4 + hash1(s * 1.7) * 0.9, x = hash1(s) * W + Math.sin(t * 0.7 + i) * 30;
    const y = ((hash1(s * 2.3) * H - t * 60 * d) % H + H) % H;
    g.globalAlpha = a * d; g.font = FONT.black(28 + 50 * d); g.fillStyle = `rgb(${colr})`; g.fillText(i % 3 ? '$' : String((i * 7) % 10), x, y);
  }
  g.restore();
}

/* ---------------- scenes ---------------- */
function S_hook(g, t) {
  skyBg(g, 'golden', t, { horizon: 1300 });
  glow(g, 300, 1120, 520, 0.8, SPRITE_ORANGE); glow(g, 300, 1120, 160, 0.9, SPRITE_WHITE);
  const rush = Ease.inOutCubic(prog(t, 0, 3.0));
  const horizon = lerp(1180, 1240, rush);
  // aerial street grid rushing toward the camera
  g.fillStyle = lin(g, 0, horizon, 0, H, [[0, '#2A2440'], [1, '#0D0B18']]); g.fillRect(0, horizon, W, H - horizon);
  g.save(); g.beginPath(); g.rect(0, horizon, W, H - horizon); g.clip();
  const vx = 540, spd = 1.2 + 6 * rush;
  for (let i = -14; i <= 14; i++) { g.strokeStyle = 'rgba(255,190,120,0.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(vx + i * 26, horizon); g.lineTo(vx + i * 420, H); g.stroke(); }
  for (let k = 0; k < 18; k++) {
    const z = ((k - t * spd) % 18 + 18) % 18 + 0.35, y = horizon + 520 / z;
    if (y > H) continue;
    g.strokeStyle = `rgba(255,190,120,${clamp(0.45 / z + 0.05)})`; g.lineWidth = 2 + 4 / z; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  for (let i = 0; i < 40; i++) { // traffic lights streaming
    const lane = (i % 13) - 6, z = ((hash1(i) * 10 - t * spd * 1.3) % 10 + 10) % 10 + 0.3;
    const y = horizon + 520 / z, x = vx + lane * 420 * (y - horizon) / (H - horizon) + lane * 26 * (1 - (y - horizon) / (H - horizon));
    glow(g, x, y, 6 + 40 / z, 0.7, i % 3 ? SPRITE_ORANGE : SPRITE_WHITE);
  }
  g.restore();
  // skyline approaching
  skyline(g, 'golden', 560 - rush * 60, horizon + 8, lerp(0.6, 1.08, rush), t, { depth: 0.25 * rush, par: [0.6, 1, 1.5] });
  g.fillStyle = lin(g, 0, horizon - 200, 0, horizon + 20, [[0, 'rgba(255,170,110,0)'], [1, 'rgba(255,170,110,0.25)']]); g.fillRect(0, horizon - 200, W, 220);
  scrimTop(g, 1100, 0.45);
  // money burst
  for (let i = 0; i < 8; i++) {
    const t0 = 0.9 + i * 0.12, u = prog(t, t0, t0 + 1.2); if (u <= 0 || u >= 1) continue;
    const an = -Math.PI / 2 + (i - 3.5) * 0.42, d = 120 + 520 * Ease.outCubic(u);
    dollarCoin(g, 540 + Math.cos(an) * d, 1000 + Math.sin(an) * d * 0.7, 46 * Ease.outBack(clamp(u * 4)) * (1 - u * 0.3), 1 - Ease.inQuad(u));
  }
  for (let i = 0; i < 4; i++) { // bills flying past the camera
    const u = prog(t, 1.4 + i * 0.28, 2.6 + i * 0.28); if (u <= 0 || u >= 1) continue;
    banknote(g, lerp(-200 + i * 300, 1300 - i * 200, u), lerp(1500 - i * 120, 1050 - i * 60, u), 1.6 - i * 0.2, -0.4 + u * 1.2 + i, u * 6 + i);
  }
  slam(g, 'COULD YOU', 540, 560, 120, prog(t, 0.15, 0.45), { from: 2.2 });
  slam(g, 'AFFORD', 540, 740, 200, prog(t, 0.4, 0.7), { color: COL.gold, from: 2.4, glow: 'rgba(255,170,60,0.6)' });
  slam(g, 'CHICAGO?', 540, 900, 170, prog(t, 0.65, 0.95), { from: 2.4, rot: -0.06 });
}

function S_rent(g, t) {
  const lt = t - SC.rent, cue = CUE['rent.price'];
  skyBg(g, 'golden', t, { horizon: 1500 });
  skyline(g, 'golden', 520 + lt * 14, 1640, 0.62, t, { near: false });
  g.fillStyle = 'rgba(30,24,50,0.35)'; g.fillRect(0, 0, W, H); // haze = shallow depth of field
  // street
  g.fillStyle = lin(g, 0, 1500, 0, H, [[0, '#2B2B38'], [1, '#121219']]); g.fillRect(0, 1500, W, H - 1500);
  const open = Ease.outBack(prog(lt, 0.7, 1.3));
  const zoom = lerp(0.74, 1.5, Ease.inOutCubic(prog(lt, 1.2, 2.4))) + lt * 0.015;
  const base = lerp(1720, 2420, Ease.inOutCubic(prog(lt, 1.2, 2.4)));
  apartment(g, 540, base, zoom, open, t);
  scrimTop(g, 960, 0.6);
  floaters(g, t, 10, 3, 0.18);
  priceBlock(g, t, {
    label: 'RENT · 1-BEDROOM', labelT: SC.rent + 0.1, value: 2457, unit: '/MONTH', t0: SC.rent + 1.2, t1: cue + 0.2, color: COL.orange,
    foot: 'Average asking rent · citywide', footT: cue + 0.45, foot2: 'Varies a lot by neighborhood', foot2T: cue + 0.9,
  });
}

function S_food(g, t) {
  const lt = t - SC.food, cue = CUE['food.price'];
  aisle(g, t, 0.9 + 2.5 * (1 - prog(lt, 0, 0.8)));
  g.fillStyle = 'rgba(8,12,24,0.25)'; g.fillRect(0, 0, W, H);
  scrimTop(g, 1000, 0.7);
  const cx = lerp(-400, 540, Ease.outBack(prog(lt, 0.05, 0.6))) + Math.sin(lt * 2) * 30 + lt * 6, cy = 1500;
  const bob = Math.abs(Math.sin(lt * 9)) * 6 * (1 - prog(lt, 0.6, 1.2) * 0.6);
  // items arc into the cart one after another
  const t0s = ITEMS.map((_, i) => 0.55 + i * 0.36);
  ITEMS.forEach((k, i) => {
    const u = prog(lt, t0s[i], t0s[i] + 0.45);
    const tx = cx - 120 + (i % 4) * 75, ty = cy - 210 - Math.floor(i / 4) * 40 + bob;
    if (u <= 0) return;
    const sx = i % 2 ? 1250 : -170, sy = 300 + (i % 3) * 120;
    const x = lerp(sx, tx, u), y = lerp(sy, ty, u) - Math.sin(u * Math.PI) * 300;
    item(g, k, x, y, lerp(1.25, 0.82, u), (1 - u) * (i % 2 ? -3 : 3));
    // price-tag style label pops at landing (item names only — no invented prices)
    const tp = prog(lt, t0s[i] + 0.45, t0s[i] + 0.6) * (1 - prog(lt, t0s[i] + 1.2, t0s[i] + 1.45));
    if (tp > 0) chip(g, k.toUpperCase(), tx + 30, ty - 120, 30, '#FFC857', '#1A1200', tp, { font: FONT.black });
  });
  cart(g, cx, cy + bob, 1.05, lt);
  priceBlock(g, t, {
    label: 'GROCERIES · FOOD', labelT: SC.food + 0.1, value: 386, unit: '/MONTH', t0: cue - 0.75, t1: cue + 0.2,
    foot: '1 adult estimate', footT: cue + 0.4,
  });
}

function S_eat(g, t) {
  const lt = t - SC.eat;
  // top: restaurant (warm) / bottom: coffee shop (cool), split by a glowing diagonal
  const mid = 980;
  g.fillStyle = lin(g, 0, 0, 0, mid, [[0, '#2A1206'], [1, '#5A2A12']]); g.fillRect(0, 0, W, mid + 60);
  for (let i = 0; i < 16; i++) glow(g, hash1(i) * W + Math.sin(t + i) * 20, 120 + hash1(i * 3) * 600, 40 + hash1(i * 5) * 90, 0.35, SPRITE_ORANGE);
  g.fillStyle = lin(g, 0, 700, 0, mid, [[0, '#6B3A1E'], [1, '#3A1E0E']]); g.fillRect(0, 760, W, mid - 700);
  g.save(); g.beginPath(); g.moveTo(0, mid + 40); g.lineTo(W, mid - 40); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
  g.fillStyle = lin(g, 0, mid, 0, H, [[0, '#0E2A2E'], [1, '#06161A']]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) glow(g, hash1(i * 9) * W, mid + 80 + hash1(i * 4) * 800, 40 + hash1(i * 2) * 80, 0.25, SPRITE_WHITE);
  g.fillStyle = lin(g, 0, 1500, 0, H, [[0, '#4A3426'], [1, '#2A1C14']]); g.fillRect(0, 1560, W, H);
  g.restore();
  g.save(); g.strokeStyle = 'rgba(255,200,120,0.9)'; g.lineWidth = 6; g.shadowColor = 'rgba(255,170,60,0.9)'; g.shadowBlur = 30;
  g.beginPath(); g.moveTo(0, mid + 40); g.lineTo(W, mid - 40); g.stroke(); g.restore();
  // plate slides in, coffee spins in
  const pu = Ease.outBack(prog(lt, 0.15, 0.7));
  plate(g, lerp(-500, 540, pu), 800 + Math.sin(t * 2) * 6, 1.15, t);
  const cu = prog(lt, 2.7, 3.4);
  if (cu > 0) coffee(g, lerp(1500, 560, Ease.outBack(cu)), 1690 + Math.sin(t * 2.4) * 5, 1.05, t, (1 - Ease.outCubic(cu)) * 6);
  const mc = CUE['eat.meal'], cc = CUE['eat.coffee'];
  chip(g, 'EATING OUT · CASUAL MEAL', 540, 430, 44, 'rgba(255,255,255,0.95)', '#2A1206', prog(t, SC.eat + 0.3, SC.eat + 0.6));
  if (t >= mc - 0.5) {
    const u = prog(t, mc - 0.5, mc + 0.15), land = t >= mc + 0.15 ? 1 + 0.14 * Math.exp(-(t - mc - 0.15) * 9) : 1;
    g.save(); g.translate(540, 610); g.scale(land, land); bigText(g, '~' + money(u >= 1 ? 20 : 20 * easeLand(u)), 0, 0, 190, { color: u >= 1 ? COL.green : COL.white, glow: u >= 1 ? 'rgba(43,227,139,0.7)' : null, stroke: 0.07 }); g.restore();
  }
  chip(g, 'COFFEE · CAPPUCCINO', 540, 1110, 40, 'rgba(255,255,255,0.95)', '#06161A', prog(t, cc - 1.0, cc - 0.7));
  if (t >= cc - 0.45) {
    const u = prog(t, cc - 0.45, cc + 0.15), land = t >= cc + 0.15 ? 1 + 0.14 * Math.exp(-(t - cc - 0.15) * 9) : 1;
    const v = u >= 1 ? '~$5.51' : '~$' + (5.51 * easeLand(u)).toFixed(2);
    g.save(); g.translate(540, 1300); g.scale(land, land); bigText(g, v, 0, 0, 190, { color: u >= 1 ? COL.green : COL.white, glow: u >= 1 ? 'rgba(43,227,139,0.7)' : null, stroke: 0.07 }); g.restore();
  }
}

function S_transit(g, t) {
  const lt = t - SC.transit, cue = CUE['transit.price'];
  skyBg(g, 'dusk', t, { horizon: 1300 });
  skyline(g, 'dusk', 540 - lt * 30, 1320, 0.78, t, {});
  g.fillStyle = lin(g, 0, 1300, 0, H, [[0, '#121A30'], [1, '#070A14']]); g.fillRect(0, 1300, W, H - 1300);
  const ey = 1180;
  elevated(g, ey, t, -lt * 120);
  // train: first pass accelerates across, a second one rolls by later
  const p1 = Ease.inCubic(prog(lt, 0.05, 1.9)), x1 = lerp(-1900, 1300, p1);
  const ghost = (x, n, dx) => { for (let k = n; k >= 0; k--) { g.globalAlpha = k ? 0.12 : 1; train(g, x - k * dx, ey - 12, 1, t); } g.globalAlpha = 1; };
  if (lt < 2.0) ghost(x1, 5, 40 * p1);
  const p2 = prog(lt, 2.6, 5.2); if (p2 > 0) ghost(lerp(1200, -1900, p2), 3, 18);
  // light streaks for speed
  if (lt < 2) for (let i = 0; i < 10; i++) { const y = ey - 140 + hash1(i) * 130, xs = ((hash1(i * 5) * W + lt * 2600) % (W + 400)) - 200; g.fillStyle = `rgba(255,255,255,${0.25 * p1})`; g.fillRect(xs, y, 160 + 200 * p1, 3); }
  scrimTop(g, 1000, 0.6);
  // commuter taps the phone on a fare reader
  const ph = Ease.outCubic(prog(lt, 1.7, 2.5)), tap = prog(t, cue - 0.35, cue - 0.1);
  const ok = prog(t, cue - 0.1, cue + 0.15);
  if (ph > 0) {
    g.save(); g.globalAlpha = ph; g.fillStyle = 'rgba(5,8,18,0.45)'; g.fillRect(0, 900, W, 1020); g.restore();
    reader(g, 720, lerp(1900, 1250, ph), 1.0, ok, t);
    const px = lerp(-200, lerp(330, 560, Ease.inOutCubic(tap)), ph), py = lerp(1900, lerp(1260, 1200, tap), ph);
    phone(g, px, py, 0.9, lerp(-0.35, -0.12, tap), gg => {
      gg.fillStyle = lin(gg, -80, -60, 80, 60, [[0, '#2F6FD6'], [1, '#14328A']]); rr(gg, -80, -70, 160, 100, 12); gg.fill();
      gg.fillStyle = 'rgba(255,255,255,0.8)'; gg.fillRect(-64, -50, 40, 26); setText(gg, FONT.bold(20), 1, 'center', 'middle'); gg.fillText('TRANSIT', 0, 60);
    });
    if (ok > 0) for (let k = 0; k < 3; k++) { const r = 40 + ((t - cue) * 300 + k * 60) % 200; g.strokeStyle = `rgba(43,227,139,${clamp(1 - r / 240) * ok})`; g.lineWidth = 6; g.beginPath(); g.arc(720, 1150, r, 0, TAU); g.stroke(); }
  }
  priceBlock(g, t, {
    label: 'CTA 30-DAY PASS', labelT: SC.transit + 0.1, value: 85, unit: 'PER MONTH', tilde: false, t0: cue - 0.4, t1: cue + 0.15,
    fmt: (v, u) => u >= 1 ? '$85' : '$' + String(10 + Math.floor(hash1(Math.floor(t * 30)) * 89)), // digital scramble, then lock
    foot: 'Regular fare pass', footT: cue + 0.4,
  });
  if (ok > 0) chip(g, 'PAID', 720, 1030, 40, COL.green, '#06120C', ok, { font: FONT.black });
}

function S_util(g, t) {
  const lt = t - SC.util, c1 = CUE['util.price'], c2 = CUE['util.internet'];
  skyBg(g, 'night', t, { horizon: 1400 });
  skyline(g, 'night', 540, 1400, 0.6, t, { near: false });
  g.fillStyle = 'rgba(6,10,22,0.45)'; g.fillRect(0, 0, W, H);
  const bc = { x: 540, y: 760 };
  apartment(g, bc.x, 1010, 0.46 + lt * 0.01, 1, t, { night: true });
  const ic = [['bolt', '#FFC857'], ['flame', '#FF8A1F'], ['drop', '#5AB4FF'], ['wifi', '#2BE38B'], ['phone', '#FFFFFF']];
  ic.forEach(([k, c], i) => {
    const p = Ease.outBack(prog(lt, 0.2 + i * 0.16, 0.55 + i * 0.16)); if (p <= 0) return;
    const an = i / ic.length * TAU + lt * 0.7, R = 300 + 20 * Math.sin(lt * 2 + i);
    icon(g, k, bc.x + Math.cos(an) * R, bc.y + Math.sin(an) * R * 0.75, 56 * p, c);
  });
  // bills slide in and stack, then a running total
  const b1 = prog(t, c1 - 0.25, c1 + 0.15), b2 = prog(t, c2 - 0.25, c2 + 0.15);
  if (b1 > 0) bill(g, lerp(1500, 540, Ease.outBack(b1)), 1130, 900, 180, lerp(0.2, -0.02, b1), 1, 'UTILITIES', '~$186', ['bolt', 'flame', 'drop'], '#FF8A1F');
  if (b2 > 0) bill(g, lerp(-500, 540, Ease.outBack(b2)), 1330, 900, 180, lerp(-0.2, 0.02, b2), 1, 'INTERNET + PHONE', '~$131', ['wifi', 'phone'], '#2BE38B');
  const tp = prog(t, c2 + 0.6, c2 + 0.9);
  if (tp > 0) chip(g, 'TOGETHER ≈ $317 / MONTH', 540, 1462, 40, COL.white, '#0A0F1E', tp, { font: FONT.black });
  slam(g, 'MONTHLY BILLS', 540, 440, 96, prog(lt, 0.05, 0.35), { from: 2 });
}

const BUDGET = [['RENT', 2457], ['FOOD', 386], ['TRANSIT', 85], ['UTILITIES', 186], ['INTERNET + PHONE', 131]];
function S_total(g, t) {
  const lt = t - SC.total, cue = CUE['total.price'];
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#060A16'], [1, '#0C1428']]); g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(43,227,139,0.06)'; g.lineWidth = 2; // subtle data grid
  for (let x = ((lt * 40) % 90) - 90; x < W; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = ((lt * 40) % 90) - 90; y < H; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  glow(g, 540, 1050, 700, 0.35, SPRITE_GREEN);
  floaters(g, t, 14, 7, 0.12);
  // category cards fly in from the edges and merge into the calculator
  const flyT = BUDGET.map((_, i) => SC.total + 0.25 + i * 0.42);
  let sum = 0;
  BUDGET.forEach(([lab, v], i) => {
    const u = prog(t, flyT[i], flyT[i] + 0.4);
    if (u >= 1) { sum += v; return; }
    if (u <= 0) return;
    const side = i % 2 ? 1 : -1, sx = 540 + side * 900, sy = 500 + i * 170;
    const e = Ease.inOutCubic(u), x = lerp(sx, 540, e), y = lerp(sy, 860, e), s = lerp(1, 0.25, Ease.inCubic(u));
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate((1 - e) * side * 0.3);
    shadow(g, 30, 12, 0.4); g.fillStyle = '#FBFCFE'; rr(g, -330, -70, 660, 140, 28); g.fill(); noShadow(g);
    setText(g, FONT.black(44), 1, 'left', 'middle'); g.fillStyle = '#1A2235'; g.fillText(lab, -300, 4);
    setText(g, FONT.black(58), 0, 'right', 'middle'); g.fillStyle = '#0E9F5B'; g.fillText(money(v), 300, 4);
    g.restore();
  });
  // eating out & coffee: varies, not counted in the subtotal
  const ev = prog(t, SC.total + 2.4, SC.total + 2.8) * (1 - prog(t, cue - 0.4, cue - 0.1));
  if (ev > 0) chip(g, '+ SOME EATING OUT & COFFEE', 540, 600, 36, 'rgba(255,255,255,0.12)', '#FFFFFF', ev, { font: FONT.bold, border: 'rgba(255,255,255,0.3)' });
  const reveal = prog(t, cue, cue + 0.25);
  const clicking = t > SC.total + 0.2 && t < cue;
  calculator(g, 540, 1080, 0.56, gg => {
    if (reveal <= 0) {
      setText(gg, FONT.semi(40), 2, 'right', 'alphabetic'); gg.fillStyle = 'rgba(43,227,139,0.7)'; gg.fillText(sum >= 3245 ? 'SUBTOTAL' : 'ADDING…', 300, -420);
      setText(gg, FONT.black(150), 0, 'right', 'alphabetic'); gg.fillStyle = '#2BE38B'; gg.shadowColor = 'rgba(43,227,139,0.8)'; gg.shadowBlur = 30; gg.fillText(money(sum), 300, -190); gg.shadowBlur = 0;
    } else {
      setText(gg, FONT.semi(40), 2, 'right', 'alphabetic'); gg.fillStyle = 'rgba(43,227,139,0.7)'; gg.fillText('≈ PER MONTH', 300, -420);
      const sz = 112 * (1 + 0.1 * Math.exp(-(t - cue) * 8));
      setText(gg, FONT.black(sz), 0, 'right', 'alphabetic'); gg.fillStyle = '#2BE38B'; gg.shadowColor = 'rgba(43,227,139,0.9)'; gg.shadowBlur = 40; gg.fillText('$3,200–3,300', 300, -200); gg.shadowBlur = 0;
    }
  }, i => clicking && Math.floor(t * 9) % 16 === (i * 5) % 16 || (reveal > 0 && reveal < 1 && i === 14), t);
  slam(g, 'BASIC MONTHLY BUDGET', 540, 420, 84, prog(lt, 0.05, 0.35), { from: 2 });
  if (reveal > 0) {
    const land = 1 + 0.15 * Math.exp(-(t - cue) * 7);
    g.save(); g.translate(540, 590); g.scale(land, land);
    bigText(g, '≈ $3,200–$3,300', 0, 0, fitSize(g, '≈ $3,200–$3,300', FONT.black, 150, 960), { color: COL.green, glow: 'rgba(43,227,139,0.8)', stroke: 0.07 });
    g.restore();
  }
  chip(g, 'Before healthcare, insurance, taxes & entertainment', 540, 1430, 30, 'rgba(10,15,30,0.85)', '#FFFFFF', prog(t, cue + 0.5, cue + 0.8), { font: FONT.semi, spacing: 0, border: 'rgba(255,255,255,0.25)' });
  chip(g, 'Illustrative budget from the categories shown', 540, 1495, 24, 'rgba(10,15,30,0.7)', 'rgba(255,255,255,0.75)', prog(t, cue + 0.8, cue + 1.1), { font: FONT.med, spacing: 0 });
}

function wordTime(key, word) { // approximate spoken time of a word, by its character position in the line
  const line = LINES[key] || '', i = line.toLowerCase().indexOf(word.toLowerCase());
  return VOICE[key] + DURS[key] * (i < 0 ? 0 : i / line.length);
}
function S_payoff(g, t) {
  const lt = t - SC.payoff, hit = SC.payoff + 0.9;
  skyBg(g, 'night', t, { horizon: 1500 });
  const push = Ease.inOutSine(prog(lt, 0, 3));
  skyline(g, 'night', 540, lerp(1760, 1840, push), lerp(0.98, 1.1, push), t, { depth: 0.1 });
  g.fillStyle = lin(g, 0, 1500, 0, H, [[0, 'rgba(255,180,90,0.0)'], [1, 'rgba(255,170,80,0.18)']]); g.fillRect(0, 1300, W, H);
  scrimTop(g, 1250, 0.5);
  // glowing figure floating above the city
  const fp = prog(lt, 0.05, 0.5), fy = 760 - lt * 18 + Math.sin(t * 2) * 6;
  if (fp > 0) {
    g.save(); g.globalAlpha = fp; glow(g, 540, fy - 50, 520, 0.55, SPRITE_GREEN);
    bigText(g, '$3,200–$3,300', 540, fy, 130, { color: COL.green, glow: 'rgba(43,227,139,0.9)', stroke: 0.06 });
    setText(g, FONT.bold(44), 4, 'center', 'alphabetic'); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText('PER MONTH · BASICS ONLY', 540, fy + 80); g.restore();
  }
  slam(g, 'CHICAGO', 540, 400, 170, prog(t, hit, hit + 0.25), { from: 2.6 });
  slam(g, "ISN'T CHEAP.", 540, 560, 150, prog(t, hit + 0.08, hit + 0.33), { color: COL.red, from: 2.6, glow: 'rgba(255,75,62,0.6)', rot: 0.05 });
  if (t > hit && t < hit + 0.12) flash(g, 0.45 * (1 - (t - hit) / 0.12), [255, 255, 255]);
  // the costs NOT included, popping in as they are said
  [['+ HEALTHCARE', 'healthcare'], ['+ INSURANCE', 'insurance'], ['+ TAXES', 'taxes'], ['+ ENTERTAINMENT', 'entertainment']].forEach(([s, w], i) => {
    const tw = wordTime('payoff', w);
    chip(g, s, i % 2 ? 690 : 390, 980 + i * 95, 40, i % 2 ? 'rgba(255,138,31,0.95)' : 'rgba(255,75,62,0.95)', '#FFFFFF', prog(t, tw - 0.05, tw + 0.2), { font: FONT.black });
  });
}

function S_cta(g, t) {
  const lt = t - SC.cta;
  skyBg(g, 'dusk', t, { horizon: 1500 });
  skyline(g, 'dusk', 540 + Math.sin(lt * 0.8) * 20, 1820, 0.95 + lt * 0.01, t, { depth: 0.05 });
  scrimTop(g, 1300, 0.55);
  slam(g, 'WOULD YOU LIVE', 540, 420, 120, prog(lt, 0.05, 0.3), { from: 2 });
  slam(g, 'IN CHICAGO?', 540, 560, 140, prog(lt, 0.15, 0.4), { color: COL.gold, from: 2, glow: 'rgba(255,200,87,0.5)' });
  // comment bubble with typing dots
  const bp = Ease.outBack(prog(lt, 0.25, 0.6));
  if (bp > 0) {
    g.save(); g.translate(540, 800); g.scale(bp, bp); shadow(g, 30, 12, 0.45);
    g.fillStyle = '#FFFFFF'; rr(g, -230, -90, 460, 180, 50); g.fill(); g.beginPath(); g.moveTo(-90, 80); g.lineTo(-140, 150); g.lineTo(-30, 86); g.fill(); noShadow(g);
    for (let k = 0; k < 3; k++) { const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 8 - k * 0.9)); g.fillStyle = `rgba(20,30,50,${a})`; g.beginPath(); g.arc(-70 + k * 70, -4 - 10 * Math.max(0, Math.sin(t * 8 - k * 0.9)), 22, 0, TAU); g.fill(); }
    g.restore();
  }
  // YES / NO pulse alternately
  const cueYes = CUE['cta.yes'] || 39.1;
  const pulse = (k) => { const ph = (lt * 2.2 + k * 0.5) % 1; return 1 + 0.09 * Math.max(0, Math.sin(ph * Math.PI)); };
  [['YES', COL.green, '#05140C', 300], ['NO', COL.red, '#FFFFFF', 780]].forEach(([s, bg, fg, x], k) => {
    const p = Ease.outBack(prog(lt, 0.45 + k * 0.12, 0.8 + k * 0.12)); if (p <= 0) return;
    const said = t >= cueYes + k * 0.25 ? 1 + 0.12 * Math.exp(-(t - cueYes - k * 0.25) * 8) : 1;
    const sc = p * pulse(k) * said;
    g.save(); g.translate(x, 1180); g.scale(sc, sc); shadow(g, 40, 16, 0.5);
    g.fillStyle = bg; rr(g, -200, -100, 400, 200, 100); g.fill(); noShadow(g);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 6; g.stroke();
    setText(g, FONT.black(110), 4, 'center', 'middle'); g.fillStyle = fg; g.fillText(s, 0, 6); g.restore();
  });
  chip(g, 'COMMENT BELOW', 540, 1400, 42, 'rgba(255,255,255,0.95)', '#0A0F1E', prog(lt, 0.8, 1.1), { font: FONT.black });
}

/* ---------------- HUD: header + running monthly tally ---------------- */
const TALLY = () => [[CUE['rent.price'] + 0.2, 2457], [CUE['food.price'] + 0.2, 2843], [CUE['transit.price'] + 0.15, 2928], [CUE['util.price'] + 0.15, 3114], [CUE['util.internet'] + 0.15, 3245]];
function hud(g, t) {
  const a = prog(t, 0.6, 0.9) * (1 - prog(t, SC.payoff - 0.1, SC.payoff));
  if (a > 0) chip(g, 'CHICAGO, IL · 2026 · APPROX. COSTS', 540, 250, 28, 'rgba(10,15,30,0.72)', 'rgba(255,255,255,0.92)', a, { font: FONT.bold, spacing: 2, border: 'rgba(255,255,255,0.2)' });
  let val = 0, last = -9; TALLY().forEach(([tt, v]) => { if (t >= tt) { val = v; last = tt; } });
  const ta = prog(t, SC.rent + 0.3, SC.rent + 0.6) * (1 - prog(t, SC.total - 0.1, SC.total + 0.1));
  if (ta > 0 && t >= SC.rent) {
    const bump = t - last < 0.6 ? 1 + 0.18 * Math.exp(-(t - last) * 8) : 1;
    g.save(); g.translate(540, 318); g.scale(bump, bump);
    chip(g, `MONTHLY TALLY  ${val ? money(val) : '$0'}`, 0, 0, 32, t - last < 0.35 ? COL.green : 'rgba(43,227,139,0.16)', t - last < 0.35 ? '#05140C' : COL.green, ta, { font: FONT.black, border: 'rgba(43,227,139,0.6)' });
    g.restore();
  }
}

/* ---------------- compositor: camera punch/shake, whip transitions ---------------- */
const SCN = { hook: S_hook, rent: S_rent, food: S_food, eat: S_eat, transit: S_transit, util: S_util, total: S_total, payoff: S_payoff, cta: S_cta };
let OFF_A, OFF_B, OA, OB, IMPACTS = [];
function initScenes(tl) {
  if (tl) { Object.assign(SC, tl.scenes); CUE = tl.cues || {}; VOICE = tl.voice || {}; DURS = tl.durs || {}; LINES = tl.lines || {}; }
  OFF_A = mk(W, H); OA = OFF_A.getContext('2d'); OFF_B = mk(W, H); OB = OFF_B.getContext('2d');
  IMPACTS = [[CUE['rent.price'] + 0.2, 1], [CUE['food.price'] + 0.2, 0.7], [CUE['eat.meal'] + 0.15, 0.6], [CUE['eat.coffee'] + 0.15, 0.6],
    [CUE['transit.price'] + 0.15, 0.7], [CUE['util.price'] + 0.15, 0.5], [CUE['util.internet'] + 0.15, 0.5], [CUE['total.price'], 1.4], [SC.payoff + 0.9, 1.2]];
}
function sceneAt(t) { let i = 0; for (let k = 0; k < KEYS.length; k++) if (t >= SC[KEYS[k]]) i = k; return i; }
function renderScene(g, key, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  // camera: slow drift + punch-in & shake on every price reveal
  let z = 1, sx = 0, sy = 0;
  IMPACTS.forEach(([ti, k]) => { if (t >= ti && t < ti + 0.8) { const d = t - ti; z += 0.05 * k * Math.exp(-d * 7); const a = 16 * k * Math.exp(-d * 9); sx += (noise1(t * 40, 1) - 0.5) * 2 * a; sy += (noise1(t * 40, 2) - 0.5) * 2 * a; } });
  g.translate(540 + sx, 960 + sy); g.scale(z, z); g.translate(-540, -960);
  SCN[key](g, t);
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const WHIP = 0.26;
function drawFrame(ctx, tIn, frameIn) {
  const t = Math.min(tIn, FREEZE), frame = Math.min(frameIn, Math.round(FREEZE * FPS));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  const i = sceneAt(t), key = KEYS[i];
  // transition window around each cut
  let j = -1; for (let k = 1; k < KEYS.length; k++) if (Math.abs(t - SC[KEYS[k]]) < WHIP / 2) j = k;
  if (j > 0) {
    const b = SC[KEYS[j]], u = clamp((t - (b - WHIP / 2)) / WHIP), e = Ease.inOutCubic(u);
    renderScene(OA, KEYS[j - 1], t); renderScene(OB, KEYS[j], t);
    const dir = [0, 1, -1, 1, -1, 1, 0, 0, -1][j];  // 0 = zoom whip / hard cut
    if (dir !== 0) {
      const off = -dir * W * e, v = dir * 70 * Math.sin(u * Math.PI);
      for (let k = 4; k >= 0; k--) { // directional motion blur
        ctx.globalAlpha = k ? 0.16 : 1;
        ctx.drawImage(OFF_A, off - v * k, 0); ctx.drawImage(OFF_B, off + dir * W - v * k, 0);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,255,255,${0.12 * Math.sin(u * Math.PI)})`; ctx.fillRect(0, 0, W, H);
    } else if (KEYS[j] === 'total') { // zoom whip into the calculator
      const zA = 1 + 0.8 * Ease.inCubic(Math.min(1, u * 2)), zB = 1.6 - 0.6 * Ease.outCubic(Math.max(0, u * 2 - 1));
      const img = u < 0.5 ? OFF_A : OFF_B, zz = u < 0.5 ? zA : zB;
      for (let k = 3; k >= 0; k--) { const s = zz * (1 + k * 0.04 * Math.sin(u * Math.PI)); ctx.globalAlpha = k ? 0.2 : 1; ctx.drawImage(img, 540 - 540 * s, 960 - 960 * s, W * s, H * s); }
      ctx.globalAlpha = 1;
    } else { // hard cut with a flash (music drop for the payoff)
      ctx.drawImage(u < 0.5 ? OFF_A : OFF_B, 0, 0);
      flash(ctx, 0.35 * Math.max(0, 1 - Math.abs(u - 0.5) * 4), [255, 255, 255]);
    }
  } else {
    renderScene(OA, key, t); ctx.drawImage(OFF_A, 0, 0);
  }
  hud(ctx, t);
  drawVignette(ctx, 0.35);
  drawGrain(ctx, frame, 0.03);
}
