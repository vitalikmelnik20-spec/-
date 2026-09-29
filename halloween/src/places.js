'use strict';
/* Additional locations. */
function kitchen(g, t, o = {}) {
  room(g, t, { wall: o.wall || '#6a543e', paper: true, floorY: 860, windows: o.window === false ? [] : [[o.winX || 1250, 170, 380, 330, o.out || 'night', true]], clock: o.clock, hanging: o.hanging === false ? null : (o.hanging || [760, 230]) });
  g.fillStyle = '#d8d0c0'; g.fillRect(1100, 560, 820, 300); g.fillStyle = '#b8ab94'; g.fillRect(1100, 540, 820, 26);
  for (let k = 0; k < 4; k++) { g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.strokeRect(1120 + k * 200, 590, 180, 250); }
  if (o.stove !== false) { stove(g, 300, 860); if (o.kettle) kettle(g, 300, 560, 0.9, o.kettle, t); }
  figs(g, o.back);
  if (o.table !== false) table(g, o.tableX || 800, o.tableY || 740, o.tableW || 760, '#5a3a24');
  if (o.cup) teacup(g, o.cup[0], o.cup[1], 1, o.cup[2] || 0, t);
  if (o.apples) for (let k = 0; k < 14; k++) { const x = 520 + (k % 7) * 80, y = 700 + Math.floor(k / 7) * 34; g.fillStyle = '#d8d0b8'; g.fillRect(x - 36, y + 8, 72, 12); ell(g, x, y - 6, 30, 28, '#8a3a18'); ell(g, x - 8, y - 14, 10, 8, 'rgba(255,220,160,0.6)'); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x + 4, y - 70); g.stroke(); }
  figs(g, o.figures);
  if (o.notebook) { g.save(); g.translate(o.notebook[0], o.notebook[1]); g.rotate(-0.1); g.fillStyle = '#efe8d4'; g.fillRect(-90, -14, 180, 60); g.restore(); }
  if (o.mask) drawMask(g, o.mask[0], o.mask[1], o.mask[2], 1000, {});
  figs(g, o.front);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, o.lightX || 760, 300, 100, 1500, [[0, 'rgba(255,236,205,1)'], [1, 'rgba(50,34,26,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function hallway(g, t, o = {}) {
  room(g, t, { wall: '#5a4a3c', paper: true, floorY: 900, door: [o.doorX || 1100, !!o.doorGlow], clock: o.clock || [1560, 300, 90], lamp: o.lamp === false ? null : [380, 560] });
  if (o.lamp !== false) { g.fillStyle = '#3a2a1a'; g.fillRect(300, 600, 160, 300); }
  if (o.chair) { const cx = o.chair; g.fillStyle = '#3a2618'; g.fillRect(cx - 100, 640, 20, 270); g.fillRect(cx + 80, 640, 20, 270); g.fillRect(cx - 100, 760, 200, 20); for (let k = 0; k < 4; k++) g.fillRect(cx - 90 + k * 55, 600, 12, 170); g.fillRect(cx - 100, 590, 200, 16); }
  figs(g, o.figures);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 380, 520, 80, 1500, [[0, 'rgba(255,230,195,1)'], [1, 'rgba(26,20,20,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function attic(g, t, o = {}) {
  g.fillStyle = lin(g, 0, 0, 0, H, [[0, '#2a1e16'], [1, '#4a3626']]); g.fillRect(0, 0, W, H);
  g.fillStyle = '#3a2a1e'; poly(g, [[0, 0], [700, 0], [0, 600]]); g.fill(); poly(g, [[W, 0], [1220, 0], [W, 600]]); g.fill();
  g.fillStyle = '#5a4430'; g.fillRect(0, 820, W, 260); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(0, 830 + k * 34); g.lineTo(W, 830 + k * 34); g.stroke(); }
  windowPane(g, t, [860, 180, 260, 300, 'day']);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,230,190,0.12)'; poly(g, [[860, 180], [1120, 180], [1500, 1080], [700, 1080]]); g.fill(); g.restore();
  dust(g, t, 40, 0.8, 6, [700, 180, 800, 900]);
  // cedar chest
  g.fillStyle = '#7a3a22'; g.fillRect(1050, 720, 560, 220); g.fillStyle = '#8a4428'; poly(g, [[1050, 720], [1610, 720], [1560, 520], [1100, 520]]); g.fill();
  g.fillStyle = '#c8a050'; g.fillRect(1300, 760, 60, 40);
  g.fillStyle = '#e8e0d0'; g.fillRect(1080, 700, 500, 22);
  figs(g, o.figures);
}
function livingRoom(g, t, o = {}) {
  room(g, t, { wall: o.wall || '#7a6450', paper: true, floorY: 880, windows: [[o.winX || 1320, 160, 440, 460, o.out || 'spring', true]], lamp: o.lamp || null });
  if (o.curtain) { g.fillStyle = 'rgba(245,240,230,0.55)'; const sw = Math.sin(t * 0.9) * 30; g.beginPath(); g.moveTo(o.winX - 40 || 1280, 140); g.quadraticCurveTo(1400 + sw, 400, 1340 + sw * 1.5, 660); g.lineTo(1300, 660); g.lineTo(1280, 140); g.fill(); }
  if (o.sofa) { const [x, y] = o.sofa; g.fillStyle = '#8a5a5a'; g.beginPath(); g.roundRect(x - 380, y - 260, 760, 180, 40); g.fill(); g.fillStyle = '#9a6a64'; g.beginPath(); g.roundRect(x - 400, y - 110, 800, 140, 30); g.fill();
    for (let k = 0; k < 30; k++) ell(g, x - 360 + hash1(k) * 720, y - 230 + hash1(k * 3) * 230, 14, 10, ['#d8a8a0', '#e8d0a0', '#a8c0a0'][k % 3]);
    g.fillStyle = '#6a4040'; g.beginPath(); g.roundRect(x - 440, y - 170, 90, 210, 30); g.fill(); g.beginPath(); g.roundRect(x + 350, y - 170, 90, 210, 30); g.fill(); }
  if (o.armchair) { const [x, y] = o.armchair; g.fillStyle = '#5a4a3a'; g.beginPath(); g.roundRect(x - 170, y - 380, 340, 300, 50); g.fill(); g.fillStyle = '#6a584a'; g.beginPath(); g.roundRect(x - 200, y - 150, 400, 150, 30); g.fill(); g.fillStyle = '#4a3a2e'; g.fillRect(x - 160, y, 20, 40); g.fillRect(x + 140, y, 20, 40); }
  if (o.side) { const [x, y] = o.side; g.fillStyle = '#4a3020'; g.fillRect(x - 90, y, 180, 20); g.fillRect(x - 70, y + 20, 16, 880 - y); g.fillRect(x + 54, y + 20, 16, 880 - y); }
  figs(g, o.figures);
  if (o.dust) dust(g, t, 30, 0.8, 8, [o.winX - 200 || 1100, 160, 700, 700]);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, o.winX || 1320, 380, 100, 1600, [[0, 'rgba(255,245,230,1)'], [1, o.night ? 'rgba(30,24,30,1)' : 'rgba(90,70,60,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function library(g, t, o = {}) {
  g.fillStyle = '#1a140e'; g.fillRect(0, 0, W, H);
  for (let s = 0; s < 3; s++) { const x0 = [0, 1350, 700][s], w = [560, 570, 0][s]; if (!w) continue;
    for (let r = 0; r < 6; r++) { g.fillStyle = '#3a2616'; g.fillRect(x0, 80 + r * 150, w, 14); for (let k = 0; k < w / 26; k++) { g.fillStyle = ['#5a2a1e', '#2a3a4a', '#4a4a2a', '#3a2a3a', '#6a5a3a'][(k + r * 3) % 5]; const hh = 90 + hash1(k + r * 20 + s * 99) * 40; g.fillRect(x0 + k * 26, 94 + r * 150 - hh + 130, 22, hh); } } }
  g.fillStyle = '#2a1e14'; g.fillRect(560, 0, 790, H);
  g.fillStyle = '#4a3020'; g.fillRect(360, 760, 1200, 30); g.fillRect(400, 790, 30, 290); g.fillRect(1500, 790, 30, 290);
  const on = o.readerOn !== false;
  g.fillStyle = '#2a2c2a'; g.fillRect(760, 380, 440, 380); g.fillStyle = '#3a3c3a'; g.fillRect(740, 700, 480, 70);
  g.fillStyle = on ? '#cfe0d0' : '#1a1c1a'; g.fillRect(790, 410, 380, 270);
  if (on) { g.fillStyle = 'rgba(30,40,30,0.5)'; for (let k = 0; k < 10; k++) g.fillRect(810, 430 + k * 24, 340 - (k % 3) * 60, 9); addGlow(g, 980, 545, 700, 0.5, SPR.cool); }
  figs(g, o.figures);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 980, 545, 100, 1400, [[0, on ? 'rgba(230,255,240,1)' : 'rgba(200,180,160,1)'], [1, 'rgba(24,20,24,1)']]); g.fillRect(0, 0, W, H); g.restore();
}
function carInterior(g, t, o = {}) {
  g.fillStyle = lin(g, 0, 0, 0, 700, [[0, '#b8c8d8'], [1, '#e8e0d0']]); g.fillRect(0, 0, W, 700);
  // brick house seen through the windshield
  g.fillStyle = '#8a4a36'; g.fillRect(900, 200, 700, 420); g.fillStyle = '#5a4a44'; poly(g, [[860, 210], [1640, 210], [1250, 60]]); g.fill();
  g.fillStyle = '#e8e0d0'; g.fillRect(1020, 330, 110, 150); g.fillRect(1380, 330, 110, 150); g.fillStyle = '#3a2a24'; g.fillRect(1200, 420, 100, 200);
  for (let i = 0; i < 4; i++) bareTree(g, 200 + i * 350, 640, 380, 300 + i, '#4a4a4a', 0.8);
  g.fillStyle = '#6a8a5a'; g.fillRect(0, 620, W, 80);
  // car body
  g.fillStyle = '#1a1614'; poly(g, [[0, 0], [W, 0], [W, 90], [0, 60]]); g.fill();
  g.fillStyle = '#2a2420'; g.fillRect(0, 0, 90, H); g.fillRect(W - 90, 0, 90, H);
  g.fillStyle = lin(g, 0, 640, 0, H, [[0, '#3a2e26'], [1, '#1a1410']]); poly(g, [[0, 700], [W, 660], [W, H], [0, H]]); g.fill();
  figs(g, o.figures);
  g.strokeStyle = '#1a1614'; g.lineWidth = 34; g.beginPath(); g.ellipse(600, 860, 260, 230, 0, 0, TAU); g.stroke();
  g.lineWidth = 20; g.beginPath(); g.moveTo(600, 860); g.lineTo(600, 1090); g.moveTo(600, 860); g.lineTo(380, 900); g.moveTo(600, 860); g.lineTo(820, 900); g.stroke();
  figs(g, o.front);
}
function brickHouse(g, t, o = {}) {
  sky(g, 'spring', { horizon: 700, t, clouds: 3, cloudCol: 'rgba(255,255,255,0.35)' });
  g.fillStyle = '#6a8a4a'; g.fillRect(0, 760, W, H);
  g.fillStyle = '#a0a0a0'; poly(g, [[900, 760], [1040, 760], [1200, H], [760, H]]); g.fill();
  const cx = o.x || 960, s = o.s || 1;
  g.fillStyle = '#8a4a36'; g.fillRect(cx - 420 * s, 780 - 520 * s, 840 * s, 520 * s);
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let y = 780 - 520 * s; y < 780; y += 18 * s) { g.beginPath(); g.moveTo(cx - 420 * s, y); g.lineTo(cx + 420 * s, y); g.stroke(); }
  g.fillStyle = '#4a4046'; poly(g, [[cx - 470 * s, 270 * s + (780 - 790 * s)], [cx + 470 * s, 270 * s + (780 - 790 * s)], [cx, 780 - 760 * s]]); g.fill();
  [[-260, -380], [260, -380], [-260, -170], [260, -170]].forEach(([dx, dy]) => { g.fillStyle = '#e8e2d4'; g.fillRect(cx + dx * s - 60 * s, 780 + dy * s, 120 * s, 150 * s); g.fillStyle = '#6a7a8a'; g.fillRect(cx + dx * s - 50 * s, 780 + dy * s + 10 * s, 100 * s, 130 * s); });
  g.fillStyle = '#2a3a4a'; g.fillRect(cx - 70 * s, 780 - 230 * s, 140 * s, 230 * s);
  if (o.doorOpen) { g.fillStyle = '#e8d8c0'; g.fillRect(cx - 60 * s, 780 - 220 * s, 120 * s, 220 * s); }
  for (let k = 0; k < 8; k++) ell(g, cx - 380 * s + k * 100 * s, 790, 40 * s, 22 * s, ['#e8c040', '#d8d0e8', '#c84a6a'][k % 3]);
  (o.trees || [[300, 780, 520], [1650, 790, 560]]).forEach((tr, i) => bareTree(g, tr[0], tr[1], tr[2], 500 + i, '#3a3430'));
  figs(g, o.figures);
}
function vintageNight(g, t, o = {}) {  // 1940s-50s farmhouse, lonely porch light
  sky(g, 'night', { horizon: 680, moon: [1500, 160, 30], t });
  treeline(g, 660, '#070910', 17, 40);
  grassField(g, 680, H, t, { far: '#141820', near: '#08090c', tipFar: '#2a3040', tipNear: '#141820', rows: 16, nearH: 60 });
  const x = o.x || 960, s = o.s || 1;
  g.fillStyle = '#4a4a50'; g.fillRect(x - 260 * s, 720 - 300 * s, 520 * s, 300 * s);
  g.fillStyle = '#1a1a20'; poly(g, [[x - 300 * s, 720 - 290 * s], [x + 300 * s, 720 - 290 * s], [x, 720 - 480 * s]]); g.fill();
  g.fillStyle = 'rgba(255,200,120,1)'; g.fillRect(x + 90 * s, 720 - 230 * s, 70 * s, 90 * s); addGlow(g, x + 125 * s, 720 - 185 * s, 200 * s, 0.5);
  if (o.porch) { porchLamp(g, x - 80 * s, 720 - 190 * s, s, t, 1); g.fillStyle = '#2a2a2e'; g.fillRect(x - 200 * s, 720 - 60 * s, 400 * s, 60 * s); g.fillStyle = '#3a3026'; g.fillRect(x - 150 * s, 720 - 130 * s, 60 * s, 80 * s); g.fillRect(x - 150 * s, 720 - 60 * s, 8 * s, 50 * s); g.fillRect(x - 98 * s, 720 - 60 * s, 8 * s, 50 * s); }
  if (o.road) { g.fillStyle = '#2a261e'; poly(g, [[x - 40, 720], [x + 40, 720], [x + 500, H], [x - 300, H]]); g.fill(); }
  fogBand(g, 720, 60, t, 0.4, 5, 8);
  leaves(g, t, 10, 0.7, 4, [0, 400, W, 680]);
}
function forestSearch(g, t) {
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { const x = hash1(i * 7) * W, w = 30 + hash1(i) * 50; g.fillStyle = mixHex('#2a2a2a', '#0a0a0a', hash1(i * 3)); g.fillRect(x, 0, w, H); }
  fogBand(g, 600, 200, t, 0.8, 3, 6); fogBand(g, 850, 150, t, 0.6, 4, 9);
  [[420, 900, 480], [820, 960, 520], [1300, 930, 500], [1650, 980, 540]].forEach((m, i) => {
    person(g, m[0] + t * 12, m[1], m[2], Object.assign({ who: 'man', hat: 'campaign', view: i % 2 ? 'back' : 'front', turn: 0.5, pose: 'walk', phase: t * 2.2 + i, arms: { l: [-0.2, 0], r: [0.9, -0.9] }, rItem: 'lantern' }, LP.dark(1)));
    addGlow(g, m[0] + t * 12 + m[2] * 0.18, m[1] - m[2] * 0.57, 160, 0.8);
  });
  fogBand(g, 950, 120, t, 0.5, 6, 12);
}
function wellDay(g, t, o = {}) {
  fieldScene(g, t, { tod: 'day', horizon: 520, fog: 0.15, nearH: 90, well: [960, 780, 1.4], wellOpen: o.open, figures: o.figures, front: o.front });
  if (o.trucks) [[260, 600, 1], [1620, 590, 0.9]].forEach(([x, y, s]) => { g.fillStyle = '#e8e4d8'; g.fillRect(x - 150 * s, y - 110 * s, 300 * s, 110 * s); g.fillStyle = '#2a3a5a'; g.fillRect(x - 150 * s, y - 60 * s, 300 * s, 16 * s); g.fillStyle = '#d8d4c8'; g.fillRect(x - 60 * s, y - 170 * s, 110 * s, 70 * s); g.fillStyle = '#3a4a5a'; g.fillRect(x - 50 * s, y - 160 * s, 90 * s, 40 * s); ell(g, x - 90 * s, y, 32 * s, 32 * s, '#1a1a1a'); ell(g, x + 90 * s, y, 32 * s, 32 * s, '#1a1a1a'); ell(g, x + 20 * s, y - 185 * s, 12 * s, 8 * s, '#c02020'); });
  if (o.lights) [[560, 640], [1360, 640]].forEach(([x, y]) => { g.fillStyle = '#2a2a2a'; g.fillRect(x - 4, y - 200, 8, 200); addGlow(g, x, y - 200, 160, 0.6); });
}
function street(g, t, o = {}) {
  sky(g, 'night', { horizon: 620, moon: [1650, 140, 30], t });
  treeline(g, 600, '#070910', 23, 40);
  g.fillStyle = '#10131a'; g.fillRect(0, 620, W, H);
  g.fillStyle = '#1a1c22'; poly(g, [[880, 620], [1040, 620], [1700, H], [220, H]]); g.fill();
  g.strokeStyle = 'rgba(200,190,150,0.35)'; g.lineWidth = 6; g.setLineDash([40, 50]); g.beginPath(); g.moveTo(960, 620); g.lineTo(960, H); g.stroke(); g.setLineDash([]);
  const hs = o.houses || [[260, 760, 420], [620, 660, 220], [1440, 680, 260], [1760, 780, 460], [820, 632, 120], [1130, 634, 130]];
  hs.forEach(([x, y, s], i) => house(g, x, y, s, t, { windows: [0, 0.8, 0, 0.9, 0.6], pumpkins: [[-100, 0, 60], [120, 0, 50]] }));
  fogBand(g, 640, 60, t, 0.5, 7, 7);
  figs(g, o.figures);
}
function roadNight(g, t, o = {}) {
  sky(g, 'night', { horizon: 560, moon: [520, 150, 30], t });
  treeline(g, 540, '#07090f', 29, 35);
  grassField(g, 560, H, t, { far: '#141a26', near: '#06080c', tipFar: '#3a4458', tipNear: '#141a26', rows: 16, nearH: 60 });
  g.fillStyle = '#1c1e24'; poly(g, [[940, 560], [990, 560], [1500, H], [520, H]]); g.fill();
  [[700, 580, 90], [1250, 590, 110], [480, 620, 170], [1520, 640, 200]].forEach(([x, y, s], i) => house(g, x, y, s, t, { windows: [0, 0.8, 0, 0.9, 0], pumpkins: [[-80, 0, 70], [80, 0, 60]] }));
  figs(g, o.figures);
  fogBand(g, 600, 70, t, 0.6, 3, 8);
}
