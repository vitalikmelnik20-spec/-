// Original vector illustrations for "Ціни на заході України": Lviv (Rynok houses + Town Hall tower),
// Uzhhorod (castle on the hill, the Uzh river, sakura), Ivano-Frankivsk (Town Hall), animated floor plans of
// 1- and 2-room flats, grocery icons, falling autumn leaves. All drawn in code, parallax-ready.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, clamp, ease } from './theme';

export type Cam = { x: number; y: number; z: number };
const Layer: React.FC<{ d: number; cam: Cam; children: React.ReactNode }> = ({ d, cam, children }) => (
  <g transform={`translate(540 960) scale(${1 + (cam.z - 1) * d}) translate(${-540 - cam.x * d} ${-960 - cam.y * d})`}>{children}</g>
);
const LIT = '#FFD08A';
const Sky: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0A1631" /><stop offset="0.36" stopColor="#1E3A66" /><stop offset="0.5" stopColor="#6A78A0" />
      <stop offset="0.58" stopColor="#E89C78" /><stop offset="0.63" stopColor="#F6C38B" />
    </linearGradient>
    <linearGradient id={`${id}-river`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FA6C8" /><stop offset="0.3" stopColor="#2F5A84" /><stop offset="1" stopColor="#0A1B33" /></linearGradient>
  </defs>
);

/** a narrow old-town house (kamyanytsia): w x h, colour, ornate cornice, arched windows */
const House: React.FC<{ x: number; base: number; w: number; h: number; col: string; roof?: string; seed: number }> = ({ x, base, w, h, col, roof = '#7A3B2A', seed }) => {
  const rows = Math.floor((h - 70) / 80), cols = w > 130 ? 3 : 2;
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill={col} />
      <rect x={x} y={base - h} width={w} height={h} fill="#000" opacity={0.06 + (seed % 3) * 0.03} />
      <rect x={x - 4} y={base - h - 10} width={w + 8} height={14} fill="#EFE6D2" />
      {seed % 2 ? <polygon points={`${x},${base - h - 10} ${x + w / 2},${base - h - 60} ${x + w},${base - h - 10}`} fill={roof} /> : <rect x={x + 8} y={base - h - 40} width={w - 16} height={30} fill={roof} />}
      {Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((__, c) => {
        const wx = x + (w / cols) * (c + 0.5) - 13, wy = base - h + 30 + r * 80;
        return <g key={`${r}${c}`}><path d={`M${wx} ${wy + 46} L${wx} ${wy + 12} Q${wx + 13} ${wy - 2} ${wx + 26} ${wy + 12} L${wx + 26} ${wy + 46} Z`} fill={(r + c + seed) % 3 ? LIT : '#2D3B52'} opacity={(r + c + seed) % 3 ? 0.85 : 1} /><rect x={wx - 4} y={wy + 46} width={34} height={5} fill="#EFE6D2" /></g>;
      }))}
      <path d={`M${x + w / 2 - 22} ${base} L${x + w / 2 - 22} ${base - 56} Q${x + w / 2} ${base - 78} ${x + w / 2 + 22} ${base - 56} L${x + w / 2 + 22} ${base} Z`} fill="#3A2A20" />
    </g>
  );
};
const ParallaxBase: React.FC<{ id: string; cam: Cam; children: React.ReactNode; dim?: number }> = ({ id, cam, children, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Sky id={id} />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill={`url(#${id}-sky)`} /></Layer>
      {children}
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- Lviv: Rynok houses + Town Hall tower ---------------- */
export const LvivPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim }) => {
  const cols = ['#E9B949', '#D98C5F', '#C9D7B9', '#E7A6A1', '#9FB7D6', '#E3CF9E', '#C97B5A', '#B9D0C2'];
  return (
    <ParallaxBase id="lv" cam={cam} dim={dim}>
      <Layer d={0.4} cam={cam}>
        {/* Town Hall tower (Ратуша) */}
        <rect x={470} y={430} width={140} height={600} fill="#D8CBB0" />
        <rect x={470} y={430} width={70} height={600} fill="#E6DBC3" />
        <rect x={460} y={420} width={160} height={20} fill="#BFB29A" />
        <polygon points="482,420 540,350 598,420" fill="#5F8F84" />
        <rect x={500} y={300} width={80} height={62} fill="#D8CBB0" />
        <path d="M500 302 Q540 240 580 302 Z" fill="#5F8F84" />
        <rect x={538} y={220} width={4} height={40} fill="#C9A44A" />
        <rect x={542} y={222} width={34} height={12} fill="#2E7BFF" /><rect x={542} y={234} width={34} height={12} fill="#FFD23F" />
        <circle cx={540} cy={500} r={40} fill="#F4ECD8" stroke="#2D3B52" strokeWidth={6} />
        <rect x={538} y={470} width={4} height={32} fill="#2D3B52" /><rect x={538} y={498} width={22} height={4} fill="#2D3B52" />
        {[0, 1, 2, 3, 4].map((r) => <rect key={r} x={505} y={580 + r * 85} width={70} height={46} rx={4} fill={LIT} opacity={0.75} />)}
      </Layer>
      <Layer d={0.75} cam={cam}>
        {Array.from({ length: 9 }).map((_, i) => <House key={i} x={-120 + i * 150} base={1210} w={150} h={360 + ((i * 37) % 4) * 40} col={cols[i % cols.length]} seed={i} />)}
        <rect x={-300} y={1210} width={1700} height={900} fill="#4A4648" />
        {Array.from({ length: 14 }).map((_, i) => <line key={i} x1={-300} y1={1230 + i * i * 6} x2={1400} y2={1230 + i * i * 6} stroke="#3C383A" strokeWidth={3} />)}
      </Layer>
    </ParallaxBase>
  );
};

/* ---------------- Uzhhorod: castle on the hill, river Uzh, sakura ---------------- */
const Sakura: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 L-6 -80 M-4 -50 L-40 -90 M-2 -60 L30 -100" stroke="#5A3A30" strokeWidth={10} strokeLinecap="round" />
    {[[-40, -110, 48], [10, -130, 56], [44, -100, 42], [-10, -90, 40], [-60, -80, 34], [60, -70, 32]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? '#F7B6CD' : '#F28DB2'} opacity={0.95} />)}
  </g>
);
export const UzhPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim }) => (
  <ParallaxBase id="uz" cam={cam} dim={dim}>
    <Layer d={0.25} cam={cam}><path d="M-400 940 L-100 760 L120 860 L380 700 L640 840 L900 690 L1180 820 L1480 760 L1480 1100 L-400 1100 Z" fill="#40597A" /></Layer>
    <Layer d={0.5} cam={cam}>
      <path d="M-400 1040 Q200 820 600 880 Q900 920 1480 1000 L1480 1200 L-400 1200 Z" fill="#2F5A44" />
      {/* castle */}
      <rect x={300} y={760} width={420} height={140} fill="#D9CFB8" />
      <rect x={300} y={760} width={420} height={140} fill="#000" opacity={0.08} />
      {Array.from({ length: 14 }).map((_, i) => <rect key={i} x={300 + i * 30} y={746} width={18} height={16} fill="#D9CFB8" />)}
      {[300, 720].map((x) => <g key={x}><rect x={x - 46} y={700} width={92} height={200} fill="#CFC4AA" /><polygon points={`${x - 56},704 ${x},630 ${x + 56},704`} fill="#A2452E" /><rect x={x - 12} y={760} width={24} height={40} rx={12} fill={LIT} opacity={0.7} /></g>)}
      <rect x={470} y={690} width={90} height={80} fill="#CFC4AA" /><polygon points="462,694 515,640 568,694" fill="#A2452E" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={360 + i * 52} y={800} width={20} height={34} rx={10} fill={LIT} opacity={0.75} />)}
    </Layer>
    <Layer d={0.8} cam={cam}>
      <rect x={-300} y={1150} width={1700} height={40} fill="#8C8C8C" />
      <rect x={-300} y={1190} width={1700} height={900} fill="url(#uz-river)" />
      {Array.from({ length: 30 }).map((_, i) => <rect key={i} x={((i * 331) % 1400) - 200} y={1210 + (i * i) % 600} width={80 + (i % 5) * 40} height={3} fill="#D6E6F5" opacity={0.18} />)}
      <Sakura x={110} y={1160} s={1.6} /><Sakura x={960} y={1165} s={1.7} /><Sakura x={330} y={1158} s={1.1} /><Sakura x={760} y={1160} s={1.15} />
    </Layer>
  </ParallaxBase>
);

/* ---------------- Ivano-Frankivsk: Town Hall (Ратуша) on the square ---------------- */
export const FrankPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim }) => {
  const cols = ['#E7D2A8', '#C9D7E4', '#E9B9A0', '#D7E4C3', '#E9C46A', '#B8C8DC'];
  return (
    <ParallaxBase id="if" cam={cam} dim={dim}>
      <Layer d={0.4} cam={cam}>
        {Array.from({ length: 8 }).map((_, i) => <House key={i} x={-160 + i * 175} base={1040} w={175} h={300 + ((i * 29) % 3) * 40} col={cols[i % cols.length]} seed={i + 3} />)}
      </Layer>
      <Layer d={0.7} cam={cam}>
        {/* cross-shaped base + tiered tower with spire */}
        <rect x={300} y={900} width={480} height={240} fill="#E9E1CF" />
        <rect x={430} y={830} width={220} height={310} fill="#F2ECDD" />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={318 + i * 80} y={950} width={40} height={60} fill={LIT} opacity={0.8} />)}
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={318 + i * 80} y={1040} width={40} height={60} fill={LIT} opacity={0.6} />)}
        <rect x={470} y={560} width={140} height={280} fill="#F2ECDD" />
        <rect x={540} y={560} width={70} height={280} fill="#DCD3BF" />
        <rect x={490} y={430} width={100} height={140} fill="#F2ECDD" />
        <rect x={510} y={330} width={60} height={110} fill="#E9E1CF" />
        <polygon points="510,332 540,230 570,332" fill="#5F8F84" />
        <rect x={538} y={190} width={4} height={44} fill="#C9A44A" />
        <circle cx={540} cy={620} r={36} fill="#F4ECD8" stroke="#2D3B52" strokeWidth={6} />
        {[0, 1, 2].map((r) => <rect key={r} x={515} y={680 + r * 50} width={50} height={30} rx={4} fill={LIT} opacity={0.75} />)}
        <rect x={520} y={460} width={40} height={60} rx={20} fill={LIT} opacity={0.7} />
        <rect x={-300} y={1140} width={1700} height={900} fill="#545054" />
        <ellipse cx={180} cy={1300} rx={110} ry={26} fill="#6C8CA0" /><rect x={170} y={1220} width={20} height={80} fill="#C7B693" />
      </Layer>
    </ParallaxBase>
  );
};

/* ---------------- supermarket shelves backdrop ---------------- */
export const ShelvesBg: React.FC<{ tint?: string }> = ({ tint = C.coral }) => {
  const frame = useCurrentFrame();
  const cols = ['#FF6B6B', '#FFD23F', '#3D8BFF', '#3DDC84', '#F6F2E9', '#FF9F43', '#A78BFA'];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ opacity: 0.32 }}>
        {Array.from({ length: 7 }).map((_, r) => (
          <g key={r} transform={`translate(${(-(frame * (r % 2 ? 1.2 : -1.2)) % 200) - 100} ${160 + r * 250})`}>
            <rect x={-100} y={170} width={1500} height={16} fill="#8D97A8" />
            {Array.from({ length: 16 }).map((__, i) => <rect key={i} x={i * 90} y={170 - 80 - ((i * 7 + r) % 3) * 30} width={66} height={80 + ((i * 7 + r) % 3) * 30} rx={8} fill={cols[(i + r * 3) % cols.length]} />)}
          </g>
        ))}
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 45%, ${tint}22, transparent 70%), linear-gradient(180deg, rgba(6,13,29,0.6), rgba(6,13,29,0.25) 40%, rgba(6,13,29,0.85))` }} />
    </AbsoluteFill>
  );
};

/* ---------------- autumn leaves overlay ---------------- */
export const Leaves: React.FC<{ n?: number; opacity?: number }> = ({ n = 14, opacity = 0.9 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {Array.from({ length: n }).map((_, i) => {
          const sp = 2.2 + (i % 5) * 0.6, x0 = (i * 173) % 1080, y = ((frame * sp + i * 271) % 2200) - 140;
          const x = x0 + Math.sin((frame + i * 40) / 22) * 60;
          return <path key={i} d="M0 -18 C14 -10 16 6 0 18 C-16 6 -14 -10 0 -18 Z" transform={`translate(${x} ${y}) rotate(${(frame * (2 + i % 3) + i * 47) % 360}) scale(${0.9 + (i % 4) * 0.3})`} fill={['#F28C28', '#E4572E', '#F6C343', '#C8553D'][i % 4]} opacity={0.85} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- floor plans (draw themselves) ---------------- */
const Furniture: React.FC<{ kind: 'bed' | 'sofa' | 'table' | 'stove' | 'bath' | 'wardrobe'; x: number; y: number; s?: number; at: number }> = ({ kind, x, y, s = 1, at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: ease.back });
  if (p <= 0) return null;
  const st = { fill: 'none', stroke: C.yellow, strokeWidth: 4, strokeLinejoin: 'round' as const };
  return (
    <g transform={`translate(${x} ${y}) scale(${s * p})`} opacity={Math.min(1, p * 2)}>
      {kind === 'bed' && <g><rect x={-60} y={-80} width={120} height={160} rx={10} {...st} /><rect x={-48} y={-70} width={40} height={26} rx={6} {...st} /><rect x={8} y={-70} width={40} height={26} rx={6} {...st} /><line x1={-60} y1={-30} x2={60} y2={-30} {...st} /></g>}
      {kind === 'sofa' && <g><rect x={-80} y={-30} width={160} height={60} rx={14} {...st} /><rect x={-80} y={-30} width={160} height={20} rx={8} {...st} /></g>}
      {kind === 'table' && <g><circle r={34} {...st} />{[0, 90, 180, 270].map((a) => <circle key={a} cx={52 * Math.cos((a * Math.PI) / 180)} cy={52 * Math.sin((a * Math.PI) / 180)} r={12} {...st} />)}</g>}
      {kind === 'stove' && <g><rect x={-40} y={-30} width={80} height={60} rx={6} {...st} />{[[-18, -12], [18, -12], [-18, 12], [18, 12]].map(([a, b]) => <circle key={`${a}${b}`} cx={a} cy={b} r={9} {...st} />)}</g>}
      {kind === 'bath' && <g><rect x={-30} y={-60} width={60} height={120} rx={26} {...st} /><circle cx={0} cy={-40} r={5} fill={C.yellow} /></g>}
      {kind === 'wardrobe' && <g><rect x={-50} y={-20} width={100} height={40} {...st} /><line x1={0} y1={-20} x2={0} y2={20} {...st} /></g>}
    </g>
  );
};
export const FloorPlan: React.FC<{ rooms: 1 | 2; at: number; w?: number }> = ({ rooms, at, w = 760 }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [at, at + 22], [0, 1], { ...clamp, easing: ease.inOut });
  const lab = (t: string, x: number, y: number, d: number) => <text x={x} y={y} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={26} fill={C.gray} opacity={prog01(frame, at + d)}>{t}</text>;
  const wall = { fill: 'none', stroke: C.off, strokeWidth: 10, strokeLinecap: 'square' as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw };
  const H = 480;
  return (
    <svg width={w} height={(w / 760) * H} viewBox={`-10 -10 780 ${H + 20}`}>
      <rect x={0} y={0} width={760} height={H} fill="rgba(255,255,255,0.04)" />
      <path d={`M0 0 H760 V${H} H0 Z`} {...wall} />
      {rooms === 1 ? (
        <g>
          <path d={`M470 0 V300 M470 380 V${H} M470 300 H760 M600 300 V${H}`} {...wall} />
          {lab('КІМНАТА', 235, 250, 18)}{lab('КУХНЯ', 615, 130, 22)}{lab('С/В', 680, 400, 24)}{lab('КОРИДОР', 535, 440, 26)}
          <Furniture kind="bed" x={130} y={150} at={at + 16} /><Furniture kind="sofa" x={300} y={400} at={at + 20} /><Furniture kind="wardrobe" x={360} y={60} at={at + 22} />
          <Furniture kind="stove" x={700} y={60} at={at + 24} /><Furniture kind="table" x={590} y={190} s={0.8} at={at + 26} /><Furniture kind="bath" x={720} y={390} s={0.6} at={at + 28} />
        </g>
      ) : (
        <g>
          <path d={`M330 0 V200 M330 280 V${H} M330 300 H560 M560 0 V200 M560 280 V${H} M560 300 H760`} {...wall} />
          {lab('КІМНАТА 1', 165, 250, 18)}{lab('КІМНАТА 2', 445, 150, 20)}{lab('КУХНЯ', 660, 130, 22)}{lab('С/В', 660, 410, 24)}{lab('КОРИДОР', 445, 410, 26)}
          <Furniture kind="bed" x={100} y={140} at={at + 16} /><Furniture kind="wardrobe" x={240} y={430} at={at + 18} /><Furniture kind="sofa" x={445} y={60} s={0.9} at={at + 20} />
          <Furniture kind="stove" x={710} y={60} at={at + 24} /><Furniture kind="table" x={650} y={210} s={0.7} at={at + 26} /><Furniture kind="bath" x={720} y={400} s={0.55} at={at + 28} />
        </g>
      )}
    </svg>
  );
};
const prog01 = (frame: number, a: number) => interpolate(frame, [a, a + 8], [0, 1], clamp);

/* ---------------- grocery icons ---------------- */
export const Icon: React.FC<{ kind: 'eggs' | 'sugar' | 'milk' | 'cheese' | 'apple' | 'pear' | 'carrot' | 'beet' | 'cabbage' | 'cart' | 'pot'; size: number }> = ({ kind, size }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    {kind === 'eggs' && <g><rect x={-54} y={0} width={108} height={40} rx={10} fill="#C9A77C" />{[-36, 0, 36].map((x) => <ellipse key={x} cx={x} cy={-4} rx={16} ry={21} fill="#FFF7E6" stroke="#E7D8BD" strokeWidth={2} />)}{[-18, 18].map((x) => <ellipse key={x} cx={x} cy={-20} rx={15} ry={20} fill="#FFF2DA" stroke="#E7D8BD" strokeWidth={2} />)}</g>}
    {kind === 'sugar' && <g><rect x={-34} y={-46} width={68} height={92} rx={8} fill="#F6F2E9" /><rect x={-34} y={-8} width={68} height={30} fill="#3D8BFF" /><text x={0} y={13} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={18} fill="#fff">ЦУКОР</text></g>}
    {kind === 'milk' && <g><path d="M-26 -26 L-14 -50 H14 L26 -26 V50 H-26 Z" fill="#F6F2E9" /><rect x={-26} y={0} width={52} height={26} fill="#3D8BFF" /><text x={0} y={19} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={14} fill="#fff">МОЛОКО</text></g>}
    {kind === 'cheese' && <g><path d="M-50 30 L40 -30 L50 30 Z" fill="#FFD23F" /><path d="M-50 30 L50 30 L50 44 L-50 44 Z" fill="#E9B52C" />{[[10, 10, 7], [30, 18, 5], [-10, 22, 5]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#E9B52C" />)}</g>}
    {kind === 'apple' && <g><circle cx={-8} cy={6} r={34} fill="#E4572E" /><circle cx={12} cy={6} r={34} fill="#E4572E" /><rect x={-2} y={-46} width={5} height={20} fill="#6B4226" /><ellipse cx={14} cy={-38} rx={14} ry={7} fill="#3DDC84" /></g>}
    {kind === 'pear' && <g><circle cx={0} cy={20} r={32} fill="#C5D86D" /><circle cx={0} cy={-14} r={20} fill="#C5D86D" /><rect x={-2} y={-46} width={5} height={16} fill="#6B4226" /></g>}
    {kind === 'carrot' && <g transform="rotate(30)"><path d="M0 50 L-18 -24 Q0 -36 18 -24 Z" fill="#F28C28" /><path d="M0 -30 L-14 -56 M0 -30 L0 -58 M0 -30 L14 -56" stroke="#3DDC84" strokeWidth={6} strokeLinecap="round" /></g>}
    {kind === 'beet' && <g><circle cx={0} cy={10} r={36} fill="#9B2242" /><path d="M0 46 L4 58" stroke="#9B2242" strokeWidth={5} /><path d="M0 -24 L-16 -54 M0 -24 L16 -54" stroke="#3DDC84" strokeWidth={7} strokeLinecap="round" /></g>}
    {kind === 'cabbage' && <g><circle r={44} fill="#9BD58C" /><path d="M-30 -10 Q0 -40 30 -10 M-34 14 Q0 -14 34 14" stroke="#6FB560" strokeWidth={5} fill="none" /></g>}
    {kind === 'cart' && <g fill="none" stroke={C.off} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round"><path d="M-54 -40 H-36 L-22 24 H38 L50 -22 H-30" /><circle cx={-14} cy={42} r={8} fill={C.off} /><circle cx={30} cy={42} r={8} fill={C.off} /></g>}
    {kind === 'pot' && <g><rect x={-50} y={-10} width={100} height={60} rx={14} fill="#B8C2CF" /><rect x={-58} y={-18} width={116} height={14} rx={7} fill="#D7DEE7" /><ellipse cx={0} cy={-12} rx={46} ry={8} fill="#B3263E" /><rect x={-70} y={0} width={16} height={10} rx={5} fill="#8D97A8" /><rect x={54} y={0} width={16} height={10} rx={5} fill="#8D97A8" /></g>}
  </svg>
);
