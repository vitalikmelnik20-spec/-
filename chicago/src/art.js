'use strict';
/* ---------------------------------------------------------------------------
 * Illustration library for "Chicago — the real cost of living".
 * Polished flat-vector art with soft gradients and shadows. The skyline is
 * built once per lighting mood into offscreen canvases (far / mid / near
 * parallax layers); everything else is drawn per frame as vectors.
 * ------------------------------------------------------------------------- */
const COL = {
  navy: '#0A0F1E', ink: '#0E1528', white: '#FFFFFF', off: '#EEF2FA',
  green: '#2BE38B', green2: '#8CFFC8', orange: '#FF8A1F', red: '#FF4B3E', gold: '#FFC857',
  steel: '#C9D1DC', muted: '#9AA6BD',
};
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function shadow(g, blur, oy = 10, a = 0.35) { g.shadowColor = `rgba(0,0,0,${a})`; g.shadowBlur = blur; g.shadowOffsetY = oy; g.shadowOffsetX = 0; }
function noShadow(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }

/* ---------------- Chicago skyline ---------------- */
const SKY_W = 1900, SKY_H = 1400;
const MOODS = {
  golden: { top: '#3B2E5A', bot: '#15122A', rim: 'rgba(255,170,90,', win: ['rgba(255,196,120,0.55)', 'rgba(255,220,160,0.35)'], lit: 0.18, far: '#7C5A86', haze: 'rgba(255,170,120,0.18)' },
  dusk: { top: '#24325E', bot: '#0E1430', rim: 'rgba(140,170,255,', win: ['rgba(255,214,140,0.9)', 'rgba(190,220,255,0.7)'], lit: 0.32, far: '#3A4C80', haze: 'rgba(120,150,230,0.16)' },
  night: { top: '#121A36', bot: '#070B18', rim: 'rgba(110,140,255,', win: ['rgba(255,214,140,0.95)', 'rgba(200,225,255,0.85)'], lit: 0.42, far: '#1E2850', haze: 'rgba(80,110,220,0.14)' },
};
// iconic mid layer (x = left edge, w, h; ground at SKY_H)
const MID = [
  { t: 'box', x: 40, w: 120, h: 470 }, { t: 'deco', x: 175, w: 120, h: 660 }, { t: 'box', x: 310, w: 100, h: 540 },
  { t: 'willis', x: 430, w: 190, h: 1080 }, { t: 'box', x: 640, w: 120, h: 600 }, { t: 'spire', x: 775, w: 110, h: 760 },
  { t: 'aon', x: 905, w: 135, h: 930 }, { t: 'box', x: 1055, w: 95, h: 520 }, { t: 'marina', x: 1165, w: 150, h: 540 },
  { t: 'box', x: 1330, w: 110, h: 640 }, { t: 'hancock', x: 1455, w: 175, h: 950 }, { t: 'box', x: 1645, w: 115, h: 560 },
  { t: 'box', x: 1770, w: 120, h: 430 },
];
function buildingPath(g, b) {
  const { x, w, h } = b, y0 = SKY_H, top = y0 - h;
  g.beginPath();
  if (b.t === 'willis') {      // stepped bundled tube
    const segs = [[0, 1, 0.46], [0, 0.72, 0.62], [0.28, 0.72, 0.83], [0.28, 0.44, 1]];
    segs.forEach(([ox, fw, fh]) => g.rect(x + ox * w, y0 - h * fh, fw * w, h * fh));
  } else if (b.t === 'hancock') { // tapered
    g.moveTo(x, y0); g.lineTo(x + w * 0.19, top); g.lineTo(x + w * 0.81, top); g.lineTo(x + w, y0); g.closePath();
  } else if (b.t === 'deco') {    // art-deco setbacks + pyramid roof
    g.rect(x, y0 - h * 0.78, w, h * 0.78); g.rect(x + w * 0.12, y0 - h * 0.88, w * 0.76, h * 0.1);
    g.moveTo(x + w * 0.2, y0 - h * 0.88); g.lineTo(x + w * 0.5, top); g.lineTo(x + w * 0.8, y0 - h * 0.88); g.closePath();
  } else if (b.t === 'spire') {
    g.rect(x, y0 - h * 0.86, w, h * 0.86);
    g.moveTo(x, y0 - h * 0.86); g.quadraticCurveTo(x + w / 2, y0 - h * 1.0, x + w, y0 - h * 0.86); g.closePath();
  } else if (b.t === 'marina') {  // two "corncob" towers
    const cw = w * 0.4;
    [0, w - cw].forEach(ox => { g.roundRect(x + ox, top, cw, h, [cw / 2, cw / 2, 0, 0]); });
  } else g.rect(x, top, w, h);
}
function drawBuilding(g, b, m, r) {
  const { x, w, h } = b, y0 = SKY_H, top = y0 - h;
  g.save();
  buildingPath(g, b);
  g.fillStyle = lin(g, 0, top, 0, y0, [[0, m.top], [1, m.bot]]); g.fill();
  g.clip();
  // vertical seams / ribs
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
  const ribs = b.t === 'aon' ? 12 : b.t === 'willis' ? 6 : 0;
  for (let i = 1; i < ribs; i++) { g.beginPath(); g.moveTo(x + i * w / ribs, top); g.lineTo(x + i * w / ribs, y0); g.stroke(); }
  if (b.t === 'aon') { g.strokeStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i <= 24; i++) { g.beginPath(); g.moveTo(x + i * w / 24, top); g.lineTo(x + i * w / 24, y0); g.stroke(); } }
  if (b.t === 'hancock') { // X bracing
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 4;
    const n = 5; for (let i = 0; i < n; i++) { const ya = top + i * h / n, yb = ya + h / n; g.beginPath(); g.moveTo(x, ya); g.lineTo(x + w, yb); g.moveTo(x + w, ya); g.lineTo(x, yb); g.stroke(); g.beginPath(); g.moveTo(x, yb); g.lineTo(x + w, yb); g.stroke(); }
  }
  if (b.t === 'marina') { // scalloped balcony rings
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; const cw = w * 0.4;
    [0, w - cw].forEach(ox => { for (let yy = top + cw * 0.6; yy < y0 - h * 0.3; yy += 16) { for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + ox + cw * (k + 0.5) / 4, yy, cw / 8, 0, Math.PI); g.stroke(); } } });
  }
  // windows
  const ww = 6, wh = 9, sx = 15, sy = 21;
  for (let yy = top + 14; yy < y0 - 10; yy += sy) for (let xx = x + 8; xx < x + w - 8; xx += sx) {
    const v = r();
    if (v < m.lit) { g.fillStyle = v < m.lit * 0.72 ? m.win[0] : m.win[1]; g.fillRect(xx, yy, ww, wh); }
    else if (v < m.lit + 0.25) { g.fillStyle = 'rgba(255,255,255,0.045)'; g.fillRect(xx, yy, ww, wh); }
  }
  // rim light on the left edge (sun / city glow)
  g.fillStyle = lin(g, x, 0, x + w * 0.35, 0, [[0, m.rim + '0.55)'], [1, m.rim + '0)']]); g.fillRect(x, top, w * 0.35, h);
  g.fillStyle = lin(g, 0, top, 0, top + 120, [[0, m.rim + '0.35)'], [1, m.rim + '0)']]); g.fillRect(x, top, w, 120);
  g.restore();
  // antennas
  const tips = [];
  const ant = (ax, ah) => { g.fillStyle = '#D9DEE8'; g.fillRect(ax - 3, top - ah, 6, ah); g.fillRect(ax - 7, top - 10, 14, 10); tips.push([ax, top - ah]); };
  if (b.t === 'willis') { ant(x + w * 0.39, 150); ant(x + w * 0.61, 130); }
  if (b.t === 'hancock') { ant(x + w * 0.4, 135); ant(x + w * 0.6, 115); }
  if (b.t === 'spire') { g.fillStyle = '#D9DEE8'; g.fillRect(x + w / 2 - 3, top - 70, 6, 80); tips.push([x + w / 2, top - 70]); }
  if (b.t === 'deco') { g.fillStyle = '#E8D9A8'; g.fillRect(x + w / 2 - 4, top - 30, 8, 30); }
  return tips;
}
function buildSkyline(mood) {
  const m = MOODS[mood], r = rng(mood === 'golden' ? 11 : mood === 'dusk' ? 23 : 37);
  // far layer: hazy, slightly blurred
  const far = mk(SKY_W, SKY_H), gf = far.getContext('2d');
  const rf = rng(5);
  for (let i = 0; i < 30; i++) {
    const w = 70 + rf() * 110, h = 220 + rf() * 460, x = i * 64 + rf() * 30 - 40;
    gf.fillStyle = m.far; gf.fillRect(x, SKY_H - h, w, h);
    gf.fillStyle = 'rgba(255,255,255,0.05)'; for (let yy = SKY_H - h + 10; yy < SKY_H; yy += 24) gf.fillRect(x + 6, yy, w - 12, 3);
  }
  const farB = mk(SKY_W, SKY_H), gb = farB.getContext('2d'); gb.filter = 'blur(3px)'; gb.drawImage(far, 0, 0);
  gb.filter = 'none'; gb.fillStyle = m.haze; gb.globalCompositeOperation = 'source-atop'; gb.fillRect(0, 0, SKY_W, SKY_H);
  // mid layer: the recognisable skyline
  const mid = mk(SKY_W, SKY_H), gm = mid.getContext('2d'); let tips = [];
  MID.forEach(b => { tips = tips.concat(drawBuilding(gm, b, m, r)); });
  // near layer: low-rise blocks + water towers
  const near = mk(SKY_W, SKY_H), gn = near.getContext('2d'); const rn = rng(9);
  const mn = { ...m, top: m.bot, bot: '#04060C', lit: m.lit * 0.8 };
  for (let i = 0; i < 16; i++) {
    const w = 90 + rn() * 120, h = 120 + rn() * 260, x = i * 125 - 30 + rn() * 30;
    drawBuilding(gn, { t: 'box', x, w, h }, mn, rn);
    if (rn() < 0.3) { // rooftop water tower, a Chicago staple
      const tx = x + w * 0.6, ty = SKY_H - h; gn.fillStyle = '#05070D';
      gn.fillRect(tx - 18, ty - 40, 36, 30); gn.beginPath(); gn.moveTo(tx - 22, ty - 40); gn.lineTo(tx, ty - 60); gn.lineTo(tx + 22, ty - 40); gn.fill();
      gn.fillRect(tx - 16, ty - 10, 4, 10); gn.fillRect(tx + 12, ty - 10, 4, 10);
    }
  }
  return { far: farB, mid, near, tips };
}
let SKY = {};
function skyBg(g, mood, t, opt = {}) {
  const grads = {
    golden: [[0, '#2B3A7A'], [0.35, '#B05A7A'], [0.62, '#FF9A55'], [0.8, '#FFD08A'], [1, '#FFE3B0']],
    dusk: [[0, '#0B1230'], [0.5, '#27407E'], [0.8, '#5A6FB8'], [1, '#B98FB8']],
    night: [[0, '#03050D'], [0.6, '#0B1430'], [1, '#1B2650']],
  };
  g.fillStyle = lin(g, 0, 0, 0, opt.horizon || H * 0.72, grads[mood]); g.fillRect(0, 0, W, H);
  if (mood === 'night' || mood === 'dusk') { // stars
    for (let i = 0; i < 70; i++) { const a = (0.2 + 0.5 * hash1(i * 3.1)) * (0.6 + 0.4 * Math.sin(t * 2 + i)); g.fillStyle = `rgba(255,255,255,${a * (mood === 'night' ? 1 : 0.4)})`; g.fillRect(hash1(i) * W, hash1(i * 7.3) * H * 0.45, 2, 2); }
  }
}
/* draw the three skyline layers with parallax; cx = screen x of the skyline centre, base = screen y of ground */
function skyline(g, mood, cx, base, scale, t, opt = {}) {
  const s = SKY[mood]; const par = opt.par || [0.55, 1, 1.6];
  const layer = (img, k, dy = 0) => {
    const sc = scale * (1 + (k - 1) * (opt.depth || 0));
    const w = SKY_W * sc, h = SKY_H * sc;
    g.drawImage(img, cx - w / 2 + (opt.pan || 0) * k, base - h + dy * sc, w, h);
  };
  layer(s.far, par[0], -60);
  layer(s.mid, par[1]);
  if (opt.tips !== false) { // blinking aircraft-warning lights on the antennas
    const sc = scale; const on = Math.sin(t * 5) > 0;
    s.tips.forEach(([x, y], i) => {
      const px = cx - SKY_W * sc / 2 + x * sc + (opt.pan || 0), py = base - SKY_H * sc + y * sc;
      if (on || i % 2) glow(g, px, py, 14 * sc + 6, mood === 'golden' ? 0.4 : 0.9, SPRITE_REDLIGHT);
    });
  }
  if (opt.near !== false) layer(s.near, par[2], 30);
}

/* ---------------- apartment building with a one-bedroom cutaway ---------------- */
const APT = { w: 620, floors: 8, fh: 112 };
function apartment(g, x, base, s, open, t, opt = {}) {
  const { w, floors, fh } = APT, h = floors * fh + 90;
  g.save(); g.translate(x, base); g.scale(s, s);
  shadow(g, 60, 30, 0.45);
  g.fillStyle = lin(g, -w / 2, 0, w / 2, 0, [[0, '#7A4636'], [0.5, '#8E5442'], [1, '#5E352A']]);
  g.fillRect(-w / 2, -h, w, h); noShadow(g);
  // brick coursing
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2;
  for (let yy = -h + 8; yy < 0; yy += 14) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); }
  // cornice + roof
  g.fillStyle = '#3B2A2A'; g.fillRect(-w / 2 - 14, -h - 18, w + 28, 30);
  g.fillStyle = '#2A1F22'; g.fillRect(-w / 2 + 60, -h - 60, 90, 42); // mechanical
  // ground floor retail glass
  g.fillStyle = lin(g, 0, -fh, 0, 0, [[0, '#2C4766'], [1, '#14263D']]); g.fillRect(-w / 2 + 20, -fh + 14, w - 40, fh - 14);
  g.fillStyle = 'rgba(255,214,150,0.25)'; g.fillRect(-w / 2 + 20, -fh + 14, w - 40, 18);
  for (let i = 1; i < 5; i++) { g.fillStyle = '#3B2A2A'; g.fillRect(-w / 2 + 20 + i * (w - 40) / 5 - 4, -fh + 14, 8, fh - 14); }
  // window grid
  const unitFloor = opt.floor == null ? 5 : opt.floor;
  for (let f = 1; f < floors; f++) {
    const y = -fh * (f + 1) - 4;
    for (let k = 0; k < 4; k++) {
      const wx = -w / 2 + 34 + k * (w - 68) / 4, ww = (w - 68) / 4 - 26;
      const lit = hash1(f * 7 + k) < (opt.night ? 0.55 : 0.25);
      g.fillStyle = lit ? lin(g, 0, y, 0, y + fh - 30, [[0, '#FFE0A8'], [1, '#FFB766']]) : lin(g, 0, y, 0, y + fh - 30, [[0, '#9DB8D8'], [1, '#3D5878']]);
      g.fillRect(wx, y + 14, ww, fh - 36);
      g.fillStyle = '#E8E1D6'; g.fillRect(wx - 4, y + fh - 22, ww + 8, 6); // sill
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx + 6, y + 18, 8, fh - 48);
    }
  }
  // the highlighted unit: facade panel swings open like a door (fake perspective)
  const uy = -fh * (unitFloor + 1) - 4, ux = -w / 2 + 22, uw = w - 44, uh = fh * 2; // two floors tall: keeps the room in proportion
  if (open > 0) {
    g.save(); g.beginPath(); g.rect(ux, uy, uw, uh); g.clip();
    g.fillStyle = '#EADBC4'; g.fillRect(ux, uy, uw, uh);
    const k = uh / 260; g.translate(ux + (uw - 560 * k) / 2, uy); g.scale(k, k); interior(g, t, opt.night); g.restore();
    // outline glow
    g.strokeStyle = `rgba(43,227,139,${0.9 * open})`; g.lineWidth = 6; g.strokeRect(ux, uy, uw, uh);
    const pw = uw * (1 - open); // panel hinged on the left, shrinking with skew = swing
    if (pw > 2) {
      g.save(); g.translate(ux, uy); g.transform(1, -0.25 * open, 0, 1, 0, 0);
      g.fillStyle = '#7F4A3A'; g.fillRect(0, 0, pw, uh);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(pw - 10, 0, 10, uh); g.restore();
    }
  }
  g.restore();
  return { ux, uy, uw, uh };
}
/* a modest one-bedroom (not a luxury penthouse), drawn in a 560x260 box */
function interior(g, t, night) {
  g.fillStyle = lin(g, 0, 0, 0, 260, [[0, '#F3E6D3'], [1, '#E2CFB6']]); g.fillRect(0, 0, 560, 260);
  g.fillStyle = lin(g, 0, 200, 0, 260, [[0, '#B98C62'], [1, '#93683F']]); g.fillRect(0, 205, 560, 55); // floor
  for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(i * 72, 205, 2, 55); }
  // window with a skyline view
  g.fillStyle = night ? '#0E1838' : lin(g, 0, 30, 0, 150, [[0, '#7FB2E8'], [1, '#CFE3F5']]); g.fillRect(210, 30, 150, 120);
  g.fillStyle = night ? '#1C2A55' : '#6F86A8';
  [[220, 80, 18, 70], [242, 60, 22, 90], [268, 95, 14, 55], [286, 50, 20, 100], [310, 85, 16, 65], [330, 70, 22, 80]].forEach(([a, b, c, d]) => g.fillRect(a, b, c, d));
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; g.strokeRect(210, 30, 150, 120); g.beginPath(); g.moveTo(285, 30); g.lineTo(285, 150); g.stroke();
  // bed
  g.fillStyle = '#5B6C8F'; rr(g, 30, 150, 170, 60, 10); g.fill();
  g.fillStyle = '#F7F7F2'; rr(g, 30, 140, 170, 26, 8); g.fill();
  g.fillStyle = '#FFFFFF'; rr(g, 40, 128, 50, 20, 8); g.fill(); rr(g, 96, 128, 50, 20, 8); g.fill();
  g.fillStyle = '#6B4A35'; g.fillRect(24, 100, 10, 110);
  // lamp + nightstand
  g.fillStyle = '#7A5A42'; g.fillRect(205, 170, 40, 40);
  g.fillStyle = '#FFE7B0'; g.beginPath(); g.moveTo(212, 140); g.lineTo(238, 140); g.lineTo(232, 120); g.lineTo(218, 120); g.fill();
  glow(g, 225, 135, 50, 0.4 + 0.05 * Math.sin(t * 3));
  // sofa + plant + kitchen counter
  g.fillStyle = '#2F7A6A'; rr(g, 290, 160, 140, 50, 12); g.fill(); rr(g, 290, 140, 140, 30, 10); g.fill();
  g.fillStyle = '#B98C62'; g.fillRect(445, 120, 100, 90); g.fillStyle = '#F2F2F2'; g.fillRect(440, 112, 110, 12);
  g.fillStyle = '#C9D1DC'; g.fillRect(470, 70, 50, 34);
  g.fillStyle = '#3C8F4A'; g.beginPath(); g.ellipse(395, 120, 14, 26, 0.3, 0, TAU); g.fill(); g.fillStyle = '#8A5A3A'; g.fillRect(386, 135, 18, 22);
}

/* ---------------- elevated "L" structure + train ---------------- */
function elevated(g, y, t, xo = 0, s = 1) {
  g.save();
  const deck = 46 * s;
  // columns down to street
  for (let x = ((xo % 260) + 260) % 260 - 260; x < W + 260; x += 260) {
    g.fillStyle = '#2A3346'; g.fillRect(x + 20, y + deck, 26 * s, H - y);
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 20, y + deck, 6 * s, H - y);
  }
  // lattice girder
  g.fillStyle = '#323C52'; g.fillRect(0, y, W, deck);
  g.strokeStyle = '#4A5672'; g.lineWidth = 5 * s;
  const step = 52 * s;
  for (let x = ((xo % step) + step) % step - step; x < W + step; x += step) { g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x + step / 2, y + deck - 6); g.lineTo(x + step, y + 6); g.stroke(); }
  g.fillStyle = '#1E2536'; g.fillRect(0, y - 10 * s, W, 12 * s); // rails
  g.restore();
}
function train(g, x, y, s, t, cars = 4) {
  const cl = 430, ch = 128;
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let c = 0; c < cars; c++) {
    const cx = c * (cl + 14);
    shadow(g, 20, 8, 0.4);
    g.fillStyle = lin(g, 0, -ch, 0, 0, [[0, '#F2F5FA'], [0.45, '#C3CBD8'], [1, '#8C96A8']]);
    rr(g, cx, -ch, cl, ch, c === 0 ? [40, 10, 10, 18] : 10); g.fill(); noShadow(g);
    // window band
    g.fillStyle = lin(g, 0, -ch + 22, 0, -ch + 70, [[0, '#1B2638'], [1, '#2E3E58']]); g.fillRect(cx + 26, -ch + 22, cl - 52, 46);
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(cx + 40 + k * 64, -ch + 26, 14, 38); }
    // doors
    g.fillStyle = 'rgba(40,52,72,0.6)'; g.fillRect(cx + cl * 0.3, -ch + 18, 6, ch - 30); g.fillRect(cx + cl * 0.7, -ch + 18, 6, ch - 30);
    g.fillStyle = '#C8102E'; g.fillRect(cx + 10, -40, cl - 20, 8); // line-colour stripe
    g.fillStyle = '#2A3346'; g.fillRect(cx + 40, -6, 80, 12); g.fillRect(cx + cl - 120, -6, 80, 12);
  }
  // headlight + route sign on the leading (right) end
  const fx = (cars - 1) * (cl + 14) + cl;
  glow(g, fx - 10, -40, 60, 0.9); g.fillStyle = '#FFF5D0'; g.beginPath(); g.arc(fx - 12, -40, 7, 0, TAU); g.fill();
  g.restore();
}

/* ---------------- groceries ---------------- */
function cart(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#D5DCE6'; g.lineWidth = 7; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-210, -250); g.lineTo(200, -250); g.lineTo(160, -60); g.lineTo(-170, -60); g.closePath(); g.stroke();
  g.lineWidth = 3; g.strokeStyle = 'rgba(213,220,230,0.8)';
  for (let i = 1; i < 9; i++) { const u = i / 9; g.beginPath(); g.moveTo(lerp(-210, 200, u), -250); g.lineTo(lerp(-170, 160, u), -60); g.stroke(); }
  for (let j = 1; j < 4; j++) { const v = j / 4; g.beginPath(); g.moveTo(lerp(-210, -170, v), lerp(-250, -60, v)); g.lineTo(lerp(200, 160, v), lerp(-250, -60, v)); g.stroke(); }
  g.lineWidth = 8; g.strokeStyle = '#D5DCE6';
  g.beginPath(); g.moveTo(-210, -250); g.lineTo(-260, -320); g.lineTo(-300, -320); g.stroke(); // handle
  g.fillStyle = '#FF4B3E'; rr(g, -318, -330, 50, 20, 8); g.fill();
  g.beginPath(); g.moveTo(-170, -60); g.lineTo(-150, -10); g.lineTo(150, -10); g.lineTo(160, -60); g.stroke();
  [[-130, 0], [120, 0]].forEach(([wx, wy]) => { g.save(); g.translate(wx, wy); g.rotate(t * 14); g.fillStyle = '#1B2230'; g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.fill(); g.fillStyle = '#8A94A6'; g.fillRect(-3, -18, 6, 36); g.restore(); });
  g.restore();
}
const ITEMS = ['milk', 'eggs', 'bread', 'chicken', 'apple', 'broccoli', 'carrots'];
function item(g, kind, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); shadow(g, 18, 8, 0.35);
  if (kind === 'milk') {
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(-40, 70); g.lineTo(-40, -50); g.lineTo(0, -85); g.lineTo(40, -50); g.lineTo(40, 70); g.fill(); noShadow(g);
    g.fillStyle = '#2F6FD6'; g.fillRect(-40, -10, 80, 40); g.fillStyle = '#EAF0FA'; g.fillRect(-40, -50, 80, 10);
  } else if (kind === 'eggs') {
    g.fillStyle = '#D9C2A0'; rr(g, -80, -20, 160, 50, 10); g.fill(); noShadow(g);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#FFF3E0'; g.beginPath(); g.ellipse(-56 + i * 37, -22, 16, 20, 0, 0, TAU); g.fill(); }
  } else if (kind === 'bread') {
    g.fillStyle = '#C98A45'; g.beginPath(); g.ellipse(0, 0, 90, 45, 0, 0, TAU); g.fill(); noShadow(g);
    g.strokeStyle = '#F2CB8C'; g.lineWidth = 6; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 35 - 14, -30); g.lineTo(i * 35 + 14, 28); g.stroke(); }
  } else if (kind === 'chicken') {
    g.fillStyle = '#E2A76B'; g.beginPath(); g.ellipse(-10, 0, 60, 42, -0.4, 0, TAU); g.fill(); noShadow(g);
    g.fillStyle = '#F5EBDD'; g.fillRect(36, -38, 30, 16); g.beginPath(); g.arc(70, -42, 12, 0, TAU); g.arc(70, -18, 12, 0, TAU); g.fill();
  } else if (kind === 'apple') {
    g.fillStyle = '#E2342F'; g.beginPath(); g.arc(-14, 0, 40, 0, TAU); g.arc(14, 0, 40, 0, TAU); g.fill(); noShadow(g);
    g.fillStyle = '#5A3A22'; g.fillRect(-3, -55, 6, 22); g.fillStyle = '#3EA14A'; g.beginPath(); g.ellipse(16, -48, 18, 8, -0.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-24, -14, 10, 16, -0.4, 0, TAU); g.fill();
  } else if (kind === 'broccoli') {
    g.fillStyle = '#7BBF5A'; g.fillRect(-12, 0, 24, 60); noShadow(g);
    g.fillStyle = '#2F8A3A'; [[-30, -10], [0, -30], [30, -10], [-15, -40], [18, -40]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 28, 0, TAU); g.fill(); });
  } else if (kind === 'carrots') {
    for (let k = -1; k <= 1; k++) { g.save(); g.rotate(k * 0.25); g.fillStyle = '#F27A1A'; g.beginPath(); g.moveTo(-14, -40); g.lineTo(14, -40); g.lineTo(0, 70); g.fill(); g.fillStyle = '#3EA14A'; g.fillRect(-4, -62, 8, 24); g.restore(); }
    noShadow(g);
  }
  noShadow(g); g.restore();
}
function aisle(g, t, speed) {
  // supermarket aisle in one-point perspective, shelves scrolling past (rendered soft for depth of field)
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#E9EEF5'], [0.5, '#D3DCE8'], [1, '#A8B4C6']]); g.fillRect(0, 0, W, H);
  const vx = 540, vy = 820;
  for (let i = 0; i < 9; i++) { // ceiling lights
    const z = ((i - t * speed * 0.6) % 9 + 9) % 9 + 0.6, k = 1 / z;
    g.fillStyle = `rgba(255,255,255,${clamp(0.9 * k * 2)})`; g.fillRect(vx - 160 * k * 3, vy - 900 * k, 320 * k * 3, 24 * k);
  }
  [-1, 1].forEach(side => {
    for (let i = 14; i >= 0; i--) {
      const z0 = ((i - t * speed) % 14 + 14) % 14 + 0.5, z1 = z0 + 1;
      const x0 = vx + side * 1100 / z0, x1 = vx + side * 1100 / z1;
      for (let sh = 0; sh < 5; sh++) {
        const ya0 = vy - 700 / z0 + sh * 300 / z0, ya1 = vy - 700 / z1 + sh * 300 / z1;
        const hue = (i * 47 + sh * 83 + (side > 0 ? 30 : 0)) % 360;
        g.fillStyle = `hsl(${hue},55%,${48 + (sh % 2) * 8}%)`;
        g.beginPath(); g.moveTo(x0, ya0); g.lineTo(x1, ya1); g.lineTo(x1, ya1 + 250 / z1); g.lineTo(x0, ya0 + 250 / z0); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.beginPath(); g.moveTo(x0, ya0 + 250 / z0); g.lineTo(x1, ya1 + 250 / z1); g.lineTo(x1, ya1 + 270 / z1); g.lineTo(x0, ya0 + 270 / z0); g.fill();
      }
    }
  });
  g.fillStyle = lin(g, 0, vy, 0, H, [[0, 'rgba(160,170,190,0.0)'], [1, 'rgba(120,130,150,0.6)']]); g.fillRect(0, vy, W, H - vy);
}

/* ---------------- food & coffee ---------------- */
function plate(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shadow(g, 40, 20, 0.45);
  g.fillStyle = '#F7F7F4'; g.beginPath(); g.ellipse(0, 0, 250, 110, 0, 0, TAU); g.fill(); noShadow(g);
  g.fillStyle = '#E6E6E0'; g.beginPath(); g.ellipse(0, 0, 190, 82, 0, 0, TAU); g.fill();
  // fries
  for (let i = 0; i < 14; i++) { g.save(); g.translate(90 + (hash1(i) - 0.5) * 70, -10 + (hash1(i * 3) - 0.5) * 30); g.rotate(-0.6 + hash1(i * 5) * 1.2); g.fillStyle = i % 2 ? '#F2C14E' : '#E8AE34'; rr(g, -8, -50, 16, 80, 4); g.fill(); g.restore(); }
  // burger
  g.save(); g.translate(-60, -20);
  g.fillStyle = '#D8913F'; g.beginPath(); g.ellipse(0, 40, 105, 26, 0, 0, TAU); g.fill();
  g.fillStyle = '#5A2E1A'; rr(g, -100, 6, 200, 30, 14); g.fill();
  g.fillStyle = '#F5C342'; g.beginPath(); g.moveTo(-100, 6); g.lineTo(100, 6); g.lineTo(80, 26); g.lineTo(40, 12); g.lineTo(0, 30); g.lineTo(-50, 12); g.lineTo(-90, 26); g.fill();
  g.fillStyle = '#4CAF50'; g.beginPath(); g.ellipse(0, 0, 108, 14, 0, 0, TAU); g.fill();
  g.fillStyle = lin(g, 0, -80, 0, 0, [[0, '#F0B060'], [1, '#C8803A']]); g.beginPath(); g.ellipse(0, -6, 100, 70, 0, Math.PI, TAU); g.fill();
  g.fillStyle = '#FFF2D6'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-60 + i * 15, -42 + Math.abs(i - 4) * 5, 4, 2.5, 0.4, 0, TAU); g.fill(); }
  g.restore();
  g.restore();
}
function coffee(g, x, y, s, t, spin = 0) {
  g.save(); g.translate(x, y); g.rotate(spin); g.scale(s, s);
  shadow(g, 30, 16, 0.45);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, 70, 200, 60, 0, 0, TAU); g.fill(); noShadow(g); // saucer
  g.fillStyle = '#EDEDEA'; g.beginPath(); g.ellipse(0, 70, 140, 40, 0, 0, TAU); g.fill();
  g.fillStyle = lin(g, -120, 0, 120, 0, [[0, '#E9E9E6'], [0.4, '#FFFFFF'], [1, '#D6D6D2']]);
  g.beginPath(); g.moveTo(-125, -40); g.bezierCurveTo(-125, 60, -90, 90, 0, 90); g.bezierCurveTo(90, 90, 125, 60, 125, -40); g.closePath(); g.fill();
  g.strokeStyle = '#E9E9E6'; g.lineWidth = 22; g.beginPath(); g.ellipse(150, 10, 40, 34, 0, -1.4, 1.4); g.stroke();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, -40, 125, 34, 0, 0, TAU); g.fill();
  g.fillStyle = '#A0643A'; g.beginPath(); g.ellipse(0, -38, 110, 27, 0, 0, TAU); g.fill();
  g.fillStyle = '#F3E3CC'; g.beginPath(); g.moveTo(0, -18); g.bezierCurveTo(-50, -40, -36, -64, 0, -48); g.bezierCurveTo(36, -64, 50, -40, 0, -18); g.fill(); // latte-art heart
  g.restore();
  // steam
  g.save(); g.globalCompositeOperation = 'screen';
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = `rgba(255,255,255,${0.25})`; g.lineWidth = 10 * s; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= 20; i++) { const u = i / 20; const px = x + (-40 + k * 40) * s + Math.sin(u * 6 + t * 3 + k) * 18 * s, py = y - (90 + u * 220) * s; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
  }
  g.restore();
}

/* ---------------- phone, reader, icons, bills, calculator, money ---------------- */
function phone(g, x, y, s, rot, screen) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); shadow(g, 40, 20, 0.5);
  g.fillStyle = '#11151D'; rr(g, -110, -220, 220, 440, 36); g.fill(); noShadow(g);
  g.fillStyle = lin(g, 0, -200, 0, 200, [[0, '#1E2A44'], [1, '#0D1424']]); rr(g, -98, -206, 196, 412, 28); g.fill();
  g.fillStyle = '#000'; rr(g, -30, -196, 60, 16, 8); g.fill();
  if (screen) screen(g);
  g.restore();
}
function reader(g, x, y, s, ok, t) {
  g.save(); g.translate(x, y); g.scale(s, s); shadow(g, 30, 16, 0.45);
  g.fillStyle = lin(g, -90, 0, 90, 0, [[0, '#2A3346'], [1, '#3C4760']]); rr(g, -90, -170, 180, 340, 24); g.fill(); noShadow(g);
  g.fillStyle = ok > 0 ? `rgba(43,227,139,${0.25 + 0.75 * ok})` : '#0E1528'; rr(g, -66, -140, 132, 110, 14); g.fill();
  if (ok > 0) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-28, -86); g.lineTo(-6, -62); g.lineTo(32, -110); g.stroke(); }
  // contactless symbol
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 7;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-20, 60, 20 + k * 18, -0.8, 0.8); g.stroke(); }
  g.restore();
}
function icon(g, kind, x, y, r, col) {
  g.save(); g.translate(x, y);
  shadow(g, 24, 10, 0.4);
  g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); noShadow(g);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.12; g.lineCap = 'round'; g.lineJoin = 'round';
  const k = r / 60;
  g.scale(k, k);
  if (kind === 'bolt') { g.beginPath(); g.moveTo(8, -40); g.lineTo(-22, 6); g.lineTo(0, 6); g.lineTo(-8, 40); g.lineTo(22, -6); g.lineTo(0, -6); g.closePath(); g.fill(); }
  if (kind === 'flame') { g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(30, -10, 30, 34, 0, 38); g.bezierCurveTo(-30, 34, -30, -6, -8, -18); g.bezierCurveTo(-4, -4, 4, -6, 0, -42); g.fill(); }
  if (kind === 'drop') { g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(26, -6, 30, 36, 0, 38); g.bezierCurveTo(-30, 36, -26, -6, 0, -40); g.fill(); }
  if (kind === 'wifi') { g.lineWidth = 8; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(0, 24, 16 + i * 16, -2.4, -0.74); g.stroke(); } g.beginPath(); g.arc(0, 24, 6, 0, TAU); g.fill(); }
  if (kind === 'phone') { g.lineWidth = 6; rr(g, -18, -36, 36, 72, 8); g.stroke(); g.beginPath(); g.arc(0, 26, 4, 0, TAU); g.fill(); }
  g.restore();
}
function bill(g, x, y, w, h, rot, a, label, amount, icons, col) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= a;
  shadow(g, 30, 14, 0.4);
  g.fillStyle = '#FBFCFE'; rr(g, -w / 2, -h / 2, w, h, 22); g.fill(); noShadow(g);
  g.fillStyle = col; rr(g, -w / 2, -h / 2, 16, h, [22, 0, 0, 22]); g.fill();
  icons.forEach((k, i) => icon(g, k, -w / 2 + 70 + i * 74, -h / 2 + 62, 30, col));
  setText(g, FONT.xbold(40), 1, 'left'); g.fillStyle = '#1A2235'; g.fillText(label, -w / 2 + 44, h / 2 - 34);
  setText(g, FONT.black(78), 0, 'right'); g.fillStyle = '#0E9F5B'; g.fillText(amount, w / 2 - 34, h / 2 - 30);
  g.strokeStyle = 'rgba(0,0,0,0.06)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(-w / 2 + 40, 0); g.lineTo(w / 2 - 40, 0); g.stroke(); g.setLineDash([]);
  g.restore();
}
function calculator(g, x, y, s, display, keys, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shadow(g, 60, 30, 0.55);
  g.fillStyle = lin(g, 0, -560, 0, 560, [[0, '#2A3245'], [1, '#141A28']]); rr(g, -400, -560, 800, 1120, 70); g.fill(); noShadow(g);
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 4; rr(g, -400, -560, 800, 1120, 70); g.stroke();
  g.fillStyle = '#081210'; rr(g, -340, -500, 680, 380, 36); g.fill();
  g.strokeStyle = 'rgba(43,227,139,0.35)'; g.lineWidth = 3; rr(g, -340, -500, 680, 380, 36); g.stroke();
  display(g);
  const labels = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'];
  for (let i = 0; i < 16; i++) {
    const c = i % 4, r = (i / 4) | 0, bx = -255 + c * 170, by = -10 + r * 140;
    const on = keys(i);
    g.fillStyle = on ? '#2BE38B' : (c === 3 ? '#FF8A1F' : '#323B52');
    g.beginPath(); g.arc(bx, by, 58, 0, TAU); g.fill();
    setText(g, FONT.bold(48), 0, 'center', 'middle'); g.fillStyle = on ? '#08130E' : '#FFFFFF'; g.fillText(labels[i], bx, by + 2);
  }
  g.restore();
}
/* US banknote seen at an angle; no portrait (an abstract medallion), soft depth of field */
function banknote(g, x, y, s, rot, flip = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * Math.cos(flip), s);
  shadow(g, 20, 10, 0.35);
  g.fillStyle = lin(g, -156, 0, 156, 0, [[0, '#C9D8C0'], [0.5, '#DDE7D3'], [1, '#C2D2B8']]); rr(g, -156, -66, 312, 132, 6); g.fill(); noShadow(g);
  g.strokeStyle = '#5E7A5A'; g.lineWidth = 4; rr(g, -144, -56, 288, 112, 4); g.stroke();
  g.strokeStyle = 'rgba(70,100,70,0.45)'; g.lineWidth = 2; rr(g, -136, -48, 272, 96, 3); g.stroke();
  g.fillStyle = 'rgba(70,100,70,0.35)'; g.beginPath(); g.ellipse(0, 0, 44, 52, 0, 0, TAU); g.fill();
  g.fillStyle = '#4C6A48'; setText(g, FONT.black(30), 0, 'center', 'middle');
  g.fillText('100', -112, -32); g.fillText('100', 112, 32); g.fillText('100', 112, -32); g.fillText('100', -112, 32);
  g.restore();
}
function dollarCoin(g, x, y, r, a) {
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  glow(g, 0, 0, r * 2.2, 0.5, SPRITE_GREEN);
  g.fillStyle = lin(g, 0, -r, 0, r, [[0, '#5CF2A8'], [1, '#14B86A']]); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = r * 0.08; g.stroke();
  setText(g, FONT.black(r * 1.3), 0, 'center', 'middle'); g.fillStyle = '#FFFFFF'; g.fillText('$', 0, r * 0.06);
  g.restore();
}
let SPRITE_GREEN = null, SPRITE_REDLIGHT = null, SPRITE_ORANGE = null, SPRITE_WHITE = null;
function initArt() {
  SPRITE_GREEN = radialSprite(128, [[0, 'rgba(120,255,190,0.9)'], [0.35, 'rgba(43,227,139,0.35)'], [1, 'rgba(43,227,139,0)']]);
  SPRITE_REDLIGHT = radialSprite(64, [[0, 'rgba(255,90,80,1)'], [0.3, 'rgba(255,40,40,0.6)'], [1, 'rgba(255,0,0,0)']]);
  SPRITE_ORANGE = radialSprite(128, [[0, 'rgba(255,190,120,0.9)'], [0.35, 'rgba(255,138,31,0.35)'], [1, 'rgba(255,138,31,0)']]);
  SPRITE_WHITE = radialSprite(128, [[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
  SKY = { golden: buildSkyline('golden'), dusk: buildSkyline('dusk'), night: buildSkyline('night') };
}
