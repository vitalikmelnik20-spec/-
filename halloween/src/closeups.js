'use strict';
/* Close-ups and inserts. */
function darkBokeh(g, t, base = '#07080c', warm = true, n = 14, seed = 2) {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const x = hash1(i * 3 + seed) * W, y = hash1(i * 5 + seed) * H * 0.8; glow(g, x, y, 40 + hash1(i * 7) * 90, 0.15 + 0.2 * hash1(i * 9), warm && i % 3 ? SPR.warm : SPR.cool); }
}
function boards(g, y0, y1, col = '#3a2a1e', dir = 0) {
  g.fillStyle = lin(g, 0, y0, 0, y1, [[0, mixHex(col, '#000', 0.4)], [1, col]]); g.fillRect(0, y0, W, y1 - y0);
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 3;
  for (let k = 0; k < 14; k++) { const y = y0 + (y1 - y0) * Math.pow(k / 13, 1.4); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let k = 0; k < 30; k++) { const x = hash1(k) * W, y = y0 + hash1(k * 2) * (y1 - y0); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 30); g.stroke(); }
}
function cuMask(g, t, o = {}) {
  darkBokeh(g, t, '#0a0807');
  addGlow(g, 300, 120, 900, 0.5);
  // coat collar
  g.fillStyle = '#4a3220'; poly(g, [[380, H], [700, 820], [1220, 820], [1540, H]]); g.fill();
  g.fillStyle = '#5e4128'; poly(g, [[560, H], [760, 860], [960, 1000], [1160, 860], [1360, H]]); g.fill();
  drawMask(g, 960, 520 + Math.sin(t * 0.5) * 3, o.r || 330, 1000, {});
  // warm key light from the porch lamp (upper left) + cold fill
  g.save(); g.globalCompositeOperation = 'source-atop'; g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 700, 300, 100, 1200, [[0, 'rgba(255,240,220,1)'], [1, 'rgba(60,70,110,1)']]); g.fillRect(0, 0, W, H); g.restore();
  if (o.macro) { g.save(); g.globalCompositeOperation = 'overlay'; g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, W, H); g.restore(); }
}
function sleeveHand(g, x, y, a, s) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = '#5e4128'; poly(g, [[-120 * s, -500 * s], [120 * s, -500 * s], [95 * s, 0], [-95 * s, 0]]); g.fill();
  g.fillStyle = '#4a3220'; g.fillRect(-100 * s, -70 * s, 200 * s, 70 * s);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 4 * s; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-98 * s, -20 * s - k * 22 * s); g.lineTo(98 * s, -20 * s - k * 22 * s); g.stroke(); }
  ell(g, 0, 40 * s, 62 * s, 56 * s, '#e0bca0'); for (let k = 0; k < 4; k++) ell(g, (-40 + k * 27) * s, 92 * s, 13 * s, 28 * s, '#dcb89a');
  g.restore();
}
function pillowcaseOpen(g, x, y, s, t) {
  g.fillStyle = '#e8e2d2'; g.beginPath(); g.moveTo(x - 260 * s, y); g.quadraticCurveTo(x - 330 * s, y + 380 * s, x - 240 * s, y + 620 * s); g.lineTo(x + 250 * s, y + 620 * s); g.quadraticCurveTo(x + 330 * s, y + 360 * s, x + 260 * s, y); g.closePath(); g.fill();
  ell(g, x, y, 260 * s, 70 * s, '#0a0808');
  g.strokeStyle = 'rgba(140,130,110,0.4)'; g.lineWidth = 5 * s; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 80 * s, y + 90 * s); g.quadraticCurveTo(x + k * 100 * s, y + 350 * s, x + k * 70 * s, y + 600 * s); g.stroke(); }
}
function cuPillowcase(g, t, o = {}) {
  darkBokeh(g, t, '#08070a');
  addGlow(g, 400, 150, 800, 0.6);
  pillowcaseOpen(g, 960, 470, 1, t);
  sleeveHand(g, 620, 430, -1.9, 0.75); sleeveHand(g, 1300, 430, 1.9, 0.75);
  if (o.choc != null) {
    const p = clamp(o.choc); const cy = lerp(-120, 470, Ease.inCubic(p));
    if (p < 1) { g.save(); g.translate(930, cy); g.rotate(0.4 + p); g.fillStyle = '#4a2414'; g.fillRect(-60, -110, 120, 220); g.fillStyle = '#8a1c1c'; g.fillRect(-60, -40, 120, 70); g.fillStyle = '#e8d0a0'; g.font = '600 30px Sans'; g.restore(); }
    for (let k = 0; k < 7; k++) glow(g, 960 + Math.sin(t * 1.3 + k) * 60, 440 - k * 45 - (t * 25 % 45), 70 + k * 18, 0.18 * clamp((p - 0.6) * 3) * (1 - k / 7), SPR.fog);
  }
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 500, 200, 100, 1500, [[0, 'rgba(255,230,200,1)'], [1, 'rgba(50,60,100,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuPost(g, t, o = {}) {
  g.fillStyle = '#06070a'; g.fillRect(0, 0, W, H);
  g.fillStyle = lin(g, 700, 0, 1220, 0, [[0, '#5a5448'], [0.5, '#9a9282'], [1, '#4a4438']]); g.fillRect(720, 0, 480, H);
  g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 2; for (let k = 0; k < 10; k++) { g.beginPath(); g.moveTo(740 + k * 46, 0); g.bezierCurveTo(760 + k * 46, 300, 720 + k * 46, 700, 745 + k * 46, H); g.stroke(); }
  const n = o.marks || 7;
  for (let k = 0; k < n; k++) {
    const y = 520 + (k - (n - 1) / 2) * 5;
    g.strokeStyle = 'rgba(40,40,45,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(860, y); g.lineTo(1060, y + (k % 2) * 2); g.stroke();
    g.strokeStyle = 'rgba(40,40,45,0.55)'; g.lineWidth = 2; g.beginPath(); let lx = 1075; const ly = y - 8 + (k % 2 ? 14 : -14) * Math.ceil(k / 2); g.moveTo(lx, ly); for (let c = 0; c < 7; c++) { lx += 9; g.lineTo(lx, ly - 7 + (c % 2) * 9); } g.stroke();
  }
  // flashlight spot
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 960 + Math.sin(t * 0.7) * 20, 520, 60, 560, [[0, 'rgba(255,245,225,1)'], [0.6, 'rgba(120,110,100,1)'], [1, 'rgba(10,12,20,1)']]); g.fillRect(0, 0, W, H); g.restore();
  addGlow(g, 960, 520, 300, 0.18);
}
function cuClock(g, t, o = {}) {
  room(g, t, { wall: '#4a3a2e', paper: true, floorY: 1300 });
  addGlow(g, 1500, 900, 900, 0.4);
  wallClock(g, 960, 420, 250, o.time || [11, 47], t + (o.sec || 0));
  if (o.kettle) { g.fillStyle = '#2a2420'; g.fillRect(500, 900, 920, 200); kettle(g, 1180, 900, 1.3, 1, t); }
  if (o.door) { g.save(); g.filter = 'blur(6px)'; g.fillStyle = '#1a120d'; g.fillRect(200, 250, 300, 830); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, 200, H); g.restore(); }
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 960, 420, 150, 1100, [[0, 'rgba(255,235,205,1)'], [1, 'rgba(40,30,30,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuHem(g, t) {
  g.fillStyle = '#07070a'; g.fillRect(0, 0, W, H);
  boards(g, 520, H, '#4a3626');
  addGlow(g, 300, 300, 900, 0.5);
  g.fillStyle = '#5e4128'; g.beginPath(); g.moveTo(560, -10); g.lineTo(1360, -10); g.quadraticCurveTo(1440, 600, 1400, 860); g.quadraticCurveTo(1000, 900, 520, 870); g.quadraticCurveTo(480, 600, 560, -10); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 6; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(640 + k * 170, 0); g.quadraticCurveTo(620 + k * 175, 500, 600 + k * 180, 870); g.stroke(); }
  g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(520, 870); g.quadraticCurveTo(1000, 920, 1400, 860); g.lineTo(1420, 900); g.quadraticCurveTo(1000, 960, 500, 905); g.fill();
  [[820, 930], [1080, 925]].forEach(([x, y]) => { ell(g, x, y, 110, 45, '#2a1e16'); ell(g, x - 20, y - 12, 70, 20, 'rgba(90,70,50,0.35)'); });
  leaves(g, t * 0.3, 10, 0.9, 12, [0, 800, W, 280]);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 400, 300, 100, 1600, [[0, 'rgba(255,225,190,1)'], [1, 'rgba(40,45,80,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuShoulder(g, t) {
  darkBokeh(g, t, '#060609', false);
  g.fillStyle = lin(g, 0, 300, 0, H, [[0, '#6a4a2e'], [1, '#3a2616']]); g.beginPath(); g.moveTo(-50, H); g.quadraticCurveTo(200, 330, 900, 300); g.quadraticCurveTo(1500, 290, 1970, 520); g.lineTo(1970, H); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let k = 0; k < 120; k++) { const x = hash1(k) * W, y = 380 + hash1(k * 2) * 700; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y + 6); g.stroke(); }
  for (let k = 0; k < 90; k++) { const x = hash1(k * 5) * W, y = 360 + hash1(k * 7) * 600, r = 3 + hash1(k * 9) * 7; ell(g, x, y, r, r, 'rgba(200,215,235,0.55)'); ell(g, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3, 'rgba(255,255,255,0.9)'); }
  addGlow(g, 400, 200, 700, 0.35);
}
function cuNotebook(g, t) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#3a2414'], [1, '#1a0e08']]); g.fillRect(0, 0, W, H);
  g.save(); g.translate(960, 560); g.rotate(-0.06);
  g.fillStyle = '#efe8d4'; g.fillRect(-620, -420, 1240, 820); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-10, -420, 20, 820);
  g.strokeStyle = 'rgba(120,150,190,0.4)'; g.lineWidth = 2; for (let k = 0; k < 20; k++) { g.beginPath(); g.moveTo(-600, -360 + k * 38); g.lineTo(600, -360 + k * 38); g.stroke(); }
  g.strokeStyle = 'rgba(40,40,60,0.75)'; g.lineWidth = 2.5; const r = rng(4);
  for (let k = 0; k < 16; k++) { let x = -580; const y = -370 + k * 38; if (k > 1 && k < 9) continue; g.beginPath(); g.moveTo(x, y); while (x < -40 - r() * 100) { x += 8 + r() * 16; g.lineTo(x, y - r() * 12); g.lineTo(x + 5, y); } g.stroke(); }
  for (let k = 0; k < 18; k++) { let x = 60; const y = -370 + k * 38; if (k > 10) continue; g.beginPath(); g.moveTo(x, y); while (x < 560 - r() * 200) { x += 8 + r() * 16; g.lineTo(x, y - r() * 12); g.lineTo(x + 5, y); } g.stroke(); }
  g.strokeStyle = 'rgba(40,40,50,0.8)'; g.lineWidth = 3; g.beginPath(); g.ellipse(-320, -60, 160, 140, 0, 0, TAU); g.stroke();
  [[-380, -100], [-260, -104]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 26, 30, 0, 0, TAU); g.stroke(); });
  g.beginPath(); g.moveTo(-420, 0); g.quadraticCurveTo(-330, 40, -260, 10); g.quadraticCurveTo(-230, -5, -210, -25); g.stroke();
  g.restore();
  g.save(); g.translate(1350, 800); g.rotate(-0.9); g.fillStyle = '#d8a82a'; g.fillRect(-12, -300, 24, 330); g.fillStyle = '#2a2a2a'; poly(g, [[-12, 30], [12, 30], [0, 70]]); g.fill(); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 800, 300, 100, 1500, [[0, 'rgba(255,230,190,1)'], [1, 'rgba(60,30,20,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuMailbox(g, t) {
  sky(g, 'day', { horizon: 700 }); treeline(g, 680, '#7a5a3a', 5, 40);
  g.fillStyle = '#9a8a5a'; g.fillRect(0, 680, W, H);
  mapleTree(g, 1600, 760, 700, 8, ['#c2641f', '#d99a2e', '#9a3b1a', '#e0b040'], 0);
  g.fillStyle = '#5a4630'; g.fillRect(900, 620, 60, 460);
  g.fillStyle = '#4a5a6a'; g.beginPath(); g.moveTo(640, 620); g.lineTo(640, 420); g.arc(930, 420, 290, Math.PI, TAU); g.lineTo(1220, 620); g.fill();
  g.fillStyle = '#3a4a5a'; ell(g, 640, 520, 30, 100, '#2a3440');
  g.fillStyle = '#a02a1a'; g.fillRect(1180, 330, 20, 150); g.fillRect(1180, 330, 70, 40);
  g.save(); g.translate(560, 470); g.rotate(-0.25);
  g.fillStyle = '#f4f0e6'; g.fillRect(-260, -170, 380, 290);
  g.strokeStyle = '#d8a02a'; g.lineWidth = 7; g.beginPath(); for (let k = 0; k < 10; k++) { g.moveTo(-120 + k * 6, -140); g.lineTo(-125 + k * 7, -95); } g.stroke();
  g.strokeStyle = '#3a6ab0'; g.lineWidth = 9; g.beginPath(); g.moveTo(-90, -60); g.lineTo(-90, 60); g.moveTo(-160, -30); g.lineTo(-20, -30); g.stroke();
  g.fillStyle = '#e0a060'; ell(g, -90, -110, 34, 32, '#e8b080'); g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.beginPath(); g.arc(-90, -105, 16, 0.3, Math.PI - 0.3); g.stroke();
  g.fillStyle = '#c8a040'; poly(g, [[-150, -140], [-30, -140], [-90, -185]]); g.fill();
  g.fillStyle = '#c02020'; ell(g, 0, 10, 36, 34, '#c02020'); g.strokeStyle = '#4a2a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -20); g.lineTo(6, -60); g.stroke();
  g.strokeStyle = '#3a8a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-250, 100); g.lineTo(110, 100); g.stroke();
  g.restore();
  addGlow(g, 300, 150, 700, 0.35);
}
function cuGrocery(g, t) {
  g.fillStyle = '#d8dcd6'; g.fillRect(0, 0, W, H);
  for (let s = 0; s < 4; s++) { g.fillStyle = '#b8b8b0'; g.fillRect(0, 120 + s * 200, W, 18); for (let k = 0; k < 40; k++) { g.fillStyle = ['#c83a2a', '#e8b82a', '#3a6ab0', '#6a3a1a', '#2a8a4a'][(k + s) % 5]; g.fillRect(k * 50 + 5, 30 + s * 200, 42, 90); } }
  g.save(); g.filter = 'blur(6px)'; g.drawImage(g.canvas, 0, 0); g.restore();
  g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, 0, W, 40);
  // wire basket
  g.strokeStyle = '#8a8e96'; g.lineWidth = 6; g.strokeRect(460, 620, 1000, 420); for (let k = 0; k < 20; k++) { g.beginPath(); g.moveTo(460 + k * 50, 620); g.lineTo(460 + k * 50, 1040); g.stroke(); }
  for (let k = 0; k < 6; k++) { g.save(); g.translate(620 + k * 130, 800 - (k % 2) * 30); g.rotate((k - 3) * 0.12); g.fillStyle = '#4a2414'; g.fillRect(-55, -140, 110, 280); g.fillStyle = ['#8a1c1c', '#c8a030', '#2a4a8a'][k % 3]; g.fillRect(-55, -60, 110, 90); g.restore(); }
  // old hands placing a bar
  const y = 380 + Math.sin(t * 0.8) * 20;
  g.save(); g.translate(1100, y); g.rotate(0.2); g.fillStyle = '#4a2414'; g.fillRect(-60, -30, 120, 290); g.fillStyle = '#8a1c1c'; g.fillRect(-60, 60, 120, 90); g.restore();
  g.fillStyle = '#6b4a32'; poly(g, [[1500, 0], [1920, 0], [1920, 380], [1300, 420]]); g.fill();
  ell(g, 1210, 360, 110, 80, '#d9a98a'); for (let k = 0; k < 4; k++) ell(g, 1100 + k * 10, 300 + k * 40, 60, 22, '#d4a283');
  g.fillStyle = 'rgba(170,110,90,0.35)'; for (let k = 0; k < 6; k++) ell(g, 1230 + k * 12, 330 + k * 8, 10, 6, 'rgba(150,100,80,0.4)');
}
function cuHatHook(g, t) {
  room(g, t, { wall: '#6a5440', paper: true, floorY: 1000, hanging: [1500, 250] });
  g.fillStyle = '#2a1a10'; g.fillRect(1040, 150, 700, 900); g.fillStyle = '#6a5440'; g.fillRect(1080, 180, 620, 870);
  g.save(); g.filter = 'blur(5px)'; stove(g, 1400, 1050); kettle(g, 1400, 745, 0.9, 1, t); g.restore();
  g.fillStyle = '#1a120d'; g.fillRect(120, 60, 460, 1020);
  g.fillStyle = '#3a2a1a'; g.fillRect(620, 300, 300, 30); ell(g, 770, 330, 14, 30, '#2a1a10');
  g.save(); g.translate(770, 470); g.rotate(-0.08);
  ell(g, 0, 90, 260, 70, '#9a7a3a'); g.fillStyle = '#b89452'; g.beginPath(); g.moveTo(-130, 80); g.quadraticCurveTo(-130, -110, 0, -110); g.quadraticCurveTo(130, -110, 130, 80); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(-130, 20, 260, 34);
  g.strokeStyle = 'rgba(90,60,20,0.35)'; g.lineWidth = 3; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(k * 36, 95); g.lineTo(k * 42, 150); g.stroke(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 1400, 300, 100, 1500, [[0, 'rgba(255,230,190,1)'], [1, 'rgba(60,40,30,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuCarSeat(g, t) {
  g.fillStyle = '#5a4a3a'; g.fillRect(0, 0, W, H);
  g.fillStyle = lin(g, 0, 300, 0, H, [[0, '#8a6a4a'], [1, '#4a3424']]); g.beginPath(); g.roundRect(100, 320, 1720, 900, 80); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 6; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(100 + k * 290, 330); g.lineTo(100 + k * 290, H); g.stroke(); }
  g.fillStyle = 'rgba(255,245,215,0.35)'; poly(g, [[0, 0], [1200, 0], [700, 600], [0, 700]]); g.fill();
  g.save(); g.translate(700, 640); g.rotate(-0.1); g.fillStyle = '#6a1a2a'; g.fillRect(-300, -170, 600, 340); g.fillStyle = '#d8b050'; g.fillRect(-300, -20, 600, 30); g.fillRect(-15, -170, 30, 340); ell(g, 0, -10, 60, 30, '#e8c060'); g.restore();
  g.save(); g.translate(1320, 700); g.rotate(0.15); g.fillStyle = '#d8c89a'; g.fillRect(-230, -160, 460, 320); g.strokeStyle = 'rgba(80,70,50,0.5)'; g.lineWidth = 3; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(-200, -110 + k * 30); g.lineTo(k < 2 ? 180 : 40, -110 + k * 30); g.stroke(); } g.fillStyle = 'rgba(60,50,40,0.5)'; g.fillRect(70, -60, 120, 140); g.fillStyle = 'rgba(40,30,20,0.7)'; g.fillRect(-200, -145, 380, 22); g.restore();
}
function cuBag(g, t) {
  g.fillStyle = '#16120e'; g.fillRect(0, 0, W, H);
  addGlow(g, 960, 300, 900, 0.35);
  g.fillStyle = '#e6e2d8'; poly(g, [[250, 860], [1670, 860], [1500, 1080], [400, 1080]]); g.fill(); g.fillStyle = '#d4d0c6'; poly(g, [[250, 860], [1670, 860], [1640, 830], [280, 830]]); g.fill();
  g.save(); g.translate(960, 560); g.rotate(-0.05);
  g.fillStyle = '#b89a6a'; poly(g, [[-230, -330], [230, -330], [260, 300], [-260, 300]]); g.fill();
  g.fillStyle = 'rgba(70,50,30,0.35)'; ell(g, 60, 80, 120, 90, 'rgba(90,60,30,0.3)'); ell(g, -120, 200, 80, 50, 'rgba(90,60,30,0.25)');
  g.strokeStyle = 'rgba(60,40,20,0.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-230, -270); g.lineTo(230, -275); g.stroke();
  g.fillStyle = 'rgba(200,110,40,0.45)'; g.beginPath(); g.ellipse(0, -30, 110, 90, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(40,20,10,0.4)'; poly(g, [[-60, -60], [-20, -60], [-40, -95]]); g.fill(); poly(g, [[20, -60], [60, -60], [40, -95]]); g.fill();
  g.fillStyle = 'rgba(40,25,15,0.35)'; g.fillRect(-160, 140, 320, 26);
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 960, 400, 100, 1200, [[0, 'rgba(255,240,220,1)'], [1, 'rgba(50,40,35,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuHatSteps(g, t) {
  g.fillStyle = '#e8e4da'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 5; k++) { g.fillStyle = mixHex('#b8b4aa', '#d8d4ca', k / 5); g.fillRect(0, 300 + k * 160, W, 160); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 300 + k * 160, W, 12); }
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, W, 300); g.fillStyle = '#3a3a40'; g.fillRect(700, 0, 520, 300);
  g.save(); g.translate(1000, 720);
  ell(g, 0, 60, 330, 90, '#a8833f'); g.fillStyle = '#c29c55'; g.beginPath(); g.moveTo(-165, 50); g.quadraticCurveTo(-165, -180, 0, -180); g.quadraticCurveTo(165, -180, 165, 50); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(-165, -20, 330, 40);
  g.strokeStyle = 'rgba(90,60,20,0.35)'; g.lineWidth = 3; for (let k = -8; k <= 8; k++) { g.beginPath(); g.moveTo(k * 36, 70); g.lineTo(k * 44, 140); g.stroke(); }
  g.restore();
  for (let k = 0; k < 16; k++) { const x = hash1(k) * W, y = 380 + hash1(k * 3) * 650; g.save(); g.translate(x, y + Math.sin(t + k) * 3); g.rotate(k); ell(g, 0, 0, 14, 8, 'rgba(248,210,220,0.95)'); g.restore(); }
  addGlow(g, 300, 100, 900, 0.3);
}
function cuCollar(g, t) {
  darkBokeh(g, t, '#07070a');
  addGlow(g, 1500, 200, 800, 0.5);
  g.fillStyle = '#3a5474'; poly(g, [[200, H], [520, 700], [1400, 700], [1720, H]]); g.fill();
  [[600, 900, '#7a5a3a'], [1250, 950, '#8a3a2a']].forEach(p => { g.fillStyle = p[2]; g.fillRect(p[0], p[1], 130, 100); });
  for (let k = 0; k < 40; k++) strawTuft(g, 620 + k * 18, 720 + Math.sin(k) * 10, Math.PI + Math.sin(k * 3) * 0.6, 900);
  ell(g, 960, 560, 230, 260, '#050507');
  ell(g, 960, 340, 620, 120, '#a8833f');
  g.fillStyle = '#c29c55'; g.beginPath(); g.moveTo(690, 330); g.quadraticCurveTo(690, 20, 960, 20); g.quadraticCurveTo(1230, 20, 1230, 330); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(690, 250, 540, 50);
  g.strokeStyle = 'rgba(90,60,20,0.4)'; g.lineWidth = 4; for (let k = -12; k <= 12; k++) { g.beginPath(); g.moveTo(960 + k * 44, 360); g.lineTo(960 + k * 52, 440); g.stroke(); }
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 1400, 250, 100, 1500, [[0, 'rgba(255,225,190,1)'], [1, 'rgba(30,35,60,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuHands(g, t) {
  darkBokeh(g, t, '#08070a');
  addGlow(g, 960, 200, 800, 0.5);
  jackOLantern(g, 1650, 1040, 180, t, { seed: 4 });
  // old man's open hand (left) with denim cuff + straw
  g.save(); g.translate(640, 620); g.rotate(-0.25);
  g.fillStyle = '#3a5474'; g.fillRect(-500, -110, 360, 220); for (let k = 0; k < 10; k++) strawTuft(g, -150, -90 + k * 20, Math.PI / 2 + (k - 5) * 0.12, 900);
  ell(g, 0, 0, 170, 120, '#c9967a'); for (let k = 0; k < 4; k++) { g.save(); g.translate(120, -80 + k * 52); g.rotate(-0.1); ell(g, 60, 0, 90, 24, '#c4917a'); g.restore(); }
  g.strokeStyle = 'rgba(120,70,55,0.5)'; g.lineWidth = 3; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(-20, 20, 60 + k * 18, -0.8, 0.4); g.stroke(); }
  g.restore();
  // small hand with the pillowcase (right)
  g.save(); g.translate(1230, 560);
  g.fillStyle = '#5e4128'; g.fillRect(40, -120, 360, 200); g.fillStyle = '#4a3220'; g.fillRect(40, -120, 90, 200);
  ell(g, 0, -20, 80, 70, '#e0bca0');
  g.fillStyle = '#e8e2d2'; g.beginPath(); g.moveTo(-40, 20); g.quadraticCurveTo(-120, 260, -80, 520); g.lineTo(160, 520); g.quadraticCurveTo(180, 260, 60, 20); g.fill();
  g.restore();
}
function cuWrappers(g, t) {
  fieldScene(g, t, { tod: 'sunrise', horizon: 520, sun: [1500, 420, 50], frost: true, fog: 0.35, nearH: 60 });
  g.fillStyle = '#5a4a3a'; g.fillRect(820, 560, 280, 600); g.fillStyle = '#6a5a48'; g.fillRect(820, 560, 280, 30);
  g.fillStyle = 'rgba(230,240,250,0.6)'; g.fillRect(820, 560, 280, 12);
  g.fillStyle = '#4a4034'; g.fillRect(0, 640, 830, 60); g.fillRect(1090, 650, 830, 60);
  [[900, 540, -0.1], [1010, 546, 0.12]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#8a1c1c'; g.fillRect(-60, -18, 120, 36); g.fillStyle = '#e8d8b0'; g.fillRect(-60, -4, 120, 8); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-60, -18, 120, 6); g.restore(); });
  addGlow(g, 1500, 420, 900, 0.4);
}
function cuModernDoor(g, t) {
  g.fillStyle = '#1a1e26'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a3a4a'; g.fillRect(640, 80, 640, 1000);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 6; g.strokeRect(700, 140, 520, 380); g.strokeRect(700, 580, 520, 440);
  g.fillStyle = 'rgba(255,200,120,0.9)'; g.fillRect(640, 1066, 640, 14); addGlow(g, 960, 1080, 400, 0.5);
  g.strokeStyle = '#3a2a1a'; g.lineWidth = 40; g.beginPath(); g.arc(960, 360, 150, 0, TAU); g.stroke();
  for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; ell(g, 960 + Math.cos(a) * 150, 360 + Math.sin(a) * 150, 26, 16, ['#b8401a', '#d88a2a', '#8a2a12', '#5a3a1a'][k % 4]); }
  g.fillStyle = '#1a1a1a'; ell(g, 960, 520, 16, 16, '#b08a4a');
  g.fillStyle = '#4a3a2a'; g.fillRect(1380, 700, 360, 30); g.fillRect(1400, 730, 20, 350); g.fillRect(1700, 730, 20, 350);
  ell(g, 1560, 690, 120, 40, '#d8d0c0'); for (let k = 0; k < 7; k++) { g.save(); g.translate(1480 + k * 26, 670); g.rotate((k - 3) * 0.2); g.fillStyle = ['#8a1c1c', '#4a2414', '#c8a030'][k % 3]; g.fillRect(-12, -40, 24, 60); g.restore(); }
  jackOLantern(g, 400, 1000, 140, t, { seed: 3 });
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, 960, 100, 50, 900, [[0, 'rgba(255,190,110,0.25)'], [1, 'rgba(255,190,110,0)']]); g.fillRect(0, 0, W, H); g.restore();
}
function cuFootprints(g, t) {
  g.fillStyle = '#1a2230'; g.fillRect(0, 0, W, H);
  grassField(g, 0, H, t, { far: '#2a3446', near: '#1a2232', tipFar: '#8a9ab8', tipNear: '#6a7a98', rows: 22, nearH: 60, frost: true, still: true });
  for (let k = 0; k < 5; k++) { const x = 560 + (k % 2) * 110, y = 1000 - k * 190; g.save(); g.translate(x, y); g.rotate(0.05); ell(g, 0, 0, 50, 95, 'rgba(10,14,24,0.75)'); ell(g, 0, -60, 40, 30, 'rgba(10,14,24,0.6)'); g.restore(); }
  // small shoes that leave no mark (ghostly)
  [[1180, 700], [1250, 520]].forEach(([x, y], i) => { ell(g, x, y, 34, 60, `rgba(40,30,24,${0.55 - i * 0.2})`); });
  for (let k = 0; k < 6; k++) glow(g, 600 + k * 20 + Math.sin(t + k) * 10, 200 - k * 30 - (t * 15 % 30), 60 + k * 20, 0.14, SPR.fog);
  addGlow(g, 1500, 100, 900, 0.25, SPR.cool);
}
function cuMicrofilm(g, t, o = {}) {
  g.fillStyle = '#050505'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a1c1a'; g.fillRect(260, 80, 1400, 920);
  const x0 = 330, y0 = 140, w = 1260, h = 800;
  const off = o.scroll ? -t * 12 : 0;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = '#d8dcc8'; g.fillRect(x0, y0, w, h);
  g.translate(0, off);
  g.fillStyle = 'rgba(20,24,20,0.85)'; g.fillRect(x0 + 60, y0 + 40, w - 120, 70); g.fillRect(x0 + 60, y0 + 140, w - 120, 110);
  g.fillStyle = 'rgba(60,60,60,0.6)'; for (let c = 0; c < 4; c++) for (let k = 0; k < 26; k++) g.fillRect(x0 + 60 + c * 290, y0 + 290 + k * 22, 260 - (k % 5 === 4 ? 100 : 0), 10);
  g.fillStyle = 'rgba(30,30,30,0.7)'; g.fillRect(x0 + 640, y0 + 300, 280, 220);
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 960, 540, 200, 900, [[0, 'rgba(220,255,230,1)'], [1, 'rgba(60,80,70,1)']]); g.fillRect(0, 0, W, H); g.restore();
  addGlow(g, 960, 540, 800, 0.2, SPR.cool);
}
function cuNewspaper(g, t) {
  g.fillStyle = '#c8b890'; g.fillRect(0, 0, W, H);
  g.save(); g.filter = 'blur(2px)';
  g.fillStyle = 'rgba(25,20,15,0.9)'; g.fillRect(160, 120, 1600, 160);
  g.fillStyle = 'rgba(25,20,15,0.75)'; g.fillRect(160, 320, 1000, 80);
  g.fillStyle = 'rgba(40,35,25,0.55)'; for (let c = 0; c < 3; c++) for (let k = 0; k < 22; k++) g.fillRect(160 + c * 360, 450 + k * 28, 330 - (k % 6 === 5 ? 150 : 0), 12);
  g.fillStyle = 'rgba(60,55,45,0.8)'; g.fillRect(1260, 330, 500, 560); g.fillStyle = 'rgba(160,150,130,0.6)'; ell(g, 1510, 520, 110, 130, 'rgba(170,160,140,0.6)'); ell(g, 1510, 800, 180, 110, 'rgba(150,140,120,0.5)');
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 900, 500, 200, 1300, [[0, 'rgba(255,245,220,1)'], [1, 'rgba(90,70,40,1)']]); g.fillRect(0, 0, W, H); g.restore();
}

/* photos: a mini scene rendered offscreen, then printed as a photograph */
let PH = null;
function photo(g, x, y, w, h, rot, style, drawFn, t) {
  if (!PH) { PH = document.createElement('canvas'); PH.width = W; PH.height = H; }
  const pg = PH.getContext('2d'); pg.setTransform(1, 0, 0, 1, 0, 0); pg.globalAlpha = 1; pg.globalCompositeOperation = 'source-over'; pg.filter = 'none';
  drawFn(pg, t);
  g.save(); g.translate(x, y); g.rotate(rot);
  const bw = style === 'polaroid' ? 30 : 36, bb = style === 'polaroid' ? 130 : 36;
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(-w / 2 - bw + 16, -h / 2 - bw + 20, w + bw * 2, h + bw + bb);
  g.fillStyle = style === 'bw' ? '#ece6d6' : '#f2eee4'; g.fillRect(-w / 2 - bw, -h / 2 - bw, w + bw * 2, h + bw + bb);
  g.filter = style === 'bw' ? 'grayscale(1) sepia(0.25) contrast(1.15) brightness(1.1)' : style === 'color70' ? 'sepia(0.45) saturate(1.3) contrast(0.9) brightness(1.1)' : 'sepia(0.3) saturate(1.1) brightness(1.1)';
  const sw = W, sh = W * h / w;
  g.drawImage(PH, 0, (H - sh) / 2, sw, sh, -w / 2, -h / 2, w, h);
  g.filter = 'none';
  g.fillStyle = 'rgba(120,100,70,0.12)'; g.fillRect(-w / 2, -h / 2, w, h);
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(-w / 2 + hash1(k) * w, -h / 2, 2, h); }
  g.restore();
}
function tabletop(g, col = '#3a2616') { g.fillStyle = lin(g, 0, 0, 0, H, [[0, mixHex(col, '#000', 0.3)], [1, col]]); g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; for (let k = 0; k < 12; k++) { g.beginPath(); g.moveTo(0, k * 95 + 20); g.bezierCurveTo(600, k * 95 + 40, 1300, k * 95, W, k * 95 + 30); g.stroke(); } }
