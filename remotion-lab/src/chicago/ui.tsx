// Reusable pieces built from video-shotcraft shot cards:
//   Odometer  <- odometer-digit-roll (per-digit reels, left-to-right lock, half-row overshoot, speed-gated ghosts, lock pulse)
//   BlurWords <- blur-slide (word stagger ~3.5f, y 40->0 + blur 10->0 + opacity on ONE shared progress)
//   CountUp   <- counter-confetti count curve (easeOutQuart + 1.3 scale overshoot, impact ring)
import React from 'react';
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { C, FONT, clamp, ease, money } from './theme';

/* ---------------- odometer ---------------- */
const SPIN = 0.85; // rows per frame while spinning
type Glyph = { d: number } | { s: string };
export const Odometer: React.FC<{
  glyphs: Glyph[]; // digits roll, strings stay put ($ , . ~)
  lockAt: number; // frame the LAST digit locks
  spinFrom?: number;
  size?: number;
  color: string;
  lockColor?: string;
}> = ({ glyphs, lockAt, spinFrom = 0, size = 200, color, lockColor }) => {
  const frame = useCurrentFrame();
  const row = Math.round(size * 1.1), dw = Math.round(size * 0.66);
  const digits = glyphs.map((g, i) => ('d' in g ? i : -1)).filter((i) => i >= 0);
  const n = digits.length;
  const posAt = (fr: number, k: number, d: number) => {
    const s = lockAt - 22 - (n - 1 - k) * 7; // start of deceleration for reel k
    const t = Math.max(0, fr - spinFrom);
    const p0 = SPIN * Math.max(0, s - spinFrom);
    const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
    if (fr < s) return SPIN * t;
    if (fr < s + 16) return interpolate(fr, [s, s + 16], [p0, T + 0.5], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (fr < s + 22) return interpolate(fr, [s + 16, s + 22], [T + 0.5, T], { ...clamp, easing: Easing.out(Easing.cubic) });
    return T;
  };
  const locked = frame >= lockAt;
  const ink = lockColor ? interpolateColors(frame, [lockAt, lockAt + 4], [color, lockColor]) : color;
  const pulse = interpolate(frame, [lockAt, lockAt + 4, lockAt + 8], [1, 1.06, 1], clamp);
  const cell = (content: React.ReactNode, w: number, key: React.Key) => (
    <div key={key} style={{ position: 'relative', width: w, height: row, overflow: 'hidden' }}>{content}</div>
  );
  const strip = (pos: number, op: number, dy: number, key: string) => (
    <div key={key} style={{ position: 'absolute', left: 0, top: 0, width: dw, translate: `0px ${-(pos % 10) * row + dy}px`, opacity: op }}>
      {Array.from({ length: 20 }).map((_, k) => (
        <div key={k} style={{ width: dw, height: row, lineHeight: `${row}px`, textAlign: 'center', fontSize: size, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: ink }}>{k % 10}</div>
      ))}
    </div>
  );
  let k = -1;
  return (
    <div style={{ display: 'flex', fontFamily: FONT, scale: String(pulse), textShadow: locked ? `0 0 ${size * 0.25}px ${ink}66` : undefined }}>
      {glyphs.map((g, i) => {
        if ('s' in g) return cell(<div style={{ height: row, lineHeight: `${row}px`, fontSize: size, fontWeight: 900, color: ink }}>{g.s}</div>, size * (g.s === ',' || g.s === '.' ? 0.3 : 0.62), i);
        k += 1;
        const pos = posAt(frame, k, g.d), speed = Math.abs(pos - posAt(frame - 1, k, g.d));
        const gate = interpolate(speed, [0.06, 0.5], [0, 1], clamp);
        return cell(<>
          {gate > 0.001 && strip(pos, 0.25 * gate, row * 0.5, 'a')}
          {gate > 0.001 && strip(pos, 0.12 * gate, -row * 0.5, 'b')}
          {strip(pos, 1, 0, 'c')}
        </>, dw, i);
      })}
    </div>
  );
};
export const glyphsOf = (s: string): Glyph[] => [...s].map((ch) => (/[0-9]/.test(ch) ? { d: +ch } : { s: ch }));

/* ---------------- blur-slide words ---------------- */
export const BlurWords: React.FC<{ text: string; start: number; size: number; color?: string; gap?: number; weight?: number; dy?: number; style?: React.CSSProperties }> = ({
  text, start, size, color = C.white, gap = 3.5, weight = 900, dy = 40, style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.28em', fontFamily: FONT, fontWeight: weight, fontSize: size, color, lineHeight: 1.02, ...style }}>
      {text.split(' ').map((w, i) => {
        const p = interpolate(frame, [start + i * gap, start + i * gap + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <span key={i} style={{ opacity: p, translate: `0px ${(1 - p) * dy}px`, filter: `blur(${(1 - p) * 10}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)', WebkitTextStroke: `${size * 0.012}px rgba(4,7,16,0.6)` }}>{w}</span>
        );
      })}
    </div>
  );
};

/* ---------------- chips ---------------- */
export const Chip: React.FC<{ children: React.ReactNode; at: number; bg?: string; fg?: string; size?: number; border?: string; weight?: number; style?: React.CSSProperties }> = ({
  children, at, bg = 'rgba(255,255,255,0.95)', fg = C.ink, size = 40, border, weight = 800, style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: ease.back });
  if (frame < at) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: 999, background: bg, color: fg, fontFamily: FONT, fontWeight: weight, fontSize: size, letterSpacing: size * 0.04, border: border ? `3px solid ${border}` : undefined, boxShadow: '0 12px 30px rgba(0,0,0,0.35)', scale: String(p), opacity: Math.min(1, p * 2), whiteSpace: 'nowrap', ...style }}>
      {children}
    </div>
  );
};

/* ---------------- count-up (easeOutQuart + overshoot) ---------------- */
export const CountUp: React.FC<{ to: number; from: number; land: number; size: number; color: string; prefix?: string; suffix?: string; fmt?: (v: number) => string }> = ({
  to, from, land, size, color, prefix = '', suffix = '', fmt = money,
}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const u = interpolate(frame, [from, land], [0, 1], { ...clamp, easing: ease.quart });
  const sc = frame < land ? interpolate(frame, [from, land], [0.4, 1.3], { ...clamp, easing: Easing.out(Easing.cubic) }) : interpolate(frame, [land, land + 10], [1.3, 1], { ...clamp, easing: ease.back });
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color: u >= 1 ? color : C.white, scale: String(sc), fontVariantNumeric: 'tabular-nums', textShadow: u >= 1 ? `0 0 ${size * 0.3}px ${color}88, 0 8px 30px rgba(0,0,0,0.6)` : '0 8px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
      {prefix}{fmt(u >= 1 ? to : to * u)}{suffix}
    </div>
  );
};

/** expanding impact ring at a landing frame */
export const ImpactRing: React.FC<{ at: number; color: string; size?: number }> = ({ at, color, size = 500 }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 24) return null;
  const p = interpolate(frame, [at, at + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.poly(4)) });
  return <div style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', border: `${10 * (1 - p) + 2}px solid ${color}`, scale: String(0.35 + 2.6 * p), opacity: 1 - p }} />;
};

/* ---------------- backgrounds ---------------- */
export const DarkGrid: React.FC<{ glow?: string; drift?: number }> = ({ glow = C.green, drift = 0.6 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 40%, #0F1A33 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '90px 90px', backgroundPosition: `${frame * drift}px ${frame * drift}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 25% at 50% 45%, ${glow}22 0%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};

/* ---------------- icons (flat, 100x100 viewBox) ---------------- */
export const Icon: React.FC<{ kind: 'bolt' | 'flame' | 'drop' | 'wifi' | 'phone'; size: number; color: string }> = ({ kind, size, color }) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size}>
    <circle r={48} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
    <g fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'bolt' && <path d="M6 -32 L-18 4 H0 L-6 32 L18 -4 H0 Z" />}
      {kind === 'flame' && <path d="M0 -34 C24 -8 24 28 0 30 C-24 28 -24 -4 -6 -14 C-3 -3 3 -5 0 -34 Z" />}
      {kind === 'drop' && <path d="M0 -32 C20 -4 24 28 0 30 C-24 28 -20 -4 0 -32 Z" />}
      {kind === 'wifi' && <g fill="none" strokeWidth={7}>{[14, 26, 38].map((r) => <path key={r} d={`M${-r * 0.7} ${18 - r * 0.7} A${r} ${r} 0 0 1 ${r * 0.7} ${18 - r * 0.7}`} />)}<circle cy={18} r={5} fill={color} /></g>}
      {kind === 'phone' && <g fill="none" strokeWidth={6}><rect x={-15} y={-30} width={30} height={60} rx={7} /><circle cy={20} r={3} fill={color} /></g>}
    </g>
  </svg>
);
