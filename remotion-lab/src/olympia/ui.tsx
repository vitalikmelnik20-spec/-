// Reusable graphic components: scene wrapper with transitions, headline, stat card, animated dollar value,
// source label, chips, captions, backgrounds.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, CUT, HEAD, NEXT, PAGES, SceneKey, XF, clamp, ease, money, prog } from './theme';

/* ---------------- scene wrapper: visible from its cut until the next cut + overlap ---------------- */
export const Scene: React.FC<{ k: SceneKey; enter?: 'push' | 'zoom' | 'wipe' | 'iris' | 'none'; children: React.ReactNode }> = ({ k, enter = 'push', children }) => {
  const frame = useCurrentFrame();
  const a = CUT[k], b = NEXT[k] + XF;
  if (frame < a || frame >= b) return null;
  const p = prog(frame, a, a + XF, ease.inOut);
  const v = interpolate(frame, [a, a + XF / 2, a + XF], [0, 1, 0], clamp); // speed proxy for motion blur
  let style: React.CSSProperties = {};
  if (enter === 'push') style = { translate: `0px ${(1 - p) * 760}px`, filter: v > 0.01 ? `blur(${v * 10}px)` : undefined };
  if (enter === 'zoom') style = { scale: String(1.3 - 0.3 * p), opacity: Math.min(1, p * 1.6), filter: v > 0.01 ? `blur(${v * 12}px)` : undefined };
  if (enter === 'wipe') style = { clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` };
  if (enter === 'iris') style = { clipPath: `circle(${p * 120}% at 50% 48%)` };
  return <AbsoluteFill style={{ overflow: 'hidden', ...style }}>{children}</AbsoluteFill>;
};

/* ---------------- text ---------------- */
export const Rise: React.FC<{ at: number; children: React.ReactNode; dy?: number; dur?: number; style?: React.CSSProperties; out?: number }> = ({ at, children, dy = 50, dur = 14, style, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = prog(frame, at, at + dur);
  const o = out !== undefined ? 1 - prog(frame, out, out + 8, ease.inOut) : 1;
  if (o <= 0) return null;
  return <div style={{ opacity: p * o, translate: `0px ${(1 - p) * dy - (1 - o) * 30}px`, filter: p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined, ...style }}>{children}</div>;
};

export const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 0.6 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: ease.back });
  return <div style={{ scale: String(from + (1 - from) * p), opacity: Math.min(1, p * 2), ...style }}>{children}</div>;
};

export const Headline: React.FC<{ text: string; size: number; color?: string; at: number; stagger?: number; style?: React.CSSProperties; weight?: number }> = ({ text, size, color = C.off, at, stagger = 3, style, weight = 900 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.26em', fontFamily: HEAD, fontWeight: weight, fontSize: size, lineHeight: 1.0, color, letterSpacing: -size * 0.01, textAlign: 'center', ...style }}>
      {text.split(' ').map((w, i) => {
        const p = interpolate(frame, [at + i * stagger, at + i * stagger + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return <span key={i} style={{ opacity: p, translate: `0px ${(1 - p) * 46}px`, filter: p < 0.98 ? `blur(${(1 - p) * 9}px)` : undefined, textShadow: '0 8px 34px rgba(0,0,0,0.55)' }}>{w}</span>;
      })}
    </div>
  );
};

export const Chip: React.FC<{ at: number; children: React.ReactNode; bg?: string; fg?: string; size?: number; border?: string; style?: React.CSSProperties }> = ({ at, children, bg = 'rgba(6,13,29,0.72)', fg = C.off, size = 32, border = 'rgba(255,255,255,0.22)', style }) => (
  <Pop at={at} from={0.7}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, padding: `${size * 0.36}px ${size * 0.75}px`, borderRadius: 999, background: bg, color: fg, border: `2px solid ${border}`, fontFamily: BODY, fontWeight: 700, fontSize: size, letterSpacing: size * 0.08, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', ...style }}>{children}</div>
  </Pop>
);

/* ---------------- numbers ---------------- */
/** dollar counter: easeOutQuart count from `from` to `land`, one restrained 6% pulse when it locks */
export const Dollars: React.FC<{ value: number; from: number; land: number; size: number; color?: string; lockColor?: string; suffix?: React.ReactNode }> = ({ value, from, land, size, color = C.off, lockColor = C.off, suffix }) => {
  const frame = useCurrentFrame();
  const u = interpolate(frame, [from, land], [0, 1], { ...clamp, easing: ease.quart });
  const locked = frame >= land;
  const pulse = interpolate(frame, [land, land + 4, land + 12], [1, 1.06, 1], clamp);
  const shown = value * u;
  const vis = interpolate(frame, [from, from + 4], [0, 1], clamp); // nothing (not "$0") until the count starts
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: size * 0.12, scale: String(pulse), opacity: vis }}>
      <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.02, color: locked ? lockColor : color, fontVariantNumeric: 'tabular-nums', textShadow: locked ? `0 0 ${size * 0.35}px ${lockColor}55` : undefined }}>{money(shown)}</span>
      {suffix}
    </div>
  );
};

/* ---------------- source label ---------------- */
export const Source: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 29, color = C.gray, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: BODY, fontWeight: 600, fontSize: size, color, letterSpacing: 0.3, ...style }}>
    <svg width={size * 0.8} height={size} viewBox="0 0 16 20"><path d="M2 1h8l4 4v14H2z" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" /><path d="M5 9h6M5 12h6M5 15h4" stroke={color} strokeWidth={1.6} /></svg>
    <span>{children}</span>
  </div>
);

/* ---------------- card ---------------- */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; accent?: string }> = ({ children, style, accent }) => {
  const frame = useCurrentFrame();
  return (
  <div style={{ translate: `0px ${Math.sin(frame / 22) * 6}px`, background: 'rgba(7,14,31,0.84)', border: '2px solid rgba(255,255,255,0.13)', borderTop: accent ? `6px solid ${accent}` : undefined, borderRadius: 36, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', padding: '34px 40px', ...style }}>{children}</div>
  );
};
export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.blue, size = 34 }) => (
  <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, letterSpacing: size * 0.12, color, textAlign: 'center' }}>{children}</div>
);

/* ---------------- backgrounds ---------------- */
export const NavyBg: React.FC<{ tint?: string }> = ({ tint = C.forest }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 70% at 50% 35%, #12264A 0%, ${C.navy} 45%, ${C.navyDeep} 100%)` }}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.04) 2px, transparent 2px)', backgroundSize: '96px 96px', backgroundPosition: `0px ${frame * 0.8}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(60% 30% at 50% 100%, ${tint}AA 0%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};
/** darkens the lower part of a plate where cards and captions sit */
export const Shade: React.FC<{ from?: number; top?: boolean; strength?: number }> = ({ from = 0.38, top = true, strength = 0.92 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top ? `rgba(6,13,29,${strength * 0.75}) 0%, rgba(6,13,29,0) 26%,` : ''} rgba(6,13,29,0) ${from * 100}%, rgba(6,13,29,${strength}) ${from * 100 + 26}%, rgba(6,13,29,${strength}) 100%)` }} />
);
export const Vignette: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(80% 60% at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)', pointerEvents: 'none' }} />;

/* ---------------- captions: phrase pages, active word highlighted, keywords coloured ---------------- */
const EM: Record<string, string> = { money: C.coral, good: C.green, warn: C.coral, key: '#9CCBFF' };
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const page = PAGES.find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  const pin = interpolate(t - page.start, [0, 0.12], [0.9, 1], { ...clamp, easing: ease.back });
  let active = -1;
  page.tokens.forEach((tk, i) => { if (t >= tk.start) active = i; });
  return (
    <div style={{ position: 'absolute', left: 120, width: 840, top: 1352, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', columnGap: 14, rowGap: 6, scale: String(pin), fontFamily: HEAD, fontWeight: 800, fontSize: 56, lineHeight: 1.16 }}>
      {page.tokens.map((tk, i) => {
        const on = i === active && t < tk.end + 0.08;
        const col = tk.em ? EM[tk.em] : C.off;
        return (
          <span key={i} style={{ color: on ? C.navyDeep : i > active ? 'rgba(244,241,234,0.62)' : col, background: on ? (tk.em ? EM[tk.em] : C.off) : 'transparent', borderRadius: 12, padding: '0 10px', WebkitTextStroke: on ? undefined : '3px rgba(4,8,18,0.9)', paintOrder: 'stroke fill', textShadow: on ? undefined : '0 4px 18px rgba(0,0,0,0.65)' }}>{tk.text}</span>
        );
      })}
    </div>
  );
};

/* ---------------- icons ---------------- */
export const CalendarIcon: React.FC<{ size: number; flip: number; label: string }> = ({ size, flip, label }) => (
  <div style={{ width: size, height: size * 1.05, borderRadius: size * 0.14, background: C.off, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.4)', position: 'relative', fontFamily: BODY }}>
    <div style={{ height: size * 0.3, background: C.coral, color: C.off, fontWeight: 700, fontSize: size * 0.16, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 2 }}>{label}</div>
    <div style={{ position: 'absolute', top: size * 0.3, left: 0, right: 0, bottom: 0, transformOrigin: 'top', transform: `perspective(400px) rotateX(${flip * 90}deg)`, background: C.off, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.navy, fontWeight: 700, fontSize: size * 0.36 }}>1</div>
  </div>
);
export const Check: React.FC<{ size?: number; color?: string; mark?: 'check' | 'alert' }> = ({ size = 56, color = C.green, mark = 'check' }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40">
    <circle r={18} fill={color} />
    {mark === 'check' ? <path d="M-8 0 L-2 6 L9 -6" stroke={C.navyDeep} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <g fill={C.navyDeep}><rect x={-2.5} y={-10} width={5} height={13} rx={2} /><circle cy={8} r={3} /></g>}
  </svg>
);
