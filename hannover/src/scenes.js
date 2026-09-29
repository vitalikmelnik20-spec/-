'use strict';
/* Hannover in 30 Sekunden — 5 Fakten. A red line (Hannover's "Roter Faden")
 * runs through the whole video and carries every transition. */
const RED = '#e3262f', RED2 = '#ff4a4f', WHITE = '#f6f2ea', INK = '#0b0c10';
const REDRGB = [227, 38, 47];
const T = { hook: 0, f1: 3.3, f2: 8.4, f3: 13.5, f4: 18.6, f5: 23.5, out: 27.3, end: 30 }; // overridden by timeline.json
let SUBS = [];

/* ---- Germany outline (lon, lat), simplified ---- */
const DE_LL = [[7.2, 53.3], [7.2, 53.6], [8.0, 53.7], [8.6, 53.9], [8.9, 54.3], [8.6, 54.9], [9.9, 54.8], [10.0, 54.5], [10.9, 54.4], [10.9, 53.95], [11.5, 54.1], [12.3, 54.4], [13.1, 54.6], [13.9, 54.2], [14.2, 53.9], [14.4, 53.3], [14.1, 52.8], [14.6, 52.5], [14.7, 52.0], [15.0, 51.1], [14.8, 50.9], [14.3, 51.0], [13.5, 50.7], [12.9, 50.4], [12.1, 50.3], [12.5, 49.7], [13.0, 49.3], [13.8, 48.8], [13.4, 48.5], [12.8, 48.2], [13.0, 47.8], [13.0, 47.5], [12.2, 47.7], [11.4, 47.5], [10.5, 47.5], [10.2, 47.3], [9.6, 47.6], [8.6, 47.7], [7.6, 47.6], [7.5, 48.1], [7.9, 48.8], [8.2, 49.0], [7.0, 49.1], [6.4, 49.5], [6.1, 50.1], [6.2, 50.6], [5.9, 51.0], [6.1, 51.2], [6.0, 51.8], [6.7, 51.9], [7.0, 52.2], [7.0, 52.6], [7.2, 53.0]];
const HAN = [9.73, 52.37];
const deK = 150, deC = [10.45, 51.15];
const proj = (ll, cx = 540, cy = 930, k = deK) => [cx + (ll[0] - deC[0]) * Math.cos(51.2 * Math.PI / 180) * k, cy - (ll[1] - deC[1]) * k];
function chaikinC(p, it = 2) { for (let k = 0; k < it; k++) { const q = []; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } p = q; } return p; }
const DE = chaikinC(DE_LL, 2);
function plen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function partial(p, f) { const tot = plen(p) * clamp(f); const out = [p[0]]; let acc = 0; for (let i = 1; i < p.length; i++) { const s = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc + s >= tot) { const u = (tot - acc) / (s || 1); out.push([lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)]); break; } out.push(p[i]); acc += s; } return out; }
function stroke(g, pts, col, w, close = false) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function redGlowLine(g, pts, w = 6, a = 1) { g.save(); g.globalAlpha = a; stroke(g, pts, 'rgba(227,38,47,0.25)', w * 4); stroke(g, pts, RED, w); g.restore(); }

function germany(g, t, o) {
  const sc = o.scale || 1, fx = o.focus || [540, 930];
  g.save(); g.translate(fx[0], fx[1]); g.scale(sc, sc); g.translate(-fx[0], -fx[1]);
  const pts = DE.map(p => proj(p));
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.fillStyle = `rgba(28,30,38,${o.fill == null ? 1 : o.fill})`; g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1 / sc; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
  const d = o.draw == null ? 1 : o.draw;
  redGlowLine(g, partial(pts.concat([pts[0]]), d), 4 / sc, 1);
  const h = proj(HAN);
  if (o.pin) {
    for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; g.beginPath(); g.arc(h[0], h[1], (10 + ph * 70) / sc, 0, TAU); g.strokeStyle = `rgba(255,74,79,${(1 - ph) * o.pin})`; g.lineWidth = 3 / sc; g.stroke(); }
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, h[0], h[1], 90 / sc, o.pin, SPRITE_RED); glow(g, h[0], h[1], 24 / sc, o.pin); g.restore();
    g.beginPath(); g.arc(h[0], h[1], 9 / sc, 0, TAU); g.fillStyle = WHITE; g.globalAlpha = o.pin; g.fill(); g.globalAlpha = 1;
  }
  g.restore();
  return h;
}

/* ---- layout helpers ---- */
function factHeader(g, t, n, t0, title, sub) {
  const a = clamp((t - t0) / 0.25);
  g.save(); g.globalAlpha = a;
  // badge
  g.fillStyle = RED; g.beginPath(); g.roundRect(390, 250, 300, 64, 32); g.fill();
  setText(g, FONT.black(30), 6); g.fillStyle = WHITE; g.fillText(`FAKT ${n} / 5`, 540, 294);
  g.restore();
  const ts = fit(g, title, FONT.black, 112, 960, 2);
  revealLine(g, title, 540, 470, ts, prog(t, t0 + 0.08, t0 + 0.5), { font: FONT.black(ts), color: WHITE, spacing: 2 });
  if (sub) revealLine(g, sub, 540, 560, 46, prog(t, t0 + 0.3, t0 + 0.7), { font: FONT.bold(46), color: RED2, spacing: 6 });
  // progress dots
  for (let i = 1; i <= 5; i++) { g.beginPath(); g.arc(540 + (i - 3) * 34, 196, i === n ? 9 : 6, 0, TAU); g.fillStyle = i <= n ? RED : 'rgba(255,255,255,0.25)'; g.fill(); }
}
function fit(g, text, fontFn, size, maxW, spacing = 0) { setText(g, fontFn(size), spacing); const w = g.measureText(text).width; return w > maxW ? Math.floor(size * maxW / w) : size; }
function counter(g, v, x, y, size, suffix = '', col = WHITE) { setText(g, FONT.black(size), 0); g.fillStyle = col; g.fillText(`${v}${suffix}`, x, y); }

/* ---- scenes ---- */
function S_hook(g, t) {
  fillBg(g, '#0c0d12', '#050507');
  const z = lerp(1, 2.1, Ease.inOutCubic(prog(t, 1.4, 3.3)));
  const h = proj(HAN);
  germany(g, t, { draw: Ease.outCubic(prog(t, 0, 0.9)), pin: prog(t, 0.6, 0.9), scale: z, focus: h });
  drawRays(g, h[0], h[1], t, (1 - prog(t, 0.3, 1.6)) * 0.8, 1300, 14, TAU, t * 0.2, [255, 90, 90]);
  const p = prog(t, 0.25, 0.6), e = Ease.outExpo(p);
  if (t > 0.25) {
    g.save(); g.translate(540, 470); g.scale(lerp(2.4, 1, e), lerp(2.4, 1, e));
    setText(g, FONT.black(150), lerp(40, 4, e), 'center', 'middle'); g.globalAlpha = clamp(p * 4);
    g.shadowColor = 'rgba(227,38,47,0.8)'; g.shadowBlur = 40 * (1 - e) + 20; g.fillStyle = WHITE; g.fillText('HANNOVER', 0, 0); g.restore();
    if (t < 0.5) flash(g, 0.5 * Math.exp(-(t - 0.25) * 14), [255, 200, 200]);
  }
  g.save(); g.globalAlpha = prog(t, 0.9, 1.2);
  g.fillStyle = RED; g.beginPath(); g.roundRect(250, 560, 580, 84, 12); g.fill();
  setText(g, FONT.black(52), 4); g.fillStyle = WHITE; g.fillText('5 FAKTEN', 540, 620); g.restore();
  revealLine(g, 'die kaum jemand kennt', 540, 720, 54, prog(t, 1.15, 1.6), { font: FONT.serif(58), color: WHITE });
}
function crown(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; g.beginPath(); g.moveTo(-100, 40); g.lineTo(-110, -50); g.lineTo(-55, -5); g.lineTo(0, -80); g.lineTo(55, -5); g.lineTo(110, -50); g.lineTo(100, 40); g.closePath(); g.fill();
  g.fillRect(-100, 45, 200, 26);
  [[-110, -50], [0, -80], [110, -50]].forEach(([cx, cy]) => { g.beginPath(); g.arc(cx, cy - 10, 13, 0, TAU); g.fill(); });
  g.fillStyle = INK; [-50, 0, 50].forEach(cx => { g.beginPath(); g.arc(cx, 15, 9, 0, TAU); g.fill(); });
  g.restore();
}
function S_f1(g, t) {
  const lt = t - T.f1;
  fillBg(g, '#0c0d14', '#050507');
  factHeader(g, t, 1, T.f1, 'HANNOVER', '+ GROSSBRITANNIEN');
  const a = Ease.outBack(prog(lt, 0.2, 0.7)), b = Ease.outBack(prog(lt, 0.45, 0.95));
  crown(g, 280, 900, 1.1 * a, WHITE); crown(g, 800, 900, 1.1 * b, RED);
  setText(g, FONT.bold(34), 8); g.fillStyle = 'rgba(246,242,234,0.8)'; g.globalAlpha = a; g.fillText('HANNOVER', 280, 1030); g.globalAlpha = b; g.fillText('LONDON', 800, 1030); g.globalAlpha = 1;
  // arc linking the two crowns
  const arc = []; for (let i = 0; i <= 60; i++) { const u = i / 60; arc.push([lerp(280, 800, u), 780 - Math.sin(u * Math.PI) * 170]); }
  redGlowLine(g, partial(arc, Ease.inOutCubic(prog(lt, 0.7, 1.4))), 6);
  const yr = Math.round(lerp(1714, 1837, Ease.inOutCubic(prog(lt, 1.2, 3.2))));
  counter(g, 1714, 290, 1260, 110, '', WHITE); setText(g, FONT.black(90)); g.fillStyle = RED; g.fillText('–', 540, 1255);
  counter(g, yr, 790, 1260, 110, '', lt > 3.2 ? RED2 : WHITE);
  revealLine(g, '123 JAHRE PERSONALUNION', 540, 1360, 40, prog(lt, 2.0, 2.5), { font: FONT.bold(40), color: WHITE, spacing: 5 });
}
const FADEN = (() => { const p = []; for (let i = 0; i <= 120; i++) { const u = i / 120; p.push([540 + Math.sin(u * TAU * 1.6) * 360 + Math.sin(u * 23) * 25, 1360 - u * 660]); } return p; })();
function S_f2(g, t) {
  const lt = t - T.f2;
  fillBg(g, '#0d0e12', '#060607');
  // abstract old-town map
  const r = rng(11); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { g.beginPath(); const y = 640 + r() * 800; g.moveTo(0, y); g.bezierCurveTo(300, y + (r() - 0.5) * 200, 700, y + (r() - 0.5) * 200, W, y + (r() - 0.5) * 100); g.stroke(); }
  for (let i = 0; i < 18; i++) { g.beginPath(); const x = r() * W; g.moveTo(x, 620); g.lineTo(x + (r() - 0.5) * 300, 1450); g.stroke(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(r() * W, 640 + r() * 800, 30 + r() * 60, 20 + r() * 50); }
  factHeader(g, t, 2, T.f2, 'DER ROTE FADEN', '4,2 KM DURCH DIE STADT');
  const d = Ease.inOutSine(prog(lt, 0.3, 3.6));
  const part = partial(FADEN, d);
  redGlowLine(g, part, 12);
  const L = plen(FADEN); let acc = 0, shown = 0;
  for (let i = 1; i < FADEN.length; i++) { acc += Math.hypot(FADEN[i][0] - FADEN[i - 1][0], FADEN[i][1] - FADEN[i - 1][1]); }
  // 36 sights along the thread
  for (let k = 0; k < 36; k++) {
    const f = (k + 0.5) / 36; if (f > d) continue; shown++;
    const p = partial(FADEN, f); const q = p[p.length - 1];
    const pop = Ease.outBack(clamp((d - f) * 25));
    g.beginPath(); g.arc(q[0], q[1], 13 * pop, 0, TAU); g.fillStyle = WHITE; g.fill(); g.beginPath(); g.arc(q[0], q[1], 6 * pop, 0, TAU); g.fillStyle = RED; g.fill();
  }
  const head = part[part.length - 1]; g.save(); g.globalCompositeOperation = 'lighter'; glow(g, head[0], head[1], 70, 0.9, SPRITE_RED); g.restore();
  g.fillStyle = 'rgba(11,12,16,0.8)'; g.beginPath(); g.roundRect(290, 1500, 500, 170, 24); g.fill();
  counter(g, shown, 540, 1610, 120, '', RED2);
  setText(g, FONT.bold(30), 6); g.fillStyle = WHITE; g.fillText('SEHENSWÜRDIGKEITEN', 540, 1652);
  void L;
}
/* Neues Rathaus with the curved dome lift */
function rathaus(g, x, y, s, p, t) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
  const a = clamp(p * 1.4);
  g.globalAlpha = a;
  g.fillStyle = '#16171d'; g.strokeStyle = WHITE; g.lineWidth = 3;
  const body = () => { g.beginPath(); g.rect(-460, -300, 920, 300); };
  body(); g.fill(); g.stroke();
  g.beginPath(); g.rect(-160, -520, 320, 220); g.fill(); g.stroke();
  // dome
  g.beginPath(); g.moveTo(-150, -520); g.bezierCurveTo(-150, -760, -40, -860, 0, -870); g.bezierCurveTo(40, -860, 150, -760, 150, -520); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.rect(-22, -950, 44, 80); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -950); g.lineTo(0, -1010); g.stroke();
  // windows & towers
  for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 1) continue; g.strokeRect(i * 66 - 16, -250, 32, 70); g.strokeRect(i * 66 - 16, -140, 32, 70); }
  [-460, 460].forEach(tx => { g.beginPath(); g.rect(tx - 50, -420, 100, 120); g.fill(); g.stroke(); g.beginPath(); g.moveTo(tx - 55, -420); g.lineTo(tx, -500); g.lineTo(tx + 55, -420); g.fill(); g.stroke(); });
  g.beginPath(); g.arc(0, -120, 60, Math.PI, TAU); g.lineTo(60, 0); g.lineTo(-60, 0); g.closePath(); g.stroke();
  // curved lift shaft inside the dome
  const path = []; for (let i = 0; i <= 40; i++) { const u = i / 40; path.push([lerp(-110, 0, u) + Math.sin(u * Math.PI) * -30, lerp(-520, -860, u)]); }
  g.globalAlpha = a;
  g.setLineDash([12, 10]); stroke(g, path, 'rgba(255,74,79,0.8)', 4); g.setLineDash([]);
  const up = Ease.inOutSine(clamp((p - 0.45) / 0.55));
  const idx = Math.min(39, Math.floor(up * 40)); const c = path[idx], nx = path[idx + 1];
  const ang = Math.atan2(nx[1] - c[1], nx[0] - c[0]) + Math.PI / 2;
  g.save(); g.translate(c[0], c[1]); g.rotate(ang * 0.35); g.fillStyle = RED; g.fillRect(-22, -30, 44, 60); g.fillStyle = 'rgba(255,230,200,0.9)'; g.fillRect(-14, -20, 28, 22); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, c[0], c[1], 80, 0.7 * up + 0.2, SPRITE_RED); g.restore();
  g.restore();
}
function S_f3(g, t) {
  const lt = t - T.f3;
  fillBg(g, '#0c0d14', '#050507');
  factHeader(g, t, 3, T.f3, 'SCHRÄG NACH OBEN', 'NEUES RATHAUS');
  drawRays(g, 540, 800, t, 0.35, 1200, 12, 2.2, -Math.PI / 2, [255, 120, 110]);
  rathaus(g, 540, 1470, 0.95, prog(lt, 0.1, 4.2), t);
  const la = prog(lt, 1.6, 2.0);
  g.save(); g.globalAlpha = la; g.strokeStyle = WHITE; g.lineWidth = 2; g.beginPath(); g.moveTo(560, 900); g.lineTo(760, 780); g.lineTo(960, 780); g.stroke();
  setText(g, FONT.black(40), 3, 'right'); g.fillStyle = WHITE; g.fillText('BOGENAUFZUG', 960, 760);
  setText(g, FONT.semi(28), 3, 'right'); g.fillStyle = RED2; g.fillText('EINZIGARTIG IN EUROPA', 960, 822); g.restore();
}
function S_f4(g, t) {
  const lt = t - T.f4;
  fillBg(g, '#0a0d12', '#040506');
  factHeader(g, t, 4, T.f4, 'GROSSE FONTÄNE', 'HERRENHÄUSER GÄRTEN');
  // baroque parterre
  g.save(); g.translate(540, 1560); g.scale(1, 0.35);
  for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(0, 0, 160 + k * 110, 0, TAU); g.strokeStyle = `rgba(80,160,100,${0.5 - k * 0.08})`; g.lineWidth = 26; g.stroke(); }
  for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); g.fillStyle = 'rgba(60,130,80,0.45)'; g.fillRect(180, -18, 400, 36); g.restore(); }
  g.beginPath(); g.arc(0, 0, 130, 0, TAU); g.fillStyle = '#16384a'; g.fill(); g.restore();
  // the jet
  const hgt = Ease.outCubic(prog(lt, 0.3, 2.4)) * 900;  // px for ~72 m
  const top = 1560 - hgt;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 160; i++) {
    const u = hash1(i), life = (u + lt * 0.8) % 1;
    const y = lerp(1560, top, Math.sqrt(life)); const x = 540 + (hash1(i * 3) - 0.5) * 26 * (1 - life * 0.5);
    glow(g, x, y, 10 + hash1(i * 7) * 16, 0.35, SPRITE_WATER);
  }
  for (let i = 0; i < 120; i++) { // falling spray
    const u = (hash1(i * 5) + lt * 0.6) % 1, side = hash1(i * 9) < 0.5 ? -1 : 1;
    const x = 540 + side * (40 + u * 260 * hash1(i * 11)), y = top + 40 + u * u * (1560 - top);
    glow(g, x, y, 5 + hash1(i) * 6, 0.35 * (1 - u), SPRITE_WATER);
  }
  g.restore();
  // height scale
  const m = Math.round(Ease.outCubic(prog(lt, 0.3, 2.4)) * 72);
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(860, 1560); g.lineTo(860, 660); g.stroke();
  for (let k = 0; k <= 7; k++) { const y = 1560 - k * 900 / 7.2 * 1; g.beginPath(); g.moveTo(850, y); g.lineTo(880, y); g.stroke(); setText(g, FONT.med(22), 1, 'left'); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText(`${k * 10}`, 892, y + 8); }
  g.strokeStyle = RED; g.lineWidth = 4; g.beginPath(); g.moveTo(560, top); g.lineTo(860, top); g.stroke();
  g.fillStyle = 'rgba(11,12,16,0.85)'; g.beginPath(); g.roundRect(140, top - 70, 330, 130, 20); g.fill();
  counter(g, m, 305, top + 30, 96, ' m', m >= 70 ? RED2 : WHITE);
}
function S_f5(g, t) {
  const lt = t - T.f5;
  fillBg(g, '#0c0d12', '#050506');
  factHeader(g, t, 5, T.f5, 'MESSE HANNOVER', 'GRÖSSTES MESSEGELÄNDE');
  // isometric halls rising
  const iso = (x, y, z) => [540 + (x - y) * 70, 1180 + (x + y) * 38 - z];
  const halls = []; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if ((i + j) % 2 === 0 || Math.abs(i) + Math.abs(j) < 4) halls.push([i * 1.3, j * 1.3, 40 + hash1(i * 7 + j) * 60, hash1(i * 13 + j * 3)]);
  halls.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  halls.forEach(([x, y, h, s]) => {
    const r = Ease.outBack(prog(lt, 0.2 + s * 0.8, 0.6 + s * 0.8)) * h; if (r <= 0) return;
    const w = 0.55; const P = (dx, dy, z) => iso(x + dx, y + dy, z);
    const top = [P(-w, -w, r), P(w, -w, r), P(w, w, r), P(-w, w, r)];
    g.fillStyle = '#2a2d36'; poly(g, [P(w, -w, 0), P(w, w, 0), P(w, w, r), P(w, -w, r)]); g.fill();
    g.fillStyle = '#1c1e25'; poly(g, [P(-w, w, 0), P(w, w, 0), P(w, w, r), P(-w, w, r)]); g.fill();
    g.fillStyle = s > 0.8 ? RED : '#3a3e4a'; poly(g, top); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.5; poly(g, top); g.stroke();
  });
  const n = prog(lt, 1.6, 2.0);
  g.save(); g.globalAlpha = n; g.translate(540, 1540); g.scale(lerp(1.6, 1, Ease.outExpo(n)), lerp(1.6, 1, Ease.outExpo(n)));
  setText(g, FONT.black(170), 0, 'center', 'middle'); g.fillStyle = RED2; g.shadowColor = 'rgba(227,38,47,0.7)'; g.shadowBlur = 30; g.fillText('#1', 0, 0); g.restore();
  revealLine(g, 'DER WELT', 540, 1680, 52, prog(lt, 1.9, 2.3), { font: FONT.black(52), color: WHITE, spacing: 10 });
}
function S_out(g, t) {
  const lt = t - T.out;
  fillBg(g, '#0c0d12', '#050507');
  germany(g, t, { draw: 1, pin: 1, scale: lerp(1.8, 1, Ease.inOutCubic(prog(lt, 0, 1.2))), focus: proj(HAN) });
  const p = prog(lt, 0.3, 0.7), e = Ease.outExpo(p);
  g.save(); g.translate(540, 420); g.scale(lerp(1.5, 1, e), lerp(1.5, 1, e)); setText(g, '900 118px MS, Emoji', lerp(20, 3, e), 'center', 'middle'); g.globalAlpha = clamp(p * 3);
  g.shadowColor = 'rgba(227,38,47,0.7)'; g.shadowBlur = 30; g.fillStyle = WHITE; g.fillText('HANNOVER 🇩🇪', 0, 0); g.restore();
  kineticChars(g, 'Warst du schon mal hier?', 540, 560, 64, T.out + 0.8, t, { font: FONT.serif(70), color: RED2, stagger: 0.025, dur: 0.4, rise: 30 });
}

/* ---- the red thread transition: a thick red line sweeps across ---- */
function redWipe(g, t, t0) {
  const p = prog(t, t0 - 0.25, t0 + 0.25); if (p <= 0 || p >= 1) return;
  const e = Ease.inOutCubic(p);
  g.save(); g.translate(540, 960); g.rotate(-0.35);
  const x = lerp(-1500, 1500, e);
  g.fillStyle = RED; g.fillRect(x - 380, -1400, 760, 2800);
  g.fillStyle = RED2; g.fillRect(x + 380, -1400, 26, 2800);
  g.restore();
}

/* ---- captions with word highlight ---- */
function captions(g, t) {
  const c = SUBS.find(s => t >= s.s && t < s.e); if (!c) return;
  const words = c.text.split(' ');
  const total = c.text.length; let acc = 0; const k = (t - c.s) / Math.max(0.3, c.e - c.s - 0.15);
  g.save(); setText(g, FONT.black(58), 0, 'left');
  const lines = []; let cur = [], w = 0; const sp = g.measureText(' ').width;
  words.forEach(wd => { const ww = g.measureText(wd).width; if (w + ww > 980 && cur.length) { lines.push(cur); cur = []; w = 0; } cur.push([wd, ww, acc / total]); w += ww + sp; acc += wd.length + 1; });
  lines.push(cur);
  const a = clamp((t - c.s) / 0.1) * clamp((c.e - t) / 0.1);
  g.globalAlpha = a;
  lines.forEach((ln, li) => {
    const lw = ln.reduce((s, x) => s + x[1], 0) + sp * (ln.length - 1); let x = 540 - lw / 2; const y = 1430 + li * 76;
    ln.forEach(([wd, ww, f]) => {
      const on = k >= f && k < f + (wd.length + 1) / total + 0.02;
      if (on) { g.fillStyle = RED; g.beginPath(); g.roundRect(x - 10, y - 54, ww + 20, 70, 10); g.fill(); }
      g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineJoin = 'round'; g.strokeText(wd, x, y); g.fillStyle = WHITE; g.fillText(wd, x, y);
      x += ww + sp;
    });
  });
  g.restore();
}

/* ---- compositor ---- */
let SPRITE_RED = null, SPRITE_WATER = null;
function initScenes(tl) {
  SPRITE_RED = radialSprite(128, [[0, 'rgba(255,120,120,1)'], [0.3, 'rgba(240,50,60,0.5)'], [1, 'rgba(227,38,47,0)']]);
  SPRITE_WATER = radialSprite(64, [[0, 'rgba(210,235,255,0.9)'], [1, 'rgba(160,210,255,0)']]);
  if (tl) { Object.assign(T, tl.scenes); SUBS = tl.subs; }
}
function drawFrame(ctx, tIn, frameIn) {
  const t = Math.min(tIn, T.end - 0.5), frame = Math.min(frameIn, Math.round((T.end - 0.5) * FPS));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const S = t < T.f1 ? S_hook : t < T.f2 ? S_f1 : t < T.f3 ? S_f2 : t < T.f4 ? S_f3 : t < T.f5 ? S_f4 : t < T.out ? S_f5 : S_out;
  S(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  [T.f1, T.f2, T.f3, T.f4, T.f5, T.out].forEach(t0 => redWipe(ctx, t, t0));
  drawDust(ctx, t, 30, 0.5);
  drawVignette(ctx, 0.6);
  captions(ctx, t);
  // brand tag
  ctx.save(); ctx.globalAlpha = 0.75 * prog(t, 1, 1.4) * (1 - prog(t, T.out - 0.3, T.out)); setText(ctx, FONT.semi(24), 9); ctx.fillStyle = WHITE; ctx.fillText('HANNOVER IN 30 SEKUNDEN', 540, 140); ctx.restore();
  drawGrain(ctx, frame, 0.06);
}
