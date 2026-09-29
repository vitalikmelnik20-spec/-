'use strict';
/* ---------------------------------------------------------------------------
 * Stylised storybook characters. person(g, x, y, h, spec) draws a lit figure
 * with feet at (x, y) and total standing height h (px).
 * Arm angles: 0 = hanging down, +PI/2 = pointing right, PI = up (screen space).
 * ------------------------------------------------------------------------- */
let FIG = null, FIGC = null;
const CHAR = {
  walter: { skin: '#d9a98a', hair: '#e8e4dc', hairStyle: 'thin', glasses: true, mustache: '#bdb8b0', coat: '#6b4a32', coatLen: 0.44, shirt: '#7a3b33', plaid: true, pants: '#3d3a38', shoes: '#2a211b' },
  scarecrow: { skin: '#d9a98a', hair: '#e8e4dc', hairStyle: 'thin', glasses: true, mustache: '#bdb8b0', coat: '#4f6a8c', coatLen: 0.42, patches: true, straw: true, hat: 'straw', shirt: '#8a5a3a', pants: '#5b4a36', shoes: '#2a211b' },
  walterCoat: { skin: '#d9a98a', hair: '#e8e4dc', hairStyle: 'thin', glasses: true, mustache: '#bdb8b0', coat: '#2d2c33', coatLen: 0.3, shirt: '#7a3b33', pants: '#2b2a2e', shoes: '#1c1a18' },
  billy: { child: true, mask: true, coat: '#5e4128', coatLen: 0.02, bigCoat: true, pants: '#2c2622', shoes: '#241c16', skin: '#e6c1a4' },
  margaret: { skin: '#e3b596', hair: '#8a5a3c', hairStyle: 'curly', coat: '#9b3e3a', coatLen: 0.1, dress: true, shirt: '#9b3e3a', pants: '#9b3e3a', shoes: '#3a2a22', female: true, smile: 1 },
  dorothy: { skin: '#e0b597', hair: '#d8d2c0', hairStyle: 'bob', glasses: 'chain', coat: '#1f2c4a', coatLen: 0.38, shirt: '#d9d2c2', pants: '#34353d', shoes: '#231d1a', female: true },
  elena: { skin: '#c48e6b', hair: '#1e1612', hairStyle: 'braid', coat: '#cbb89a', coatLen: 0.4, shirt: '#cbb89a', pants: '#3a3c48', shoes: '#2a2420', female: true },
  girl: { child: true, skin: '#c99a7a', hair: '#231812', hairStyle: 'kid', coat: '#2b1d3a', coatLen: 0.05, hat: 'witch', cape: true, pants: '#1d1826', shoes: '#1a1418', female: true },
  kid: { child: true, skin: '#dcae8f', hair: '#6b4a2a', hairStyle: 'kid', coat: '#7c7f86', coatLen: 0.3, pants: '#4a4c52', shoes: '#222', },
  sheriff: { skin: '#cf9d7c', hair: '#4a3a2c', hairStyle: 'short', coat: '#a88c62', coatLen: 0.46, hat: 'campaign', shirt: '#a88c62', pants: '#5b4a34', shoes: '#1c1612', mustache: '#4a3a2c' },
  man: { skin: '#cf9d7c', hair: '#3a2e26', hairStyle: 'short', coat: '#3c3a36', coatLen: 0.32, pants: '#2e2c2a', shoes: '#1a1816' },
  neighbor: { skin: '#e2b89c', hair: '#cfc9c0', hairStyle: 'bun', coat: '#6e7a5a', coatLen: 0.2, dress: true, shirt: '#6e7a5a', pants: '#6e7a5a', shoes: '#2a2420', female: true, glasses: true },
  woman: { skin: '#e0b090', hair: '#5a3a26', hairStyle: 'bob', coat: '#4a5a6a', coatLen: 0.4, pants: '#2e3038', shoes: '#222', female: true },
};

function initFigures() { FIG = document.createElement('canvas'); FIG.width = 1800; FIG.height = 1800; FIGC = FIG.getContext('2d'); }

function person(g, x, y, h, spec) {
  const o = Object.assign({}, CHAR[spec.who] || {}, spec);
  const S = Math.min(1500 / (h * 1.5), 1);  // keep inside the temp canvas
  const hh = h * S;
  const cw = Math.ceil(hh * 1.5), ch = Math.ceil(hh * 1.35);
  const ox = cw / 2, oy = hh * 1.2;
  FIGC.setTransform(1, 0, 0, 1, 0, 0); FIGC.clearRect(0, 0, cw + 4, ch + 4);
  FIGC.globalAlpha = 1; FIGC.globalCompositeOperation = 'source-over';
  FIGC.save(); FIGC.translate(ox, oy); FIGC.scale(o.flip ? -1 : 1, 1);
  drawBody(FIGC, hh, o);
  FIGC.restore();
  // lighting: ambient tint + directional key light (source-atop keeps it inside the figure)
  FIGC.globalCompositeOperation = 'source-atop';
  if (o.amb) { FIGC.fillStyle = o.amb; FIGC.fillRect(0, 0, cw, ch); }
  const L = o.light || { x: -1, y: -0.6, c: 'rgba(255,190,110,0.35)', d: 'rgba(0,0,0,0.45)' };
  const ll = Math.hypot(L.x, L.y) || 1, lx = L.x / ll, ly = L.y / ll;
  const cx = ox, cy = oy - hh * 0.5;
  FIGC.fillStyle = lin(FIGC, cx + lx * hh * 0.35, cy + ly * hh * 0.5, cx - lx * hh * 0.35, cy - ly * hh * 0.5, [[0, L.c], [0.45, 'rgba(0,0,0,0)'], [1, L.d]]);
  FIGC.fillRect(0, 0, cw, ch);
  FIGC.globalCompositeOperation = 'source-over';
  g.save(); g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  g.drawImage(FIG, 0, 0, cw, ch, x - ox / S, y - oy / S, cw / S, ch / S);
  g.restore();
  // items that emit light are drawn in world space
  if (o._lights) o._lights.forEach(fn => fn(g, x, y, 1 / S));
}

function limb(g, x0, y0, a, L, w, col) {
  const x1 = x0 + Math.sin(a) * L, y1 = y0 + Math.cos(a) * L;
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  return [x1, y1];
}

function drawBody(g, u, o) {
  const child = !!o.child;
  const pose = o.pose || 'stand';
  const view = o.view || 'front';          // front | back | side
  const turn = o.turn || 0;                // -1..1 for 3/4 views
  const headR = u * (child ? 0.085 : 0.062);
  const shY = -u * (child ? 0.74 : 0.8);
  const hipStand = -u * 0.48;
  let hipY = hipStand, hipX = 0;
  if (pose === 'sit') hipY = -u * 0.3;
  if (pose === 'kneel') hipY = -u * 0.3;
  const sw = u * (view === 'side' ? 0.07 : child ? 0.1 : 0.115);
  const lean = o.lean || 0;
  const legW = u * 0.05;
  const walk = pose === 'walk' ? Math.sin(o.phase || 0) : 0;
  o._lights = [];

  /* legs */
  const pants = o.pants, shoe = o.shoes;
  const legs = [];
  if (pose === 'stand' || pose === 'walk') {
    [-1, 1].forEach(s => {
      const a = walk * 0.35 * s;
      const top = [hipX + s * u * 0.04, hipY];
      const foot = [top[0] + Math.sin(a) * -hipY, 0 - (1 - Math.cos(a)) * -hipY * 0.2];
      legs.push([top, foot]);
    });
  } else if (pose === 'sit') {
    const d = view === 'side' ? 1 : 0;
    [-1, 1].forEach(s => {
      const knee = [s * u * 0.075 + d * u * 0.2, hipY + u * (d ? 0 : 0.075)];
      legs.push([[s * u * 0.05, hipY], knee]); legs.push([knee, [knee[0] * 0.9, 0]]);
    });
    if (!d) { g.fillStyle = pants; poly(g, [[-u * 0.09, hipY - u * 0.01], [u * 0.09, hipY - u * 0.01], [u * 0.11, hipY + u * 0.08], [-u * 0.11, hipY + u * 0.08]]); g.fill(); }
  } else if (pose === 'kneel') {
    const k1 = [u * 0.12, -u * 0.2], k2 = [-u * 0.06, -u * 0.01];
    legs.push([[-u * 0.03, hipY], k2], [k2, [-u * 0.1, -u * 0.005]], [[u * 0.04, hipY], k1], [k1, [u * 0.13, 0]]);
  }
  if (!o.bigCoat || pose !== 'stand') {
    legs.forEach(([a, b]) => { g.strokeStyle = pants; g.lineWidth = legW * (child ? 1.1 : 1); g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
  }
  // shoes
  const feet = pose === 'kneel' ? [[u * 0.15, 0]] : pose === 'sit' ? legs.filter((_, i) => i % 2 === 1).map(l => l[1]) : legs.map(l => l[1]);
  feet.forEach(f => ell(g, f[0] + u * 0.012, f[1] - u * 0.01, u * 0.035, u * 0.018, shoe));

  /* upper body (rotates by lean around hip) */
  g.save(); g.translate(hipX, hipY); g.rotate(lean); g.translate(0, -hipY);
  const shoulderY = shY + (hipY - hipStand);
  const L = o.coatLen == null ? 0.4 : o.coatLen;
  let hemY = pose === 'stand' || pose === 'walk' ? -u * L : hipY + u * 0.08;
  if (o.bigCoat && (pose === 'stand' || pose === 'walk')) hemY = 0;
  const hemW = o.bigCoat ? u * 0.19 : o.dress ? u * 0.15 : u * 0.105;
  // cape (behind)
  if (o.cape) { g.fillStyle = '#140d1c'; poly(g, [[-sw * 1.05, shoulderY + u * 0.02], [sw * 1.05, shoulderY + u * 0.02], [u * 0.2, -u * 0.04], [-u * 0.2, -u * 0.04]]); g.fill(); }
  // back arm
  const arms = o.arms || {};
  const armCol = o.coat, armW = u * (o.bigCoat ? 0.075 : 0.05);
  const drawArm = (side) => {
    const spec = arms[side] || [side === 'l' ? -0.08 : 0.08, 0];
    const s0 = [side === 'l' ? -sw * 0.92 : sw * 0.92, shoulderY + u * 0.025];
    const up = u * (child ? 0.16 : 0.17), fo = u * (child ? 0.15 : 0.16);
    const e = limb(g, s0[0], s0[1], spec[0], up, armW, armCol);
    const hnd = limb(g, e[0], e[1], spec[0] + spec[1], fo * (o.bigCoat ? 1.05 : 1), armW * 0.9, armCol);
    if (o.bigCoat) { const cx = hnd[0] - Math.sin(spec[0] + spec[1]) * u * 0.03, cy = hnd[1] - Math.cos(spec[0] + spec[1]) * u * 0.03; limb(g, cx, cy, spec[0] + spec[1], u * 0.025, armW * 1.05, '#4a3220'); }
    if (o.straw) strawTuft(g, hnd[0], hnd[1], spec[0] + spec[1], u);
    if (!o.gloves) ell(g, hnd[0], hnd[1], u * 0.024, u * 0.026, o.skin);
    const it = side === 'l' ? o.lItem : o.rItem;
    if (it) drawItem(g, it, hnd[0], hnd[1], u, spec[0] + spec[1], o);
    return hnd;
  };
  const backSide = view === 'back' ? 'r' : (o.backArm || 'l');
  if (view !== 'side') drawArm(backSide);
  // torso / coat
  g.fillStyle = o.coat;
  poly(g, [[-sw, shoulderY], [sw, shoulderY], [hemW, hemY], [-hemW, hemY]]);
  g.fill();
  // collar / shirt V
  if (view !== 'back') {
    if (o.shirt && !o.bigCoat) { g.fillStyle = o.shirt; poly(g, [[-sw * 0.35, shoulderY], [sw * 0.35, shoulderY], [0, shoulderY + u * 0.13]]); g.fill();
      if (o.plaid) { g.strokeStyle = 'rgba(30,20,20,0.5)'; g.lineWidth = u * 0.004; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(-sw * 0.3, shoulderY + k * u * 0.025); g.lineTo(sw * 0.3, shoulderY + k * u * 0.025); g.stroke(); } } }
    if (!o.dress && !o.bigCoat) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = u * 0.006; g.beginPath(); g.moveTo(0, shoulderY + u * 0.13); g.lineTo(0, hemY); g.stroke(); }
    if (o.bigCoat) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = u * 0.008; g.beginPath(); g.moveTo(-u * 0.01, shoulderY + u * 0.05); g.lineTo(u * 0.02, hemY); g.stroke();
      [0.18, 0.32, 0.46].forEach(k => ell(g, u * 0.035, shoulderY + u * k, u * 0.01, u * 0.01, '#2e2014')); }
  }
  if (o.patches) { [[-0.06, 0.12, '#7a5a3a'], [0.05, 0.22, '#8a3a2a'], [-0.04, 0.3, '#6a7a5a']].forEach(p => { g.fillStyle = p[2]; g.fillRect(p[0] * u, shoulderY + p[1] * u, u * 0.04, u * 0.035); }); }
  if (o.straw) { for (let k = 0; k < 7; k++) strawTuft(g, (k - 3) * u * 0.02, shoulderY + u * 0.005, Math.PI + (k - 3) * 0.2, u * 0.7); }
  // head
  const hx = (view === 'side' ? u * 0.01 : turn * u * 0.01), hy = shoulderY - u * (child ? 0.07 : 0.1);
  if (!o.mask) {
    g.fillStyle = o.skin; g.fillRect(-u * 0.02, shoulderY - u * 0.05, u * 0.04, u * 0.06);  // neck
    drawHead(g, hx, hy, headR, u, o, view, turn);
  } else drawMask(g, hx, hy + u * 0.005, u * 0.1, u, Object.assign({}, o, { back: view === 'back' }));
  if (view === 'side' || view === 'front' || view === 'back') drawArm(backSide === 'l' ? 'r' : 'l');
  g.restore();
}

function strawTuft(g, x, y, a, u) {
  g.strokeStyle = '#d8b35a'; g.lineWidth = u * 0.004; g.lineCap = 'round';
  for (let k = -2; k <= 2; k++) { const aa = a + k * 0.25; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(aa) * u * 0.05, y + Math.cos(aa) * u * 0.05); g.stroke(); }
}

function drawHead(g, x, y, r, u, o, view, turn) {
  // hair behind
  if (o.hairStyle === 'curly') { g.fillStyle = o.hair; for (let k = 0; k < 10; k++) { const a = Math.PI + (k / 9) * Math.PI * 1.2 - 0.1; ell(g, x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.0 + r * 0.25, r * 0.38, r * 0.38, o.hair); } }
  if (o.hairStyle === 'braid') { g.fillStyle = o.hair; ell(g, x, y - r * 0.05, r * 1.12, r * 1.12, o.hair); g.strokeStyle = o.hair; g.lineWidth = r * 0.45; g.beginPath(); g.moveTo(x + r * 0.7, y + r * 0.5); g.quadraticCurveTo(x + r * 1.1, y + r * 1.8, x + r * 0.6, y + r * 2.8); g.stroke(); }
  if (o.hairStyle === 'bob') ell(g, x, y + r * 0.1, r * 1.15, r * 1.1, o.hair);
  if (o.hairStyle === 'bun') { ell(g, x, y - r * 1.0, r * 0.45, r * 0.4, o.hair); ell(g, x, y - r * 0.1, r * 1.08, r * 1.05, o.hair); }
  // face
  ell(g, x, y, r * 0.92, r, o.skin);
  if (view === 'back') {
    if (o.hairStyle === 'thin') { g.save(); g.beginPath(); g.ellipse(x, y, r * 0.93, r, 0, 0, TAU); g.clip(); ell(g, x, y + r * 0.55, r * 1.1, r * 0.6, o.hair); ell(g, x, y - r * 0.3, r * 0.55, r * 0.5, mixHex(o.skin, '#000', 0.08)); g.restore(); }
    else ell(g, x, y - r * 0.05, r * 0.95, r * 1.02, o.hair);
  } else {
    const fx = x + turn * r * 0.3;
    // hair on top
    if (o.hairStyle === 'thin') { g.fillStyle = o.hair; g.beginPath(); g.ellipse(x, y - r * 0.35, r * 0.9, r * 0.62, 0, Math.PI * 1.05, Math.PI * 1.95); g.fill(); ell(g, x - r * 0.85, y - r * 0.1, r * 0.18, r * 0.35, o.hair); ell(g, x + r * 0.85, y - r * 0.1, r * 0.18, r * 0.35, o.hair); }
    if (o.hairStyle === 'short' || o.hairStyle === 'kid') { g.fillStyle = o.hair; g.beginPath(); g.ellipse(x, y - r * 0.2, r * 0.97, r * 0.85, 0, Math.PI * 1.02, Math.PI * 1.98); g.fill(); }
    if (o.hairStyle === 'curly') { for (let k = 0; k < 7; k++) { const a = Math.PI * 1.05 + (k / 6) * Math.PI * 0.9; ell(g, x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.8, r * 0.32, r * 0.3, o.hair); } }
    if (o.hairStyle === 'bob' || o.hairStyle === 'braid' || o.hairStyle === 'bun') { g.fillStyle = o.hair; g.beginPath(); g.ellipse(x, y - r * 0.28, r, r * 0.75, 0, Math.PI, TAU); g.fill(); }
    // features
    const ey = y - r * 0.08, es = r * 0.36;
    const eyeC = 'rgba(40,30,28,0.85)';
    if (!o.eyesClosed) { ell(g, fx - es, ey, r * 0.07, r * 0.09, eyeC); ell(g, fx + es, ey, r * 0.07, r * 0.09, eyeC); }
    else { g.strokeStyle = eyeC; g.lineWidth = r * 0.05; [-1, 1].forEach(s => { g.beginPath(); g.arc(fx + s * es, ey - r * 0.02, r * 0.1, 0.2, Math.PI - 0.2); g.stroke(); }); }
    g.strokeStyle = 'rgba(60,40,35,0.55)'; g.lineWidth = r * 0.05; g.lineCap = 'round';
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(fx + s * es - r * 0.14, ey - r * 0.22 - (o.sad ? s * -0.04 * r : 0)); g.lineTo(fx + s * es + r * 0.14, ey - r * 0.24 + (o.sad ? s * 0.06 * r : 0)); g.stroke(); });
    g.strokeStyle = 'rgba(120,70,55,0.5)'; g.beginPath(); g.moveTo(fx + r * 0.02, ey + r * 0.05); g.lineTo(fx + r * 0.08, ey + r * 0.32); g.lineTo(fx - r * 0.02, ey + r * 0.35); g.stroke();
    if (o.glasses) { g.strokeStyle = o.glasses === 'chain' ? 'rgba(40,40,50,0.8)' : 'rgba(210,200,180,0.9)'; g.lineWidth = r * 0.04; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(fx + s * es, ey, r * 0.2, r * 0.17, 0, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(fx - es + r * 0.2, ey); g.lineTo(fx + es - r * 0.2, ey); g.stroke();
      if (o.glasses === 'chain') { g.strokeStyle = 'rgba(200,180,120,0.6)'; g.lineWidth = r * 0.02; g.beginPath(); g.moveTo(x - r * 0.9, ey); g.quadraticCurveTo(x - r * 0.8, y + r * 1.6, x, y + r * 1.7); g.quadraticCurveTo(x + r * 0.8, y + r * 1.6, x + r * 0.9, ey); g.stroke(); } }
    const my = y + r * 0.5, smile = o.smile == null ? 0.3 : o.smile;
    if (o.mustache) { g.fillStyle = o.mustache; g.beginPath(); g.moveTo(fx - r * 0.38, my + r * 0.02); g.quadraticCurveTo(fx, my - r * 0.22, fx + r * 0.38, my + r * 0.02); g.quadraticCurveTo(fx, my - r * 0.02, fx - r * 0.38, my + r * 0.02); g.fill(); }
    g.strokeStyle = 'rgba(110,50,45,0.7)'; g.lineWidth = r * 0.05; g.beginPath(); g.moveTo(fx - r * 0.2, my + r * 0.1); g.quadraticCurveTo(fx, my + r * (0.1 + 0.18 * smile), fx + r * 0.2, my + r * 0.1); g.stroke();
    if (o.tears) { ell(g, fx - es, ey + r * 0.3, r * 0.04, r * 0.07, 'rgba(200,220,255,0.7)'); }
  }
  // hats
  if (o.hat === 'straw') {
    g.fillStyle = '#b89452'; ell(g, x, y - r * 0.55, r * 1.9, r * 0.38, '#a8833f');
    g.beginPath(); g.moveTo(x - r * 0.95, y - r * 0.6); g.quadraticCurveTo(x - r * 0.9, y - r * 1.55, x, y - r * 1.55); g.quadraticCurveTo(x + r * 0.9, y - r * 1.55, x + r * 0.95, y - r * 0.6); g.fillStyle = '#c29c55'; g.fill();
    g.fillStyle = '#6a4a2a'; g.fillRect(x - r * 0.93, y - r * 0.85, r * 1.86, r * 0.18);
    g.strokeStyle = 'rgba(90,60,20,0.35)'; g.lineWidth = r * 0.03; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * r * 0.25, y - r * 0.5); g.lineTo(x + k * r * 0.45, y - r * 0.62); g.stroke(); }
    if (o.shadowFace) { g.fillStyle = 'rgba(8,8,12,0.9)'; ell(g, x, y + r * 0.1, r * 0.95, r * 1.0, 'rgba(8,8,12,0.92)'); }
  }
  if (o.hat === 'witch') { g.fillStyle = '#1a1024'; ell(g, x, y - r * 0.6, r * 1.8, r * 0.35, '#1a1024'); poly(g, [[x - r * 0.9, y - r * 0.65], [x + r * 0.9, y - r * 0.65], [x + r * 0.5, y - r * 2.6]]); g.fill(); g.fillStyle = '#7a4aa0'; g.fillRect(x - r * 0.88, y - r * 0.95, r * 1.76, r * 0.2); }
  if (o.hat === 'helmet') { ell(g, x, y, r * 1.45, r * 1.45, '#e8ecf0'); ell(g, x, y + r * 0.05, r * 1.0, r * 0.85, '#1a2230'); g.fillStyle = 'rgba(255,255,255,0.3)'; ell(g, x - r * 0.4, y - r * 0.3, r * 0.3, r * 0.2, 'rgba(255,255,255,0.35)'); }
  if (o.hat === 'campaign') { ell(g, x, y - r * 0.6, r * 1.6, r * 0.3, '#6a5234'); g.fillStyle = '#7a603c'; poly(g, [[x - r * 0.85, y - r * 0.65], [x + r * 0.85, y - r * 0.65], [x + r * 0.4, y - r * 1.5], [x, y - r * 1.35], [x - r * 0.4, y - r * 1.5]]); g.fill(); }
}

function drawMask(g, x, y, r, u, o) {
  // hood of the coat collar behind
  ell(g, x, y + r * 0.9, r * 0.9, r * 0.35, '#4a3220');
  // papier-mache pumpkin
  const gr = rad(g, x - r * 0.3, y - r * 0.3, r * 0.1, r * 1.2, [[0, '#e0914a'], [0.6, '#c06a2a'], [1, '#7a3e18']]);
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.05, r * 0.95, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(90,40,15,0.45)'; g.lineWidth = r * 0.05;
  [-0.55, 0, 0.55].forEach(k => { g.beginPath(); g.ellipse(x + k * r * 0.5, y, r * (0.55 - Math.abs(k) * 0.25), r * 0.93, 0, -Math.PI / 2, Math.PI / 2, k < 0); g.stroke(); });
  // faded paint patches & cracks
  g.fillStyle = 'rgba(230,200,150,0.18)'; ell(g, x + r * 0.35, y - r * 0.4, r * 0.3, r * 0.2, 'rgba(230,200,150,0.18)');
  g.strokeStyle = 'rgba(60,25,10,0.35)'; g.lineWidth = r * 0.02; g.beginPath(); g.moveTo(x - r * 0.7, y - r * 0.2); g.lineTo(x - r * 0.5, y - r * 0.05); g.lineTo(x - r * 0.55, y + r * 0.15); g.stroke();
  // stem
  g.fillStyle = '#4a5a2a'; poly(g, [[x - r * 0.1, y - r * 0.9], [x + r * 0.1, y - r * 0.92], [x + r * 0.16, y - r * 1.22], [x + 0.02 * r, y - r * 1.2]]); g.fill();
  if (o.back) { g.strokeStyle = 'rgba(40,25,15,0.6)'; g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(x - r * 0.9, y + r * 0.1); g.quadraticCurveTo(x, y + r * 0.3, x + r * 0.9, y + r * 0.1); g.stroke(); return; }
  // eye holes (dark, empty)
  const eye = 'rgba(8,5,6,0.96)';
  [[-0.38, -0.12], [0.36, -0.14]].forEach(([ex, ey]) => { g.fillStyle = eye; g.beginPath(); g.ellipse(x + ex * r, y + ey * r, r * 0.17, r * 0.2, 0, 0, TAU); g.fill(); });
  // crooked painted smile (painted, not cut): dark red-brown line, lower on the left
  g.strokeStyle = 'rgba(55,18,10,0.9)'; g.lineWidth = r * 0.07; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - r * 0.55, y + r * 0.38); g.quadraticCurveTo(x - r * 0.1, y + r * 0.62, x + r * 0.2, y + r * 0.45); g.quadraticCurveTo(x + r * 0.42, y + r * 0.35, x + r * 0.55, y + r * 0.22); g.stroke();
  g.lineWidth = r * 0.03; [-0.3, 0, 0.28].forEach(k => { g.beginPath(); g.moveTo(x + k * r, y + r * 0.42); g.lineTo(x + k * r, y + r * 0.55); g.stroke(); });
}

function drawItem(g, it, x, y, u, a, o) {
  const name = typeof it === 'string' ? it : it.name;
  if (name === 'pillowcase') {
    const w = u * 0.13, h = u * 0.2;
    g.fillStyle = '#e9e4d6'; g.beginPath(); g.moveTo(x - w * 0.3, y); g.quadraticCurveTo(x - w * 0.7, y + h * 0.4, x - w * 0.55, y + h); g.lineTo(x + w * 0.55, y + h); g.quadraticCurveTo(x + w * 0.7, y + h * 0.4, x + w * 0.3, y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,110,95,0.4)'; g.lineWidth = u * 0.004; g.beginPath(); g.moveTo(x - w * 0.1, y + h * 0.2); g.lineTo(x - w * 0.2, y + h * 0.9); g.moveTo(x + w * 0.15, y + h * 0.15); g.lineTo(x + w * 0.25, y + h * 0.85); g.stroke();
  } else if (name === 'flashlight') {
    g.save(); g.translate(x, y); g.rotate(-(a) + Math.PI); g.fillStyle = '#2a2a2e'; g.fillRect(-u * 0.012, -u * 0.01, u * 0.024, u * 0.07); g.fillStyle = '#ffeec8'; g.fillRect(-u * 0.014, u * 0.058, u * 0.028, u * 0.01); g.restore();
    const beam = it.beam; // world-space beam: {angle, len}
    if (beam) o._lights.push((W2, fx, fy, k) => {});
  } else if (name === 'bowl') {
    ell(g, x, y - u * 0.02, u * 0.1, u * 0.03, '#d8d0c0'); g.fillStyle = '#b8a890'; g.beginPath(); g.ellipse(x, y - u * 0.02, u * 0.1, u * 0.06, 0, 0, Math.PI); g.fill();
    for (let k = 0; k < 5; k++) { g.save(); g.translate(x + (k - 2) * u * 0.03, y - u * 0.04); g.rotate((k - 2) * 0.3); g.fillStyle = k % 2 ? '#5a2e1a' : '#7a1e1e'; g.fillRect(-u * 0.012, -u * 0.03, u * 0.024, u * 0.05); g.restore(); }
  } else if (name === 'candy') {
    g.save(); g.translate(x, y); g.rotate(0.3); g.fillStyle = '#4a2414'; g.fillRect(-u * 0.02, -u * 0.035, u * 0.04, u * 0.07); g.fillStyle = '#8a1c1c'; g.fillRect(-u * 0.02, -u * 0.012, u * 0.04, u * 0.024); g.restore();
  } else if (name === 'mask') {
    drawMask(g, x, y + u * 0.03, u * 0.06, u, o);
  } else if (name === 'hat') {
    ell(g, x, y + u * 0.02, u * 0.1, u * 0.025, '#a8833f'); ell(g, x, y, u * 0.05, u * 0.035, '#c29c55');
  } else if (name === 'paper') {
    g.save(); g.translate(x, y); g.rotate(-0.2); g.fillStyle = '#e6dcc2'; g.fillRect(-u * 0.035, -u * 0.05, u * 0.07, u * 0.09); g.restore();
  } else if (name === 'photo') {
    g.save(); g.translate(x, y); g.rotate(-0.15); g.fillStyle = '#efe9dc'; g.fillRect(-u * 0.04, -u * 0.05, u * 0.08, u * 0.09); g.fillStyle = '#5a5650'; g.fillRect(-u * 0.032, -u * 0.042, u * 0.064, u * 0.06); g.restore();
  } else if (name === 'lantern') {
    g.fillStyle = '#2a2622'; g.fillRect(x - u * 0.02, y, u * 0.04, u * 0.06); ell(g, x, y + u * 0.04, u * 0.015, u * 0.02, '#ffd28a');
    o._lights.push((W2, fx, fy, k) => {});
  } else if (name === 'towel') {
    g.fillStyle = '#d8d4c8'; g.fillRect(x - u * 0.02, y, u * 0.045, u * 0.1);
  } else if (name === 'bucket') {
    g.fillStyle = '#d86a1a'; poly(g, [[x - u * 0.05, y + u * 0.02], [x + u * 0.05, y + u * 0.02], [x + u * 0.04, y + u * 0.1], [x - u * 0.04, y + u * 0.1]]); g.fill();
  } else if (name === 'notebook') {
    g.fillStyle = '#3a4a3a'; g.fillRect(x - u * 0.04, y - u * 0.02, u * 0.07, u * 0.09);
  } else if (name === 'rope') {
    g.strokeStyle = '#a8905a'; g.lineWidth = u * 0.01; g.beginPath(); g.arc(x, y + u * 0.05, u * 0.04, 0, TAU); g.stroke();
  }
}

/* flashlight beam in world space: from (x,y) toward angle, with mist scattering */
function beam(g, x, y, ang, len, spread = 0.18, a = 0.5) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = rad(g, x, y, 5, len, [[0, `rgba(255,240,205,${0.55 * a})`], [0.4, `rgba(255,235,195,${0.18 * a})`], [1, 'rgba(255,230,190,0)']]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x, y);
  g.arc(x, y, len, ang - spread, ang + spread); g.closePath(); g.fill();
  glow(g, x, y, 30, a, SPR.warm);
  g.restore();
}
