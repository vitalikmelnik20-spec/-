'use strict';
/* Shot table: every shot of the script -> set + characters + camera + grade. */
const SHOT = {};
const HANG = { l: [-0.08, 0], r: [0.08, 0] };
const B = (x, y, h, e = {}) => Object.assign({ who: 'billy', x, y, h, arms: { l: [-0.15, 0.1], r: [0.35, -0.2] }, rItem: 'pillowcase' }, LP.porch(-1), e);
const Wt = (who, x, y, h, e = {}) => Object.assign({ who, x, y, h, arms: HANG }, e);
const wave = (t, k = 1) => [2.5 + 0.35 * Math.sin(t * 5 * k), 0.3];
const young = { hair: '#8a7e70', mustache: '#6a5a4a', skin: '#e0b090' };

/* ======================= COLD OPEN ======================= */
SHOT.V01 = { grade: 'night', cam: { z0: 1.0, z1: 1.16, f0: [960, 560], f1: [960, 600] },
  draw: (g, t) => porchDoor(g, t, { figures: [B(960, 905, 520, { arms: { l: [-0.12, 0.1], r: [lerp(0.25, 0.9, Ease.inOutSine(clamp(t / 6))), lerp(-0.1, -0.5, clamp(t / 6))] } })] }) };
SHOT.F001 = { cam: { z0: 1.0, z1: 1.12, f0: [960, 500] }, draw: (g, t) => cuMask(g, t) };
SHOT.F002 = { cam: { z0: 1.0, z1: 1.1 }, draw: (g, t) => cuPillowcase(g, t) };
SHOT.F003 = { cam: { z0: 1.05, z1: 1.18, f0: [960, 560] }, draw: (g, t) => cuPost(g, t, { marks: 7 }) };
SHOT.F004 = { grade: 'night', cam: { z0: 1.05, z1: 1.16, f0: [760, 500] },
  draw: (g, t) => porchFront(g, t, { swing: 760, doorX: 1380, winX: 300, pumpkins: [[1150, 880, 60]], rail: false, figures: [Wt('walter', 760, 862, 720, Object.assign({ pose: 'sit', turn: 0.3, sad: true, smile: 0.05, arms: { l: [0.3, 0.5], r: [-0.3, -0.5] }, rItem: 'bowl' }, LP.porch(1)))] }) };
SHOT.F005 = { grade: 'night', cam: { z0: 1.0, z1: 1.08 },
  draw: (g, t) => fieldScene(g, t, { horizon: 560, fence: [[120, 760, 1], [420, 700, 0.8], [700, 650, 0.6], [940, 615, 0.45]],
    front: [Wt('walter', 1180, 1040, 760, Object.assign({ view: 'back', arms: { l: [-0.1, 0], r: [0.6, -0.1] }, rItem: 'flashlight' }, LP.moon(1)))],
    beams: [[1330, 690, -2.75, 800, 0.13, 0.6]] }) };
SHOT.F006 = { grade: 'night', cam: { z0: 1.0, z1: 1.06, f0: [1200, 540] },
  draw: (g, t) => houseExt(g, t, { x: 1340, s: 760, horizon: 780, moon: [520, 170, 30], windows: [0, 0.9, 0, 0.8, 0], pumpkins: [[-120, 0, 50], [120, 0, 46], [-60, -20, 36], [300, -40, 40]], fog: 0.5, trees: [[1880, 820, 560], [860, 800, 380]] }) };

/* ======================= ACT 1 ======================= */
SHOT.F007 = { cam: { z0: 1.0, z1: 1.08, f0: [800, 540], f1: [1100, 540] },
  draw: (g, t) => houseExt(g, t, { tod: 'day', x: 900, s: 820, horizon: 720, clouds: 5, porchLight: false, leaves: 18, trees: [[200, 760, 620], [1650, 780, 700]] }) };
SHOT.F008 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 520] },
  draw: (g, t) => { tabletop(g, '#2a1a10'); addGlow(g, 400, 100, 900, 0.3);
    photo(g, 960, 520, 1280, 760, -0.035, 'color70', (pg, tt) => porchFront(pg, tt, { tod: 'day', doorX: 1500, winX: 300, rail: false, pumpkins: [[400, 880, 70, false], [620, 880, 58, false], [1250, 890, 64, false], [1400, 880, 50, false], [1040, 900, 44, false]],
      figures: [Wt('walter', 800, 870, 760, Object.assign({}, young, { turn: 0.4, smile: 1, eyesClosed: true, arms: { l: [-0.1, 0], r: [0.5, 0.6] } }, LP.day())), Wt('margaret', 1040, 870, 700, Object.assign({ turn: -0.4, smile: 1, eyesClosed: true, arms: { l: [-0.5, -0.6], r: [0.1, 0] } }, LP.day()))] }), t); } };
SHOT.F009 = { grade: 'warm', cam: { z0: 1.02, z1: 1.12, f0: [800, 650] },
  draw: (g, t) => kitchen(g, t, { out: 'day', apples: true, tableX: 820, tableY: 740, hanging: [820, 200] }) };
SHOT.F010 = { grade: 'vintage', cam: { z0: 1.02, z1: 1.1, f0: [900, 600] },
  draw: (g, t) => { kitchen(g, t, { out: 'day', wall: '#7a8a6a', tableX: 900, tableY: 760, hanging: [900, 200],
    back: [Wt('margaret', 900, 960, 760, Object.assign({ pose: 'sit', turn: 0.2, smile: 0.6, arms: { l: [0.5, 0.9], r: [-0.4, -1.2] } }, LP.lamp(-1)))] });
    g.fillStyle = '#4f6a8c'; g.save(); g.translate(930, 752); g.rotate(-0.05); g.fillRect(-170, -26, 340, 34); g.restore(); for (let k = 0; k < 6; k++) strawTuft(g, 780 + k * 10, 740, -1.2 + k * 0.1, 900);
    ell(g, 1240, 752, 130, 26, '#a8833f'); g.fillStyle = '#c29c55'; g.beginPath(); g.moveTo(1175, 750); g.quadraticCurveTo(1175, 690, 1240, 690); g.quadraticCurveTo(1305, 690, 1305, 750); g.fill(); } };
SHOT.F011 = { grade: 'warm', cam: { z0: 1.02, z1: 1.1 },
  draw: (g, t) => porchFront(g, t, { doorX: 1500, winX: 380, pumpkins: [[1180, 880, 60], [260, 880, 56]], rail: false, figures: [
    Wt('scarecrow', 1000, 880, 760, Object.assign({ turn: -0.4, smile: 1, arms: { l: [-0.9, -0.6], r: [0.2, 0] }, lItem: 'candy' }, LP.porch(1))),
    Wt('kid', 760, 900, 470, Object.assign({ view: 'back', coat: '#e0e0e0', hat: 'witch', arms: { l: [0, 0], r: [2.3, 0.3] } }, LP.porch(1))),
    Wt('kid', 580, 910, 430, Object.assign({ view: 'back', coat: '#6a4a2a', hat: 'campaign', arms: { l: [-0.3, 0], r: [0.3, 0] }, rItem: 'bucket' }, LP.porch(1))),
    Wt('kid', 1300, 920, 420, Object.assign({ turn: -0.6, coat: '#f2f2f2', smile: 1, arms: { l: [-0.4, -0.8], r: [0.3, 0] }, lItem: 'bucket' }, LP.porch(-1)))] }) };
SHOT.F012 = { cam: { z0: 1.0, z1: 1.08, f0: [1000, 500] }, grade: 'vintage', draw: (g, t) => church(g, t, { blossom: true, cars: 10, tod: 'spring' }) };
SHOT.F013 = { grade: 'night', cam: { z0: 1.5, z1: 1.62, f0: [960, 640] },
  draw: (g, t) => houseExt(g, t, { tod: 'dusk', x: 960, s: 900, horizon: 780, porchLight: 0, windows: [0, 0, 0, 0, 0], leaves: 30, trees: [[150, 800, 560], [1780, 820, 640]] }) };
SHOT.F014 = { cam: { z0: 1.0, z1: 1.1, f0: [800, 520] }, draw: (g, t) => cuMailbox(g, t) };
SHOT.F015 = { grade: 'warm', cam: { z0: 1.05, z1: 1.15, f0: [1100, 560] },
  draw: (g, t) => attic(g, t, { figures: [Wt('walter', 900, 900, 760, Object.assign({ pose: 'kneel', turn: 0.5, sad: true, smile: 0, arms: { l: [0.9, 0.3], r: [0.5, 0.6] }, rItem: 'hat' }, LP.soft(1)))] }) };
SHOT.F016 = { cam: { z0: 1.0, z1: 1.08 }, draw: (g, t) => cuGrocery(g, t) };
SHOT.V02 = { grade: 'night', cam: { z0: 1.08, z1: 1.0, f0: [900, 620] },
  draw: (g, t) => porchFront(g, t, { tod: 'dusk', doorX: 1500, winX: 380, lamp: prog(t, 5.2, 5.6), winLit: t > 5.3, rail: false,
    pumpkins: [[560, 880, 56, t > 0.8], [700, 885, 62, t > 1.8], [840, 888, 58, t > 2.8], [1180, 888, 64, t > 4.0]],
    figures: [Wt('scarecrow', 1020, 890, 700, Object.assign({ pose: 'kneel', flip: true, turn: 0.6, smile: 0.6, arms: { l: [-0.6, -0.4], r: [0.2, 0] } }, LP.porch(-1, 0.6)))] }) };
SHOT.F017 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [900, 540] },
  draw: (g, t) => porchFront(g, t, { doorX: 1520, winX: 300, pumpkins: [[1280, 880, 60], [560, 882, 50]], rail: false, figures: [
    Wt('scarecrow', 820, 880, 760, Object.assign({ turn: 0.4, smile: 1, eyesClosed: true, lean: -0.08, arms: { l: [-0.3, -0.2], r: [0.6, 1.4] } }, LP.porch(1))),
    Wt('kid', 1120, 900, 380, Object.assign({ turn: -0.3, coat: '#dfe3e8', pants: '#c8ccd2', hat: 'helmet', arms: { l: [-1.3, -0.2], r: [0.2, 0] }, lItem: 'bucket' }, LP.porch(-1)))] }) };
SHOT.F018 = { grade: 'night', cam: { z0: 1.04, z1: 1.14, f0: [800, 520] },
  draw: (g, t) => { porchFront(g, t, { swing: 760, doorX: 1420, winX: 250, winLit: false, rail: false, pumpkins: [[1180, 880, 60], [1330, 885, 50]],
    figures: [Wt('scarecrow', 640, 862, 700, Object.assign({ pose: 'sit', turn: 0.2, sad: true, smile: 0, arms: { l: [0.2, 0.2], r: [-0.2, -0.3] } }, LP.porch(1, 0.7)))] });
    drawItem(g, 'bowl', 900, 640, 700, 0, {}); } };
SHOT.F019 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [900, 500], f1: [1100, 420] },
  draw: (g, t) => { fieldScene(g, t, { horizon: 700, moon: [1450, 200, 44], fog: 0.4 });
    g.fillStyle = '#0c0a0a'; g.fillRect(0, 0, W, 90); g.fillRect(0, 0, 70, H);
    g.strokeStyle = 'rgba(30,26,22,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(300, 90); g.lineTo(310, 760); g.moveTo(820, 90); g.lineTo(810, 760); g.stroke();
    g.fillStyle = '#2a2018'; g.fillRect(260, 760, 600, 26);
    person(g, 560, 980, 700, Object.assign({ who: 'scarecrow', view: 'back', pose: 'sit', arms: { l: [-0.3, 0.4], r: [0.3, -0.4] } }, LP.moon(1)));
    g.fillStyle = '#4a4a50'; g.fillRect(0, 880, W, 18); for (let x = 10; x < W; x += 50) g.fillRect(x, 898, 14, 190); } };
SHOT.F020 = { cam: { z0: 1.02, z1: 1.12, f0: [800, 500] }, draw: (g, t) => cuHatHook(g, t) };
SHOT.F021 = { cam: { z0: 1.0, z1: 1.2, f0: [960, 420] }, draw: (g, t) => cuClock(g, t, { kettle: true }) };
SHOT.V03 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [960, 580] },
  draw: (g, t) => porchDoor(g, t, { door: Ease.inOutSine(clamp(t / 2.6)), lit: false, smoke: true, leaves: 4, figures: [B(960, 905, 520, { arms: { l: [-0.12, 0.1], r: [lerp(0.3, 0.7, prog(t, 3, 5)), lerp(-0.1, -0.35, prog(t, 3, 5))] } })] }) };
SHOT.F022 = { cam: { z0: 1.1, z1: 1.3, f0: [960, 520] }, draw: (g, t) => cuMask(g, t, { r: 420, macro: true }) };
SHOT.F023 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 700] }, draw: (g, t) => cuHem(g, t) };
SHOT.F024 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [900, 600] },
  draw: (g, t) => porchDoor(g, t, { figures: [B(1120, 905, 520)], front: [Wt('walter', 620, 1260, 1100, Object.assign({ view: 'back', lean: 0.28, arms: { l: [-0.2, 0], r: [0.7, 0.4] } }, LP.porch(1, 0.8)))] }) };
SHOT.F025 = { cam: { z0: 1.0, z1: 1.12, f0: [960, 480] }, draw: (g, t) => cuPillowcase(g, t, { choc: prog(t, 0.8, 2.6) }) };
SHOT.F026 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [960, 600] },
  draw: (g, t) => { fieldScene(g, t, { horizon: 560, fence: [[80, 800, 1], [380, 740, 0.8], [640, 700, 0.62], [860, 672, 0.5]],
    front: [B(960, 930, 430, Object.assign({ view: 'back', pose: 'walk', phase: t * 2.4, arms: { l: [-0.12, 0], r: [0.25, 0] } }, LP.moon(-1)))] });
    g.fillStyle = '#1e160f'; g.fillRect(0, 960, W, 120); g.fillStyle = '#2a1e14'; g.fillRect(760, 945, 400, 30); addGlow(g, 200, 400, 600, 0.45); g.fillStyle = '#0c0a08'; g.fillRect(0, 0, 90, H); g.fillRect(W - 90, 0, 90, H); } };
SHOT.F027 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [1000, 560] },
  draw: (g, t) => fieldScene(g, t, { horizon: 560, fog: 0.6, front: [Wt('walter', 680, 1080, 820, Object.assign({ view: 'back', arms: { l: [-0.1, 0], r: [0.9, -0.2] }, rItem: 'flashlight' }, LP.porch(-1, 0.6)))],
    beams: [[860, 610, -0.18, 1200, 0.1, 0.6]] }) };
SHOT.F028 = { grade: 'night', cam: { z0: 1.04, z1: 1.14, f0: [900, 520] },
  draw: (g, t) => kitchen(g, t, { out: 'night', winX: 1250, cup: [1010, 735, 1], hanging: [700, 220], tableX: 850, tableY: 760,
    back: [Wt('walter', 820, 980, 780, Object.assign({ pose: 'sit', turn: 0.8, sad: true, smile: 0, arms: { l: [0.4, 0.8], r: [-0.3, -0.9] } }, LP.lamp(-1)))] }) };

/* ======================= ACT 2 ======================= */
SHOT.F029 = { grade: 'warm', cam: { z0: 1.0, z1: 1.12, f0: [1100, 520] },
  draw: (g, t) => hallway(g, t, { doorX: 1150, clock: [1560, 300, 90], figures: [Wt('scarecrow', 900, 920, 820, Object.assign({ turn: 0.7, sad: true, smile: 0, arms: { l: [-0.1, 0], r: [1.1, 0.3] } }, LP.lamp(-1)))] }) };
SHOT.F030 = { grade: 'night', cam: { z0: 1.12, z1: 1.22, f0: [960, 640] }, draw: (g, t) => porchDoor(g, t, { fog: 0.9, figures: [B(960, 905, 520)] }) };
SHOT.F031 = { cam: { z0: 1.0, z1: 1.1 }, draw: (g, t) => cuShoulder(g, t) };
SHOT.F032 = { grade: 'night', cam: { z0: 1.0, z1: 1.08 },
  draw: (g, t) => fieldScene(g, t, { horizon: 560, fence: [[0, 900, 1.3], [500, 860, 1.2], [1000, 830, 1.1], [1500, 800, 1.0], [1920, 780, 0.95]],
    behind: [B(1150, 700 - t * 4, 230 - t * 2, Object.assign({ view: 'back', pose: 'walk', phase: t * 2 }, LP.moon(1)))],
    front: [Wt('scarecrow', 520, 1100, 820, Object.assign({ view: 'back', arms: { l: [-0.1, 0], r: [0.8, -0.3] }, rItem: 'flashlight' }, LP.moon(1)))],
    beams: [[700, 640, -0.45, 800, 0.12, 0.5]] }) };
SHOT.F033 = { grade: 'night', cam: { z0: 1.0, z1: 1.06 }, draw: (g, t) => { fieldScene(g, t, { horizon: 540, still: true, fog: 0.5 }); fogBand(g, 700, 60, t, 0.5, 12, 4, SPR.fog, 900, 1200); } };
SHOT.V04 = { grade: 'night', cam: { z0: 1.0, z1: 1.04 },
  draw: (g, t) => { const k = clamp(t / 7);
    fieldScene(g, t, { horizon: 560, still: true, fog: 0.6, fence: [[0, 1000, 1.3], [600, 960, 1.2], [1200, 940, 1.1], [1920, 920, 1.0]],
      behind: [B(1000 + k * 80, lerp(900, 740, k), lerp(430, 280, k), Object.assign({ view: 'back', pose: 'walk', phase: t * 2.2, alpha: 1 - prog(t, 3.8, 6.2) }, LP.moon(1)))] }); } };
SHOT.F034 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [850, 560] },
  draw: (g, t) => kitchen(g, t, { out: 'night', cup: [1080, 735, 0], hanging: [820, 240], tableX: 850, tableY: 760, notebook: [800, 745],
    back: [Wt('walter', 820, 980, 780, Object.assign({ pose: 'sit', turn: 0.1, lean: 0.12, smile: 0, arms: { l: [0.4, 0.9], r: [-0.2, -0.5] } }, LP.lamp(-0.2)))] }) };
SHOT.F035 = { cam: { z0: 1.0, z1: 1.12 }, draw: (g, t) => cuNotebook(g, t) };
SHOT.F036 = { grade: 'warm', cam: { z0: 1.02, z1: 1.12, f0: [1000, 520] },
  draw: (g, t) => hallway(g, t, { doorX: 1250, clock: [640, 280, 90], figures: [Wt('walter', 960, 920, 820, Object.assign({ turn: 0.7, smile: 0, arms: { l: [0.5, 0.9], r: [-0.3, -0.8] }, lItem: 'notebook' }, LP.lamp(-1)))] }) };
SHOT.F037 = { grade: 'night', cam: { z0: 1.02, z1: 1.12, f0: [960, 560] },
  draw: (g, t) => { porchFront(g, t, { doorX: 1560, winX: 330, rail: false, pumpkins: [[240, 880, 56]], figures: [] });
    g.fillStyle = '#8a8478'; g.fillRect(900, 0, 70, 870); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(950, 0, 20, 870);
    for (let k = 0; k < 2; k++) { g.strokeStyle = 'rgba(40,40,45,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(905, 560 + k * 4); g.lineTo(965, 560 + k * 4); g.stroke(); }
    person(g, 760, 870, 760, Object.assign({ who: 'walter', pose: 'kneel', turn: 0.6, smile: 0, arms: { l: [1.3, 0.6], r: [0.9, 0.9] } }, LP.porch(1)));
    person(g, 1120, 872, 520, B(0, 0, 0)); } };
SHOT.F038 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 520] },
  draw: (g, t) => { tabletop(g, '#3a2616');
    [[-560, 0.08, 1], [0, -0.04, 2], [560, 0.05, 3]].forEach(([dx, r, yr]) => photo(g, 960 + dx, 480, 460, 380, r, 'polaroid', (pg, tt) => porchFront(pg, 0, { tod: 'day', doorX: 1600, winX: 260, rail: false,
      figures: [0, 1, 2].map(k => Wt('kid', 700 + k * 260, 880, 420 + yr * 70 + k * 12, Object.assign({ coat: ['#e0e0e0', '#8a3a2a', '#3a5a8a'][k], hat: ['witch', 'campaign', null][k], smile: 1 }, LP.day())))}), t)); } };
SHOT.F039 = { cam: { z0: 1.1, z1: 1.25, f0: [960, 540] }, draw: (g, t) => cuPost(g, t, { marks: 4 }) };
SHOT.F040 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [960, 560] },
  draw: (g, t) => porchDoor(g, t, { figures: [B(960, 905, 520, { arms: { l: [-1.45, 0], r: [0.3, -0.2] } })], front: [Wt('walter', 1450, 1250, 1080, Object.assign({ view: 'back', arms: { l: [-0.3, 0.2], r: [0.2, 0] } }, LP.porch(-1, 0.6)))] }) };
SHOT.V05 = { grade: 'night', cam: { z0: 1.5, z1: 1.6, f0: [980, 560], f1: [520, 600] },
  draw: (g, t) => porchDoor(g, t, { leaves: 16, fog: 0.8, figures: [B(960, 905, 520, { arms: { l: [-1.45, 0], r: [0.3, -0.2] } })] }) };
SHOT.F041 = { grade: 'warm', cam: { z0: 1.02, z1: 1.12, f0: [1100, 480] },
  draw: (g, t) => hallway(g, t, { doorX: 1100, figures: [Wt('walter', 1100, 900, 820, Object.assign({ eyesClosed: true, sad: true, smile: -0.2, arms: { l: [-0.3, 0.3], r: [0.3, -0.3] } }, LP.lamp(-1)))] }) };
SHOT.F042 = { cam: { z0: 1.0, z1: 1.08 },
  draw: (g, t) => winterScene(g, t, { fence: [[0, 900, 1.2], [480, 890, 1.2], [960, 880, 1.2], [1440, 870, 1.2], [1920, 860, 1.2]],
    figures: [Wt('walterCoat', 620, 1000, 760, Object.assign({ turn: 0.6, smile: 0.3, hat: null }, LP.day(1))), Wt('man', 1260, 980, 720, Object.assign({ turn: -0.6, coat: '#6a2a2a', hat: 'campaign', smile: 0.5 }, LP.day(-1)))] }) };
SHOT.F043 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 560] }, draw: (g, t) => winterScene(g, t, { road: true, houses: [[500, 640, 320], [1400, 630, 300], [1750, 620, 220], [220, 650, 260]] }) };
SHOT.F044 = { grade: 'warm', cam: { z0: 1.0, z1: 1.1, f0: [960, 560] }, draw: (g, t) => library(g, t) };
SHOT.F045 = { cam: { z0: 1.05, z1: 1.18, f0: [980, 560] },
  draw: (g, t) => library(g, t, { figures: [Wt('walter', 980, 1200, 900, Object.assign({ view: 'back', pose: 'sit', arms: { l: [0.3, 0.4], r: [-0.3, -0.4] } }, LP.dark(0.3)))] }) };
SHOT.F046 = { cam: { z0: 1.0, z1: 1.15, f0: [960, 500] }, draw: (g, t) => cuMicrofilm(g, t, { scroll: true }) };
SHOT.F047 = { cam: { z0: 1.05, z1: 1.2, f0: [1100, 500] }, draw: (g, t) => cuNewspaper(g, t) };
SHOT.F048 = { cam: { z0: 1.0, z1: 1.1 },
  draw: (g, t) => { tabletop(g, '#1e1610'); addGlow(g, 900, 300, 900, 0.3);
    photo(g, 960, 540, 820, 820, 0.03, 'bw', pg => porchFront(pg, 0, { tod: 'day', doorX: 1500, winX: 360, rail: false, figures: [Wt('kid', 960, 900, 560, Object.assign({ hair: '#c07040', smile: 1, arms: { l: [-2.0, -0.9], r: [0.1, 0] }, lItem: 'mask' }, LP.day()))] }), t); } };
SHOT.F049 = { cam: { z0: 1.0, z1: 1.1 },
  draw: (g, t) => { tabletop(g, '#1e1610'); addGlow(g, 900, 300, 900, 0.3);
    photo(g, 960, 540, 820, 820, -0.04, 'bw', pg => porchFront(pg, 0, { tod: 'day', doorX: 1500, winX: 360, rail: false, figures: [Wt('kid', 960, 900, 520, Object.assign({ hair: '#c07040', bigCoat: true, coat: '#5e4128', coatLen: 0.03, smile: 0.8, arms: { l: [-0.15, 0.1], r: [0.15, -0.1] } }, LP.day()))] }), t); } };
SHOT.F050 = { cam: { z0: 1.08, z1: 1.18, f0: [980, 600] },
  draw: (g, t) => library(g, t, { figures: [Wt('walter', 980, 1180, 900, Object.assign({ pose: 'sit', turn: 0, sad: true, smile: 0, arms: { l: [0.3, 0.5], r: [0.25, 3.3] } }, LP.dark(0)))] }) };

/* ======================= ACT 3 ======================= */
SHOT.F051 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 520] }, draw: (g, t) => brickHouse(g, t) };
SHOT.F052 = { cam: { z0: 1.02, z1: 1.1, f0: [800, 560] },
  draw: (g, t) => carInterior(g, t, { figures: [Wt('walterCoat', 560, 1500, 1250, Object.assign({ pose: 'sit', turn: 0.5, sad: true, smile: 0, arms: { l: [0.9, 0.6], r: [0.5, 0.9] } }, LP.soft(1)))] }) };
SHOT.F053 = { cam: { z0: 1.0, z1: 1.1 }, draw: (g, t) => cuCarSeat(g, t) };
SHOT.F054 = { cam: { z0: 2.2, z1: 2.32, f0: [960, 560] },
  draw: (g, t) => brickHouse(g, t, { doorOpen: true, figures: [Wt('dorothy', 960, 790, 250, Object.assign({ turn: -0.2, smile: 0.2, arms: { l: [-0.4, -1.0], r: [0.1, 0] }, lItem: 'paper' }, LP.soft(-1))),
    Wt('walterCoat', 830, 900, 420, Object.assign({ view: 'back', arms: HANG }, LP.soft(-1)))] }) };
SHOT.F055 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [960, 560] },
  draw: (g, t) => { livingRoom(g, t, { sofa: [960, 900], lamp: [320, 560], winX: 1400,
    figures: [Wt('walter', 820, 910, 700, Object.assign({ pose: 'sit', turn: 0.5, sad: true, smile: 0.1, arms: { l: [-0.1, 0.2], r: [0.5, 0.8] } }, LP.lamp(-1))),
      Wt('dorothy', 1110, 910, 660, Object.assign({ pose: 'sit', turn: -0.5, smile: 0.2, arms: { l: [-0.5, -0.8], r: [0.1, 0] } }, LP.lamp(-1)))] });
    table(g, 960, 960, 520, '#4a3020'); teacup(g, 860, 952, 0.8, 0.6, t); teacup(g, 1060, 952, 0.8, 0.6, t); } };
SHOT.F056 = { cam: { z0: 1.0, z1: 1.1 },
  draw: (g, t) => { tabletop(g, '#241a12'); addGlow(g, 900, 300, 900, 0.3);
    photo(g, 960, 540, 1100, 780, 0.025, 'bw', pg => porchFront(pg, 0, { tod: 'day', doorX: 1500, winX: 330, rail: false, figures: [
      Wt('girl', 820, 900, 640, Object.assign({ hat: null, hairStyle: 'braid', hair: '#6a4a2a', coat: '#8a8a90', pose: 'sit', smile: 1, arms: { l: [-0.2, 0.3], r: [0.6, 0.6] } }, LP.day())),
      Wt('kid', 1080, 900, 480, Object.assign({ hair: '#c07040', pose: 'sit', smile: 1, arms: { l: [-0.4, -0.3], r: [0.2, 0] } }, LP.day()))] }), t); } };
SHOT.F057 = { grade: 'vintage', cam: { z0: 1.0, z1: 1.1, f0: [960, 500] }, draw: (g, t) => vintageNight(g, t, { road: true, s: 1.1 }) };
SHOT.F058 = { cam: { z0: 1.0, z1: 1.08, f0: [900, 600] },
  draw: (g, t) => fieldScene(g, t, { tod: 'day', horizon: 560, fog: 0.15, nearH: 120, houseAt: [1620, 640, 380], stones: [[520, 800, 90], [640, 790, 70], [760, 812, 110], [900, 800, 60], [600, 860, 80]] }) };
SHOT.F059 = { grade: 'bw', cam: { z0: 1.0, z1: 1.06 }, draw: (g, t) => forestSearch(g, t) };
SHOT.F060 = { grade: 'vintage', cam: { z0: 1.05, z1: 1.2, f0: [900, 520] }, draw: (g, t) => vintageNight(g, t, { porch: true, s: 1.6, x: 1000 }) };
SHOT.F061 = { cam: { z0: 3.4, z1: 3.55, f0: [930, 600] },
  draw: (g, t) => brickHouse(g, t, { doorOpen: true, figures: [Wt('walterCoat', 890, 800, 250, Object.assign({ turn: 0.7, sad: true, smile: 0.3, arms: { l: [0.2, 0], r: [0.9, 0.2] } }, LP.soft(-1))),
    Wt('dorothy', 985, 790, 235, Object.assign({ turn: -0.7, tears: true, smile: 0.4, arms: { l: [-0.9, -0.1], r: [-0.6, -0.4] } }, LP.soft(-1)))] }) };
SHOT.V06 = { grade: 'warm', cam: { z0: 1.05, z1: 1.14, f0: [1200, 560] },
  draw: (g, t) => livingRoom(g, t, { winX: 1320, armchair: [1180, 900], dust: true, figures: [
    Wt('dorothy', 1180, 900, 640, Object.assign({ pose: 'sit', turn: 0.2, eyesClosed: t > 3, tears: t > 3, smile: 0.3, arms: { l: [0.2, 1.2], r: [-0.2, -1.2] }, rItem: 'photo' }, LP.soft(1))),
    Wt('walter', 900, 900, 780, Object.assign({ turn: 0.5, sad: true, smile: 0.1, arms: { l: [-0.1, 0], r: [lerp(0.3, 1.2, prog(t, 1, 3)), lerp(0, -0.4, prog(t, 1, 3))] } }, LP.soft(1)))] }) };

/* ======================= ACT 4 ======================= */
SHOT.F062 = { grade: 'warm', cam: { z0: 1.02, z1: 1.1 },
  draw: (g, t) => porchFront(g, t, { doorX: 1520, winX: 330, pumpkins: [[1280, 880, 60], [220, 880, 52], [640, 884, 46]], rail: false, figures: [
    Wt('scarecrow', 900, 880, 760, Object.assign({ turn: 0.3, smile: 0.9, arms: { l: [-0.2, 0], r: [1.0, 0.3] }, rItem: 'candy' }, LP.porch(1))),
    Wt('kid', 1180, 905, 420, Object.assign({ turn: -0.5, coat: '#2a2a2a', hat: 'witch', smile: 1, arms: { l: [-1.2, -0.2], r: [0.2, 0] }, lItem: 'bucket' }, LP.porch(-1))),
    Wt('kid', 1360, 910, 380, Object.assign({ turn: -0.5, coat: '#e8e8e8', smile: 1, arms: { l: [-0.3, 0], r: [0.2, 0] }, rItem: 'bucket' }, LP.porch(-1)))] }) };
SHOT.F063 = { grade: 'warm', cam: { z0: 1.03, z1: 1.14, f0: [800, 560] },
  draw: (g, t) => hallway(g, t, { doorX: 1150, chair: 780, figures: [Wt('scarecrow', 780, 905, 760, Object.assign({ pose: 'sit', coat: '#2d2c33', patches: false, turn: 0.4, smile: 0, arms: { l: [0.3, 0.6], r: [-0.3, -0.6] }, rItem: 'flashlight' }, LP.lamp(-1)))] }) };
SHOT.F064 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [960, 520] }, draw: (g, t) => fieldScene(g, t, { horizon: 600, moon: [1200, 200, 60], frost: true, fog: 0.4, lowFog: 800 }) };
SHOT.F065 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [900, 580] },
  draw: (g, t) => porchDoor(g, t, { lit: true, figures: [B(880, 905, 520)], front: [Wt('scarecrow', 1420, 1260, 1150, Object.assign({ view: 'back', arms: { l: [-0.3, 0.2], r: [0.3, 0] } }, LP.porch(-1, 0.6)))] }) };
SHOT.F066 = { grade: 'night', cam: { z0: 1.15, z1: 1.28, f0: [960, 640] },
  draw: (g, t) => porchDoor(g, t, { figures: [B(1110, 905, 520), Wt('scarecrow', 820, 930, 700, Object.assign({ pose: 'kneel', turn: 0.8, smile: 0.2, arms: { l: [0.9, 0.3], r: [0.4, 0.4] } }, LP.porch(-1)))] }) };
SHOT.V07 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [1000, 600] },
  draw: (g, t) => { const k = clamp(t / 8);
    fieldScene(g, t, { horizon: 580, frost: true, fog: 0.55, lowFog: 780, houseAt: [220, 640, 420], housePorch: 1,
      behind: [B(lerp(1040, 1160, k), lerp(840, 720, k), lerp(360, 250, k), Object.assign({ view: 'back', pose: 'walk', phase: t * 2.2 }, LP.moon(1)))],
      front: [Wt('scarecrow', lerp(760, 880, k), lerp(1030, 900, k), lerp(640, 520, k), Object.assign({ view: 'back', pose: 'walk', phase: t * 2, arms: { l: [-0.1, 0], r: [0.7, -0.2] }, rItem: 'flashlight' }, LP.moon(1)))],
      beams: [[lerp(760, 880, k) + 180 * lerp(640, 520, k) / 640, lerp(1030, 900, k) - 330 * lerp(640, 520, k) / 640, -1.2 + Math.sin(t * 1.5) * 0.08, 700, 0.12, 0.55]] }); } };
SHOT.F067 = { grade: 'night', cam: { z0: 1.0, z1: 1.06 },
  draw: (g, t) => fieldScene(g, t, { horizon: 560, fog: 0.8, lowFog: 760, frost: true,
    behind: [Wt('scarecrow', 900 + t * 3, 780, 300, Object.assign({ view: 'back', pose: 'walk', phase: t * 2 }, LP.moon(1))), B(1000 + t * 3, 782, 200, Object.assign({ view: 'back', pose: 'walk', phase: t * 2.4 }, LP.moon(1)))] }) };
SHOT.F068 = { cam: { z0: 1.0, z1: 1.1, f0: [900, 600] }, draw: (g, t) => cuFootprints(g, t) };
SHOT.F069 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [1000, 560] },
  draw: (g, t) => { fieldScene(g, t, { horizon: 560, fog: 1.0, lowFog: 700, moon: [1500, 150, 30], beams: [[200, 1080, -0.75, 1300, 0.18, 0.7]] });
    addGlow(g, 1060, 610, 70, 0.6 + 0.2 * Math.sin(t * 2)); fogBand(g, 600, 120, t, 0.8, 21, 10); } };
SHOT.F070 = { grade: 'night', cam: { z0: 1.05, z1: 1.14, f0: [960, 640] },
  draw: (g, t) => fieldScene(g, t, { horizon: 560, fog: 0.8, lowFog: 800, well: [960, 860, 0.9], behind: [B(990, 780, 320, LP.moon(1))] }) };
SHOT.F071 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [960, 640] },
  draw: (g, t) => fieldScene(g, t, { horizon: 420, frost: true, fog: 0.6, moon: false, well: [960, 960, 2.4], beams: [[200, 1100, -0.55, 1400, 0.2, 0.8]] }) };
SHOT.V08 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [900, 620] },
  draw: (g, t) => { const fade = prog(t, 3.2, 6.2);
    fieldScene(g, t, { horizon: 560, fog: 0.9, lowFog: 820, frost: true, well: [880, 860, 1.4],
      figures: [B(1180, 840, 380, Object.assign({ alpha: 1 - fade, arms: { l: [-0.15, 0.1], r: [lerp(0.2, -0.9, prog(t, 0.5, 2)), lerp(0, -0.5, prog(t, 0.5, 2))] }, rItem: fade > 0.6 ? null : 'pillowcase' }, LP.moon(-1)))],
      front: [Wt('scarecrow', 420, 1100, 760, Object.assign({ turn: 0.7, smile: 0, arms: { l: [-0.1, 0], r: [1.0, -0.2] }, rItem: 'flashlight' }, LP.moon(1)))],
      beams: [[560, 700, -0.05, 800, 0.12, 0.5]] });
    if (fade > 0) { g.save(); g.globalAlpha = fade; g.translate(900, 755); g.rotate(0.2); g.fillStyle = '#e8e2d2'; g.beginPath(); g.ellipse(0, 0, 70, 24, 0, 0, TAU); g.fill(); g.restore(); } } };
SHOT.F072 = { cam: { z0: 1.0, z1: 1.1 },
  draw: (g, t) => { g.fillStyle = '#0a0c12'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 7; k++) { g.save(); g.translate(k * 290 - 20, 0); g.rotate(0.02 * (k % 3 - 1)); g.fillStyle = mixHex('#7a7a7a', '#4a4a4c', hash1(k)); g.fillRect(0, -20, 270, H + 40); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; for (let j = 0; j < 6; j++) { g.beginPath(); g.moveTo(20 + j * 40, 0); g.bezierCurveTo(30 + j * 40, 300, 10 + j * 40, 700, 25 + j * 40, H); g.stroke(); } g.restore(); }
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(160,180,210,0.18)'; g.fillRect(0, 0, W, H); g.restore();
    g.save(); g.translate(1250, 600); g.rotate(0.35); pillowcaseOpen(g, 0, -250, 0.9, t); g.restore();
    g.save(); g.translate(720, 560); g.rotate(-0.25); drawMask(g, 0, 0, 230, 1000, {}); g.restore();
    fogBand(g, 200, 160, t, 0.35, 5, 8);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 900, 560, 150, 1100, [[0, 'rgba(255,245,225,1)'], [1, 'rgba(20,24,40,1)']]); g.fillRect(0, 0, W, H); g.restore(); } };
SHOT.F073 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 520] },
  draw: (g, t) => { g.fillStyle = '#0a0c12'; g.fillRect(0, 0, W, H); fogBand(g, 500, 300, t, 0.4, 3, 6);
    const tr = Math.sin(t * 23) * 3 + Math.sin(t * 17) * 2;
    g.save(); g.translate(tr, tr * 0.5); drawMask(g, 960, 500, 300, 1000, {});
    [[610, 640, -0.5], [1310, 640, 0.5]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#3a5474'; g.fillRect(-120, 80, 240, 400); ell(g, 0, 0, 110, 150, '#c9967a'); for (let k = 0; k < 4; k++) ell(g, (k - 1.5) * 45 * Math.sign(r), -140, 20, 50, '#c4917a'); g.restore(); });
    g.restore();
    g.fillStyle = 'rgba(200,215,235,0.4)'; for (let k = 0; k < 40; k++) ell(g, 760 + hash1(k) * 400, 300 + hash1(k * 2) * 400, 3, 4, 'rgba(210,225,245,0.5)');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 700, 300, 150, 1200, [[0, 'rgba(255,245,225,1)'], [1, 'rgba(20,24,40,1)']]); g.fillRect(0, 0, W, H); g.restore(); } };
SHOT.F074 = { grade: 'night', cam: { z0: 1.03, z1: 1.12, f0: [1000, 640] },
  draw: (g, t) => fieldScene(g, t, { horizon: 520, frost: true, fog: 0.7, lowFog: 820, well: [620, 880, 1.3],
    front: [Wt('scarecrow', 1180, 980, 640, Object.assign({ pose: 'sit', lean: 0.18, sad: true, eyesClosed: true, smile: -0.2, arms: { l: [0.3, 0.7], r: [-0.3, -0.7] }, rItem: 'mask' }, LP.moon(-1)))] }) };
SHOT.F075 = { cam: { z0: 1.0, z1: 1.08, f0: [1100, 560] },
  draw: (g, t) => fieldScene(g, t, { tod: 'sunrise', horizon: 600, sun: [1500, 520, 60], frost: true, fog: 0.6, houseAt: [1300, 660, 460], houseWin: [0, 0, 0, 0, 0],
    front: [Wt('scarecrow', 900 + t * 6, 980 - t * 4, 520, Object.assign({ view: 'back', pose: 'walk', phase: t * 1.6, arms: { l: [-0.1, 0], r: [0.2, 0] }, rItem: 'mask' }, { light: { x: 1, y: -0.3, c: 'rgba(255,200,130,0.5)', d: 'rgba(20,14,20,0.6)' } }))] }) };
SHOT.F076 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [900, 560] },
  draw: (g, t) => kitchen(g, t, { out: 'day', tableX: 900, tableY: 760, hanging: [900, 210], mask: [880, 720, 60],
    back: [Wt('sheriff', 900, 990, 800, Object.assign({ pose: 'sit', lean: 0.1, smile: 0, sad: true, arms: { l: [0.4, 0.8], r: [-0.4, -0.8] } }, LP.soft(1)))] }) };
SHOT.F077 = { cam: { z0: 1.0, z1: 1.06 },
  draw: (g, t) => wellDay(g, t, { trucks: true, lights: true, figures: [
    Wt('man', 680, 800, 420, Object.assign({ turn: 0.6, lean: 0.25, arms: { l: [1.0, 0.5], r: [0.8, 0.6] }, rItem: 'rope' }, LP.day())),
    Wt('man', 1240, 800, 430, Object.assign({ turn: -0.6, lean: -0.25, coat: '#5a4a3a', arms: { l: [-0.8, -0.6], r: [-1.0, -0.4] } }, LP.day())),
    Wt('sheriff', 1400, 760, 380, Object.assign({ turn: -0.4, arms: HANG }, LP.day())),
    Wt('man', 520, 740, 340, Object.assign({ turn: 0.4, coat: '#2a3a4a', arms: { l: [-0.2, 0], r: [0.6, 0.8] } }, LP.day()))] }) };
SHOT.F078 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 640] },
  draw: (g, t) => wellDay(g, t, { open: true, behind: [], figures: [[620, 760, 380], [820, 730, 330], [1100, 730, 330], [1310, 760, 380], [540, 860, 440], [1400, 870, 450]].map(([x, y, h], i) =>
    Wt(i === 3 ? 'sheriff' : 'man', x, y, h, Object.assign({ hat: null, turn: x < 960 ? 0.5 : -0.5, lean: x < 960 ? 0.12 : -0.12, sad: true, eyesClosed: true, coat: ['#3c3a36', '#5a4a3a', '#2a3a4a', '#a88c62', '#4a3a2e', '#3a4a3a'][i], arms: { l: [0.4, 0.5], r: [-0.4, -0.5] }, rItem: 'hat' }, LP.day()))) }) };
SHOT.F079 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 520] }, draw: (g, t) => cuBag(g, t) };

/* ======================= ACT 5 ======================= */
const DOT = e => Object.assign({ who: 'dorothy', coat: '#1c1c24' }, e);
SHOT.F080 = { cam: { z0: 1.0, z1: 1.08 }, draw: (g, t) => cemetery(g, t, { figures: [[800, 760, 250], [870, 770, 240], [940, 765, 260], [1010, 770, 235], [1080, 760, 250], [1150, 772, 230]].map(([x, y, h], i) => Wt(['man', 'woman', 'walterCoat', 'dorothy', 'man', 'woman'][i], x, y, h, Object.assign({ view: 'back', coat: ['#1c1c20', '#26262e', '#2d2c33', '#1c1c24', '#2a2420', '#202028'][i] }, LP.soft(1)))) }) };
SHOT.F081 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 600] },
  draw: (g, t) => cemetery(g, t, { path: true, figures: [Wt('walterCoat', 900 + t * 2, 960 - t * 4, 560, Object.assign({ view: 'back', pose: 'walk', phase: t * 1.5, arms: { l: [-0.1, 0], r: [0.5, -0.3] } }, LP.soft(1))), Wt('dorothy', 1060 + t * 2, 962 - t * 4, 520, Object.assign({ view: 'back', coat: '#1c1c24', pose: 'walk', phase: t * 1.5 + 3, arms: { l: [-0.5, 0.3], r: [0.1, 0] } }, LP.soft(1)))] }) };
SHOT.F082 = { cam: { z0: 1.0, z1: 1.08, f0: [900, 500] },
  draw: (g, t) => cemetery(g, t, { figures: [Wt('walterCoat', 820, 1500, 1200, Object.assign({ turn: 0.2, sad: true, smile: 0, arms: { l: [0.55, 1.0], r: [-0.55, -1.0] }, rItem: 'mask' }, LP.soft(1))), Wt('dorothy', 1300, 1520, 1120, DOT(Object.assign({ turn: -0.4, sad: true, smile: 0.1, arms: HANG }, LP.soft(1))))] }) };
SHOT.F083 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 480] },
  draw: (g, t) => cemetery(g, t, { figures: [Wt('walterCoat', 870, 1400, 1150, Object.assign({ turn: 0.5, tears: true, eyesClosed: true, smile: 0.2, arms: { l: [-0.2, 0], r: [1.2, 0.9] } }, LP.soft(1))), Wt('dorothy', 1080, 1420, 1080, DOT(Object.assign({ turn: -0.6, tears: true, eyesClosed: true, smile: 0.2, arms: { l: [-1.3, -0.8], r: [-0.8, -0.9] } }, LP.soft(1))))] }) };
SHOT.V09 = { cam: { z0: 1.05, z1: 1.12, f0: [1000, 640] },
  draw: (g, t) => { cemetery(g, t, { clear: 1100 });
    const hx = 1180, hy = 960; g.fillStyle = '#eceae4'; g.beginPath(); g.moveTo(hx - 150, hy); g.lineTo(hx - 150, hy - 260); g.quadraticCurveTo(hx, hy - 360, hx + 150, hy - 260); g.lineTo(hx + 150, hy); g.fill(); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(hx + 110, hy - 270, 40, 270);
    [[-80, -250, 0.5], [60, -290, -0.3], [100, -200, 1.2]].forEach(([dx, dy, r]) => { g.save(); g.translate(hx + dx, hy + dy); g.rotate(r); ell(g, 0, 0, 26, 14, '#b8301a'); g.restore(); });
    const reach = prog(t, 1, 3);
    if (t > 3) { g.save(); g.translate(hx - 10, hy - 330); g.rotate(-0.05); g.fillStyle = '#4a2414'; g.fillRect(-60, -18, 120, 36); g.fillStyle = '#8a1c1c'; g.fillRect(-20, -18, 40, 36); g.restore(); }
    person(g, 860, 1000, 760, Object.assign({ who: 'walterCoat', pose: 'kneel', turn: 0.8, sad: true, smile: 0.1, arms: { l: [0.3, 0.2], r: [lerp(0.6, 1.9, reach), lerp(0.4, -0.3, reach)] }, rItem: t < 3 ? 'candy' : null }, LP.soft(1))); } };
SHOT.F084 = { grade: 'warm', cam: { z0: 1.03, z1: 1.13, f0: [800, 560] },
  draw: (g, t) => hallway(g, t, { doorX: 1150, chair: 780, clock: [1560, 300, 90], figures: [Wt('scarecrow', 780, 905, 760, Object.assign({ pose: 'sit', turn: 0.6, smile: 0.1, arms: { l: [0.3, 0.5], r: [-0.3, -0.5] }, rItem: 'bowl' }, LP.lamp(-1)))] }) };
SHOT.F085 = { cam: { z0: 1.0, z1: 1.18, f0: [960, 420] }, draw: (g, t) => cuClock(g, t, { time: [11, 48], door: true }) };
SHOT.F086 = { grade: 'night', cam: { z0: 1.03, z1: 1.12, f0: [1200, 480] },
  draw: (g, t) => livingRoom(g, t, { night: true, out: 'field', winX: 1250, wall: '#4a3e36', figures: [Wt('scarecrow', 1100, 960, 820, Object.assign({ view: 'back', arms: { l: [-0.1, 0], r: [0.1, 0] } }, LP.moon(1)))] }) };
SHOT.F087 = { grade: 'warm', cam: { z0: 1.02, z1: 1.1 },
  draw: (g, t) => porchFront(g, t, { doorX: 1560, winX: 300, pumpkins: [[1300, 880, 60], [180, 880, 56], [560, 884, 46]], rail: false, figures: [
    Wt('kid', 640, 905, 420, Object.assign({ turn: 0.5, coat: '#8a2a2a', hat: 'campaign', smile: 1, arms: { l: [-0.2, 0], r: [2.4, 0.3] } }, LP.porch(1))),
    Wt('scarecrow', 900, 880, 760, Object.assign({ turn: 0, smile: 1, eyesClosed: true, arms: { l: [-1.0, -0.4], r: [1.0, 0.4] } }, LP.porch(1))),
    Wt('kid', 1140, 905, 400, Object.assign({ turn: -0.5, coat: '#e8e8e8', smile: 1, arms: { l: wave(t), r: [0.2, 0] } }, LP.porch(-1))),
    Wt('girl', 1320, 910, 380, Object.assign({ turn: -0.5, smile: 1, arms: { l: [-0.3, 0], r: [0.3, 0] }, rItem: 'bucket' }, LP.porch(-1)))] }) };
SHOT.F088 = { cam: { z0: 1.02, z1: 1.1, f0: [1200, 520] },
  draw: (g, t) => { livingRoom(g, t, { winX: 1320, armchair: [1000, 900], side: [1380, 700], curtain: true, dust: true });
    ell(g, 1380, 695, 100, 24, '#a8833f'); g.fillStyle = '#c29c55'; g.beginPath(); g.moveTo(1330, 695); g.quadraticCurveTo(1330, 640, 1380, 640); g.quadraticCurveTo(1430, 640, 1430, 695); g.fill(); } };
SHOT.F089 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 600] },
  draw: (g, t) => church(g, t, { blossom: true, x: 1200, s: 0.9, figures: [[380, 900, 380], [520, 920, 400], [660, 890, 360], [800, 930, 420], [940, 900, 370], [1480, 920, 400], [1620, 900, 380], [1760, 930, 420], [300, 980, 460], [1080, 990, 470]].map(([x, y, h], i) =>
    Wt(['man', 'woman', 'kid', 'neighbor', 'man', 'woman', 'man', 'woman', 'man', 'woman'][i], x, y, h, Object.assign({ turn: (i % 2 ? -0.3 : 0.3), coat: ['#1c1c20', '#26262e', '#2d2c33', '#202028', '#2a2420'][i % 5], smile: i % 3 === 0 ? 0.6 : 0.1, tears: i % 4 === 1 }, LP.day()))) }) };
SHOT.F090 = { cam: { z0: 1.0, z1: 1.1, f0: [1000, 600] }, draw: (g, t) => cuHatSteps(g, t) };
SHOT.F091 = { cam: { z0: 1.0, z1: 1.08 },
  draw: (g, t) => { houseExt(g, t, { tod: 'summer', season: 'summer', x: 1100, s: 760, horizon: 720, clouds: 4 });
    g.fillStyle = '#e8e8e4'; g.fillRect(180, 640, 560, 280); g.fillStyle = '#c85a2a'; g.fillRect(180, 700, 560, 40); g.fillStyle = '#d8d8d4'; g.fillRect(740, 740, 180, 180); g.fillStyle = '#6a8aa8'; g.fillRect(760, 760, 130, 70); ell(g, 300, 930, 45, 45, '#1a1a1a'); ell(g, 820, 930, 45, 45, '#1a1a1a');
    g.fillStyle = '#b89a6a'; g.fillRect(560, 820, 90, 70); g.fillRect(420, 830, 80, 60);
    person(g, 620, 960, 520, Object.assign({ who: 'elena', turn: 0.5, smile: 1, arms: { l: [0.9, 0.7], r: [0.6, 0.9] } }, LP.day()));
    person(g, 780 + t * 25, 980, 300, Object.assign({ who: 'girl', hat: null, coat: '#e86a8a', pants: '#3a4a8a', pose: 'walk', phase: t * 6, smile: 1, arms: { l: [-1.8, 0.3], r: [1.8, -0.3] } }, LP.day())); } };
SHOT.F092 = { cam: { z0: 1.0, z1: 1.08, f0: [900, 600] },
  draw: (g, t) => { fieldScene(g, t, { tod: 'summer', horizon: 540, moon: false, sun: [300, 300, 60], fog: 0.1, nearH: 110, houseAt: [1600, 600, 360], houseWin: [0, 0, 0, 0, 0],
    front: [Wt('girl', 820 + Math.sin(t * 0.8) * 120, 900, 380, Object.assign({ hat: null, coat: '#e86a8a', pants: '#3a4a8a', pose: 'walk', phase: t * 5, smile: 1, arms: { l: [-2.4 + Math.sin(t * 3) * 0.3, 0.2], r: [2.4 - Math.sin(t * 3) * 0.3, -0.2] } }, LP.day(-1)))] });
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, 300, 300, 50, 1500, [[0, 'rgba(255,220,150,0.35)'], [1, 'rgba(255,220,150,0)']]); g.fillRect(0, 0, W, H); g.restore(); } };
SHOT.F093 = { cam: { z0: 1.0, z1: 1.08 },
  draw: (g, t) => { houseExt(g, t, { tod: 'summer', season: 'summer', x: 1400, s: 600, horizon: 700, houseOn: true });
    person(g, 700, 980, 680, Object.assign({ who: 'neighbor', turn: 0.6, smile: 1, arms: { l: [-0.1, 0], r: [0.6, 0.8] } }, LP.day(1)));
    person(g, 1120, 990, 700, Object.assign({ who: 'elena', turn: -0.6, smile: 1, arms: HANG }, LP.day(1)));
    g.fillStyle = '#f4f2ec'; g.fillRect(0, 860, W, 22); g.fillRect(0, 960, W, 22); for (let x = 10; x < W; x += 70) { poly(g, [[x, 1080], [x, 840], [x + 20, 815], [x + 40, 840], [x + 40, 1080]]); g.fill(); }
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,225,180,1)'; g.fillRect(0, 0, W, H); g.restore(); } };
SHOT.F094 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 600] },
  draw: (g, t) => houseExt(g, t, { tod: 'dusk', x: 960, s: 900, horizon: 760, windows: [0.7, 0.9, 0, 0.9, 0.8], pumpkins: [[-420, 0, 46], [-340, 0, 50], [-260, 0, 44], [-180, 0, 52], [-100, -10, 40], [110, -10, 42], [190, 0, 50], [270, 0, 46], [350, 0, 52], [430, 0, 44], [-60, -330, 34], [60, -330, 34]],
    figures: [Wt('girl', 960, 930, 150, Object.assign({ smile: 1, arms: { l: [-0.3, 0], r: [0.3, 0] }, rItem: 'bucket' }, LP.porch(1)))], trees: [[120, 800, 560], [1800, 820, 620]] }) };
SHOT.F095 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [960, 640] },
  draw: (g, t) => { livingRoom(g, t, { night: true, out: 'night', winX: 1500, sofa: [900, 900], lamp: [260, 560] });
    g.save(); g.translate(1180, 740); g.rotate(-Math.PI / 2); person(g, 0, 0, 700, Object.assign({ who: 'girl', hat: null, eyesClosed: true, smile: 0.3, arms: { l: [-0.3, 0.8], r: [0.4, -0.6] } }, LP.lamp(1))); g.restore();
    g.save(); g.translate(1320, 700); g.rotate(-0.4); g.fillStyle = '#1a1024'; ell(g, 0, 20, 140, 30, '#1a1024'); poly(g, [[-70, 10], [70, 10], [30, -170]]); g.fill(); g.restore();
    drawItem(g, 'bucket', 1330, 800, 900, 0, {}); } };
SHOT.F096 = { grade: 'warm', cam: { z0: 1.03, z1: 1.12, f0: [900, 520] },
  draw: (g, t) => kitchen(g, t, { out: 'night', clock: [520, 300, 80], table: false, hanging: [960, 200],
    figures: [Wt('elena', 1000, 960, 820, Object.assign({ turn: -0.8, smile: 0, arms: { l: [-0.3, -0.3], r: [0.4, 0.6] }, rItem: 'towel' }, LP.lamp(1)))] }) };
SHOT.V10 = { grade: 'night', cam: { z0: 1.0, z1: 1.1, f0: [960, 560] },
  draw: (g, t) => porchDoor(g, t, { door: Ease.inOutSine(clamp(t / 2.2)), figures: [
    Wt('scarecrow', 1160, 915, 800, Object.assign({ shadowFace: true, arms: { l: [lerp(-0.1, -0.9, prog(t, 3, 5.5)), lerp(0, -0.5, prog(t, 3, 5.5))], r: [0.1, 0] } }, LP.porch(-1))),
    B(880, 905, 520, { arms: { l: [-0.12, 0.1], r: [lerp(0.3, 0.8, prog(t, 2.2, 4)), lerp(-0.1, -0.4, prog(t, 2.2, 4))] } })] }) };
SHOT.F097 = { cam: { z0: 1.0, z1: 1.12, f0: [960, 420] }, draw: (g, t) => cuCollar(g, t) };
SHOT.F098 = { cam: { z0: 1.0, z1: 1.1 }, draw: (g, t) => cuHands(g, t) };
SHOT.F099 = { grade: 'night', cam: { z0: 1.03, z1: 1.1, f0: [1000, 600] },
  draw: (g, t) => porchDoor(g, t, { figures: [Wt('scarecrow', 1060, 915, 800, Object.assign({ shadowFace: true, arms: { l: [-0.9, -0.5], r: [0.1, 0] } }, LP.porch(-1))), B(820, 905, 520)],
    front: [Wt('elena', 1560, 1300, 1100, Object.assign({ view: 'back', lean: -0.1, arms: { l: [-1.0, -0.4], r: [0.2, 0] }, lItem: 'candy' }, LP.porch(-1, 0.8)))] }) };
SHOT.F100 = { grade: 'night', cam: { z0: 1.02, z1: 1.1, f0: [900, 540] },
  draw: (g, t) => porchFront(g, t, { doorX: 1500, winX: 300, pumpkins: [[1250, 880, 60], [560, 882, 52], [420, 885, 44]], rail: false, figures: [
    Wt('scarecrow', 880, 880, 800, Object.assign({ shadowFace: true, arms: { l: [-0.1, 0], r: [lerp(0.4, 2.9, prog(t, 1, 2.5)), lerp(0, 0.7, prog(t, 1, 2.5))] } }, LP.porch(1))), B(1080, 882, 520, LP.porch(1))] }) };
SHOT.V11 = { grade: 'night', cam: { z0: 1.0, z1: 1.05 },
  draw: (g, t) => { const k = clamp(t / 7), a = 1 - prog(t, 3.8, 6.5);
    fieldScene(g, t, { horizon: 560, fog: 0.8, lowFog: 780,
      behind: [Wt('scarecrow', lerp(900, 980, k), lerp(900, 740, k), lerp(560, 330, k), Object.assign({ view: 'back', pose: 'walk', phase: t * 1.8, alpha: a, arms: { l: [-0.1, 0], r: [0.5, 0] } }, LP.moon(1))),
        B(lerp(1030, 1060, k), lerp(902, 742, k), lerp(380, 225, k), Object.assign({ view: 'back', pose: 'walk', phase: t * 2.2, alpha: a, rItem: 'pillowcase', arms: { l: [-0.5, 0], r: [0.2, 0] } }, LP.moon(1)))] });
    g.fillStyle = '#1e160f'; g.fillRect(0, 990, W, 90); g.fillStyle = '#0c0a08'; g.fillRect(0, 0, 80, H); g.fillRect(W - 80, 0, 80, H); addGlow(g, 160, 380, 500, 0.4); } };
SHOT.F101 = { cam: { z0: 1.0, z1: 1.1, f0: [960, 560] }, draw: (g, t) => cuWrappers(g, t) };
SHOT.F102 = { cam: { z0: 1.02, z1: 1.1 },
  draw: (g, t) => porchFront(g, t, { tod: 'day', doorX: 1560, winX: 330, rail: false, figures: [
    Wt('neighbor', 840, 880, 700, Object.assign({ turn: 0.5, smile: 1, eyesClosed: true, tears: true, arms: { l: [-0.2, 0], r: [2.5, 1.0] } }, LP.day())),
    Wt('elena', 1120, 885, 740, Object.assign({ turn: -0.4, smile: 0.8, arms: { l: [-0.5, -0.9], r: [0.1, 0] }, lItem: 'paper' }, LP.day()))] }) };
SHOT.F103 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [960, 560] },
  draw: (g, t) => houseExt(g, t, { x: 960, s: 860, horizon: 760, moon: [1500, 170, 32], windows: [0, 0.8, 0, 0.9, 0.6], pumpkins: [[-120, 0, 50], [120, 0, 46], [-200, -10, 40], [220, -10, 42], [-60, -330, 30]], fog: 0.7, trees: [[120, 800, 560], [1800, 820, 620]] }) };
SHOT.F104 = { grade: 'night', cam: { z0: 1.04, z1: 1.12, f0: [760, 520] },
  draw: (g, t) => { porchFront(g, t, { swing: 760, doorX: 1420, winX: 250, rail: false, pumpkins: [[1180, 880, 60], [1320, 885, 50]],
    figures: [Wt('elena', 700, 862, 700, Object.assign({ pose: 'sit', turn: 0.3, smile: 0.3, arms: { l: [0.4, 0.7], r: [-0.4, -0.7] } }, LP.porch(1)))] });
    g.fillStyle = '#8a3a3a'; poly(g, [[620, 560], [780, 560], [820, 820], [580, 820]]); g.fill(); g.strokeStyle = 'rgba(230,200,150,0.4)'; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(600 + k * 55, 570); g.lineTo(590 + k * 65, 815); g.stroke(); }
    drawItem(g, 'bowl', 930, 640, 700, 0, {}); } };
SHOT.F105 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 480] },
  draw: (g, t) => { if (!PH) { PH = document.createElement('canvas'); PH.width = W; PH.height = H; }
    const pg = PH.getContext('2d'); pg.setTransform(1, 0, 0, 1, 0, 0);
    porchDoor(pg, t, { figures: [Wt('scarecrow', 1080, 915, 800, Object.assign({ shadowFace: true }, LP.porch(-1))), B(840, 905, 520)] });
    g.fillStyle = '#1e140f'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 8; g.strokeRect(380, 680, 1160, 340);
    g.save(); g.beginPath(); g.rect(560, 150, 800, 420); g.clip(); g.drawImage(PH, 560 - 260, 150 - 200, W * 1.1, H * 1.1); g.fillStyle = 'rgba(255,220,170,0.08)'; g.fillRect(560, 150, 800, 420); g.restore();
    g.strokeStyle = '#140d0a'; g.lineWidth = 24; g.strokeRect(548, 138, 824, 444); g.lineWidth = 10; g.beginPath(); g.moveTo(960, 150); g.lineTo(960, 570); g.stroke(); addGlow(g, 960, 360, 500, 0.2); } };
SHOT.F106 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [960, 600] },
  draw: (g, t) => { fieldScene(g, t, { horizon: 520, fog: 0.6, houseAt: null,
    front: [Wt('scarecrow', 1120, 1000, 640, Object.assign({ shadowFace: true, arms: { l: [-0.1, 0], r: [2.8, 0.7] } }, LP.porch(-1))), B(860, 1000, 400, { arms: { l: [-0.15, 0.1], r: wave(t) }, rItem: null, lItem: 'pillowcase' })] });
    for (let k = 0; k < 3; k++) { g.fillStyle = mixHex('#3a2a1e', '#1a120c', k / 3); g.fillRect(0, 1040 - k * 26, W, 26); }
    jackOLantern(g, 300, 1060, 90, t, { seed: 2 }); jackOLantern(g, 1650, 1062, 80, t, { seed: 5 }); } };
SHOT.F107 = { grade: 'night', cam: { z0: 1.0, z1: 1.08, f0: [960, 560] }, draw: (g, t) => street(g, t) };
SHOT.F108 = { grade: 'night', cam: { z0: 1.0, z1: 1.12, f0: [960, 620] },
  draw: (g, t) => roadNight(g, t, { figures: [Wt('scarecrow', 950 + t * 1.5, 700, 110, Object.assign({ view: 'back', pose: 'walk', phase: t * 2 }, LP.moon(1))), B(985 + t * 1.5, 701, 72, Object.assign({ view: 'back', pose: 'walk', phase: t * 2.4 }, LP.moon(1)))] }) };
SHOT.F109 = { cam: { z0: 1.0, z1: 1.08, f0: [960, 540] }, draw: (g, t) => cuModernDoor(g, t) };
SHOT.V12 = { grade: 'night', cam: { z0: 1.0, z1: 1.05, f0: [960, 560] },
  draw: (g, t) => { const fl = t > 4 && t < 4.4 ? 0.3 : 1;
    houseExt(g, t, { x: 520, s: 900, horizon: 700, moon: [1500, 150, 34], windows: [0, 0.8, 0, 0.9, 0.6], porchLight: fl, pumpkins: [[-120, 0, 52], [120, 0, 48], [-220, -10, 40], [230, -10, 44]], fog: 0.7, trees: [[1880, 760, 500]],
      ghosts: [Wt('scarecrow', 1380, 760, 300, Object.assign({ shadowFace: true, alpha: 0.85, arms: { l: [-0.1, 0], r: wave(t, 0.6) } }, LP.moon(-1))), B(1480, 762, 200, Object.assign({ alpha: 0.85, arms: { l: wave(t, 0.6).map((v, i) => i ? v : -v), r: [0.3, 0] }, rItem: null }, LP.moon(-1)))] }); } };
SHOT.F110 = { cam: { z0: 1.0, z1: 1.1, f0: [900, 600] },
  draw: (g, t) => { g.fillStyle = '#07070a'; g.fillRect(0, 0, W, H); boards(g, 380, H, '#4a3626');
    g.fillStyle = '#3a2a1e'; g.fillRect(0, 700, W, 30);
    jackOLantern(g, 1400, 880, 320, t, { seed: 6 });
    g.save(); g.translate(760, 820); g.rotate(-0.15); g.fillStyle = '#e8e2d2'; g.beginPath(); g.moveTo(-380, -120); g.quadraticCurveTo(0, -170, 380, -110); g.quadraticCurveTo(420, 0, 380, 120); g.quadraticCurveTo(0, 160, -380, 110); g.closePath(); g.fill();
    g.fillStyle = '#0a0808'; ell(g, 360, 0, 40, 110, '#0a0808'); g.fillStyle = '#4a2414'; g.fillRect(250, -40, 180, 80); g.fillStyle = '#8a1c1c'; g.fillRect(300, -40, 60, 80); g.restore();
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = rad(g, 1300, 700, 150, 1400, [[0, 'rgba(255,230,190,1)'], [1, 'rgba(30,24,40,1)']]); g.fillRect(0, 0, W, H); g.restore(); } };
SHOT.F111 = { grade: 'night', cam: { z0: 1.0, z1: 1.06, f0: [960, 640] },
  draw: (g, t) => houseExt(g, t, { x: 700, s: 620, horizon: 860, moon: [1560, 260, 36], windows: [0, 0.8, 0, 0.9, 0.6], pumpkins: [[-120, 0, 52], [120, 0, 48], [-200, -10, 40], [220, -10, 44]], fog: 0.8, trees: [[140, 900, 420], [1260, 890, 360]],
    ghosts: [Wt('scarecrow', 1480, 900, 170, Object.assign({ shadowFace: true, alpha: 0.6 }, LP.moon(-1))), B(1535, 901, 112, Object.assign({ alpha: 0.6, rItem: 'pillowcase' }, LP.moon(-1)))] }) };
