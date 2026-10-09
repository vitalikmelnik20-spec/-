// Original vector "plates" of Olympia, WA (no stock footage is reachable from this environment, so every
// location is illustrated): the Capitol dome over Capitol Lake, the downtown waterfront, an apartment street,
// a single-family home, and a local street for the bus. Each plate is layered for parallax camera moves.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from './theme';

export type Cam = { x: number; y: number; z: number };
const Layer: React.FC<{ d: number; cam: Cam; children: React.ReactNode }> = ({ d, cam, children }) => (
  <g transform={`translate(540 960) scale(${1 + (cam.z - 1) * d}) translate(${-540 - cam.x * d} ${-960 - cam.y * d})`}>{children}</g>
);

/** jagged evergreen silhouette */
export const fir = (x: number, base: number, h: number, w: number) => {
  const tiers = 6, pts: string[] = [`${x},${base - h}`];
  for (let i = 1; i <= tiers; i++) {
    const y = base - h + (h * 0.92 * i) / tiers, half = (w / 2) * (0.25 + 0.75 * (i / tiers));
    pts.push(`${x + half},${y}`, `${x + half * 0.45},${y - h * 0.035}`);
  }
  pts.push(`${x + w * 0.06},${base - h * 0.08}`, `${x + w * 0.06},${base}`, `${x - w * 0.06},${base}`, `${x - w * 0.06},${base - h * 0.08}`);
  for (let i = tiers; i >= 1; i--) {
    const y = base - h + (h * 0.92 * i) / tiers, half = (w / 2) * (0.25 + 0.75 * (i / tiers));
    pts.push(`${x - half * 0.45},${y - h * 0.035}`, `${x - half},${y}`);
  }
  return `M${pts.join(' L')} Z`;
};
const Firs: React.FC<{ items: [number, number, number, number][]; fill: string; opacity?: number }> = ({ items, fill, opacity = 1 }) => (
  <g fill={fill} opacity={opacity}>{items.map(([x, b, h, w], i) => <path key={i} d={fir(x, b, h, w)} />)}</g>
);
const ridge = (y: number, amp: number, seed: number) => {
  let d = `M-400 ${y}`;
  for (let x = -400; x <= 1480; x += 40) d += ` L${x} ${y - amp * (0.5 + 0.5 * Math.sin(x * 0.011 + seed) * Math.cos(x * 0.004 + seed * 2))}`;
  return d + ` L1480 2400 L-400 2400 Z`;
};
const SkyDefs: React.FC<{ id: string; warm?: number }> = ({ id, warm = 1 }) => (
  <defs>
    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#081227" />
      <stop offset="0.38" stopColor="#173253" />
      <stop offset="0.53" stopColor="#4F6F8C" />
      <stop offset="0.6" stopColor={warm ? '#C99A86' : '#7C93A8'} />
      <stop offset="0.66" stopColor="#E3B892" />
    </linearGradient>
    <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#53708C" />
      <stop offset="0.25" stopColor="#24405E" />
      <stop offset="1" stopColor="#081227" />
    </linearGradient>
    <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FF9C6E" stopOpacity="0.55" />
      <stop offset="1" stopColor="#FF9C6E" stopOpacity="0" />
    </radialGradient>
    <linearGradient id={`${id}-dome`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFF6E8" />
      <stop offset="0.55" stopColor="#D9D2C4" />
      <stop offset="1" stopColor="#8E8A86" />
    </linearGradient>
    <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="3" /></filter>
    <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="14" /></filter>
  </defs>
);
const Ripples: React.FC<{ y0: number; y1: number; seed?: number; color?: string }> = ({ y0, y1, seed = 1, color = '#BFD3E6' }) => {
  const frame = useCurrentFrame();
  const lines = [];
  for (let i = 0; i < 46; i++) {
    const u = i / 46, y = y0 + (y1 - y0) * u * u;
    const x = ((i * 337 * seed + frame * (0.6 + u * 1.4)) % 1300) - 160;
    lines.push(<rect key={i} x={x} y={y} width={60 + 220 * u} height={1.5 + 3 * u} rx={2} fill={color} opacity={0.08 + 0.1 * (1 - u)} />);
  }
  return <g>{lines}</g>;
};
const Mist: React.FC<{ y: number; opacity?: number; speed?: number }> = ({ y, opacity = 0.28, speed = 0.4 }) => {
  const frame = useCurrentFrame();
  return (
    <g opacity={opacity} filter="url(#cap-soft)">
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((i * 420 + frame * speed) % 1700) - 300} cy={y + (i % 2) * 26} rx={360} ry={38} fill="#DCE6EF" />)}
    </g>
  );
};

/* ---------------- Washington State Capitol (Legislative Building) ---------------- */
export const CapitolBuilding: React.FC<{ fillId?: string }> = ({ fillId = 'cap-dome' }) => {
  const stone = '#E6E0D3', shade = '#B9B2A5', lit = '#FFD08A';
  const wingWin = [];
  for (let x = 268; x <= 812; x += 26) {
    if (x > 418 && x < 662) continue;
    for (const [y, h] of [[992, 28], [1036, 32]] as const) wingWin.push(<rect key={`${x}-${y}`} x={x} y={y} width={11} height={h} rx={1.5} fill={lit} opacity={((x * 7 + y) % 5) / 8 + 0.35} />);
  }
  return (
    <g>
      {/* wings */}
      <rect x={244} y={962} width={592} height={16} fill={stone} />
      <rect x={252} y={976} width={576} height={104} fill={stone} />
      <rect x={252} y={976} width={576} height={104} fill={shade} opacity={0.25} />
      {wingWin}
      {/* central portico */}
      <rect x={426} y={940} width={228} height={140} fill={stone} />
      <polygon points="414,958 540,912 666,958" fill={stone} />
      <polygon points="434,953 540,920 646,953" fill={shade} opacity={0.5} />
      <rect x={414} y={954} width={252} height={12} fill="#F3EEE4" />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={437 + i * 28} y={968} width={11} height={112} fill="#FBF8F1" />)}
      {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={450 + i * 28} y={985} width={13} height={80} fill={lit} opacity={0.55} />)}
      {/* steps */}
      <polygon points="410,1080 670,1080 700,1104 380,1104" fill="#D3CCBE" />
      {/* drum */}
      <rect x={440} y={892} width={200} height={22} fill={stone} />
      <rect x={456} y={806} width={168} height={88} fill={shade} />
      {Array.from({ length: 13 }).map((_, i) => <rect key={i} x={459 + i * 13} y={812} width={6.5} height={80} fill="#FBF8F1" />)}
      <rect x={448} y={796} width={184} height={14} fill="#F3EEE4" />
      <rect x={466} y={776} width={148} height={22} fill={stone} />
      {/* dome */}
      <path d="M468 780 C468 704 500 652 540 646 C580 652 612 704 612 780 Z" fill={`url(#${fillId})`} />
      {[-48, -26, -8, 8, 26, 48].map((dx) => <path key={dx} d={`M${540 + dx * 1.45} 780 Q${540 + dx * 1.2} 700 ${540 + dx * 0.15} 650`} stroke="#9C968C" strokeWidth={2} fill="none" opacity={0.6} />)}
      {/* lantern */}
      <rect x={524} y={606} width={32} height={44} fill={stone} />
      {[0, 1, 2].map((i) => <rect key={i} x={528 + i * 10} y={612} width={4} height={34} fill={lit} opacity={0.7} />)}
      <ellipse cx={540} cy={606} rx={20} ry={11} fill="#EDE7DB" />
      <rect x={538.5} y={570} width={3} height={30} fill="#D9D2C4" />
      <circle cx={540} cy={568} r={4.5} fill="#F1E3C4" />
    </g>
  );
};

export const CapitolPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <SkyDefs id="cap" />
        <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#cap-sky)" /></Layer>
        <Layer d={0.25} cam={cam}>
          <circle cx={540} cy={930} r={420} fill="url(#cap-glow)" />
          {/* Mount Rainier, far away */}
          <path d="M520 1000 L700 860 L760 800 L790 770 L812 760 L840 772 L880 806 L960 880 L1180 1000 Z" fill="#8297AE" opacity={0.85} />
          <path d="M760 800 L790 770 L812 760 L840 772 L880 806 L858 812 L836 798 L816 812 L796 800 L778 812 Z" fill="#EEF2F6" />
        </Layer>
        <Layer d={0.45} cam={cam}>
          <path d={ridge(1010, 40, 1)} fill="#2C5468" opacity={0.9} />
          <Mist y={1000} opacity={0.22} />
        </Layer>
        <Layer d={0.6} cam={cam}>
          <path d={ridge(1060, 46, 3)} fill="#1C4339" />
          <Firs fill="#173B31" items={Array.from({ length: 26 }).map((_, i) => [-140 + i * 52 + ((i * 37) % 23), 1080, 90 + ((i * 53) % 60), 46] as [number, number, number, number])} />
        </Layer>
        <Layer d={0.8} cam={cam}>
          {/* hill + building */}
          <path d="M-200 1160 L-200 1100 Q540 1060 1280 1100 L1280 1160 Z" fill="#244D3B" />
          <CapitolBuilding />
          <Firs fill="#10342A" items={[[214, 1110, 210, 92], [262, 1112, 150, 72], [868, 1112, 200, 90], [818, 1114, 140, 66], [120, 1130, 260, 110], [960, 1130, 250, 108]]} />
          {/* lake */}
          <rect x={-300} y={1150} width={1700} height={1000} fill="url(#cap-water)" />
          <g transform="translate(0 2300) scale(1 -1)" opacity={0.3} filter="url(#cap-blur)">
            <CapitolBuilding />
          </g>
          <rect x={-300} y={1150} width={1700} height={8} fill="#E9C9A6" opacity={0.25} />
          <Ripples y0={1160} y1={1920} />
        </Layer>
        <Layer d={1.2} cam={cam}>
          <Firs fill="#06170F" items={[[-30, 1990, 760, 300], [70, 2040, 560, 230], [1110, 1990, 760, 300], [1010, 2040, 560, 230]]} />
        </Layer>
        <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
        <rect width={1080} height={1920} fill={`rgba(255,255,255,${0.012 * Math.sin(frame / 7)})`} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- downtown waterfront (boardwalk + marina, dome on the hill) ---------------- */
export const WaterfrontPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => {
  const bld: [number, number, number, string][] = [
    [-120, 150, 250, '#7E5546'], [40, 120, 330, '#B9A68A'], [170, 140, 210, '#5D6E80'], [320, 110, 280, '#8C5A4A'],
    [440, 160, 190, '#A69684'], [610, 120, 310, '#506273'], [740, 150, 230, '#9A6B55'], [900, 130, 270, '#B7AA95'], [1040, 160, 200, '#6A5A50'],
  ];
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <SkyDefs id="wf" />
        <defs><filter id="cap-soft"><feGaussianBlur stdDeviation="14" /></filter><linearGradient id="cap-dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF6E8" /><stop offset="0.55" stopColor="#D9D2C4" /><stop offset="1" stopColor="#8E8A86" /></linearGradient></defs>
        <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#wf-sky)" /></Layer>
        <Layer d={0.35} cam={cam}>
          <path d={ridge(980, 60, 5)} fill="#2C5468" />
          <g transform="translate(560 410) scale(0.5)"><CapitolBuilding /></g>
          <Firs fill="#1B4337" items={Array.from({ length: 22 }).map((_, i) => [-100 + i * 60, 990, 80 + ((i * 41) % 50), 44] as [number, number, number, number])} />
        </Layer>
        <Layer d={0.6} cam={cam}>
          {bld.map(([x, w, h, col], i) => (
            <g key={i}>
              <rect x={x} y={1120 - h} width={w} height={h} fill={col} />
              <rect x={x} y={1120 - h} width={w} height={10} fill="#000" opacity={0.18} />
              {Array.from({ length: Math.floor((h - 40) / 38) }).map((_, r) => Array.from({ length: Math.floor((w - 20) / 26) }).map((__, c) => (
                <rect key={`${r}-${c}`} x={x + 14 + c * 26} y={1120 - h + 28 + r * 38} width={12} height={20} fill="#FFD08A" opacity={((r * 3 + c * 7 + i) % 5) > 1 ? 0.75 : 0.12} />
              )))}
            </g>
          ))}
          <rect x={-300} y={1118} width={1700} height={20} fill="#3A3F48" />
          {/* boardwalk lamps */}
          {[60, 300, 540, 780, 1020].map((x) => <g key={x}><rect x={x} y={1040} width={5} height={84} fill="#1A2233" /><circle cx={x + 2.5} cy={1038} r={9} fill="#FFE2A8" /><circle cx={x + 2.5} cy={1038} r={26} fill="#FFE2A8" opacity={0.18} /></g>)}
        </Layer>
        <Layer d={0.85} cam={cam}>
          <rect x={-300} y={1136} width={1700} height={1000} fill="url(#wf-water)" />
          <Ripples y0={1150} y1={1920} seed={2} />
          {/* marina: masts + hulls */}
          {[90, 230, 390, 560, 720, 880, 1010].map((x, i) => (
            <g key={x}>
              <rect x={x} y={1270 - 300 - (i % 3) * 40} width={4} height={300 + (i % 3) * 40} fill="#E8ECF2" />
              <path d={`M${x - 70} 1262 L${x + 80} 1262 L${x + 60} 1292 L${x - 52} 1292 Z`} fill="#F4F1EA" />
              <rect x={x - 40} y={1244} width={70} height={20} rx={6} fill="#D9DEE6" />
              <path d={`M${x + 4} ${1000 - (i % 3) * 40} L${x + 60} 1236 L${x + 4} 1236 Z`} fill="#CBD5E1" opacity={0.25} />
            </g>
          ))}
          <rect x={-300} y={1290} width={1700} height={22} fill="#4A3A2E" />
          {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={-300 + i * 60} y={1310} width={10} height={70} fill="#2F241C" />)}
        </Layer>
        <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- apartment street ---------------- */
export const ApartmentPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <SkyDefs id="ap" warm={0} />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#ap-sky)" /></Layer>
      <Layer d={0.45} cam={cam}><Firs fill="#1B4337" items={Array.from({ length: 20 }).map((_, i) => [-80 + i * 66, 1040, 170 + ((i * 29) % 70), 70] as [number, number, number, number])} /></Layer>
      <Layer d={0.75} cam={cam}>
        {/* 4-storey apartment block with balconies */}
        <rect x={120} y={430} width={840} height={640} fill="#D9D3C7" />
        <rect x={120} y={430} width={420} height={640} fill="#C7BFB1" />
        <rect x={104} y={410} width={872} height={26} fill="#3A4252" />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            {Array.from({ length: 6 }).map((_, c) => {
              const x = 150 + c * 134, y = 470 + r * 150;
              return (
                <g key={c}>
                  <rect x={x} y={y} width={92} height={96} rx={4} fill={(r * 5 + c * 3) % 4 ? '#FFD08A' : '#2D3B52'} opacity={(r * 5 + c * 3) % 4 ? 0.85 : 1} />
                  <rect x={x + 44} y={y} width={4} height={96} fill="#B8B0A2" />
                  <rect x={x - 10} y={y + 96} width={112} height={12} fill="#4A5366" />
                  {Array.from({ length: 8 }).map((__, k) => <rect key={k} x={x - 6 + k * 14} y={y + 72} width={3} height={26} fill="#4A5366" />)}
                </g>
              );
            })}
          </g>
        ))}
        <rect x={470} y={960} width={140} height={110} fill="#2A3346" />
        <rect x={480} y={970} width={120} height={100} fill="#FFD08A" opacity={0.5} />
        <rect x={-300} y={1070} width={1700} height={30} fill="#9AA3AE" />
        <rect x={-300} y={1100} width={1700} height={900} fill="#232C3B" />
        <Firs fill="#10342A" items={[[60, 1090, 420, 170], [1020, 1090, 400, 160], [170, 1090, 250, 100]]} />
      </Layer>
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- single-family home (Pacific Northwest craftsman) ---------------- */
export const HousePlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <SkyDefs id="hs" />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#hs-sky)" /></Layer>
      <Layer d={0.4} cam={cam}>
        <path d={ridge(1000, 50, 7)} fill="#2C5468" />
        <Firs fill="#1B4337" items={Array.from({ length: 22 }).map((_, i) => [-120 + i * 62, 1010, 160 + ((i * 31) % 90), 66] as [number, number, number, number])} />
      </Layer>
      <Layer d={0.75} cam={cam}>
        <rect x={-300} y={1080} width={1700} height={1000} fill="#25503C" />
        {/* house */}
        <rect x={250} y={800} width={580} height={300} fill="#5C7A8A" />
        {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={250} y={806 + i * 21} width={580} height={2} fill="#4B6676" />)}
        <polygon points="214,820 540,590 866,820" fill="#2E3A48" />
        <polygon points="250,812 540,612 830,812" fill="#E9E2D3" opacity={0.08} />
        <polygon points="430,760 540,684 650,760" fill="#E9E2D3" />
        <rect x={500} y={705} width={80} height={52} fill="#FFD08A" opacity={0.85} />
        <rect x={700} y={640} width={46} height={120} fill="#7D4E3C" />
        {/* porch */}
        <rect x={232} y={950} width={616} height={18} fill="#E9E2D3" />
        {[262, 400, 680, 818].map((x) => <rect key={x} x={x - 12} y={968} width={24} height={132} fill="#E9E2D3" />)}
        <rect x={500} y={980} width={80} height={120} fill="#7D4E3C" />
        <rect x={510} y={995} width={60} height={36} fill="#FFD08A" opacity={0.7} />
        {[[300, 850], [660, 850], [300, 990], [650, 990]].map(([x, y], i) => (
          <g key={i}><rect x={x} y={y} width={110} height={78} fill="#FFD08A" opacity={0.85} /><rect x={x + 53} y={y} width={4} height={78} fill="#E9E2D3" /><rect x={x - 6} y={y - 6} width={122} height={8} fill="#E9E2D3" /></g>
        ))}
        <polygon points="510,1100 570,1100 640,1260 440,1260" fill="#B7B0A2" />
        <Firs fill="#10342A" items={[[120, 1110, 470, 190], [960, 1110, 450, 180], [40, 1150, 300, 130]]} />
      </Layer>
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- local street + generic city bus (no agency branding) ---------------- */
export const BusStreetPlate: React.FC<{ cam: Cam; busX: number; dim?: number }> = ({ cam, busX, dim = 0 }) => {
  const frame = useCurrentFrame();
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 1150) rotate(${-(busX * 0.9) % 360})`}>
      <circle r={44} fill="#141A24" /><circle r={22} fill="#9AA3AE" />
      {[0, 60, 120].map((a) => <rect key={a} x={-3} y={-22} width={6} height={44} fill="#5F6875" transform={`rotate(${a})`} />)}
    </g>
  );
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <SkyDefs id="bs" warm={0} />
        <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#bs-sky)" /></Layer>
        <Layer d={0.4} cam={cam}>
          {[[-100, 180, 300], [90, 140, 220], [240, 160, 340], [410, 120, 260], [540, 170, 300], [720, 130, 240], [860, 160, 320], [1030, 150, 260]].map(([x, w, h], i) => (
            <g key={i}><rect x={x} y={1000 - h} width={w} height={h} fill={['#46566B', '#5B5149', '#3E4A5C'][i % 3]} />
              {Array.from({ length: Math.floor(h / 46) }).map((_, r) => <rect key={r} x={x + 16} y={1000 - h + 20 + r * 46} width={w - 32} height={14} fill="#FFD08A" opacity={(r + i) % 3 ? 0.55 : 0.12} />)}</g>
          ))}
          <Firs fill="#1B4337" items={[[60, 1010, 240, 100], [380, 1010, 200, 90], [700, 1010, 230, 96], [1000, 1010, 210, 92]]} />
        </Layer>
        <Layer d={0.8} cam={cam}>
          <rect x={-300} y={1000} width={1700} height={40} fill="#8F98A3" />
          <rect x={-300} y={1040} width={1700} height={300} fill="#2A303B" />
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={-300 + ((i * 180 - frame * 0) % 2000)} y={1262} width={90} height={10} fill="#E8D9A0" opacity={0.6} />)}
          <rect x={-300} y={1340} width={1700} height={700} fill="#1A1F29" />
          {/* bus stop sign: generic pictogram */}
          <rect x={860} y={760} width={8} height={280} fill="#C8CED6" />
          <rect x={824} y={730} width={80} height={80} rx={12} fill={C.forest} stroke="#F4F1EA" strokeWidth={4} />
          <rect x={842} y={748} width={44} height={34} rx={6} fill="#F4F1EA" /><rect x={846} y={754} width={36} height={14} fill={C.forest} />
          <circle cx={852} cy={790} r={5} fill="#F4F1EA" /><circle cx={876} cy={790} r={5} fill="#F4F1EA" />
          {/* bus */}
          <g transform={`translate(${busX} 0)`}>
            <rect x={-20} y={860} width={880} height={290} rx={34} fill="#F4F1EA" />
            <rect x={-20} y={1080} width={880} height={50} fill={C.forest} />
            <rect x={-20} y={1060} width={880} height={10} fill={C.blue} opacity={0.8} />
            <rect x={14} y={900} width={820} height={130} rx={14} fill="#1D3550" />
            {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={26 + i * 136} y={910} width={124} height={110} rx={8} fill="#2E5478" opacity={0.9} />)}
            {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={36 + i * 136} y={918} width={40} height={94} fill="#FFFFFF" opacity={0.08} />)}
            <rect x={60} y={872} width={260} height={24} rx={4} fill="#121821" />
            <text x={190} y={891} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={19} fill="#FFB547" letterSpacing={3}>DOWNTOWN</text>
            <rect x={636} y={1036} width={92} height={10} fill="#1D3550" />
            <rect x={836} y={990} width={20} height={36} rx={6} fill="#FFE2A8" />
            {wheel(170)}{wheel(690)}
          </g>
        </Layer>
        <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
      </svg>
    </AbsoluteFill>
  );
};
