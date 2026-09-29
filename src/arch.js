'use strict';
/* ---------------------------------------------------------------------------
 * Architectural line-art. A Sketch is a set of strokes (polylines), filled
 * silhouettes and window lights, in local units: x centred, ground at y=0,
 * negative y goes up. drawSketch() builds it from the ground up.
 * ------------------------------------------------------------------------- */
class Sketch {
  constructor() { this.strokes = []; this.fills = []; this.lights = []; this.minY = 0; }
  line(pts, lw = 1) { this.strokes.push({ pts, lw }); pts.forEach(p => { this.minY = Math.min(this.minY, p[1]); }); return this; }
  rect(x, y, w, h, lw) { return this.line([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], lw); } // y = top
  hline(x0, x1, y, lw) { return this.line([[x0, y], [x1, y]], lw); }
  vline(x, y0, y1, lw) { return this.line([[x, y0], [x, y1]], lw); }
  arch(x, yb, w, h, lw, light) { // arched opening, x centre, yb bottom
    const r = w / 2, spring = yb - h + r, pts = [[x - r, yb], [x - r, spring]];
    for (let i = 1; i < 16; i++) { const a = Math.PI + (i / 16) * Math.PI; pts.push([x + Math.cos(a) * r, spring + Math.sin(a) * r]); }
    pts.push([x + r, spring], [x + r, yb]);
    this.line(pts, lw);
    if (light) this.lights.push({ poly: pts, a: light });
    return this;
  }
  win(x, y, w, h, style = 0, light = 0.8) { // x centre, y top
    this.rect(x - w / 2, y, w, h, 1);
    if (style === 1) this.line([[x - w / 2 - 6, y - 4], [x, y - w * 0.35], [x + w / 2 + 6, y - 4]], 1); // pediment
    if (style === 2) this.hline(x - w / 2 - 6, x + w / 2 + 6, y - 6, 1.4); // cornice cap
    this.vline(x, y + 3, y + h - 3, 0.6);
    if (light) this.lights.push({ poly: [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]], a: light });
    return this;
  }
  arc(cx, cy, rx, ry, a0, a1, lw, n = 24) {
    const pts = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return this.line(pts, lw);
  }
  fill(poly, a = 1) { this.fills.push({ poly, a }); poly.forEach(p => { this.minY = Math.min(this.minY, p[1]); }); return this; }
  finish() {
    const H = -this.minY || 1;
    this.strokes.forEach((s, i) => {
      let lo = -1e9; s.pts.forEach(p => { lo = Math.max(lo, p[1]); });
      s.delay = clamp(-lo / H) * 0.75 + hash1(i * 3.3) * 0.12;
      s.len = polyLength(s.pts, false);
    });
    this.h = H; return this;
  }
}
function domePts(cx, yb, w, h, n = 20) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([cx + Math.cos(a) * w / 2, yb + Math.sin(a) * h]); } return pts;
}
function onionPts(cx, yb, w, h, n = 24) { // baroque bulb cap
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n; const y = yb - u * h;
    const r = w / 2 * (Math.sin(u * Math.PI * 0.95 + 0.25) * (1 - u * 0.55)) + 1;
    pts.push([cx - r, y]);
  }
  const right = pts.map(p => [2 * cx - p[0], p[1]]).reverse();
  return pts.concat(right);
}

/* Tenement house (kamianytsia) */
function kamianytsia(seed, w, h) {
  const r = rng(seed), s = new Sketch();
  const L = -w / 2, Rr = w / 2, top = -h * 0.84, g = -h * 0.22;
  const style = Math.floor(r() * 3);
  // silhouette
  let sil = [[L, 0], [L, top], [Rr, top], [Rr, 0]];
  if (style === 0) sil = [[L, 0], [L, -h * 0.9], [L + w * 0.3, -h * 0.9], [0, -h], [Rr - w * 0.3, -h * 0.9], [Rr, -h * 0.9], [Rr, 0]];
  if (style === 1) sil = [[L, 0], [L, top], [-w * 0.28, top], [-w * 0.22, -h * 0.93], [0, -h], [w * 0.22, -h * 0.93], [w * 0.28, top], [Rr, top], [Rr, 0]];
  if (style === 2) sil = [[L, 0], [L, -h * 0.9], [Rr, -h * 0.9], [Rr, 0]];
  s.fill(sil, 1);
  s.line([[L, 0], [L, top], [Rr, top], [Rr, 0]], 1.6);
  s.hline(L - 6, Rr + 6, top, 2.2); s.hline(L - 3, Rr + 3, top + 10, 1);
  s.hline(L, Rr, g, 1.4);
  s.arch(0, 0, w * 0.26, -g * 0.82, 1.3, 0.35);
  s.arch(-w * 0.32, -8, w * 0.17, -g * 0.6, 1, 0.9);
  s.arch(w * 0.32, -8, w * 0.17, -g * 0.6, 1, 0.9);
  const floors = 3, fh = (g - top) / floors;
  const m = w > 215 ? 3 : 2;
  for (let f = 0; f < floors; f++) {
    const yT = g - fh * (f + 1) + fh * 0.22;
    for (let k = 0; k < m; k++) {
      const x = L + (w / m) * (k + 0.5);
      s.win(x, yT, Math.min(46, w / m * 0.42), fh * 0.56, f === 0 ? 1 : f === 1 ? 2 : 0, r() < 0.75 ? 0.4 + r() * 0.6 : 0);
    }
    if (f < floors - 1) s.hline(L, Rr, g - fh * (f + 1), 0.7);
  }
  if (style === 0) { // Renaissance attic with finials
    s.line([[L, -h * 0.84], [L, -h * 0.9], [L + w * 0.3, -h * 0.9], [0, -h], [Rr - w * 0.3, -h * 0.9], [Rr, -h * 0.9], [Rr, -h * 0.84]], 1.4);
    [L + 8, 0, Rr - 8].forEach((x, i) => { s.vline(x, i === 1 ? -h : -h * 0.9, (i === 1 ? -h : -h * 0.9) - 26, 1.2); s.arc(x, (i === 1 ? -h : -h * 0.9) - 32, 6, 6, 0, TAU, 1, 12); });
  } else if (style === 1) { // baroque gable with volutes
    s.line([[-w * 0.28, top], [-w * 0.22, -h * 0.93], [0, -h], [w * 0.22, -h * 0.93], [w * 0.28, top]], 1.4);
    s.arc(-w * 0.2, top - 16, 16, 16, 0, Math.PI * 1.5, 1, 14); s.arc(w * 0.2, top - 16, 16, 16, -Math.PI * 0.5, Math.PI, 1, 14);
    s.arc(0, -h * 0.925, 14, 18, 0, TAU, 1, 16);
  } else { // balustrade parapet
    s.line([[L, top], [L, -h * 0.9], [Rr, -h * 0.9], [Rr, top]], 1.4);
    for (let x = L + 12; x < Rr - 6; x += 16) s.vline(x, top - 4, -h * 0.9 + 4, 0.7);
  }
  return s.finish();
}

/* Lviv National Opera (stylised) */
function operaSketch() {
  const s = new Sketch();
  // back dome + stage roof silhouette
  s.fill([[-470, 0], [-470, -330], [-420, -360], [-240, -370], [-240, -430], [-60, -470], [-40, -520], [40, -520], [60, -470], [240, -430], [240, -370], [420, -360], [470, -330], [470, 0]], 1);
  s.fill(domePts(0, -430, 560, 170, 28).concat([[280, -430]]), 0.8);
  s.line(domePts(0, -430, 560, 170, 28), 1.2);
  // main body
  s.line([[-470, 0], [-470, -330], [470, -330], [470, 0], [-470, 0]], 2);
  s.hline(-480, 480, -330, 2.4); s.hline(-476, 476, -318, 1);
  s.hline(-470, 470, -150, 1.8); s.hline(-470, 470, -140, 0.8);
  // ground floor arcade (central loggia)
  for (let i = -3; i <= 3; i++) s.arch(i * 62, 0, 44, 120, 1.3, 0.9);
  // side wings windows
  [-1, 1].forEach(side => {
    for (let k = 0; k < 2; k++) {
      const x = side * (300 + k * 90);
      s.arch(x, -14, 40, 100, 1.1, 0.8);
      s.win(x, -290, 40, 100, 2, 0.7);
    }
    // corner domed pavilions
    const cx = side * 345;
    s.line([[cx - 120, -330], [cx - 120, -380], [cx + 120, -380], [cx + 120, -330]], 1.5);
    s.fill([[cx - 120, -330], [cx - 120, -380], [cx + 120, -380], [cx + 120, -330]], 1);
    const d = domePts(cx, -380, 150, 90, 20); s.fill(d, 1); s.line(d, 1.5);
    s.rect(cx - 12, -490, 24, 28, 1); s.arc(cx, -497, 10, 12, Math.PI, TAU, 1, 10); s.vline(cx, -507, -535, 1);
    for (let x = cx - 110; x <= cx + 110; x += 20) s.vline(x, -380, -365, 0.7);
  });
  // upper floor colonnade (central)
  for (let i = -4; i <= 4; i++) {
    const x = i * 52;
    s.line([[x - 5, -152], [x - 5, -312]], 1.6); s.line([[x + 5, -152], [x + 5, -312]], 1.6);
    s.rect(x - 9, -320, 18, 8, 0.8);
    if (i < 4) s.arch(x + 26, -160, 28, 130, 0.9, 0.95);
  }
  // central attic with sculptural niches
  s.fill([[-250, -330], [-250, -430], [250, -430], [250, -330]], 1);
  s.line([[-250, -330], [-250, -430], [250, -430], [250, -330]], 1.8);
  s.hline(-262, 262, -430, 2.2);
  for (let i = -2; i <= 2; i++) s.arch(i * 90, -345, 30, 70, 1, 0.5);
  // statue pedestals
  s.rect(-40, -470, 80, 40, 1.4); s.rect(-205, -455, 50, 25, 1.2); s.rect(155, -455, 50, 25, 1.2);
  // "Glory" statue with raised palm branch (centre)
  const glory = [[-22, -470], [-16, -540], [-26, -560], [-8, -590], [-6, -610], [6, -612], [8, -592], [22, -575], [48, -640], [56, -636], [30, -560], [18, -540], [22, -470]];
  s.fill(glory, 1); s.line(glory, 1.5);
  s.arc(0, -620, 11, 12, 0, TAU, 1.4, 14);
  s.line([[52, -638], [60, -700], [44, -686]], 1.4); s.line([[60, -700], [74, -684]], 1.2); s.line([[58, -680], [40, -670]], 1); s.line([[58, -680], [76, -664]], 1);
  // wings of Glory
  s.line([[-8, -592], [-50, -640], [-60, -600], [-20, -570]], 1.2);
  // side sculptures
  [-180, 180].forEach(x => {
    const f = [[x - 16, -455], [x - 12, -505], [x - 18, -520], [x - 4, -545], [x + 6, -545], [x + 16, -520], [x + 12, -505], [x + 16, -455]];
    s.fill(f, 1); s.line(f, 1.2); s.arc(x + 1, -553, 8, 9, 0, TAU, 1.2, 12);
  });
  // balustrade
  for (let x = -466; x <= 466; x += 14) if (Math.abs(x) > 250) s.vline(x, -330, -318, 0.6);
  // steps
  s.hline(-300, 300, 8, 1.2); s.hline(-330, 330, 16, 1);
  return s.finish();
}

/* Armenian Cathedral: nave, drum + conical roof, bell tower */
function armenianSketch() {
  const s = new Sketch();
  s.fill([[-190, 0], [-190, -250], [-80, -290], [-60, -290], [-60, -350], [0, -440], [60, -350], [60, -290], [80, -290], [190, -250], [190, 0]], 1);
  s.line([[-190, 0], [-190, -250], [190, -250], [190, 0]], 1.8);
  s.line([[-190, -250], [0, -300], [190, -250]], 1.4);
  s.line([[-60, -290], [-60, -350], [60, -350], [60, -290]], 1.4);
  s.line([[-66, -350], [0, -440], [66, -350]], 1.6);
  s.vline(0, -440, -480, 1.4); s.hline(-12, 12, -468, 1.2);
  for (let i = -1; i <= 1; i++) s.arch(i * 34, -300, 16, 40, 0.9, 0.7);
  s.arch(0, 0, 70, 150, 1.4, 0.5);
  for (let i = 0; i < 4; i++) { s.arch(-150 + i * 30, 0, 22, 80, 0.9, 0.6); s.arch(60 + i * 30, 0, 22, 80, 0.9, 0.6); }
  s.hline(-190, 190, -100, 1); s.win(-120, -210, 26, 70, 0, 0.8); s.win(120, -210, 26, 70, 0, 0.8);
  // stone-course hatching
  for (let y = -120; y > -240; y -= 24) s.hline(-186, -150, y, 0.5), s.hline(150, 186, y, 0.5);
  // bell tower
  const tx = 300;
  s.fill([[tx - 50, 0], [tx - 50, -420], [tx + 50, -420], [tx + 50, 0]], 1);
  s.line([[tx - 50, 0], [tx - 50, -420], [tx + 50, -420], [tx + 50, 0]], 1.6);
  s.hline(tx - 56, tx + 56, -300, 1.4); s.hline(tx - 56, tx + 56, -420, 1.8);
  s.arch(tx, -310, 40, 90, 1.2, 0.9); s.win(tx, -220, 22, 60, 0, 0.6); s.win(tx, -120, 22, 60, 0, 0.6);
  const on = onionPts(tx, -420, 100, 110); s.fill(on, 1); s.line(on, 1.5);
  s.vline(tx, -530, -580, 1.3); s.hline(tx - 12, tx + 12, -565, 1.2);
  return s.finish();
}

/* Towers & churches for the skyline */
function ratushaSketch() {
  const s = new Sketch();
  s.fill([[-150, 0], [-150, -200], [-45, -200], [-45, -620], [-34, -640], [-34, -700], [-20, -760], [0, -790], [20, -760], [34, -700], [34, -640], [45, -620], [45, -200], [150, -200], [150, 0]], 1);
  s.line([[-150, 0], [-150, -200], [150, -200], [150, 0]], 1.6);
  for (let i = -2; i <= 2; i++) s.win(i * 55, -170, 26, 60, 2, 0.7);
  for (let i = -2; i <= 2; i++) s.arch(i * 55, 0, 30, 80, 1, 0.5);
  s.line([[-45, -200], [-45, -620], [45, -620], [45, -200]], 1.8);
  for (let y = -260; y > -560; y -= 60) { s.hline(-45, 45, y, 0.8); s.win(0, y - 50, 18, 38, 0, 0.6); }
  s.arc(0, -585, 24, 24, 0, TAU, 1.6, 24); s.line([[0, -585], [0, -603]], 1.2); s.line([[0, -585], [12, -585]], 1.2);
  s.line([[-34, -640], [-34, -700], [34, -700], [34, -640]], 1.4); s.hline(-48, 48, -620, 2); s.hline(-40, 40, -640, 1.2);
  s.arch(-14, -646, 14, 44, 0.8, 0.8); s.arch(14, -646, 14, 44, 0.8, 0.8);
  s.line([[-34, -700], [-20, -760], [0, -790], [20, -760], [34, -700]], 1.5);
  s.vline(0, -790, -840, 1.2);
  s.line([[0, -840], [30, -832], [0, -824]], 1);
  return s.finish();
}
function latinSketch() {
  const s = new Sketch();
  s.fill([[-240, 0], [-240, -260], [0, -380], [60, -360], [60, -500], [80, -520], [90, -600], [100, -660], [110, -600], [120, -520], [140, -500], [140, -340], [240, -260], [240, 0]], 1);
  s.line([[-240, 0], [-240, -260], [0, -380], [60, -350]], 1.6); s.line([[140, -340], [240, -260], [240, 0]], 1.6);
  for (let i = -3; i <= 1; i++) { s.arch(i * 55 - 20, -60, 26, 150, 1, 0.8); s.line([[i * 55 - 20, -80], [i * 55 - 20, -200]], 0.5); }
  s.line([[60, 0], [60, -500], [140, -500], [140, 0]], 1.8);
  s.arch(100, -330, 36, 110, 1.1, 0.8); s.arch(100, -140, 36, 110, 1.1, 0.7);
  s.hline(54, 146, -400, 1.4); s.hline(54, 146, -500, 1.6);
  const cap = [[70, -500], [80, -520], [90, -600], [100, -660], [110, -600], [120, -520], [130, -500]];
  s.line(cap, 1.5); s.arc(100, -560, 18, 22, 0, TAU, 1, 14); s.vline(100, -660, -700, 1.2);
  return s.finish();
}
function dominicanSketch() {
  const s = new Sketch();
  s.fill([[-230, 0], [-230, -300], [-170, -300], [-170, -390], [-140, -420], [-110, -390], [-110, -330], [-120, -330], [-150, -380]].concat(
    domePts(0, -330, 260, 170, 24), [[110, -330], [110, -390], [140, -420], [170, -390], [170, -300], [230, -300], [230, 0]]), 1);
  s.line([[-230, 0], [-230, -300], [230, -300], [230, 0]], 1.8);
  for (let i = -4; i <= 4; i++) s.vline(i * 50, -20, -290, i % 2 ? 0.6 : 1.3);
  s.arch(0, 0, 60, 150, 1.4, 0.6); s.win(-100, -250, 30, 80, 1, 0.6); s.win(100, -250, 30, 80, 1, 0.6);
  s.line([[-130, -300], [0, -345], [130, -300]], 1.4);
  const d = domePts(0, -330, 260, 170, 24); s.line(d, 1.8);
  for (let i = -2; i <= 2; i++) s.arc(i * 42, -330, 1, 150 * Math.cos(i * 0.35), Math.PI, TAU, 0.6, 10);
  s.rect(-22, -545, 44, 50, 1.2); s.arc(0, -545, 22, 26, Math.PI, TAU, 1.2, 12); s.vline(0, -571, -610, 1.2);
  [-140, 140].forEach(x => { s.line([[x - 30, -300], [x - 30, -390], [x, -420], [x + 30, -390], [x + 30, -300]], 1.3); s.vline(x, -420, -450, 1); });
  return s.finish();
}
function georgeSketch() {
  const s = new Sketch();
  s.fill([[-200, 0], [-200, -220], [-60, -250], [-60, -300]].concat(domePts(0, -300, 150, 120, 20), [[60, -300], [60, -250], [200, -220], [200, 0]]), 1);
  s.line([[-200, 0], [-200, -220], [200, -220], [200, 0]], 1.6);
  s.line([[-200, -220], [0, -270], [200, -220]], 1.4);
  s.line([[-60, -250], [-60, -300], [60, -300], [60, -250]], 1.2);
  s.line(domePts(0, -300, 150, 120, 20), 1.6);
  s.vline(0, -420, -470, 1.2); s.hline(-14, 14, -455, 1.2);
  s.arch(0, 0, 60, 140, 1.3, 0.6);
  [-130, 130].forEach(x => s.win(x, -180, 30, 90, 1, 0.7));
  // St George on horseback (tiny silhouette) on the pediment
  s.line([[-24, -270], [-14, -300], [14, -300], [24, -270]], 1);
  return s.finish();
}
function korniaktSketch() {
  const s = new Sketch();
  s.fill([[-50, 0], [-50, -480], [-40, -500], [-30, -560], [0, -600], [30, -560], [40, -500], [50, -480], [50, 0]], 1);
  s.line([[-50, 0], [-50, -480], [50, -480], [50, 0]], 1.6);
  for (let k = 0; k < 4; k++) { const y = -120 - k * 90; s.hline(-54, 54, y, 1.2); s.arch(-20, y + 80, 22, 60, 0.9, 0.7); s.arch(20, y + 80, 22, 60, 0.9, 0.7); }
  s.line([[-40, -480], [-40, -500], [-30, -560], [0, -600], [30, -560], [40, -500], [40, -480]], 1.4);
  s.vline(0, -600, -640, 1.1);
  return s.finish();
}

/* Render a Sketch with draw-on progress p (0..1) */
function drawSketch(ctx, sk, x, y, sc, p, o = {}) {
  if (p <= 0) return;
  const alpha = o.alpha == null ? 1 : o.alpha;
  const col = o.color || [232, 180, 90];
  ctx.save();
  ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // silhouettes
  const fa = clamp((p - 0.35) / 0.45) * alpha * (o.fill == null ? 1 : o.fill);
  if (fa > 0) {
    const g = ctx.createLinearGradient(0, -sk.h, 0, 0);
    g.addColorStop(0, o.fillTop || 'rgba(34,30,32,1)'); g.addColorStop(1, o.fillBottom || 'rgba(12,13,20,1)');
    ctx.fillStyle = g;
    for (const f of sk.fills) { ctx.globalAlpha = fa * f.a; ctx.beginPath(); pathPoly(ctx, f.poly); ctx.fill(); }
  }
  // lit windows
  const la = clamp((p - 0.55) / 0.35) * alpha * (o.lights == null ? 1 : o.lights);
  if (la > 0) {
    ctx.fillStyle = 'rgba(255,196,110,1)';
    sk.lights.forEach((L, i) => {
      const fl = 0.8 + 0.2 * Math.sin((o.t || 0) * 2.3 + i * 1.7);
      ctx.globalAlpha = la * L.a * 0.55 * fl; ctx.beginPath(); pathPoly(ctx, L.poly); ctx.fill();
    });
  }
  // strokes
  const lwMul = (o.lw || 1) / Math.max(0.5, sc) * Math.max(0.7, sc);
  const tips = [];
  for (const s of sk.strokes) {
    const q = clamp((p - s.delay * 0.6) / 0.4);
    if (q <= 0) continue;
    const pts = q >= 1 ? s.pts : partialPoly(s.pts, Ease.outCubic(q));
    ctx.globalAlpha = alpha * (o.lineAlpha == null ? 0.95 : o.lineAlpha);
    ctx.strokeStyle = rgbStr(col, 1);
    ctx.lineWidth = s.lw * 1.5 * lwMul;
    ctx.beginPath(); pathPoly(ctx, pts, false); ctx.stroke();
    if (q < 1 && tips.length < 40) tips.push(pts[pts.length - 1]);
  }
  ctx.restore();
  if (o.sparks !== false && tips.length) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    tips.forEach(tp => glow(ctx, x + tp[0] * sc, y + tp[1] * sc, 14, 0.8 * alpha));
    ctx.restore();
  }
}

/* Skyline outline (for the steam morph) as evenly-resampled points, px */
function skylineOutline(x0, x1, base, n) {
  const P = [];
  const add = (x, y) => P.push([x, y]);
  add(x0, base - 60);
  const seq = [
    ['h', 40, 80], ['roof', 50, 90, 130], ['h', 30, 100], ['tower', 36, 250, 330], ['h', 40, 120], ['roof', 60, 110, 160],
    ['h', 30, 90], ['ratusha', 60, 400, 470], ['h', 40, 130], ['dome', 120, 170, 260], ['h', 30, 110], ['tower', 30, 260, 320],
    ['roof', 60, 100, 150], ['h', 40, 90], ['dome', 90, 120, 200], ['h', 60, 70],
  ];
  const total = seq.reduce((a, s) => a + s[1], 0);
  const k = (x1 - x0) / total;
  let x = x0;
  for (const s of seq) {
    const w = s[1] * k;
    if (s[0] === 'h') { add(x, base - s[2]); add(x + w, base - s[2]); }
    if (s[0] === 'roof') { add(x, base - s[2]); add(x + w / 2, base - s[3]); add(x + w, base - s[2]); }
    if (s[0] === 'tower') { add(x, base - 90); add(x, base - s[2]); add(x + w / 2, base - s[3]); add(x + w, base - s[2]); add(x + w, base - 90); }
    if (s[0] === 'ratusha') {
      add(x, base - 120); add(x + w * 0.2, base - 120); add(x + w * 0.2, base - s[2]); add(x + w * 0.3, base - s[2] - 20);
      add(x + w * 0.35, base - s[2] - 45); add(x + w / 2, base - s[3]); add(x + w * 0.65, base - s[2] - 45); add(x + w * 0.7, base - s[2] - 20);
      add(x + w * 0.8, base - s[2]); add(x + w * 0.8, base - 120); add(x + w, base - 120);
    }
    if (s[0] === 'dome') {
      add(x, base - s[2]);
      for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; add(x + w / 2 + Math.cos(a) * w * 0.4, base - s[2] + Math.sin(a) * (s[3] - s[2]) * 0.8); }
      add(x + w / 2, base - s[3] - 20); add(x + w * 0.9, base - s[2]); add(x + w, base - s[2]);
    }
    x += w;
  }
  add(x1, base - 60);
  // resample
  const L = polyLength(P, false), out = [];
  for (let i = 0; i < n; i++) out.push(pointAt(P, (i / (n - 1)) * L));
  return out;
}
