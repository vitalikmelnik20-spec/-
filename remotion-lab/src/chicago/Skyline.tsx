// Chicago skyline as SVG paths: Willis Tower (stepped tubes + twin antennas), tapered Hancock with
// X-bracing, Aon Center, Marina City "corncobs", an art-deco stepped tower, plus filler towers.
// The outline can draw itself with @remotion/paths evolvePath (depth-layer + line-draw opening).
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { rand } from './theme';

export const SKY_W = 1900;
export const SKY_H = 1400;
type B = { t: 'box' | 'willis' | 'hancock' | 'aon' | 'marina' | 'deco' | 'spire'; x: number; w: number; h: number };
const MID: B[] = [
  { t: 'box', x: 40, w: 120, h: 470 }, { t: 'deco', x: 175, w: 120, h: 660 }, { t: 'box', x: 310, w: 100, h: 540 },
  { t: 'willis', x: 430, w: 190, h: 1080 }, { t: 'box', x: 640, w: 120, h: 600 }, { t: 'spire', x: 775, w: 110, h: 760 },
  { t: 'aon', x: 905, w: 135, h: 930 }, { t: 'box', x: 1055, w: 95, h: 520 }, { t: 'marina', x: 1165, w: 150, h: 540 },
  { t: 'box', x: 1330, w: 110, h: 640 }, { t: 'hancock', x: 1455, w: 175, h: 950 }, { t: 'box', x: 1645, w: 115, h: 560 },
  { t: 'box', x: 1770, w: 120, h: 430 },
];
const G = SKY_H; // ground line
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y + h}V${y}H${x + w}V${y + h}`;
/** outline of one building as a single open path (left foot -> right foot) */
const outline = (b: B): string => {
  const { x, w, h } = b, top = G - h;
  switch (b.t) {
    case 'willis': {
      const s = (fh: number) => G - h * fh;
      return `M${x} ${G}V${s(0.46)}H${x + w * 0.28}V${s(0.83)}H${x + w * 0.28}V${s(1)}H${x + w * 0.72}V${s(0.62)}H${x + w}V${G}`;
    }
    case 'hancock':
      return `M${x} ${G}L${x + w * 0.19} ${top}H${x + w * 0.81}L${x + w} ${G}`;
    case 'deco':
      return `M${x} ${G}V${G - h * 0.78}H${x + w * 0.12}V${G - h * 0.88}H${x + w * 0.2}L${x + w * 0.5} ${top}L${x + w * 0.8} ${G - h * 0.88}H${x + w * 0.88}V${G - h * 0.78}H${x + w}V${G}`;
    case 'spire':
      return `M${x} ${G}V${G - h * 0.86}Q${x + w / 2} ${G - h} ${x + w} ${G - h * 0.86}V${G}`;
    case 'marina': {
      const cw = w * 0.4, r = cw / 2;
      return `M${x} ${G}V${top + r}A${r} ${r} 0 0 1 ${x + cw} ${top + r}V${G}M${x + w - cw} ${G}V${top + r}A${r} ${r} 0 0 1 ${x + w} ${top + r}V${G}`;
    }
    default:
      return rect(x, top, w, h);
  }
};
const antennas = (b: B): [number, number, number][] => {
  const top = G - b.h;
  if (b.t === 'willis') return [[b.x + b.w * 0.39, top - 150, top], [b.x + b.w * 0.61, top - 130, top]];
  if (b.t === 'hancock') return [[b.x + b.w * 0.4, top - 135, top], [b.x + b.w * 0.6, top - 115, top]];
  if (b.t === 'spire') return [[b.x + b.w / 2, top - 70, G - b.h * 0.9]];
  return [];
};
const PATHS = MID.map(outline);
const WINDOWS = (() => {
  const r = rand(17);
  const out: { x: number; y: number; k: number }[] = [];
  MID.forEach((b) => {
    for (let y = G - b.h + 30; y < G - 14; y += 21)
      for (let x = b.x + 10; x < b.x + b.w - 12; x += 15) {
        const v = r();
        if (v < 0.36) out.push({ x, y, k: r() });
      }
  });
  return out;
})();
const NEAR = (() => {
  const r = rand(9);
  return Array.from({ length: 16 }, (_, i) => ({ x: i * 125 - 30 + r() * 30, w: 90 + r() * 120, h: 120 + r() * 260, tower: r() < 0.35 }));
})();

export type Mood = { skyTop: string; skyMid: string; skyLow: string; body: string; body2: string; rim: string; lit: string; lit2: string; far: string };
export const MOODS: Record<'golden' | 'dusk' | 'night', Mood> = {
  golden: { skyTop: '#22306A', skyMid: '#A9567A', skyLow: '#FFB46A', body: '#3B2E5A', body2: '#15122A', rim: '#FFB066', lit: '#FFD59A', lit2: '#FFE7C4', far: '#7C5A86' },
  dusk: { skyTop: '#0A1230', skyMid: '#27407E', skyLow: '#B98FB8', body: '#24325E', body2: '#0E1430', rim: '#8CA8FF', lit: '#FFD68C', lit2: '#C8DCFF', far: '#3A4C80' },
  night: { skyTop: '#03050D', skyMid: '#0B1430', skyLow: '#1B2650', body: '#121A36', body2: '#070B18', rim: '#6E8CFF', lit: '#FFD68C', lit2: '#C8E1FF', far: '#1E2850' },
};

/** the skyline layer set. draw: 0..1 outline progress; fill: 0..1; lights: 0..1; blink frame for antenna lights */
export const Skyline: React.FC<{ mood: Mood; draw?: number; fill?: number; lights?: number; frame: number; showNear?: boolean; showFar?: boolean; style?: React.CSSProperties }> = ({
  mood, draw = 1, fill = 1, lights = 1, frame, showNear = true, showFar = true, style,
}) => {
  const id = React.useId().replace(/:/g, '');
  const blink = Math.sin(frame / 4) > 0;
  return (
    <svg viewBox={`0 0 ${SKY_W} ${SKY_H}`} width={SKY_W} height={SKY_H} style={{ overflow: 'visible', ...style }}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mood.body} />
          <stop offset="1" stopColor={mood.body2} />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={mood.rim} stopOpacity="0.5" />
          <stop offset="0.35" stopColor={mood.rim} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showFar && (
        <g opacity={0.55 * fill} style={{ filter: 'blur(3px)' }}>
          {Array.from({ length: 30 }, (_, i) => {
            const r = rand(100 + i);
            const w = 70 + r() * 110, h = 220 + r() * 460, x = i * 64 + r() * 30 - 40;
            return <rect key={i} x={x} y={G - h - 60} width={w} height={h + 60} fill={mood.far} />;
          })}
        </g>
      )}
      {/* filled bodies */}
      <g opacity={fill}>
        {PATHS.map((d, i) => (
          <g key={i}>
            <path d={d + 'Z'} fill={`url(#b${id})`} />
            <path d={d + 'Z'} fill={`url(#r${id})`} />
          </g>
        ))}
        {/* Hancock X-bracing and Aon ribs */}
        {MID.filter((b) => b.t === 'hancock').map((b, i) =>
          Array.from({ length: 5 }, (_, k) => {
            const ya = G - b.h + (k * b.h) / 5, yb = ya + b.h / 5;
            const inset = (y: number) => (b.w * 0.19 * (G - y)) / b.h;
            return (
              <path key={`${i}-${k}`} d={`M${b.x + inset(ya)} ${ya}L${b.x + b.w - inset(yb)} ${yb}M${b.x + b.w - inset(ya)} ${ya}L${b.x + inset(yb)} ${yb}M${b.x + inset(yb)} ${yb}H${b.x + b.w - inset(yb)}`}
                stroke="rgba(255,255,255,0.16)" strokeWidth={4} />
            );
          }),
        )}
        {MID.filter((b) => b.t === 'aon').map((b, i) =>
          Array.from({ length: 16 }, (_, k) => <path key={`${i}-${k}`} d={`M${b.x + (k * b.w) / 16} ${G - b.h}V${G}`} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />),
        )}
      </g>
      {/* windows light up */}
      <g>
        {WINDOWS.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width={6} height={9} fill={w.k < 0.72 ? mood.lit : mood.lit2}
            opacity={Math.max(0, Math.min(1, lights * 3 - w.k * 2)) * (0.55 + 0.45 * w.k)} />
        ))}
      </g>
      {/* self-drawing outline */}
      {draw > 0 && draw < 1.02 && (
        <g fill="none" stroke={mood.rim} strokeWidth={4} strokeLinejoin="round" opacity={1 - Math.max(0, fill - 0.6) * 1.5}>
          {PATHS.map((d, i) => {
            const ev = evolvePath(Math.min(1, Math.max(0, draw * 1.25 - (i % 5) * 0.06)), d);
            return <path key={i} d={d} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />;
          })}
        </g>
      )}
      {/* antennas + blinking aircraft lights */}
      <g opacity={fill}>
        {MID.flatMap((b) => antennas(b)).map(([x, y, base], i) => (
          <g key={i}>
            <rect x={x - 3} y={y} width={6} height={base - y} fill="#D9DEE8" />
            <circle cx={x} cy={y} r={7} fill="#FF4B3E" opacity={blink || i % 2 ? 0.95 : 0.25} />
          </g>
        ))}
      </g>
      {showNear && (
        <g opacity={fill}>
          {NEAR.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={G - b.h + 30} width={b.w} height={b.h} fill="#04060C" />
              {b.tower && (
                <g fill="#04060C">
                  <rect x={b.x + b.w * 0.6 - 18} y={G - b.h - 10} width={36} height={30} />
                  <path d={`M${b.x + b.w * 0.6 - 22} ${G - b.h - 10}L${b.x + b.w * 0.6} ${G - b.h - 30}L${b.x + b.w * 0.6 + 22} ${G - b.h - 10}Z`} />
                </g>
              )}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};
