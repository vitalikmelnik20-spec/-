'use strict';
/* ---------------------------------------------------------------------------
 * Scenes. Each is a pure function of time t (seconds).
 *   0–2   hook: Ukraine -> western Ukraine -> 3D Lviv
 *   2–6   city reveal (oblast, Lviv, historic centre)
 *   6–10  Market Square
 *   10–14 old city line-art street journey
 *   14–18 coffee culture (cup -> steam skyline -> coffee map)
 *   18–22 city energy
 *   22–26 iconic skyline reveal
 *   26–30 final shot
 * ------------------------------------------------------------------------- */
const cam = new Cam();
const SK = {};
let SKYLINE = null, FAR_SKY = null, BUF = null, BUFCTX = null;

function initScenes() {
  buildCity();
  SK.opera = operaSketch(); SK.arm = armenianSketch(); SK.ratusha = ratushaSketch(); SK.latin = latinSketch();
  SK.dominican = dominicanSketch(); SK.george = georgeSketch(); SK.korniakt = korniaktSketch();
  SK.k = [0, 1, 2, 3, 4, 5, 6, 7].map(i => kamianytsia(100 + i * 17, [230, 210, 220, 200, 225, 210, 215, 205][i], [560, 610, 540, 590, 575, 600, 555, 585][i]));
  SKYLINE = skylineOutline(70, 1010, 900, 150);
  FAR_SKY = skylineOutline(0, 1800, 0, 260);
  BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; BUFCTX = BUF.getContext('2d');
}

/* ---------------------------------------------------------------------------
 * 3D map world (scenes 1–3 and 8)
 * ------------------------------------------------------------------------- */
function drawGraticule(ctx, cam, a) {
  if (a <= 0) return;
  ctx.save(); ctx.strokeStyle = rgba(C.gold, a); ctx.lineWidth = 1;
  for (let lon = 20; lon <= 42; lon += 1) {
    const pts = []; for (let lat = 43; lat <= 54; lat += 0.5) pts.push(geo(lon, lat));
    cam.projLine(pts).forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
  }
  for (let lat = 43; lat <= 54; lat += 1) {
    const pts = []; for (let lon = 20; lon <= 42; lon += 0.5) pts.push(geo(lon, lat));
    cam.projLine(pts).forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
  }
  ctx.restore();
}
function strokeGlow(ctx, runs, color, w, a, glowW = 4) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = rgbStr(color, a * 0.18); ctx.lineWidth = w * glowW;
  runs.forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
  ctx.strokeStyle = rgbStr(color, a); ctx.lineWidth = w;
  runs.forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
  ctx.restore();
}
const GOLD = [236, 184, 96], GOLD2 = [255, 215, 140];

function drawUkraine(ctx, cam, t, o) {
  const a = o.alpha == null ? 1 : o.alpha; if (a <= 0) return;
  ctx.save();
  const th = o.thick || 0;
  if (th > 0) {
    for (let i = 7; i >= 1; i--) {
      const sp = cam.projPoly(UA_S, -th * i / 7);
      ctx.beginPath(); pathPoly(ctx, sp);
      ctx.fillStyle = `rgba(${26 - i * 2},${18 - i},${12},${a})`; ctx.fill();
      ctx.strokeStyle = rgbStr(GOLD, a * 0.18 * (1 - i / 8)); ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  const top = cam.projPoly(UA_S, 0);
  ctx.beginPath(); pathPoly(ctx, top);
  const g = ctx.createRadialGradient(W * 0.45, cam.cy, 50, W * 0.5, cam.cy, 1400);
  g.addColorStop(0, `rgba(40,40,54,${a})`); g.addColorStop(1, `rgba(17,19,30,${a})`);
  ctx.fillStyle = g; ctx.fill();
  // fine inner hatching (clipped)
  if (o.hatch) {
    ctx.save(); ctx.clip();
    drawGraticule(ctx, cam, 0.12 * a * o.hatch);
    ctx.restore();
  }
  const draw = o.draw == null ? 1 : o.draw;
  const line = draw < 1 ? partialPoly(UA_S, draw, true) : UA_S.concat([UA_S[0]]);
  const runs = cam.projLine(line);
  strokeGlow(ctx, runs, GOLD2, o.lw || 3, a * 0.95, 5);
  if (draw < 1 && line.length) {
    const hp = cam.proj(line[line.length - 1][0], line[line.length - 1][1], 0);
    if (hp) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, hp[0], hp[1], 90, a, SPRITE_FLARE); }
  }
  ctx.restore();
  // other cities
  if (o.cities) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    CITIES.forEach((c, i) => { const q = cam.proj(c[0], c[1], 0); if (q) glow(ctx, q[0], q[1], 10 + c[2] * 16, o.cities * a * (0.5 + 0.3 * Math.sin(t * 2 + i))); });
    ctx.restore();
  }
}
function drawOblast(ctx, cam, t, a, draw) {
  if (a <= 0) return;
  const line = draw < 1 ? partialPoly(OBLAST_S, draw, true) : OBLAST_S.concat([OBLAST_S[0]]);
  if (draw >= 1) {
    ctx.save(); ctx.beginPath(); pathPoly(ctx, cam.projPoly(OBLAST_S, 0));
    ctx.fillStyle = rgbStr(GOLD, 0.13 * a); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.setLineDash([]);
  strokeGlow(ctx, cam.projLine(line), GOLD2, 2.6, a, 5);
  ctx.restore();
}
function groundRing(ctx, cam, x, y, r, color, a, lw = 2) {
  const pts = []; for (let i = 0; i <= 64; i++) { const k = (i / 64) * TAU; pts.push([x + Math.cos(k) * r, y + Math.sin(k) * r]); }
  ctx.save(); ctx.strokeStyle = rgbStr(color, a); ctx.lineWidth = lw;
  cam.projLine(pts).forEach(rn => { ctx.beginPath(); pathPoly(ctx, rn, false); ctx.stroke(); }); ctx.restore();
}
function drawMarker(ctx, cam, t, a, size = 1) {
  if (a <= 0) return;
  const q = cam.proj(0, 0, 0); if (!q) return;
  for (let k = 0; k < 3; k++) {
    const ph = ((t * 0.9 + k / 3) % 1);
    groundRing(ctx, cam, 0, 0, cam.d * 0.05 * size * (0.3 + ph * 2.2), GOLD2, a * (1 - ph) * 0.8, 2);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, q[0], q[1], 150 * size, a * 0.8, SPRITE_FLARE);
  glow(ctx, q[0], q[1], 34 * size, a);
  ctx.restore();
}
function drawSquare(ctx, cam, t, a) {
  if (a <= 0) return;
  const sq = [[-0.071, -0.056], [0.071, -0.056], [0.071, 0.056], [-0.071, 0.056]];
  const sp = cam.projPoly(sq, 0);
  ctx.save();
  ctx.beginPath(); pathPoly(ctx, sp); ctx.fillStyle = `rgba(58,44,30,${a})`; ctx.fill();
  ctx.clip();
  ctx.strokeStyle = rgbStr(GOLD, 0.12 * a); ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) {
    cam.projLine([[i * 0.009, -0.06], [i * 0.009, 0.06]]).forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
    cam.projLine([[-0.075, i * 0.007], [0.075, i * 0.007]]).forEach(r => { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); });
  }
  ctx.restore();
  strokeGlow(ctx, cam.projLine(sq.concat([sq[0]])), GOLD2, 2, a * 0.8, 4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  [[-0.052, -0.042], [0.052, -0.042], [0.052, 0.042], [-0.052, 0.042]].forEach((f, i) => {
    const q = cam.proj(f[0], f[1], 0.002); if (q) glow(ctx, q[0], q[1], 26, a * (0.6 + 0.3 * Math.sin(t * 3 + i)));
  });
  ctx.restore();
}
function drawSvobody(ctx, cam, t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const y = -0.4 + i * 0.023;
    [-0.345, -0.395].forEach(x => { const q = cam.proj(x, y, 0.004); if (q) glow(ctx, q[0], q[1], 7, a * 0.5); });
  }
  ctx.restore();
}

/* camera for scenes 1–3 */
function camIntro(t) {
  let lnd = Math.log(3050);
  lnd = lerp(lnd, Math.log(2700), Ease.outQuad(prog(t, 0, 0.25)));
  lnd = lerp(lnd, Math.log(520), Ease.inOutCubic(prog(t, 0.25, 1.9)));
  lnd = lerp(lnd, Math.log(430), Ease.inOutSine(prog(t, 1.9, 3.3)));
  lnd = lerp(lnd, Math.log(1.75), Ease.inOutQuart(prog(t, 3.3, 5.35)));
  lnd = lerp(lnd, Math.log(1.45), Ease.outQuad(prog(t, 5.35, 6.0)));
  lnd = lerp(lnd, Math.log(0.36), Ease.inOutCubic(prog(t, 6.0, 7.25)));
  lnd = lerp(lnd, Math.log(0.3), Ease.inOutSine(prog(t, 7.25, 10.2)));
  cam.d = Math.exp(lnd);
  const tp = Ease.inOutCubic(prog(t, 0.2, 1.6));
  cam.tx = lerp(UA_CENTER[0], 0, tp); cam.ty = lerp(UA_CENTER[1], 0, tp);
  cam.ty += -40 * Ease.inOutSine(prog(t, 1.6, 2.6)) * (1 - Ease.inOutSine(prog(t, 3.3, 4.6)));
  let p = 0;
  p = lerp(p, 0.92, Ease.inOutCubic(prog(t, 0.7, 2.1)));
  p = lerp(p, 0.84, Ease.inOutSine(prog(t, 2.1, 3.4)));
  p = lerp(p, 0.98, Ease.inOutSine(prog(t, 3.4, 5.6)));
  p = lerp(p, 1.02, Ease.inOutSine(prog(t, 6.0, 7.3)));
  cam.pitch = p;
  let y = 0;
  y = lerp(y, -0.35, Ease.inOutCubic(prog(t, 0.7, 2.2)));
  y = lerp(y, 0.25, Ease.inOutSine(prog(t, 3.3, 6.0)));
  y = lerp(y, 1.75, Ease.inOutSine(prog(t, 6.0, 10.3)));
  cam.yaw = y;
  cam.cy = lerp(1180, 1120, prog(t, 2.0, 3.0));
  cam.cy = lerp(cam.cy, 1300, Ease.inOutSine(prog(t, 6.0, 7.5)));
  cam.tz = 0;
  cam.setup();
  return lnd;
}
function riseIntro(t) {
  return b => {
    if (b.grp === 'market') { const s = 6.05 + (b.order / CITY.marketCount) * 1.25; return Ease.outBack(prog(t, s, s + 0.42)); }
    if (b.grp === 'ratusha') { const s = b.part ? 7.35 : 7.15; return Ease.outBack(prog(t, s, s + 0.55)); }
    if (b.grp === 'landmark') { const s = 4.35 + b.seed * 0.5; return Ease.outBack(prog(t, s, s + 0.6)); }
    if (b.grp === 'old') { const s = 3.75 + b.r * 1.3 + b.seed * 0.3; return Ease.outBack(prog(t, s, s + 0.55)); }
    const s = 3.95 + Math.min(b.r, 3) * 0.33 + b.seed * 0.3; return Ease.outBack(prog(t, s, s + 0.55));
  };
}

function S_map(ctx, t) {
  const lnd = camIntro(t);
  const lnd2 = camIntro(t + 1 / 60); camIntro(t); // look-ahead for zoom speed, then restore camera
  const zoomV = Math.max(0, (lnd - lnd2) * 60); // log-units per second
  fillBg(ctx, '#080a12', '#030305');
  // camera shake on the title impact
  const shake = t > 0.27 ? Math.exp(-(t - 0.27) * 9) * 14 : 0;
  ctx.save();
  ctx.translate(Math.sin(t * 97) * shake, Math.cos(t * 83) * shake);
  const d = cam.d;
  drawGraticule(ctx, cam, 0.07 * clamp((Math.log(d) - 3) / 2));
  drawUkraine(ctx, cam, t, { alpha: 1, draw: lerp(0.42, 1, Ease.outCubic(prog(t, 0, 0.42))), thick: 22 * Ease.inOutCubic(prog(t, 0.6, 1.9)), hatch: 1, cities: clamp((Math.log(d) - 4.2) / 1.5), lw: lerp(3.2, 2.4, prog(t, 0, 2)) });
  // oblast
  const obA = Ease.outCubic(prog(t, 1.75, 2.2)) * (1 - Ease.inCubic(prog(t, 3.6, 4.6)));
  drawOblast(ctx, cam, t, obA, Ease.inOutCubic(prog(t, 1.75, 2.55)));
  // streets & city
  const near = clamp((Math.log(30) - Math.log(d)) / 1.6);
  drawStreets(ctx, cam, t, { alpha: near * 0.9, pulse: 0.2 });
  // historic-centre ring highlight
  const ringA = Ease.outCubic(prog(t, 4.7, 5.2)) * (1 - prog(t, 6.2, 6.9));
  if (ringA > 0) strokeGlow(ctx, cam.projLine(partialPoly(CITY.ring, Ease.inOutCubic(prog(t, 4.7, 5.5)))), GOLD2, 3.5, ringA, 5);
  drawSquare(ctx, cam, t, clamp((Math.log(4) - Math.log(d)) / 0.8));
  drawSvobody(ctx, cam, t, clamp((Math.log(2.5) - Math.log(d)) / 0.6));
  const lightsA = clamp((Math.log(d) - Math.log(1.2)) / 1.2) * clamp((Math.log(900) - Math.log(d)) / 1.5);
  drawLights(ctx, cam, t, lightsA * 0.9, clamp(40 / d, 0.5, 1.6));
  drawSpikes(ctx, cam, t, Ease.outCubic(prog(t, 1.1, 1.9)) * clamp((Math.log(d) - Math.log(3)) / 1.2), Math.min(d * 0.05, 26) * Ease.outBack(prog(t, 1.1, 2.0)));
  renderCity(ctx, cam, t, {
    rise: riseIntro(t), alpha: clamp((Math.log(9) - Math.log(d)) / 0.8), edge: 0.3, windows: clamp((Math.log(2) - Math.log(d)) / 0.8),
    ratushaGlow: 0.55 * Ease.outCubic(prog(t, 7.5, 8.2)) + 0.12 * Math.sin(t * 4) * prog(t, 7.5, 8),
  });
  // Ratusha light shaft
  const shA = Ease.outCubic(prog(t, 7.6, 8.3)) * (1 - prog(t, 9.7, 10));
  if (shA > 0) {
    const q = cam.proj(0, 0.004, 0.07);
    if (q) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(q[0], q[1], q[0], q[1] - 900);
      g.addColorStop(0, `rgba(255,210,140,${0.35 * shA})`); g.addColorStop(1, 'rgba(255,210,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q[0] - 10, q[1]); ctx.lineTo(q[0] + 10, q[1]); ctx.lineTo(q[0] + 90, q[1] - 900); ctx.lineTo(q[0] - 90, q[1] - 900); ctx.fill();
      glow(ctx, q[0], q[1], 120, shA * 0.9, SPRITE_FLARE);
      ctx.restore();
    }
  }
  const mkA = clamp((Math.log(d) - Math.log(6)) / 1.2);
  drawMarker(ctx, cam, t, mkA, t < 2 ? 1.2 : 0.8);
  // hook rays from Lviv
  const q0 = cam.proj(0, 0, 0);
  if (q0) drawRays(ctx, q0[0], q0[1], t, (1 - prog(t, 0.2, 1.4)) * 0.9 + 0.35 * Math.exp(-Math.abs(t - 0.28) * 8), 1500, 18, TAU, t * 0.2);
  ctx.restore();
  // speed streaks while zooming
  const sv = clamp((zoomV - 0.8) / 3);
  if (sv > 0) speedStreaks(ctx, t, sv * 0.9, 540, cam.cy);

  /* ---- typography ---- */
  hookText(ctx, t);
  revealText(ctx, t);
  squareText(ctx, t);
}

function speedStreaks(ctx, t, a, cx, cy) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const ang = hash1(i * 3.1) * TAU;
    const r0 = 200 + ((hash1(i * 7.7) * 1400 + t * 2400 * (0.6 + hash1(i))) % 1400);
    const L = 80 + 260 * hash1(i * 1.9);
    const x0 = cx + Math.cos(ang) * r0, y0 = cy + Math.sin(ang) * r0;
    const x1 = cx + Math.cos(ang) * (r0 + L), y1 = cy + Math.sin(ang) * (r0 + L);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(255,220,160,0)'); g.addColorStop(1, `rgba(255,220,160,${0.5 * a})`);
    ctx.strokeStyle = g; ctx.lineWidth = 1.5 + 2 * hash1(i * 5.3);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.restore();
}

function hookText(ctx, t) {
  if (t > 2.3) return;
  const exit = Ease.inCubic(prog(t, 1.88, 2.12));
  textScrim(ctx, 700, 460, 0.55 * (1 - exit));
  // "ЦЕ ЛЬВІВ." slam
  const p = prog(t, 0.24, 0.62);
  if (t >= 0.24) {
    const e = Ease.outExpo(p);
    const sc = lerp(2.6, 1, e) * (1 + exit * 0.08);
    ctx.save();
    ctx.translate(540, 640 - exit * 70);
    setText(ctx, FONT.black(172), lerp(40, 2, e), 'center', 'middle');
    // echo trails
    for (let k = 3; k >= 1; k--) {
      ctx.save(); ctx.scale(sc * (1 + k * 0.06 * (1 - e)), sc * (1 + k * 0.06 * (1 - e)));
      ctx.globalAlpha = 0.18 * (1 - e) * (1 - exit); ctx.fillStyle = C.gold2; ctx.fillText('ЦЕ ЛЬВІВ.', 0, 0); ctx.restore();
    }
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(p * 4) * (1 - exit);
    ctx.shadowColor = 'rgba(255,190,90,0.9)'; ctx.shadowBlur = 50 * (1 - e) + 22;
    ctx.fillStyle = C.white; ctx.fillText('ЦЕ ЛЬВІВ.', 0, 0);
    ctx.restore();
  }
  if (t >= 0.24 && t < 0.5) flash(ctx, 0.55 * Math.exp(-(t - 0.24) * 14));
  // second line, character by character
  const a2 = 1 - exit;
  if (a2 > 0) {
    ctx.save(); ctx.translate(0, -exit * 50);
    kineticChars(ctx, 'АЛЕ ТИ ЗНАЄШ', 540, 800, 82, 0.98, t, { font: FONT.xbold(82), color: C.gold2, spacing: 3, stagger: 0.022, dur: 0.35, glow: 'rgba(255,170,60,0.6)', alpha: a2 });
    kineticChars(ctx, 'ЙОГО НЕ ВЕСЬ.', 540, 900, 82, 1.2, t, { font: FONT.xbold(82), color: C.gold2, spacing: 3, stagger: 0.022, dur: 0.35, glow: 'rgba(255,170,60,0.6)', alpha: a2 });
    ctx.restore();
  }
}

function revealText(ctx, t) {
  if (t < 2.0 || t > 6.3) return;
  // oblast label
  const oa = Ease.outCubic(prog(t, 2.15, 2.5)) * (1 - Ease.inCubic(prog(t, 3.35, 3.7)));
  if (oa > 0) {
    textScrim(ctx, 520, 200, 0.5 * oa);
    setText(ctx, FONT.semi(26), 12); ctx.globalAlpha = oa; ctx.fillStyle = C.gold;
    ctx.fillText('ЗАХІДНА УКРАЇНА', 540, 450); ctx.globalAlpha = 1;
    kineticChars(ctx, 'Львівська область', 540, 548, 76, 2.2, t, { font: FONT.serif(80), color: C.cream, stagger: 0.02, dur: 0.4, alpha: oa });
    // leader line to the region
    const c = cam.proj(OBLAST.reduce((s, p) => s + p[0], 0) / OBLAST.length, OBLAST.reduce((s, p) => s + p[1], 0) / OBLAST.length, 0);
    if (c) {
      const lp = Ease.inOutCubic(prog(t, 2.35, 2.75));
      ctx.save(); ctx.strokeStyle = rgbStr(GOLD2, 0.8 * oa); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(540, 590); ctx.lineTo(lerp(540, c[0], lp), lerp(590, c[1], lp)); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; glow(ctx, lerp(540, c[0], lp), lerp(590, c[1], lp), 26, oa);
      ctx.restore();
    }
  }
  // Lviv title
  const la = 1 - Ease.inCubic(prog(t, 5.8, 6.15));
  if (t > 3.75 && la > 0) {
    textScrim(ctx, 600, 300, 0.55 * la * prog(t, 3.75, 4.1));
    ctx.save(); ctx.translate(0, -Ease.inCubic(prog(t, 5.8, 6.15)) * 60);
    kineticChars(ctx, 'Львів', 540, 590, 230, 3.8, t, { font: FONT.black(230), color: C.white, spacing: 6, stagger: 0.05, dur: 0.55, rise: 120, glow: 'rgba(255,180,80,0.55)', glowBlur: 40, alpha: la });
    const lw = 460 * Ease.inOutCubic(prog(t, 4.2, 4.7));
    ctx.globalAlpha = la; ctx.fillStyle = C.gold2; ctx.fillRect(540 - lw / 2, 640, lw, 3);
    ctx.globalAlpha = 1;
    revealLine(ctx, 'заснований у XIII столітті', 540, 725, 58, prog(t, 4.45, 5.0), { font: FONT.serif(58), color: C.gold2, alpha: la });
    revealLine(ctx, '49°50′ пн. ш.   ·   24°01′ сх. д.', 540, 790, 26, prog(t, 4.7, 5.2), { font: FONT.med(26), spacing: 5, color: '#b9a27a', alpha: la });
    ctx.restore();
  }
  // historic centre tag
  const ha = Ease.outCubic(prog(t, 5.0, 5.35)) * (1 - prog(t, 5.85, 6.15));
  if (ha > 0) {
    const q = cam.proj(0.56, 0.03, 0);
    if (q) {
      const x = clamp(q[0] + 30, 90, 640), y = clamp(q[1] - 90, 900, 1500);
      ctx.save(); ctx.globalAlpha = ha;
      ctx.strokeStyle = C.gold2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(x, y + 12); ctx.lineTo(x + 250, y + 12); ctx.stroke();
      setText(ctx, FONT.bold(28), 5, 'left'); ctx.fillStyle = C.cream; ctx.fillText('ІСТОРИЧНИЙ ЦЕНТР', x, y);
      setText(ctx, FONT.serif(30), 0, 'left'); ctx.fillStyle = C.gold2; ctx.fillText('спадщина ЮНЕСКО', x, y + 52);
      ctx.restore();
    }
  }
}

function squareText(ctx, t) {
  if (t < 7.0 || t > 10.2) return;
  const ex = Ease.inCubic(prog(t, 9.55, 9.85));
  const a = 1 - ex;
  textScrim(ctx, 520, 260, 0.6 * prog(t, 7.1, 7.5) * a);
  revealLine(ctx, 'СЕРЦЕ ЛЬВОВА', 540, 520, 118, prog(t, 7.3, 7.85), { font: FONT.black(118), spacing: 4, color: C.white, glow: 'rgba(255,180,80,0.5)', alpha: a });
  kineticChars(ctx, 'Площа Ринок', 540, 650, 96, 8.0, t, { font: FONT.serif(100), color: C.gold2, stagger: 0.035, dur: 0.5, alpha: a, glow: 'rgba(255,160,60,0.5)' });
  // Ratusha callout
  const ra = Ease.outCubic(prog(t, 8.25, 8.6)) * a;
  const q = cam.proj(0, 0.004, 0.068);
  if (ra > 0 && q) {
    const x = clamp(q[0] + 140, 60, 760), y = q[1] + 70;
    const lp = Ease.inOutCubic(prog(t, 8.25, 8.6));
    ctx.save(); ctx.globalAlpha = ra; ctx.strokeStyle = C.gold2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(lerp(q[0], x, lp), lerp(q[1], y, lp)); ctx.lineTo(lerp(q[0], x, lp) + 150 * lp, lerp(q[1], y, lp)); ctx.stroke();
    setText(ctx, FONT.bold(34), 6, 'left'); ctx.fillStyle = C.cream; ctx.fillText('РАТУША', x + 4, y - 16);
    ctx.restore();
  }
}

/* ---------------------------------------------------------------------------
 * Scene 4: old city — line-art street journey with parallax
 * ------------------------------------------------------------------------- */
const STREET_ELEMS = [
  { k: 0, x: 120 }, { k: 1, x: 345 }, { k: 2, x: 565 }, { k: 3, x: 780 }, { k: 4, x: 995 },
  { arm: true, x: 1560 },
  { k: 5, x: 2110 }, { k: 6, x: 2325 },
  { opera: true, x: 3050 },
];
function S_street(ctx, t) {
  const G = 1440;
  const camX = lerp(360, 3050, Ease.inOutCubic(prog(t, 9.8, 13.55)));
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#07080e'); g.addColorStop(0.62, '#15121a'); g.addColorStop(0.75, '#2a1c12'); g.addColorStop(0.76, '#0b0a0c'); g.addColorStop(1, '#040405');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 540, G - 120, 900, 0.25, SPRITE_FLARE); ctx.restore();
  // far skyline (parallax 0.35)
  ctx.save();
  const fo = -camX * 0.35;
  for (let rep = -1; rep < 4; rep++) {
    const ox = rep * 1800 + fo % 1800 + (fo < 0 ? 0 : 0);
    ctx.beginPath(); ctx.moveTo(ox + FAR_SKY[0][0] * 1, G - 40);
    FAR_SKY.forEach(p => ctx.lineTo(ox + p[0], G - 40 + p[1] * 0.85 - 120));
    ctx.lineTo(ox + 1800, G - 40); ctx.closePath();
    ctx.fillStyle = '#0f1019'; ctx.fill();
    ctx.strokeStyle = rgbStr(GOLD, 0.18); ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
  // mid elements
  for (const e of STREET_ELEMS) {
    const sx = e.x - camX + 540;
    if (sx < -700 || sx > W + 700) continue;
    let p = clamp((camX - (e.x - 900)) / 700);
    if (e.opera) p = Ease.inOutSine(prog(t, 12.35, 13.75));
    const sk = e.opera ? SK.opera : e.arm ? SK.arm : SK.k[e.k];
    const sc = e.opera ? 0.95 : e.arm ? 1.0 : 1.0;
    drawSketch(ctx, sk, sx, G, sc, p, { t, fill: 0.95, lw: e.opera ? 1.2 : 1 });
  }
  // wet-stone reflection of the facades
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.translate(0, G * 2); ctx.scale(1, -1);
  ctx.drawImage(ctx.canvas, 0, G - 700, W, 700, 0, G - 700, W, 700);
  ctx.restore();
  ctx.save();
  const rg = ctx.createLinearGradient(0, G, 0, G + 520);
  rg.addColorStop(0, 'rgba(4,4,6,0.2)'); rg.addColorStop(1, 'rgba(4,4,6,1)');
  ctx.fillStyle = rg; ctx.fillRect(0, G, W, 520);
  ctx.restore();
  // street surface with parallax cobbles and tram rails
  ctx.save();
  ctx.fillStyle = rgbStr(GOLD, 0.5); ctx.fillRect(0, G, W, 2);
  for (let j = 0; j < 14; j++) {
    const y = G + 16 + j * (10 + j * 3.4);
    const sp = 34 + j * 9, par = 1 + j * 0.09;
    const off = ((-camX * par) % sp + sp) % sp;
    ctx.strokeStyle = rgbStr(GOLD, 0.05 + j * 0.008); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = off - sp; x < W + sp; x += sp) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sp / 2, y - 4 - j * 0.4, x + sp, y); }
    ctx.stroke();
  }
  [G + 150, G + 214].forEach((y, i) => {
    const lg = ctx.createLinearGradient(0, 0, W, 0);
    const gp = ((camX * 0.001) % 1);
    lg.addColorStop(0, 'rgba(255,210,140,0.08)'); lg.addColorStop(clamp(gp), 'rgba(255,220,160,0.65)'); lg.addColorStop(1, 'rgba(255,210,140,0.08)');
    ctx.fillStyle = lg; ctx.fillRect(0, y, W, 3 + i);
  });
  ctx.restore();
  // foreground lamps (parallax 1.55)
  for (let i = 0; i < 8; i++) {
    const x = i * 820 - camX * 1.55 + 700;
    if (x < -200 || x > W + 200) continue;
    drawLamp(ctx, x, H + 30, 1.25, t);
  }
  // labels
  const lab = (str, cx, a) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    setText(ctx, FONT.serif(54)); ctx.fillStyle = C.gold2; ctx.fillText(str, 540, 640);
    ctx.fillStyle = rgbStr(GOLD2, a); ctx.fillRect(540 - 60 * a, 668, 120 * a, 2);
    ctx.restore();
  };
  const bell = (c, w) => clamp(1 - Math.abs(camX - c) / w);
  lab('старовинні кам’яниці', 0, Ease.smooth(bell(640, 520)) * prog(t, 10.15, 10.5));
  lab('Вірменський квартал', 0, Ease.smooth(bell(1560, 380)));
  lab('Оперний театр', 0, Ease.smooth(prog(t, 12.9, 13.3)) * (1 - prog(t, 13.8, 14)));
  // title
  const tA = 1 - prog(t, 13.8, 14.0);
  textScrim(ctx, 400, 220, 0.6);
  revealLine(ctx, 'МІСТО, ДЕ ІСТОРІЯ —', 540, 390, 80, prog(t, 10.3, 10.8), { font: FONT.black(80), color: C.white, alpha: tA });
  revealLine(ctx, 'НА КОЖНОМУ КРОЦІ', 540, 490, 80, prog(t, 10.55, 11.05), { font: FONT.black(80), color: C.gold2, alpha: tA, glow: 'rgba(255,170,60,0.45)' });
}
function drawLamp(ctx, x, yb, s, t) {
  ctx.save(); ctx.translate(x, yb); ctx.scale(s, s);
  ctx.fillStyle = '#050507'; ctx.strokeStyle = rgbStr(GOLD, 0.35); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(-7, -720, 14, 720); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -700); ctx.quadraticCurveTo(60, -760, 110, -700); ctx.lineWidth = 6; ctx.strokeStyle = '#050507'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(90, -700); ctx.lineTo(130, -700); ctx.lineTo(122, -650); ctx.lineTo(98, -650); ctx.closePath(); ctx.fillStyle = '#050507'; ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + 110 * s, yb - 660 * s, 150, 0.85 + 0.05 * Math.sin(t * 9), SPRITE_FLARE);
  ctx.restore();
}

/* ---------------------------------------------------------------------------
 * Scene 5: coffee
 * ------------------------------------------------------------------------- */
function S_coffee(ctx, t, noText) {
  const lt = t - 14;
  fillBg(ctx, '#0d0a08', '#030303');
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 540, 1250, 800, 0.22, SPRITE_FLARE);
  ctx.restore();
  const push = lerp(1.0, 1.06, Ease.inOutSine(prog(t, 14, 16.3)));
  ctx.save(); ctx.translate(540, 1260); ctx.scale(push, push); ctx.translate(-540, -1260);
  // morph progress
  const m = Ease.inOutCubic(prog(t, 14.85, 15.75));
  // skyline fill + line (after morph)
  const la = prog(t, 15.35, 15.95);
  if (la > 0) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(SKYLINE[0][0], 900); SKYLINE.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(SKYLINE[SKYLINE.length - 1][0], 900); ctx.closePath();
    const fg = ctx.createLinearGradient(0, 430, 0, 900); fg.addColorStop(0, `rgba(255,200,130,${0.16 * la})`); fg.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = fg; ctx.fill();
    strokeGlow(ctx, [partialPoly(SKYLINE, Ease.inOutCubic(la))], GOLD2, 3, 0.95, 5);
    ctx.restore();
  }
  drawCup(ctx, 540, lt);
  drawSteam(ctx, t, m);
  ctx.restore();
  if (noText) return;
  kineticChars(ctx, 'КАВА —', 540, 330, 130, 14.2, t, { font: FONT.black(130), color: C.white, stagger: 0.04, dur: 0.45, glow: 'rgba(255,170,80,0.5)' });
  kineticChars(ctx, 'ОКРЕМА ІСТОРІЯ', 540, 430, 78, 14.45, t, { font: FONT.xbold(78), color: C.gold2, spacing: 4, stagger: 0.025, dur: 0.4 });
}
function drawCup(ctx, cx, lt) {
  // table glow & saucer
  const sy = 1480;
  ctx.save();
  let g = ctx.createRadialGradient(cx, sy + 10, 20, cx, sy + 10, 380);
  g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, sy + 30, 420, 110, 0, 0, TAU); ctx.fill();
  g = ctx.createLinearGradient(cx - 330, 0, cx + 330, 0);
  g.addColorStop(0, '#0c0c0f'); g.addColorStop(0.3, '#23201d'); g.addColorStop(0.6, '#121114'); g.addColorStop(1, '#070709');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, sy, 330, 78, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgbStr(GOLD, 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, sy - 4, 326, 74, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
  ctx.strokeStyle = rgbStr(GOLD, 0.25); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, sy - 2, 200, 44, 0, 0, TAU); ctx.stroke();
  // cup body
  const top = 1190, rx = 215, ry = 50;
  ctx.beginPath();
  ctx.moveTo(cx - rx, top);
  ctx.bezierCurveTo(cx - rx, top + 150, cx - 170, top + 250, cx - 90, top + 272);
  ctx.lineTo(cx + 90, top + 272);
  ctx.bezierCurveTo(cx + 170, top + 250, cx + rx, top + 150, cx + rx, top);
  ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI, false);
  ctx.closePath();
  g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, '#060607'); g.addColorStop(0.18, '#2c2824'); g.addColorStop(0.3, '#171517'); g.addColorStop(0.75, '#0b0b0d'); g.addColorStop(0.95, '#3a2a18'); g.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = g; ctx.fill();
  // specular streak
  ctx.save(); ctx.clip();
  const sg = ctx.createLinearGradient(cx - 150, 0, cx - 110, 0);
  sg.addColorStop(0, 'rgba(255,240,220,0)'); sg.addColorStop(0.5, 'rgba(255,240,220,0.13)'); sg.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = sg; ctx.fillRect(cx - 160, top, 60, 300);
  ctx.restore();
  // handle
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#141215'; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.moveTo(cx + 200, top + 50); ctx.bezierCurveTo(cx + 320, top + 30, cx + 330, top + 170, cx + 175, top + 200); ctx.stroke();
  ctx.strokeStyle = rgbStr(GOLD, 0.35); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx + 212, top + 38); ctx.bezierCurveTo(cx + 335, top + 18, cx + 348, top + 178, cx + 180, top + 214); ctx.stroke();
  // coffee surface
  const cy = top + 8;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx - 18, ry - 10, 0, 0, TAU); ctx.clip();
  g = ctx.createRadialGradient(cx - 20, cy - 4, 5, cx, cy, rx);
  g.addColorStop(0, '#c08a52'); g.addColorStop(0.35, '#8a5a30'); g.addColorStop(0.75, '#4a2a14'); g.addColorStop(1, '#1d0f07');
  ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  // latte-art swirl
  ctx.strokeStyle = 'rgba(245,225,190,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const u = i / 160, a = u * TAU * 3 + lt * 0.7, r = 0.1 + u * 0.75;
    const x = cx + Math.cos(a) * r * (rx - 30), y = cy + Math.sin(a) * r * (ry - 14);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  // gold rim
  ctx.strokeStyle = rgbStr(GOLD2, 0.9); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, top, rx, ry, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, top + 4, rx - 12, ry - 8, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.restore();
}
function steamPos(i, n, t) {
  const w = Math.floor(i * 3 / n), k = i - Math.floor(w * n / 3), per = n / 3;
  const u = ((k / per) + t * 0.22) % 1;
  const x0 = 540 + (w - 1) * 90;
  const y = 1170 - u * 620;
  const x = x0 + (noise1(u * 3 + t * 0.6, w + 1) - 0.5) * 160 * u + Math.sin(u * 7 + t * 1.3 + w) * 30 * u;
  return [x, y, u, w];
}
function drawSteam(ctx, t, m) {
  const n = SKYLINE.length * 3;
  ctx.save(); ctx.globalCompositeOperation = m > 0.5 ? 'lighter' : 'screen';
  for (let i = 0; i < n; i++) {
    const s = steamPos(i, n, t);
    const tgt = SKYLINE[Math.floor(i / 3)];
    const x = lerp(s[0], tgt[0] + Math.sin(t * 2 + i) * 3, m), y = lerp(s[1], tgt[1] + Math.cos(t * 1.7 + i) * 3, m);
    const life = Math.sin(s[2] * Math.PI);
    const a = lerp(0.07 * life, 0.06, m) * (1 - prog(t, 15.8, 16.3) * 0.8);
    const r = lerp(40 + s[2] * 110, 16, m);
    glow(ctx, x, y, r, a, SPRITE_PUFF);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
 * Scenes 5b–6: coffee map -> city energy (shared top-down/perspective map)
 * ------------------------------------------------------------------------- */
const WORDS = ['ЛЬВІВ', 'ІСТОРІЯ', 'АРХІТЕКТУРА', 'КАВА', 'КУЛЬТУРА'];
function camCityMap(t) {
  const e = Ease.inOutCubic(prog(t, 17.7, 18.6));
  cam.d = lerp(lerp(3.6, 2.8, Ease.outCubic(prog(t, 16.2, 17.9))), 1.75, e);
  const bp = t > 18 ? Math.exp(-((t - 18) % BEAT) * 10) : 0;
  cam.d *= 1 - 0.025 * bp * prog(t, 18.4, 18.6);
  cam.pitch = lerp(0.3, 0.92, e);
  cam.yaw = lerp(-0.25, 0.15, prog(t, 16.2, 18)) + e * lerp(0, -0.9, Ease.inOutSine(prog(t, 18, 22)));
  cam.tx = lerp(0.05, -0.2, e) + 0.35 * Ease.inOutSine(prog(t, 18.3, 22));
  cam.ty = lerp(0.03, -0.25, e) + 0.55 * Ease.inOutSine(prog(t, 18.3, 22));
  cam.tz = 0; cam.cy = lerp(1000, 1180, e);
  cam.setup();
  return e;
}
function S_citymap(ctx, t) {
  const e = camCityMap(t);
  fillBg(ctx, '#0a0a10', '#030305');
  // coffee-map mode: cream streets on dark paper
  const coffee = 1 - e;
  drawStreets(ctx, cam, t, {
    alpha: 0.75 + e * 0.35, width: 1 + e * 0.3, pulse: e * 0.5,
    color: (k, al) => e < 0.5 ? `rgba(240,220,190,${clamp(al * 0.8)})` : rgba(C.gold, clamp(al)),
  });
  // old-town ring
  strokeGlow(ctx, cam.projLine(CITY.ring), GOLD2, 3, 0.7, 4);
  drawSquare(ctx, cam, t, 0.6 + e * 0.4);
  // buildings rise into view as the camera tilts
  renderCity(ctx, cam, t, { rise: b => (b.grp === 'outer' ? 0.9 : 1) * Ease.outCubic(prog(t, 17.85 + (b.seed * 0.5), 18.7 + b.seed * 0.5)), alpha: 0.9 * e, edge: 0.25, windows: 0.8 });
  drawLights(ctx, cam, t, 0.55 * e, 0.9);
  // cafés + coffee icons
  if (coffee > 0.01) drawCoffeeFlow(ctx, t, coffee);
  if (e > 0.01) drawEnergy(ctx, t, e);
  // title carries over from the cup scene
  const ta = 1 - prog(t, 17.6, 17.95);
  if (t < 18) {
    if (t >= 16.7) coffeeTitle(ctx, ta);
    revealLine(ctx, 'кавові маршрути старого міста', 540, 1560, 40, prog(t, 16.6, 17.0), { font: FONT.serif(44), color: C.cream, alpha: ta });
  }
  if (t >= 18) wordCounter(ctx, t);
}
function coffeeTitle(ctx, a) {
  textScrim(ctx, 380, 200, 0.6 * a);
  ctx.save(); ctx.globalAlpha = a;
  setText(ctx, FONT.black(130)); ctx.fillStyle = C.white; ctx.shadowColor = 'rgba(255,170,80,0.5)'; ctx.shadowBlur = 24; ctx.fillText('КАВА —', 540, 330);
  ctx.shadowBlur = 0; setText(ctx, FONT.xbold(78), 4); ctx.fillStyle = C.gold2; ctx.fillText('ОКРЕМА ІСТОРІЯ', 540, 430);
  ctx.restore();
}
function coffeeIcon(ctx, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.fillStyle = '#120d0a'; ctx.strokeStyle = C.gold2; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 2.2; ctx.beginPath();
  ctx.moveTo(-11, -4); ctx.lineTo(-9, 9); ctx.quadraticCurveTo(-8, 12, -4, 12); ctx.lineTo(4, 12); ctx.quadraticCurveTo(8, 12, 9, 9); ctx.lineTo(11, -4); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(13, 3, 4.5, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, -9); ctx.quadraticCurveTo(-7, -13, -4, -17); ctx.moveTo(3, -9); ctx.quadraticCurveTo(0, -13, 3, -17); ctx.stroke();
  ctx.restore();
}
function drawCoffeeFlow(ctx, t, a) {
  const streets = CITY.streets.filter(s => s.kind === 'lane' || s.kind === 'ring' || s.kind === 'art');
  ctx.save();
  // cafés light up one after another
  CITY.cafes.forEach((c, i) => {
    const on = prog(t, 16.5 + i * 0.07, 16.8 + i * 0.07);
    const q = cam.proj(c[0], c[1], 0); if (!q || on <= 0) return;
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, q[0], q[1], 30, a * on * 0.9);
    ctx.globalCompositeOperation = 'source-over';
    const ph = (t * 0.8 + c[2]) % 1;
    ctx.strokeStyle = rgbStr(GOLD2, a * on * (1 - ph) * 0.7); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(q[0], q[1], 8 + ph * 30, 0, TAU); ctx.stroke();
  });
  // coffee couriers with trails
  for (let i = 0; i < 12; i++) {
    const s = streets[(i * 7 + 3) % streets.length];
    const sp = 0.35 + hash1(i) * 0.25;
    const head = ((hash1(i * 3) * s.len + (t - 16.2) * sp) % s.len);
    const trail = [];
    for (let k = 0; k <= 12; k++) { const d = head - k * 0.02; if (d < 0) break; trail.push(pointAt(s.pts, d)); }
    const runs = cam.projLine(trail);
    ctx.lineCap = 'round';
    runs.forEach(r => {
      for (let k = 1; k < r.length; k++) {
        ctx.strokeStyle = rgbStr(GOLD2, a * 0.8 * (1 - k / r.length)); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(r[k - 1][0], r[k - 1][1]); ctx.lineTo(r[k][0], r[k][1]); ctx.stroke();
      }
    });
    const hp = pointAt(s.pts, head); const q = cam.proj(hp[0], hp[1], 0);
    if (q) coffeeIcon(ctx, q[0], q[1], 0.85, a * prog(t, 16.35 + i * 0.05, 16.6 + i * 0.05));
  }
  ctx.restore();
}
function drawEnergy(ctx, t, e) {
  const bp = Math.exp(-((t - 18) % BEAT) * 8) * prog(t, 18, 18.3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // tram lines
  CITY.trams.forEach((r, i) => {
    const runs = cam.projLine(r.pts);
    runs.forEach(rn => { ctx.strokeStyle = `rgba(255,160,70,${0.35 * e})`; ctx.lineWidth = 3; ctx.beginPath(); pathPoly(ctx, rn, false); ctx.stroke(); });
    for (let k = 0; k < 3; k++) {
      const head = ((k / 3) * r.len + (t - 17.5) * (0.6 + i * 0.08) * (i % 2 ? 1 : -1) % r.len + r.len * 4) % r.len;
      const trail = []; for (let j = 0; j <= 14; j++) trail.push(pointAt(r.pts, Math.max(0, head - j * 0.018)));
      cam.projLine(trail).forEach(rn => {
        for (let j = 1; j < rn.length; j++) { ctx.strokeStyle = `rgba(255,${200 - j * 5},120,${e * (1 - j / rn.length)})`; ctx.lineWidth = 6 - j * 0.3; ctx.beginPath(); ctx.moveTo(rn[j - 1][0], rn[j - 1][1]); ctx.lineTo(rn[j][0], rn[j][1]); ctx.stroke(); }
      });
      const hp = pointAt(r.pts, head), q = cam.proj(hp[0], hp[1], 0.004);
      if (q) glow(ctx, q[0], q[1], 30, e);
    }
  });
  // people flows
  const streets = CITY.streets;
  for (let i = 0; i < 260; i++) {
    const s = streets[(i * 13) % streets.length];
    const d = (hash1(i * 1.7) * s.len + (t - 17) * (0.05 + hash1(i) * 0.12) * (i % 2 ? 1 : -1) % s.len + s.len * 8) % s.len;
    const p = pointAt(s.pts, d), q = cam.proj(p[0], p[1], 0.002);
    if (q && q[0] > -10 && q[0] < W + 10 && q[1] > -10 && q[1] < H + 10) glow(ctx, q[0], q[1], 5, 0.7 * e);
  }
  // venues pulsing on the beat
  for (let i = 0; i < 26; i++) {
    const a = hash1(i * 2.2) * TAU, r = 0.15 + hash1(i * 4.1) * 1.6;
    const q = cam.proj(Math.cos(a) * r, Math.sin(a) * r, 0); if (!q) continue;
    glow(ctx, q[0], q[1], 22 + 30 * bp * (i % 2), e * (0.5 + 0.5 * bp));
  }
  ctx.restore();
  // walking people silhouettes (foreground parallax)
  const wa = e * (1 - prog(t, 21.8, 22));
  if (wa > 0) {
    for (let i = 0; i < 5; i++) { const x = ((i * 300 + (t - 17.5) * 70) % 1500) - 200; walker(ctx, W - x, 1905, 185, (t - 17.5) * 5.5 + i * 1.3, wa * 0.85, -1); }
    for (let i = 0; i < 4; i++) { const x = ((i * 380 + 90 + (t - 17.5) * 130) % 1500) - 200; walker(ctx, x, 1985, 290, (t - 17.5) * 6.2 + i * 2.1, wa, 1); }
  }
}
function walker(ctx, x, yb, h, ph, a, dir) {
  const s = h / 100;
  ctx.save(); ctx.translate(x, yb); ctx.scale(s * dir, s); ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  const leg = Math.sin(ph) * 0.45, arm = Math.sin(ph) * 0.4;
  const hipY = -48, shY = -82;
  const limb = (x0, y0, ang, L, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.sin(ang) * L, y0 + Math.cos(ang) * L); ctx.stroke(); };
  ctx.strokeStyle = '#040406';
  limb(0, hipY, leg, 48, 10); limb(0, hipY, -leg, 48, 10);
  limb(0, shY + 4, -arm, 38, 7);
  ctx.fillStyle = '#040406'; ctx.beginPath(); ctx.moveTo(-9, shY); ctx.lineTo(9, shY); ctx.lineTo(8, hipY + 6); ctx.lineTo(-8, hipY + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(1, shY - 11, 8.5, 0, TAU); ctx.fill();
  limb(0, shY + 4, arm, 38, 7);
  // rim light
  ctx.strokeStyle = rgbStr(GOLD, 0.5); ctx.lineWidth = 1.2 / s;
  ctx.beginPath(); ctx.arc(1, shY - 11, 8.5, -Math.PI * 0.9, -Math.PI * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, shY); ctx.lineTo(8, hipY + 6); ctx.stroke();
  ctx.restore();
}
function wordCounter(ctx, t) {
  const t0 = 18.5;
  const idx = Math.min(WORDS.length - 1, Math.floor((t - t0) / BEAT));
  const out = 1 - prog(t, 21.85, 22);
  textScrim(ctx, 880, 260, 0.65 * prog(t, 18.2, 18.5));
  // beat ticks
  const ta = prog(t, 18.2, 18.45) * out;
  ctx.save(); ctx.globalAlpha = ta;
  for (let i = 0; i < 5; i++) {
    const on = t >= t0 + i * BEAT;
    ctx.fillStyle = on ? C.gold2 : 'rgba(232,180,90,0.25)';
    ctx.fillRect(540 - 2.5 * 70 + i * 70 + 8, 1010, 54, on ? 5 : 3);
  }
  setText(ctx, FONT.semi(28), 10); ctx.fillStyle = C.gold;
  ctx.fillText(t < t0 ? '00 / 05' : `0${idx + 1} / 05`, 540, 740);
  ctx.restore();
  if (t < t0) return;
  const lt = t - t0 - idx * BEAT;
  const p = prog(lt, 0, 0.2);
  const word = WORDS[idx];
  const size = word.length > 8 ? 108 : 150;
  const sc = lerp(1.35, 1, Ease.outExpo(p));
  ctx.save();
  ctx.translate(540, 910); ctx.scale(sc, sc);
  setText(ctx, FONT.black(size), lerp(26, 4, Ease.outExpo(p)), 'center', 'alphabetic');
  ctx.globalAlpha = clamp(p * 3) * out;
  ctx.shadowColor = 'rgba(255,170,70,0.8)'; ctx.shadowBlur = 40 * (1 - p) + 20;
  ctx.fillStyle = idx === WORDS.length - 1 ? C.gold2 : C.white;
  ctx.fillText(word, 0, 0);
  ctx.restore();
  // previous word ghost flying up
  if (idx > 0 && lt < 0.18) {
    const q = lt / 0.18, pw = WORDS[idx - 1];
    ctx.save(); ctx.globalAlpha = (1 - q) * 0.5;
    setText(ctx, FONT.black(pw.length > 8 ? 108 : 150), 4); ctx.fillStyle = C.gold;
    ctx.fillText(pw, 540, 910 - q * 140); ctx.restore();
  }
  if (lt < 0.1) flash(ctx, 0.12 * (1 - lt / 0.1));
}

/* ---------------------------------------------------------------------------
 * Scene 7: iconic skyline reveal
 * ------------------------------------------------------------------------- */
function S_skyline(ctx, t) {
  const G = 1480;
  const pull = Ease.inOutCubic(prog(t, 22, 26));
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#07070d'); g.addColorStop(0.55, '#181220'); g.addColorStop(0.76, '#3a2210'); g.addColorStop(0.771, '#0b0908'); g.addColorStop(1, '#030303');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // god rays behind the Opera
  const ra = Ease.outCubic(prog(t, 22.4, 23.6));
  drawRays(ctx, 540, 820, t, ra * 0.95, 1700, 16, 2.3, -Math.PI / 2, [255, 196, 120]);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 540, 900, 700, 0.35 * ra, SPRITE_FLARE); ctx.restore();
  const layer = (s0, fn) => {
    const s = lerp(s0, 1, pull);
    ctx.save(); ctx.translate(540, G); ctx.scale(s, s); ctx.translate(-540, -G); fn(); ctx.restore();
  };
  // far skyline silhouettes rising
  layer(1.1, () => {
    const up = Ease.outCubic(prog(t, 22.0, 22.7));
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(-200, G);
    FAR_SKY.forEach(p => ctx.lineTo(p[0] * 0.8 - 180, G - 150 + (p[1] - 0) * 0.9 * up + (1 - up) * 200));
    ctx.lineTo(1300, G); ctx.closePath(); ctx.fillStyle = '#100f18'; ctx.fill();
    ctx.strokeStyle = rgbStr(GOLD, 0.25 * up); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  });
  // mid layer landmarks
  layer(1.22, () => {
    const items = [
      [SK.george, -60, 0.7, 22.4], [SK.latin, 130, 0.86, 22.05], [SK.korniakt, 310, 0.84, 22.3], [SK.dominican, 800, 0.8, 22.2], [SK.ratusha, 975, 0.88, 22.1],
    ];
    items.forEach(([sk, x, s, st]) => drawSketch(ctx, sk, x, G - 40, s, Ease.inOutSine(prog(t, st, st + 1.0)), { t, fill: 1, lineAlpha: 0.75, fillTop: 'rgba(26,22,28,1)', fillBottom: 'rgba(14,13,20,1)' }));
  });
  // Opera — hero
  layer(1.34, () => {
    drawSketch(ctx, SK.opera, 540, G, 0.98, Ease.inOutSine(prog(t, 22.12, 23.5)), { t, fill: 1, lw: 1.3, fillTop: 'rgba(40,32,30,1)', fillBottom: 'rgba(16,15,22,1)' });
  });
  // statue glint
  const sg = prog(t, 23.35, 23.75);
  if (sg > 0) {
    const s = lerp(1.34, 1, pull);
    const x = 540 + (540 + 55 * 0.98 - 540) * s, y = G + (-690 * 0.98) * s;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, 200 * Math.sin(sg * Math.PI) + 60, 0.9, SPRITE_FLARE); ctx.restore();
  }
  // floor glow & reflection line
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fg = ctx.createLinearGradient(0, G, 0, G + 260);
  fg.addColorStop(0, `rgba(255,190,110,${0.28 * ra})`); fg.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, G, W, 260);
  ctx.restore();
  // title
  textScrim(ctx, 420, 230, 0.55);
  revealLine(ctx, 'МІСТО, ЯКЕ', 540, 390, 110, prog(t, 23.25, 23.8), { font: FONT.black(110), spacing: 3, color: C.white, glow: 'rgba(255,180,80,0.45)', alpha: 1 - prog(t, 25.85, 26) });
  revealLine(ctx, 'ВАЖКО СПЛУТАТИ', 540, 500, 84, prog(t, 23.5, 24.05), { font: FONT.xbold(84), spacing: 3, color: C.gold2, glow: 'rgba(255,170,60,0.5)', alpha: 1 - prog(t, 25.85, 26) });
}

/* ---------------------------------------------------------------------------
 * Scene 8: final — city collapses into a glowing point on Ukraine
 * ------------------------------------------------------------------------- */
function camFinal(t) {
  const e = Ease.inOutQuart(prog(t, 26.0, 27.9));
  const lnd = lerp(Math.log(0.55), Math.log(2350), e) + lerp(0, -0.05, prog(t, 27.9, 29.5));
  cam.d = Math.exp(lnd);
  cam.pitch = lerp(1.02, 0.32, Ease.inOutCubic(prog(t, 26.2, 28.0)));
  cam.yaw = lerp(1.55, 0, Ease.inOutCubic(prog(t, 26.0, 27.9)));
  const tp = Ease.inOutCubic(prog(t, 26.6, 27.9));
  cam.tx = lerp(0, UA_CENTER[0], tp); cam.ty = lerp(0, UA_CENTER[1] - 60, tp);
  cam.tz = 0; cam.cy = lerp(1120, 1290, tp);
  cam.setup();
}
function S_final(ctx, t) {
  camFinal(t);
  const d = cam.d;
  fillBg(ctx, '#080a12', '#030305');
  drawGraticule(ctx, cam, 0.07 * clamp((Math.log(d) - 3) / 2));
  drawUkraine(ctx, cam, t, { alpha: 1, draw: 1, thick: 22 * prog(t, 27.0, 27.9), hatch: 1, cities: clamp((Math.log(d) - 4.2) / 1.5) * 0.8, lw: 2.8 });
  const near = clamp((Math.log(30) - Math.log(d)) / 1.6);
  drawStreets(ctx, cam, t, { alpha: near * 0.9 });
  drawSquare(ctx, cam, t, clamp((Math.log(4) - Math.log(d)) / 0.8));
  drawLights(ctx, cam, t, clamp((Math.log(d) - Math.log(1.0)) / 1.0) * clamp((Math.log(400) - Math.log(d)) / 1.2), clamp(40 / d, 0.5, 1.6));
  renderCity(ctx, cam, t, { alpha: clamp((Math.log(7) - Math.log(d)) / 0.9), edge: 0.3, windows: clamp((Math.log(2) - Math.log(d)) / 0.8), ratushaGlow: 0.5 });
  // Lviv becomes the glowing point
  const mk = clamp((Math.log(d) - Math.log(40)) / 1.5);
  drawMarker(ctx, cam, t, mk, 1.0 + 0.4 * prog(t, 27.6, 28.2));
  const q = cam.proj(0, 0, 0);
  if (q) {
    drawRays(ctx, q[0], q[1], t, mk * 0.5, 900, 14, TAU, t * 0.15);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, q[0], q[1], 260, 0.5 * mk, SPRITE_FLARE); ctx.restore();
  }
  // final type
  const fa = prog(t, 27.25, 27.6);
  textScrim(ctx, 620, 300, 0.5 * fa);
  if (t > 27.2) {
    const p = prog(t, 27.25, 27.75), e = Ease.outExpo(p);
    ctx.save(); ctx.translate(540, 610); ctx.scale(lerp(1.5, 1, e), lerp(1.5, 1, e));
    setText(ctx, `900 170px MS, Emoji`, lerp(30, 4, e), 'center', 'alphabetic');
    ctx.globalAlpha = clamp(p * 3);
    ctx.shadowColor = 'rgba(255,180,80,0.7)'; ctx.shadowBlur = 50 * (1 - e) + 26;
    ctx.fillStyle = C.white; ctx.fillText('ЛЬВІВ 🇺🇦', 0, 0);
    ctx.restore();
    if (t < 27.5) flash(ctx, 0.35 * (1 - prog(t, 27.25, 27.5)));
  }
  kineticChars(ctx, 'Скільки разів ти тут був?', 540, 740, 62, 27.95, t, { font: FONT.serif(64), color: C.gold2, stagger: 0.022, dur: 0.45, rise: 30 });
}

/* ---------------------------------------------------------------------------
 * Master compositor
 * ------------------------------------------------------------------------- */
function sceneAt(ctx, t) {
  if (t < 10.0) S_map(ctx, t);
  else if (t < 14.0) S_street(ctx, t);
  else if (t < 16.2) S_coffee(ctx, t);
  else if (t < 22.0) S_citymap(ctx, t);
  else if (t < 26.0) S_skyline(ctx, t);
  else S_final(ctx, t);
}
function resetCtx(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.shadowColor = 'transparent'; c.filter = 'none'; }

function drawFrame(ctx, tIn, frameIn) {
  const HOLD = 29.5;
  const t = Math.min(tIn, HOLD);
  const frame = Math.min(frameIn, Math.round(HOLD * FPS));
  resetCtx(ctx);
  if (t >= 9.72 && t < 10.12) {
    // slit transition: Market Square -> old city street
    S_map(ctx, t);
    resetCtx(BUFCTX); S_street(BUFCTX, Math.max(t, 9.72));
    const p = Ease.inOutExpo(prog(t, 9.72, 10.12));
    const hh = H * p / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 960 - hh, W, hh * 2); ctx.clip(); ctx.drawImage(BUF, 0, 0); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,215,150,${0.9 * (1 - p * 0.6)})`;
    ctx.fillRect(0, 960 - hh - 2, W, 4); ctx.fillRect(0, 960 + hh - 2, W, 4);
    glow(ctx, 540, 960 - hh, 300, 0.6 * (1 - p), SPRITE_FLARE); glow(ctx, 540, 960 + hh, 300, 0.6 * (1 - p), SPRITE_FLARE);
    ctx.restore();
  } else if (t >= 16.2 && t < 16.7) {
    // coffee -> map: dive into the cup
    S_citymap(ctx, t);
    resetCtx(BUFCTX); S_coffee(BUFCTX, t, true);
    const p = prog(t, 16.2, 16.7), e = Ease.inExpo(p);
    ctx.save(); ctx.globalAlpha = 1 - Ease.inCubic(p);
    ctx.translate(540, 1198); ctx.scale(1 + e * 7, 1 + e * 7); ctx.translate(-540, -1198);
    ctx.drawImage(BUF, 0, 0); ctx.restore();
    resetCtx(ctx); coffeeTitle(ctx, 1);
  } else {
    sceneAt(ctx, t);
  }
  resetCtx(ctx);
  // cut flashes
  if (t >= 14 && t < 14.2) flash(ctx, 0.7 * (1 - prog(t, 14, 14.2)));
  if (t >= 21.75 && t < 22) flash(ctx, 0.85 * Ease.inExpo(prog(t, 21.75, 22)));
  if (t >= 22 && t < 22.3) flash(ctx, 0.85 * (1 - Ease.outCubic(prog(t, 22, 22.3))));
  if (t >= 26 && t < 26.3) flash(ctx, 0.75 * (1 - Ease.outCubic(prog(t, 26, 26.3))));
  // atmosphere
  const dustA = 0.6 + 0.6 * prog(t, 22, 23) * (1 - prog(t, 26, 26.5));
  drawDust(ctx, t, 46, dustA);
  drawVignette(ctx, 0.78);
  // series tag
  const ua = prog(t, 2.3, 2.7) * (1 - prog(t, 25.6, 25.95));
  if (ua > 0) {
    ctx.save(); ctx.globalAlpha = ua * 0.8;
    setText(ctx, FONT.semi(24), 9); ctx.fillStyle = C.cream; ctx.fillText('ЛЬВІВ ЗА 30 СЕКУНД', 540, 196);
    ctx.fillStyle = 'rgba(245,234,214,0.18)'; ctx.fillRect(540 - 130, 216, 260, 2);
    ctx.fillStyle = C.gold2; ctx.fillRect(540 - 130, 216, 260 * clamp(t / 30), 2);
    ctx.restore();
  }
  drawGrain(ctx, frame, 0.07);
}
