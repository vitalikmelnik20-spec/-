// Original vector "plates" of Bern (no stock footage is reachable from this environment): the Federal
// Palace (Bundeshaus) above the turquoise Aare with the Bernese Alps behind, the arcaded old town with the
// Zytglogge clock tower, a street with a red tram (no operator branding) and a modern apartment block.
// Every plate is layered for parallax camera moves.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from './theme';

export type Cam = { x: number; y: number; z: number };
const Layer: React.FC<{ d: number; cam: Cam; children: React.ReactNode }> = ({ d, cam, children }) => (
  <g transform={`translate(540 960) scale(${1 + (cam.z - 1) * d}) translate(${-540 - cam.x * d} ${-960 - cam.y * d})`}>{children}</g>
);
const SAND = '#D9CBAA', SAND2 = '#C2B08B', SAND3 = '#A8946C', ROOF = '#9C4A32', ROOF2 = '#7E3A28', COPPER = '#5FA593', LIT = '#FFD08A';

/** deciduous / round tree clump */
const Trees: React.FC<{ items: [number, number, number][]; fill: string }> = ({ items, fill }) => (
  <g fill={fill}>{items.map(([x, y, r], i) => <g key={i}><circle cx={x} cy={y} r={r} /><circle cx={x - r * 0.6} cy={y + r * 0.3} r={r * 0.75} /><circle cx={x + r * 0.6} cy={y + r * 0.35} r={r * 0.7} /></g>)}</g>
);
const Sky: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0A1631" />
      <stop offset="0.36" stopColor="#1C3A63" />
      <stop offset="0.5" stopColor="#5A7FA6" />
      <stop offset="0.58" stopColor="#E3B794" />
      <stop offset="0.62" stopColor="#F2CFA4" />
    </linearGradient>
    <linearGradient id={`${id}-aare`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6FD3C9" />
      <stop offset="0.3" stopColor="#2A9C9A" />
      <stop offset="1" stopColor="#0C3A4A" />
    </linearGradient>
    <linearGradient id={`${id}-snow`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFF4E8" />
      <stop offset="1" stopColor="#C9D6E6" />
    </linearGradient>
    <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="3" /></filter>
  </defs>
);
/** Bernese Alps (Eiger, Mönch, Jungfrau read left to right), with snow caps */
const Alps: React.FC<{ id: string; y: number }> = ({ id, y }) => {
  const peaks: [number, number][] = [[-300, 80], [-140, 150], [20, 210], [150, 260], [250, 200], [360, 290], [470, 230], [600, 320], [720, 250], [860, 300], [990, 200], [1150, 240], [1380, 90]];
  const base = `M-400 ${y} ` + peaks.map(([x, h]) => `L${x} ${y - h}`).join(' ') + ` L1480 ${y} Z`;
  return (
    <g>
      <path d={base} fill="#7F97B4" />
      {peaks.map(([x, h], i) => h > 180 && <path key={i} d={`M${x - h * 0.42} ${y - h * 0.62} L${x} ${y - h} L${x + h * 0.38} ${y - h * 0.64} L${x + h * 0.18} ${y - h * 0.58} L${x} ${y - h * 0.66} L${x - h * 0.2} ${y - h * 0.56} Z`} fill={`url(#${id}-snow)`} />)}
    </g>
  );
};
const Ripples: React.FC<{ y0: number; y1: number; color?: string }> = ({ y0, y1, color = '#D8FFF8' }) => {
  const frame = useCurrentFrame();
  return (
    <g>{Array.from({ length: 44 }).map((_, i) => {
      const u = i / 44, y = y0 + (y1 - y0) * u * u, x = ((i * 389 + frame * (1.2 + u * 2.4)) % 1400) - 200; // the Aare flows fast
      return <rect key={i} x={x} y={y} width={70 + 240 * u} height={1.5 + 3 * u} rx={2} fill={color} opacity={0.1 + 0.1 * (1 - u)} />;
    })}</g>
  );
};
const Flag: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const frame = useCurrentFrame();
  const wave = Math.sin(frame / 6) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-1.5} y={0} width={3} height={60} fill="#E8E2D2" />
      <path d={`M1.5 2 L37 ${2 + wave} L37 ${34 + wave} L1.5 34 Z`} fill="#E5372B" />
      <rect x={15} y={9 + wave / 2} width={8} height={18} fill="#fff" /><rect x={10} y={14 + wave / 2} width={18} height={8} fill="#fff" />
    </g>
  );
};

/* ---------------- Bundeshaus (Federal Palace) ---------------- */
export const Bundeshaus: React.FC = () => {
  const wins = [];
  for (let x = 196; x <= 884; x += 24) {
    if (x > 452 && x < 628) continue;
    for (const y of [918, 956, 994]) wins.push(<rect key={`${x}-${y}`} x={x} y={y} width={11} height={24} rx={5} fill={LIT} opacity={((x * 3 + y) % 7) / 10 + 0.3} />);
  }
  return (
    <g>
      {/* wings */}
      <rect x={180} y={900} width={720} height={130} fill={SAND} />
      <rect x={180} y={900} width={720} height={130} fill={SAND3} opacity={0.18} />
      <rect x={172} y={890} width={736} height={14} fill="#E6DAC0" />
      {wins}
      {/* corner pavilions with copper hip roofs */}
      {[200, 880].map((cx) => (
        <g key={cx}>
          <rect x={cx - 46} y={870} width={92} height={160} fill={SAND2} />
          <polygon points={`${cx - 52},872 ${cx},826 ${cx + 52},872`} fill={COPPER} />
          {[0, 1].map((r) => <rect key={r} x={cx - 14} y={892 + r * 50} width={28} height={34} rx={13} fill={LIT} opacity={0.65} />)}
        </g>
      ))}
      {/* central block */}
      <rect x={452} y={820} width={176} height={210} fill={SAND} />
      <polygon points="440,824 540,784 640,824" fill={SAND2} />
      <rect x={440} y={820} width={200} height={12} fill="#E6DAC0" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={470 + i * 40} y={850} width={22} height={60} rx={11} fill={LIT} opacity={0.8} />)}
      {[0, 1, 2].map((i) => <rect key={i} x={478 + i * 46} y={940} width={34} height={90} rx={17} fill="#3A2F26" />)}
      {[0, 1, 2].map((i) => <rect key={i} x={482 + i * 46} y={946} width={26} height={84} rx={13} fill={LIT} opacity={0.55} />)}
      {/* drum + copper dome + lantern */}
      <rect x={478} y={730} width={124} height={60} fill={SAND2} />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={486 + i * 19} y={740} width={9} height={40} rx={4} fill={LIT} opacity={0.6} />)}
      <rect x={470} y={784} width={140} height={10} fill="#E6DAC0" />
      <path d="M472 734 C472 664 506 626 540 622 C574 626 608 664 608 734 Z" fill={COPPER} />
      <path d="M472 734 C472 664 506 626 540 622 L540 734 Z" fill="#7DC2AE" opacity={0.55} />
      {[-44, -22, 0, 22, 44].map((dx) => <path key={dx} d={`M${540 + dx * 1.4} 734 Q${540 + dx * 1.15} 668 ${540 + dx * 0.1} 626`} stroke="#3E7E6E" strokeWidth={2} fill="none" />)}
      <rect x={528} y={596} width={24} height={30} fill={COPPER} />
      <ellipse cx={540} cy={596} rx={16} ry={7} fill="#4F9381" />
      <Flag x={540} y={530} s={0.9} />
    </g>
  );
};

export const BundeshausPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Sky id="bh" />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#bh-sky)" /></Layer>
      <Layer d={0.25} cam={cam}><Alps id="bh" y={980} /></Layer>
      <Layer d={0.5} cam={cam}>
        <path d="M-400 1000 Q100 950 540 985 Q900 1010 1480 960 L1480 1200 L-400 1200 Z" fill="#3E6B52" />
        <Trees fill="#2F5A44" items={Array.from({ length: 18 }).map((_, i) => [-160 + i * 80, 1000 + ((i * 17) % 20), 34 + ((i * 13) % 16)] as [number, number, number])} />
      </Layer>
      <Layer d={0.8} cam={cam}>
        <Bundeshaus />
        {/* Bundesterrasse retaining wall with arches, wooded slope down to the river */}
        <rect x={120} y={1030} width={840} height={90} fill={SAND3} />
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${150 + i * 68} 1120 L${150 + i * 68} 1068 Q${180 + i * 68} 1040 ${210 + i * 68} 1068 L${210 + i * 68} 1120 Z`} fill="#6E5D44" />)}
        <rect x={110} y={1026} width={860} height={8} fill="#E6DAC0" />
        <path d="M-300 1110 Q540 1090 1380 1110 L1380 1215 L-300 1215 Z" fill="#2C5640" />
        <Trees fill="#244A36" items={[[40, 1110, 70], [170, 1140, 54], [920, 1120, 64], [1040, 1100, 72], [330, 1170, 40], [760, 1172, 42], [540, 1180, 36]]} />
        <rect x={-300} y={1200} width={1700} height={1000} fill="url(#bh-aare)" />
        <g transform="translate(0 2400) scale(1 -1)" opacity={0.25} filter="url(#bh-blur)"><Bundeshaus /></g>
        <Ripples y0={1210} y1={1920} />
      </Layer>
      <Layer d={1.2} cam={cam}><Trees fill="#0A1E16" items={[[-60, 1840, 220], [1140, 1860, 230]]} /></Layer>
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- Altstadt: arcaded street toward the Zytglogge ---------------- */
const Zytglogge: React.FC = () => (
  <g>
    <rect x={480} y={560} width={120} height={420} fill={SAND2} />
    <rect x={480} y={560} width={60} height={420} fill={SAND} />
    <polygon points="468,566 540,400 612,566" fill={ROOF2} />
    <polygon points="468,566 540,400 540,566" fill={ROOF} />
    <rect x={536} y={360} width={8} height={44} fill="#C9A44A" /><circle cx={540} cy={356} r={9} fill="#E6C25A" />
    {/* astronomical clock face */}
    <circle cx={540} cy={660} r={44} fill="#1F3E73" stroke="#E6C25A" strokeWidth={8} />
    {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={538} y={622} width={4} height={10} fill="#E6C25A" transform={`rotate(${i * 30} 540 660)`} />)}
    <rect x={538} y={630} width={4} height={32} fill="#E6C25A" transform="rotate(40 540 660)" />
    <rect x={538} y={640} width={4} height={22} fill="#E6C25A" transform="rotate(-70 540 660)" />
    <rect x={505} y={760} width={70} height={90} rx={35} fill={LIT} opacity={0.6} />
    <path d="M490 980 L490 900 Q540 850 590 900 L590 980 Z" fill="#2A2018" />
  </g>
);
export const AltstadtPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => {
  // one-point perspective toward the tower: facades on both sides with arcades (Lauben) at street level
  const VPx = 540, VPy = 980;
  const side = (s: 1 | -1) => {
    const g = [];
    for (let k = 0; k < 7; k++) {
      const u0 = k / 7, u1 = (k + 1) / 7;
      const x0 = s < 0 ? -40 + (VPx - 100 - -40) * Math.pow(u0, 0.75) : 1120 - (1120 - (VPx + 100)) * Math.pow(u0, 0.75);
      const x1 = s < 0 ? -40 + (VPx - 100 - -40) * Math.pow(u1, 0.75) : 1120 - (1120 - (VPx + 100)) * Math.pow(u1, 0.75);
      const top0 = 300 + (VPy - 420 - 300) * Math.pow(u0, 0.75), top1 = 300 + (VPy - 420 - 300) * Math.pow(u1, 0.75);
      const bot0 = 1500 - (1500 - VPy) * Math.pow(u0, 0.75), bot1 = 1500 - (1500 - VPy) * Math.pow(u1, 0.75);
      const col = [SAND, SAND2, '#CDBB95', '#BFAE88'][k % 4];
      g.push(<polygon key={`f${k}`} points={`${x0},${top0} ${x1},${top1} ${x1},${bot1} ${x0},${bot0}`} fill={col} />);
      // roof eave
      g.push(<polygon key={`r${k}`} points={`${x0},${top0} ${x1},${top1} ${x1},${top1 - 26 * (1 - u1)} ${x0},${top0 - 40 * (1 - u0)}`} fill={ROOF} />);
      // windows: 3 rows
      for (let r = 0; r < 3; r++) {
        const fy = (q: number, t: number, b: number) => t + (b - t) * q;
        const q0 = 0.12 + r * 0.17, q1 = q0 + 0.1;
        const xa = x0 + (x1 - x0) * 0.25, xb = x0 + (x1 - x0) * 0.62;
        const ta = fy(q0, top0 + (top1 - top0) * 0.25, bot0 + (bot1 - bot0) * 0.25), tb = fy(q0, top0 + (top1 - top0) * 0.62, bot0 + (bot1 - bot0) * 0.62);
        const ba = fy(q1, top0 + (top1 - top0) * 0.25, bot0 + (bot1 - bot0) * 0.25), bb = fy(q1, top0 + (top1 - top0) * 0.62, bot0 + (bot1 - bot0) * 0.62);
        g.push(<polygon key={`w${k}-${r}`} points={`${xa},${ta} ${xb},${tb} ${xb},${bb} ${xa},${ba}`} fill={LIT} opacity={(k + r) % 3 ? 0.8 : 0.25} />);
      }
      // arcade arch (dark opening at street level)
      const aT0 = top0 + (bot0 - top0) * 0.68, aT1 = top1 + (bot1 - top1) * 0.68;
      g.push(<polygon key={`a${k}`} points={`${x0 + (x1 - x0) * 0.08},${bot0 - (bot0 - aT0) * 0.05} ${x0 + (x1 - x0) * 0.08},${aT0 + 18 * (1 - u0)} ${(x0 + x1) / 2},${(aT0 + aT1) / 2 - 10 * (1 - u0)} ${x1 - (x1 - x0) * 0.08},${aT1 + 18 * (1 - u1)} ${x1 - (x1 - x0) * 0.08},${bot1}`} fill="#3B2E22" />);
      g.push(<polygon key={`al${k}`} points={`${x0 + (x1 - x0) * 0.2},${bot0 - (bot0 - aT0) * 0.3} ${x1 - (x1 - x0) * 0.2},${bot1 - (bot1 - aT1) * 0.3} ${x1 - (x1 - x0) * 0.2},${bot1} ${x0 + (x1 - x0) * 0.2},${bot0}`} fill={LIT} opacity={0.35} />);
    }
    return g;
  };
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <Sky id="as" />
        <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#as-sky)" /></Layer>
        <Layer d={0.6} cam={cam}>
          <Zytglogge />
          <rect x={-300} y={VPy - 40} width={1700} height={1200} fill="#6B625A" />
          {/* cobbled street + tram rails converging */}
          <polygon points={`-200,1920 1280,1920 ${VPx + 100},${VPy} ${VPx - 100},${VPy}`} fill="#4C4A4E" />
          {[-160, 160].map((dx) => <line key={dx} x1={VPx + dx * 0.25} y1={VPy} x2={VPx + dx * 2.4} y2={1920} stroke="#A9A9AE" strokeWidth={4} opacity={0.6} />)}
          {Array.from({ length: 16 }).map((_, i) => { const y = VPy + (1920 - VPy) * Math.pow(i / 16, 1.6); return <line key={i} x1={-200} y1={y} x2={1280} y2={y} stroke="#3C3A3E" strokeWidth={2} />; })}
          {side(-1)}{side(1)}
          {/* fountain column (one of the old-town fountains) */}
          <rect x={300} y={1180} width={22} height={210} fill="#C7B693" />
          <rect x={268} y={1380} width={86} height={40} rx={8} fill="#6C8CA0" />
          <circle cx={311} cy={1166} r={22} fill="#C9A44A" />
        </Layer>
        <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- street with a red tram (generic, no operator branding) ---------------- */
export const TramPlate: React.FC<{ cam: Cam; tramX: number; dim?: number }> = ({ cam, tramX, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Sky id="tr" />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#tr-sky)" /></Layer>
      <Layer d={0.25} cam={cam}><Alps id="tr" y={960} /></Layer>
      <Layer d={0.45} cam={cam}>
        {[[-120, 200, 330], [80, 170, 380], [250, 190, 300], [440, 160, 360], [600, 200, 320], [800, 170, 390], [970, 200, 330]].map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={1010 - h} width={w} height={h} fill={[SAND, SAND2, '#CDBB95'][i % 3]} />
            <polygon points={`${x - 8},${1010 - h} ${x + w / 2},${1010 - h - 60} ${x + w + 8},${1010 - h}`} fill={i % 2 ? ROOF : ROOF2} />
            {Array.from({ length: 3 }).map((_, r) => Array.from({ length: 3 }).map((__, c) => <rect key={`${r}${c}`} x={x + 24 + c * (w - 48) / 3} y={1010 - h + 30 + r * 70} width={(w - 48) / 3 - 18} height={40} fill={LIT} opacity={(r + c + i) % 3 ? 0.75 : 0.2} />))}
            {Array.from({ length: Math.floor(w / 60) }).map((_, k) => <path key={k} d={`M${x + 8 + k * 60} 1010 L${x + 8 + k * 60} 960 Q${x + 34 + k * 60} 930 ${x + 60 + k * 60} 960 L${x + 60 + k * 60} 1010 Z`} fill="#3B2E22" />)}
          </g>
        ))}
      </Layer>
      <Layer d={0.8} cam={cam}>
        <rect x={-300} y={1000} width={1700} height={400} fill="#3F3D42" />
        {[1240, 1262].map((y) => <rect key={y} x={-300} y={y} width={1700} height={5} fill="#A9A9AE" opacity={0.7} />)}
        <line x1={-300} y1={820} x2={1400} y2={820} stroke="#2A2A30" strokeWidth={3} />
        {/* tram */}
        <g transform={`translate(${tramX} 0)`}>
          <line x1={420} y1={820} x2={470} y2={880} stroke="#2A2A30" strokeWidth={4} /><line x1={520} y1={820} x2={470} y2={880} stroke="#2A2A30" strokeWidth={4} />
          <rect x={-40} y={880} width={1020} height={340} rx={40} fill="#D8382C" />
          <rect x={-40} y={1150} width={1020} height={50} fill="#9E2219" />
          <rect x={-10} y={920} width={960} height={150} rx={18} fill="#1D3550" />
          {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={2 + i * 136} y={930} width={124} height={130} rx={10} fill="#2E5478" />)}
          {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={12 + i * 136} y={938} width={36} height={114} fill="#fff" opacity={0.08} />)}
          <rect x={300} y={1080} width={8} height={130} fill="#9E2219" /><rect x={620} y={1080} width={8} height={130} fill="#9E2219" />
          <rect x={30} y={890} width={240} height={24} rx={4} fill="#121821" />
          <text x={150} y={909} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={19} fill="#FFB547" letterSpacing={3}>ZYTGLOGGE</text>
          {[90, 250, 680, 840].map((x) => <circle key={x} cx={x} cy={1222} r={30} fill="#141A24" />)}
        </g>
        <rect x={-300} y={1400} width={1700} height={700} fill="#1A1F29" />
      </Layer>
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);

/* ---------------- modern apartment block (for "buying") ---------------- */
export const FlatPlate: React.FC<{ cam: Cam; dim?: number }> = ({ cam, dim = 0 }) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Sky id="fl" />
      <Layer d={0.15} cam={cam}><rect x={-600} y={-600} width={2300} height={2000} fill="url(#fl-sky)" /></Layer>
      <Layer d={0.25} cam={cam}><Alps id="fl" y={1000} /></Layer>
      <Layer d={0.5} cam={cam}><Trees fill="#2F5A44" items={Array.from({ length: 16 }).map((_, i) => [-120 + i * 90, 1020, 46 + ((i * 7) % 18)] as [number, number, number])} /></Layer>
      <Layer d={0.8} cam={cam}>
        <rect x={150} y={420} width={780} height={640} fill="#E9E4DA" />
        <rect x={540} y={420} width={390} height={640} fill="#D6D0C4" />
        <rect x={140} y={404} width={800} height={20} fill="#59606C" />
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <rect x={150} y={512 + r * 112} width={780} height={10} fill="#BFB8AA" />
            {Array.from({ length: 4 }).map((_, c) => (
              <g key={c}>
                <rect x={180 + c * 190} y={436 + r * 112} width={150} height={76} fill={(r + c) % 3 ? '#FFD08A' : '#2D3B52'} opacity={(r + c) % 3 ? 0.85 : 1} />
                <rect x={170 + c * 190} y={500 + r * 112} width={170} height={8} fill="#59606C" />
                <rect x={170 + c * 190} y={478 + r * 112} width={170} height={3} fill="#59606C" opacity={0.7} />
              </g>
            ))}
          </g>
        ))}
        <rect x={-300} y={1060} width={1700} height={30} fill="#9AA3AE" />
        <rect x={-300} y={1090} width={1700} height={900} fill="#2A4A3A" />
        <Trees fill="#1F4031" items={[[90, 1040, 110], [1000, 1050, 100], [230, 1080, 60]]} />
      </Layer>
      <rect width={1080} height={1920} fill={C.navyDeep} opacity={dim} />
    </svg>
  </AbsoluteFill>
);
