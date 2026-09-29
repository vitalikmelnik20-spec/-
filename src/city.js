'use strict';
/* ---------------------------------------------------------------------------
 * Procedural, stylised Lviv: Market Square with 44-ish tenement houses,
 * the Ratusha, landmark churches + Opera, an old-town grid, outer districts,
 * a street network, tram routes and café points. Units: km.
 * ------------------------------------------------------------------------- */
const CITY = { buildings: [], streets: [], trams: [], cafes: [], lights: [], ring: [] };

function rotP(x, y, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return [cx + x * c - y * s, cy + x * s + y * c]; }
function faceN(p) {
  const a = p[0], b = p[1], c = p[2];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / l, n[1] / l, n[2] / l];
}
/* counter-clockwise footprint (seen from above) -> outward walls */
function prismFaces(fp, z0, z1, top = true) {
  const faces = [];
  for (let i = 0; i < fp.length; i++) {
    const a = fp[i], b = fp[(i + 1) % fp.length];
    const p = [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]];
    faces.push({ p, n: faceN(p), k: 0 });
  }
  if (top) { const p = fp.map(q => [q[0], q[1], z1]); faces.push({ p, n: [0, 0, 1], k: 1 }); }
  return faces;
}
function rectFp(x, y, w, d, rot = 0) {
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(q => rotP(q[0], q[1], x, y, rot));
}
function polyFp(x, y, r, n, rot = 0) {
  const fp = []; for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU; fp.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return fp;
}
function capFaces(fp, z0, z1) { // pyramid / cone cap
  let cx = 0, cy = 0; fp.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= fp.length; cy /= fp.length;
  const faces = [];
  for (let i = 0; i < fp.length; i++) {
    const a = fp[i], b = fp[(i + 1) % fp.length];
    const p = [[a[0], a[1], z0], [b[0], b[1], z0], [cx, cy, z1]];
    faces.push({ p, n: faceN(p), k: 2 });
  }
  return faces;
}
function gableFaces(x, y, w, d, h, rh, rot) { // ridge along local x
  const L = (lx, ly) => rotP(lx, ly, x, y, rot);
  const A = L(-w / 2, -d / 2), B = L(w / 2, -d / 2), Cc = L(w / 2, d / 2), D = L(-w / 2, d / 2);
  const R1 = L(-w / 2, 0), R2 = L(w / 2, 0);
  const faces = [];
  const q = (pts, k) => faces.push({ p: pts, n: faceN(pts), k });
  q([[A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], h], [A[0], A[1], h]], 0);
  q([[Cc[0], Cc[1], 0], [D[0], D[1], 0], [D[0], D[1], h], [Cc[0], Cc[1], h]], 0);
  q([[B[0], B[1], 0], [Cc[0], Cc[1], 0], [Cc[0], Cc[1], h], [R2[0], R2[1], h + rh], [B[0], B[1], h]], 0);
  q([[D[0], D[1], 0], [A[0], A[1], 0], [A[0], A[1], h], [R1[0], R1[1], h + rh], [D[0], D[1], h]], 0);
  q([[A[0], A[1], h], [B[0], B[1], h], [R2[0], R2[1], h + rh], [R1[0], R1[1], h + rh]], 2);
  q([[Cc[0], Cc[1], h], [D[0], D[1], h], [R1[0], R1[1], h + rh], [R2[0], R2[1], h + rh]], 2);
  return faces;
}
function addB(faces, cx, cy, grp, extra = {}) {
  let h = 0; faces.forEach(f => f.p.forEach(p => { h = Math.max(h, p[2]); }));
  const b = Object.assign({ faces, cx, cy, h, grp, id: CITY.buildings.length, seed: hash1(CITY.buildings.length * 7.3 + 1) }, extra);
  CITY.buildings.push(b); return b;
}

function buildCity() {
  const R = rng(20250);
  /* --- Market Square: tenement houses around a 142 x 112 m square -------- */
  const SQ = { w: 0.142, d: 0.112 }, DEP = 0.036;
  const sides = [
    { ax: [-SQ.w / 2 - DEP, SQ.d / 2 + DEP / 2], dir: [1, 0], len: SQ.w + DEP * 2, rot: 0, inward: [0, -1] }, // north
    { ax: [SQ.w / 2 + DEP / 2, SQ.d / 2], dir: [0, -1], len: SQ.d, rot: Math.PI / 2, inward: [-1, 0] },     // east
    { ax: [SQ.w / 2 + DEP, -SQ.d / 2 - DEP / 2], dir: [-1, 0], len: SQ.w + DEP * 2, rot: 0, inward: [0, 1] }, // south
    { ax: [-SQ.w / 2 - DEP / 2, -SQ.d / 2], dir: [0, 1], len: SQ.d, rot: Math.PI / 2, inward: [1, 0] },     // west
  ];
  let order = 0;
  sides.forEach((s, si) => {
    let u = 0;
    while (u < s.len - 0.006) {
      let w = 0.011 + R() * 0.007; if (s.len - u - w < 0.01) w = s.len - u;
      const cx = s.ax[0] + s.dir[0] * (u + w / 2), cy = s.ax[1] + s.dir[1] * (u + w / 2);
      const h = 0.019 + R() * 0.011;
      // gable ridge parallel to the facade: local x along facade
      const faces = gableFaces(cx, cy, w * 0.97, DEP, h, 0.008 + R() * 0.004, s.rot);
      addB(faces, cx, cy, 'market', { order: order++, side: si, inward: s.inward, fw: w, facadeH: h });
      u += w;
    }
  });
  CITY.marketCount = order;
  /* --- Ratusha -------------------------------------------------------------- */
  {
    const f = [];
    f.push(...prismFaces(rectFp(0, -0.006, 0.062, 0.05), 0, 0.021));
    CITY.ratushaBody = addB(f, 0, -0.006, 'ratusha', { part: 0 });
    const t = [];
    t.push(...prismFaces(rectFp(0, 0.004, 0.017, 0.017), 0.021, 0.052));
    t.push(...prismFaces(polyFp(0, 0.004, 0.0085, 8, Math.PI / 8), 0.052, 0.060));
    t.push(...capFaces(polyFp(0, 0.004, 0.0085, 8, Math.PI / 8), 0.060, 0.068));
    CITY.ratushaTower = addB(t, 0, 0.004, 'ratusha', { part: 1 });
  }
  /* --- Landmarks ------------------------------------------------------------ */
  const LM = [];
  const lm = (name, faces, cx, cy, extra) => { const b = addB(faces, cx, cy, 'landmark', Object.assign({ name }, extra)); LM.push(b); return b; };
  // Latin Cathedral
  lm('latin', gableFaces(-0.115, -0.112, 0.07, 0.03, 0.022, 0.014, 0.1), -0.115, -0.112);
  lm('latinT', [...prismFaces(rectFp(-0.155, -0.100, 0.012, 0.012, 0.1), 0, 0.05), ...capFaces(rectFp(-0.155, -0.100, 0.012, 0.012, 0.1), 0.05, 0.068)], -0.155, -0.1);
  // Dominican church with dome
  lm('dominican', [...prismFaces(rectFp(0.17, 0.205, 0.05, 0.034, 0.05), 0, 0.022),
    ...prismFaces(polyFp(0.172, 0.207, 0.012, 10), 0.022, 0.03), ...capFaces(polyFp(0.172, 0.207, 0.012, 10), 0.03, 0.046)], 0.17, 0.205);
  // Armenian Cathedral (drum + cone) and its bell tower
  lm('armenian', [...gableFaces(-0.14, 0.2, 0.032, 0.018, 0.013, 0.007, 0),
    ...prismFaces(polyFp(-0.138, 0.2, 0.006, 10), 0.018, 0.026), ...capFaces(polyFp(-0.138, 0.2, 0.006, 10), 0.026, 0.036)], -0.14, 0.2);
  lm('armenianT', [...prismFaces(rectFp(-0.112, 0.218, 0.008, 0.008), 0, 0.034), ...capFaces(rectFp(-0.112, 0.218, 0.008, 0.008), 0.034, 0.044)], -0.112, 0.218);
  // Bernardine
  lm('bernardine', gableFaces(0.22, -0.27, 0.06, 0.028, 0.024, 0.013, -0.2), 0.22, -0.27);
  lm('bernardineT', [...prismFaces(rectFp(0.19, -0.255, 0.01, 0.01, -0.2), 0, 0.052), ...capFaces(rectFp(0.19, -0.255, 0.01, 0.01, -0.2), 0.052, 0.064)], 0.19, -0.255);
  // Korniakt tower
  lm('korniakt', [...prismFaces(rectFp(0.125, 0.05, 0.011, 0.011), 0, 0.058), ...capFaces(rectFp(0.125, 0.05, 0.011, 0.011), 0.058, 0.07)], 0.125, 0.05);
  // Opera House: auditorium block + stage tower + front attic
  CITY.opera = lm('opera', [...prismFaces(rectFp(-0.37, 0.25, 0.1, 0.07), 0, 0.028), ...capFaces(rectFp(-0.37, 0.25, 0.1, 0.07), 0.028, 0.04)], -0.37, 0.25, { opera: true });
  lm('operaS', [...prismFaces(rectFp(-0.37, 0.3, 0.07, 0.035), 0, 0.045)], -0.37, 0.3, { opera: true });
  // St George's Cathedral
  lm('george', [...prismFaces(rectFp(-1.31, -0.35, 0.045, 0.045), 0, 0.022),
    ...prismFaces(polyFp(-1.31, -0.35, 0.013, 10), 0.022, 0.034), ...capFaces(polyFp(-1.31, -0.35, 0.013, 10), 0.034, 0.052)], -1.31, -0.35);
  CITY.landmarks = LM;

  const occupied = (x, y, r) => CITY.buildings.some(b => (b.grp === 'landmark' || b.grp === 'ratusha') && Math.hypot(b.cx - x, b.cy - y) < r);
  /* --- Old town blocks ------------------------------------------------------ */
  const SP = 0.085, BL = 0.06, ROT = 0.08;
  for (let gx = -7; gx <= 7; gx++) for (let gy = -6; gy <= 7; gy++) {
    const [bx, by] = rotP(gx * SP, gy * SP, 0, 0, ROT);
    const ex = bx / 0.5, ey = (by - 0.03) / 0.42;
    if (ex * ex + ey * ey > 1) continue;
    if (Math.abs(bx) < SQ.w / 2 + DEP + 0.03 && Math.abs(by) < SQ.d / 2 + DEP + 0.03) continue;
    if (bx > -0.43 && bx < -0.3 && by > -0.45 && by < 0.2) continue; // Svobody avenue
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const [x, y] = rotP(gx * SP + (i - 0.5) * BL / 2, gy * SP + (j - 0.5) * BL / 2, 0, 0, ROT);
      if (occupied(x, y, 0.045)) continue;
      const h = 0.014 + R() * 0.014;
      const faces = R() < 0.7 ? gableFaces(x, y, BL / 2 * 0.94, BL / 2 * 0.94, h, 0.007, ROT + (R() < 0.5 ? 0 : Math.PI / 2)) : prismFaces(rectFp(x, y, BL / 2 * 0.94, BL / 2 * 0.94, ROT), 0, h);
      addB(faces, x, y, 'old', { r: Math.hypot(x, y) });
    }
  }
  /* --- Outer districts ------------------------------------------------------ */
  const OS = 0.2;
  for (let gx = -15; gx <= 15; gx++) for (let gy = -15; gy <= 15; gy++) {
    const [x0, y0] = rotP(gx * OS, gy * OS, 0, 0, 0.12);
    const r = Math.hypot(x0, y0);
    const ex = x0 / 0.56, ey = (y0 - 0.03) / 0.48;
    if (ex * ex + ey * ey < 1 || r > 2.9) continue;
    if (Math.hypot(x0 - 0.57, y0 - 0.69) < 0.3) continue; // High Castle park
    if (R() > 0.78 - r * 0.08) continue;
    const n = 1 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const x = x0 + (R() - 0.5) * OS * 0.55, y = y0 + (R() - 0.5) * OS * 0.55;
      if (occupied(x, y, 0.06)) continue;
      const tall = R() < 0.25 + r * 0.06;
      const h = tall ? 0.03 + R() * 0.03 : 0.012 + R() * 0.012;
      const w = 0.03 + R() * 0.05, d = 0.02 + R() * 0.03;
      addB(prismFaces(rectFp(x, y, w, d, 0.12 + (R() < 0.3 ? Math.PI / 2 : 0)), 0, h), x, y, 'outer', { r });
    }
  }
  /* --- City light cloud (for far-away views) ------------------------------- */
  CITY.buildings.forEach(b => CITY.lights.push([b.cx, b.cy, 0.35 + Math.min(1, b.h * 25) * 0.65]));
  for (let i = 0; i < 900; i++) {
    const a = R() * TAU, r = 0.4 + Math.pow(R(), 1.6) * 6.5;
    CITY.lights.push([Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.9, 0.2 + R() * 0.5]);
  }
  /* --- Streets -------------------------------------------------------------- */
  const arterials = [];
  const angs = [0.18, 0.95, 1.6, 2.25, 2.9, 3.55, 4.25, 4.95, 5.6];
  angs.forEach((a0, i) => {
    const pts = [];
    for (let s = 0; s <= 30; s++) {
      const r = 0.5 + s * 0.12;
      const a = a0 + Math.sin(r * 0.9 + i) * 0.08;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    arterials.push(pts); CITY.streets.push({ pts, w: 2, kind: 'art' });
  });
  const ring = [];
  for (let s = 0; s <= 72; s++) { const a = (s / 72) * TAU; ring.push([Math.cos(a) * 0.56, 0.03 + Math.sin(a) * 0.48]); }
  CITY.ring = ring; CITY.streets.push({ pts: ring, w: 2, kind: 'ring' });
  [1.35, 2.3].forEach((rr, k) => {
    const pts = [];
    for (let s = 0; s <= 120; s++) { const a = (s / 120) * TAU; const r = rr * (1 + 0.06 * Math.sin(a * 3 + k)); pts.push([Math.cos(a) * r * 1.05, Math.sin(a) * r * 0.95]); }
    CITY.streets.push({ pts, w: 1.5, kind: 'ring2' });
  });
  // local grid streets, clipped to the city disc
  const addGrid = (spacing, rot, rMin, rMax, kind) => {
    for (let k = -20; k <= 20; k++) for (let dir = 0; dir < 2; dir++) {
      let run = [];
      for (let s = -60; s <= 60; s++) {
        const u = s * 0.05, v = k * spacing;
        const [x, y] = dir ? rotP(v, u, 0, 0, rot) : rotP(u, v, 0, 0, rot);
        const r = Math.hypot(x / 1.05, y / 0.95);
        if (r > rMin && r < rMax) run.push([x, y]);
        else { if (run.length > 2) CITY.streets.push({ pts: run, w: 1, kind }); run = []; }
      }
      if (run.length > 2) CITY.streets.push({ pts: run, w: 1, kind });
    }
  };
  addGrid(0.2, 0.12 + 0.5 * 0, 0.62, 2.95, 'grid');
  // old-town lanes
  for (let k = -6; k <= 6; k++) for (let dir = 0; dir < 2; dir++) {
    const run = [];
    for (let s = -12; s <= 12; s++) {
      const u = s * 0.04, v = (k + 0.5) * SP;
      const [x, y] = dir ? rotP(v, u, 0, 0, ROT) : rotP(u, v, 0, 0, ROT);
      const ex = x / 0.5, ey = (y - 0.03) / 0.42;
      if (ex * ex + ey * ey < 1) run.push([x, y]);
    }
    if (run.length > 2) CITY.streets.push({ pts: run, w: 1, kind: 'lane' });
  }
  CITY.streets.forEach(s => { s.len = polyLength(s.pts, false); });
  /* --- Tram routes: arterial -> ring -> arterial ----------------------------- */
  const route = (ai, bi, dir) => {
    const a = arterials[ai].slice(0, 22).reverse();
    const b = arterials[bi].slice(0, 22);
    const a0 = Math.atan2(a[a.length - 1][1], a[a.length - 1][0]);
    let a1 = Math.atan2(b[0][1], b[0][0]);
    if (dir > 0 && a1 < a0) a1 += TAU; if (dir < 0 && a1 > a0) a1 -= TAU;
    const arc = [];
    for (let s = 0; s <= 24; s++) { const a = lerp(a0, a1, s / 24); arc.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5]); }
    const pts = a.concat(arc, b);
    return { pts, len: polyLength(pts, false) };
  };
  CITY.trams = [route(0, 3, 1), route(5, 1, -1), route(7, 4, -1), route(2, 6, 1)];
  /* --- Cafés ---------------------------------------------------------------- */
  const cr = rng(99);
  for (let i = 0; i < 18; i++) {
    const a = cr() * TAU, r = 0.12 + cr() * 0.5;
    CITY.cafes.push([Math.cos(a) * r * 0.95, 0.03 + Math.sin(a) * r * 0.8, cr()]);
  }
}

/* point at distance s along polyline */
function pointAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (s <= seg) { const t = s / (seg || 1); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]; }
    s -= seg;
  }
  return pts[pts.length - 1];
}

/* ---------------------------------------------------------------------------
 * City renderer
 * ------------------------------------------------------------------------- */
const LIGHT = (() => { const l = [-0.45, -0.55, 0.7]; const n = Math.hypot(...l); return l.map(v => v / n); })();
const COL = {
  wallD: hexRgb('#0d111b'), wallL: hexRgb('#3a2f25'), roof: hexRgb('#2a1c16'), roofL: hexRgb('#6b3d24'),
  top: hexRgb('#1a1f2c'), gold: hexRgb('#e8b45a'), warm: hexRgb('#ffcf85'),
};

function renderCity(ctx, cam, t, o = {}) {
  const rise = o.rise || (() => 1);
  const alpha = o.alpha == null ? 1 : o.alpha;
  if (alpha <= 0) return;
  const list = [];
  for (const b of CITY.buildings) {
    const rs = rise(b);
    if (rs <= 0.001) continue;
    const v = cam.view(b.cx, b.cy, b.h * 0.3);
    if (v[2] < cam.near * 2) continue;
    const s = cam.f / v[2];
    const sx = cam.cx + v[0] * s, sy = cam.cy - v[1] * s;
    const rad = (0.08 + b.h * 2) * s;
    if (sx < -rad || sx > W + rad || sy < -rad - b.h * s * 2 || sy > H + rad) continue;
    list.push([v[2], b, rs, s]);
  }
  list.sort((a, b) => b[0] - a[0]);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  const hi = o.highlight || null;
  for (const [, b, rs, sc] of list) {
    const gold = (b.grp === 'ratusha' ? (o.ratushaGlow || 0) : 0) + (hi && hi(b) || 0);
    const edgeA = (o.edge == null ? 0.35 : o.edge) * (b.grp === 'outer' ? 0.45 : 1) + gold * 0.6;
    const zs = rs;
    for (const f of b.faces) {
      const pts = f.p;
      // back-face culling against camera position
      const p0 = pts[0];
      const dz0 = p0[2] * zs;
      const dot = f.n[0] * (cam.px - p0[0]) + f.n[1] * (cam.py - p0[1]) + f.n[2] * (cam.pz - dz0);
      if (dot <= 0) continue;
      const sp = [];
      let ok = true;
      for (const p of pts) { const q = cam.proj(p[0], p[1], p[2] * zs); if (!q) { ok = false; break; } sp.push(q); }
      if (!ok) continue;
      const lam = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
      let c;
      if (f.k === 1) c = mixRgb(COL.top, COL.wallL, 0.25 + lam * 0.2);
      else if (f.k === 2) c = mixRgb(COL.roof, COL.roofL, lam * 0.9);
      else c = mixRgb(COL.wallD, COL.wallL, lam * 0.85);
      if (gold > 0) c = mixRgb(c, COL.gold, clamp(gold * 0.55));
      ctx.beginPath(); pathPoly(ctx, sp);
      ctx.fillStyle = rgbStr(c, 1); ctx.fill();
      if (edgeA > 0.01) { ctx.strokeStyle = rgbStr(COL.gold, clamp(edgeA)); ctx.lineWidth = Math.max(0.6, Math.min(2.2, sc * 0.0012)); ctx.stroke(); }
      // windows on walls
      if (o.windows && f.k === 0 && pts.length === 4 && (b.grp === 'market' || b.grp === 'ratusha' || b.grp === 'old') && sc > 1400) {
        drawWindows(ctx, sp, b, f, t, o.windows * (b.grp === 'old' ? 0.6 : 1));
      }
    }
  }
  ctx.restore();
}
function bil(sp, u, v) { // bilinear on quad [bl, br, tr, tl]
  const a = sp[0], b = sp[1], c = sp[2], d = sp[3];
  const x0 = lerp(a[0], b[0], u), y0 = lerp(a[1], b[1], u), x1 = lerp(d[0], c[0], u), y1 = lerp(d[1], c[1], u);
  return [lerp(x0, x1, v), lerp(y0, y1, v)];
}
function drawWindows(ctx, sp, b, f, t, amt) {
  const wlen = Math.hypot(sp[1][0] - sp[0][0], sp[1][1] - sp[0][1]);
  const cols = Math.max(2, Math.min(5, Math.round(wlen / 22)));
  const rows = b.grp === 'ratusha' && b.part === 1 ? 6 : 3;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const s = b.id * 31 + i * 7 + j * 13 + (f.n[0] * 3 + f.n[1] * 5);
    const on = hash1(s);
    if (on < 0.35) continue;
    const u0 = (i + 0.3) / cols, u1 = (i + 0.7) / cols, v0 = 0.12 + j * (0.78 / rows), v1 = v0 + 0.78 / rows * 0.55;
    const flick = 0.75 + 0.25 * Math.sin(t * 2 + s);
    const a = amt * (0.25 + 0.6 * on) * flick;
    ctx.fillStyle = `rgba(255,${(190 + on * 50) | 0},${(110 + on * 60) | 0},${a})`;
    ctx.beginPath();
    pathPoly(ctx, [bil(sp, u0, v0), bil(sp, u1, v0), bil(sp, u1, v1), bil(sp, u0, v1)]);
    ctx.fill();
  }
}

/* ground layers ------------------------------------------------------------- */
function drawStreets(ctx, cam, t, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pxkm = cam.f / cam.d;
  for (const s of CITY.streets) {
    const k = s.kind;
    let al = k === 'art' ? 0.55 : k === 'ring' ? 0.7 : k === 'ring2' ? 0.4 : k === 'lane' ? 0.35 : 0.2;
    al *= a;
    if (o.pulse) al *= 1 + o.pulse * (0.6 + 0.4 * Math.sin(s.len * 10 + t * 3));
    const runs = cam.projLine(s.pts);
    ctx.strokeStyle = o.color ? o.color(k, al) : rgba(C.gold, clamp(al));
    ctx.lineWidth = Math.max(0.7, Math.min(6, (k === 'art' || k === 'ring' ? 0.012 : 0.006) * pxkm)) * (o.width || 1);
    for (const r of runs) { ctx.beginPath(); pathPoly(ctx, r, false); ctx.stroke(); }
  }
  ctx.restore();
}
function drawLights(ctx, cam, t, a, size = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < CITY.lights.length; i++) {
    const L = CITY.lights[i];
    const q = cam.proj(L[0], L[1], 0);
    if (!q || q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > H + 20) continue;
    const tw = 0.7 + 0.3 * Math.sin(t * 3 + i);
    glow(ctx, q[0], q[1], (3 + L[2] * 6) * size, a * L[2] * tw);
  }
  ctx.restore();
}
/* vertical "data-spike" extrusions of the light cloud (3D map look) */
function drawSpikes(ctx, cam, t, a, hScale) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < CITY.lights.length; i += 2) {
    const L = CITY.lights[i];
    const r = Math.hypot(L[0], L[1]);
    const h = hScale * L[2] * Math.exp(-r * 0.45) * (0.6 + 0.4 * hash1(i));
    const p0 = cam.proj(L[0], L[1], 0), p1 = cam.proj(L[0], L[1], h);
    if (!p0 || !p1) continue;
    if (p0[0] < -50 || p0[0] > W + 50 || p0[1] < -50 || p0[1] > H + 400) continue;
    const g = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    g.addColorStop(0, `rgba(255,200,120,${0.5 * a})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
  }
  ctx.restore();
}
