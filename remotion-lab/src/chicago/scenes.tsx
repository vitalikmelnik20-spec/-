// The nine scenes. Each runs on its own local frame (0 = its cut); price moments are pinned to the
// narrator's word cues. Shot-card sources noted per scene.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, Solid, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { starburst } from '@remotion/effects/starburst';
import { C, CAPTIONS, CUTS, FONT, clamp, cue, ease, f, money, prog, rand } from './theme';
import { Skyline, MOODS, SKY_W, SKY_H } from './Skyline';
import { BlurWords, Chip, CountUp, DarkGrid, Icon, ImpactRing, Odometer, glyphsOf } from './ui';

const local = (abs: number, scene: keyof typeof CUTS) => abs - CUTS[scene];
const Center: React.FC<{ y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ y, children, style }) => (
  <div style={{ position: 'absolute', left: 0, width: 1080, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: 'translateY(-50%)', ...style }}>{children}</div>
);
const SkyBg: React.FC<{ mood: keyof typeof MOODS }> = ({ mood }) => {
  const m = MOODS[mood];
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${m.skyTop} 0%, ${m.skyMid} 52%, ${m.skyLow} 78%, ${m.skyLow} 100%)` }} />;
};
const placeSky = (scale: number, ground: number, cx = 540): React.CSSProperties => ({
  position: 'absolute', left: cx - (SKY_W * scale) / 2, top: ground - SKY_H * scale, width: SKY_W, height: SKY_H, scale: String(scale), transformOrigin: '0 0',
});

/* 0–3 s · HOOK — depth-layer-moves (push-in over a self-drawing skyline) + blur-slide headline */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 100], [0.62, 0.8], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <SkyBg mood="golden" />
      <AbsoluteFill style={{ background: 'radial-gradient(35% 22% at 28% 62%, rgba(255,214,150,0.85), rgba(255,160,90,0) 70%)' }} />
      <div style={placeSky(push, 1560, 560 - frame * 0.8)}>
        <Skyline mood={MOODS.golden} frame={frame} draw={prog(frame, 0, 34, Easing.inOut(Easing.quad))} fill={prog(frame, 16, 46)} lights={prog(frame, 30, 75)} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 1555, width: 1080, height: 365, background: 'linear-gradient(180deg, #120E22 0%, #07060E 100%)' }}>
        {Array.from({ length: 26 }, (_, i) => { const r = rand(i + 40); const x = r() * 1080; return <div key={i} style={{ position: 'absolute', left: x - 3, top: 0, width: 6, height: 120 + r() * 200, background: `linear-gradient(180deg, ${r() < 0.7 ? 'rgba(255,200,130,0.55)' : 'rgba(200,220,255,0.45)'}, transparent)`, opacity: prog(frame, 30 + r() * 30, 60 + r() * 30) * (0.6 + 0.4 * Math.sin(frame / 6 + i)) }} />; })}
      </div>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,8,18,0.62) 0%, rgba(5,8,18,0.25) 45%, rgba(5,8,18,0) 60%, rgba(5,8,18,0.55) 100%)' }} />
      <Center y={470}><BlurWords text="COULD YOU" start={4} size={118} /></Center>
      <Center y={610}><BlurWords text="AFFORD" start={10} size={215} color={C.gold} /></Center>
      <Center y={770}><BlurWords text="CHICAGO?" start={16} size={168} /></Center>
    </AbsoluteFill>
  );
};

/* 3–8 s · RENT — odometer-digit-roll locks digit by digit on "twenty-four fifty-seven" */
const Building: React.FC<{ lit: number; frame: number }> = ({ lit, frame }) => {
  const rise = prog(frame, 0, 22, ease.back);
  return (
    <svg viewBox="0 0 600 520" width={600} height={520} style={{ translate: `0px ${(1 - rise) * 300}px`, opacity: rise }}>
      <rect x={40} y={20} width={520} height={500} rx={10} fill="#5E352A" />
      <rect x={24} y={6} width={552} height={26} rx={6} fill="#3B2A2A" />
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => {
        const isUnit = r === 2 && (c === 1 || c === 2);
        const on = (r * 4 + c) % 3 === 0;
        return <rect key={`${r}-${c}`} x={78 + c * 120} y={58 + r * 92} width={86} height={62} rx={6}
          fill={isUnit ? (lit > 0 ? '#FFE0A8' : '#3D5878') : on ? '#FFB766' : '#3D5878'} opacity={isUnit ? 1 : 0.85} />;
      }))}
      {lit > 0 && <rect x={190} y={234} width={222} height={78} rx={10} fill="none" stroke={C.green} strokeWidth={6} opacity={lit} />}
    </svg>
  );
};
export const Rent: React.FC = () => {
  const frame = useCurrentFrame();
  const lockAt = local(f(6.6), 'rent');
  return (
    <AbsoluteFill>
      <DarkGrid glow={C.orange} />
      <Center y={430}><Chip at={4} size={50}>RENT · 1-BEDROOM</Chip></Center>
      <Center y={600}><Odometer glyphs={glyphsOf('~$2,457')} lockAt={lockAt} spinFrom={26} size={185} color={C.white} lockColor={C.orange} /></Center>
      <ImpactRingAt at={lockAt} y={600} color={C.orange} />
      <Center y={735}>{frame >= lockAt && <BlurWords text="/MONTH" start={lockAt + 2} size={64} weight={800} dy={20} />}</Center>
      <Center y={830}><Chip at={lockAt + 14} size={32} bg="rgba(10,15,30,0.85)" fg="#fff" border="rgba(255,255,255,0.2)" weight={600}>Average asking rent · citywide</Chip></Center>
      <Center y={895}><Chip at={lockAt + 24} size={28} bg="rgba(10,15,30,0.7)" fg="rgba(255,255,255,0.85)" weight={500}>Varies a lot by neighborhood</Chip></Center>
      <Center y={1150}><Building lit={prog(frame, lockAt, lockAt + 8)} frame={frame} /></Center>
    </AbsoluteFill>
  );
};
const ImpactRingAt: React.FC<{ at: number; y: number; color: string }> = ({ at, y, color }) => (
  <Center y={y}><ImpactRing at={at} color={color} /></Center>
);

/* 8–13 s · GROCERIES — list-stack-press (cards rise and stack, each landing presses the pile) */
const ITEMS = [
  { t: 'MILK', c: '#5AB4FF' }, { t: 'EGGS', c: '#FFE3A3' }, { t: 'BREAD', c: '#E0A050' }, { t: 'CHICKEN', c: '#F2B58A' }, { t: 'FRUIT & VEG', c: '#5BD06B' },
];
export const Food: React.FC = () => {
  const frame = useCurrentFrame();
  const CUES = [16, 28, 40, 52, 64];
  const press = CUES.reduce((acc, c) => acc + interpolate(frame, [c + 22, c + 26, c + 30], [0, 6, 0], clamp), 0);
  const land = local(cue('food.price'), 'food') + 14;
  const count = CUES.filter((c) => frame >= c + 22).length;
  return (
    <AbsoluteFill>
      <DarkGrid glow={C.green} />
      <Center y={430}><Chip at={4} size={50}>GROCERIES · FOOD</Chip></Center>
      <Center y={600}><CountUp to={386} from={land - 16} land={land} size={185} color={C.green} prefix="~" /></Center>
      <ImpactRingAt at={land} y={600} color={C.green} />
      <Center y={730}>{frame >= land && <BlurWords text="/MONTH" start={land + 2} size={64} weight={800} dy={20} />}</Center>
      <Center y={815}><Chip at={land + 12} size={32} bg="rgba(10,15,30,0.85)" fg="#fff" border="rgba(255,255,255,0.2)" weight={600}>1 adult estimate</Chip></Center>
      {/* the stack */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, translate: `0px ${press}px` }}>
        {ITEMS.map((it, i) => {
          const c = CUES[i];
          const p = interpolate(frame, [c, c + 22], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0.05, 0.25, 1.12) });
          if (frame < c) return null;
          const y = 1250 - i * 84;
          const tilt = (1 - p) * (i % 2 ? 2 : -2);
          const hl = interpolate(frame, [c + 25, c + 32], [0, 1], clamp);
          return (
            <div key={i} style={{ position: 'absolute', left: 170, top: y - 52 + (1 - p) * 600, width: 740, height: 104, borderRadius: 22, background: C.card, rotate: `${tilt}deg`, scale: String(1.06 - 0.06 * p), boxShadow: p < 1 ? '0 32px 64px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', padding: '0 34px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${40 * hl}%`, background: `${it.c}55` }} />
              <div style={{ width: 46, height: 46, borderRadius: 23, background: it.c, marginRight: 26, position: 'relative' }} />
              <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.cardInk, letterSpacing: 2, position: 'relative' }}>{it.t}</div>
            </div>
          );
        })}
        {/* one glaze sweep over the whole pile */}
        <div style={{ position: 'absolute', left: interpolate(frame, [82, 98], [-700, 1500], clamp), top: 820, width: 300, height: 520, rotate: '14deg', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)', mixBlendMode: 'overlay' }} />
      </div>
      <div style={{ position: 'absolute', left: 170, top: 1250 - 4 * 84 - 104, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.muted, opacity: prog(frame, 14, 20) }}>
        BASKET · <span style={{ color: C.white, fontVariantNumeric: 'tabular-nums' }}>{count}</span> ITEMS
      </div>
    </AbsoluteFill>
  );
};

/* 13–18 s · EATING OUT — card-flip-reveal (front: the thing, back: its price), flips on the spoken number */
const Burger = () => (
  <svg viewBox="-260 -130 520 260" width={360} height={180}>
    <ellipse cx={0} cy={40} rx={250} ry={80} fill="#F7F7F4" /><ellipse cx={0} cy={40} rx={190} ry={58} fill="#E6E6E0" />
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={70 + (i % 6) * 14} y={-30 + (i % 3) * 6} width={14} height={80} rx={4} fill={i % 2 ? '#F2C14E' : '#E8AE34'} transform={`rotate(${-20 + i * 4} ${100} 20)`} />)}
    <ellipse cx={-60} cy={52} rx={105} ry={24} fill="#D8913F" /><rect x={-160} y={10} width={200} height={30} rx={14} fill="#5A2E1A" />
    <path d="M-160 10 H40 L20 30 L-20 16 L-60 34 L-110 16 L-150 30Z" fill="#F5C342" /><ellipse cx={-60} cy={4} rx={108} ry={14} fill="#4CAF50" />
    <path d="M-160 -2 A100 70 0 0 1 40 -2Z" fill="#E7A355" />
  </svg>
);
const Cup = () => (
  <svg viewBox="-220 -150 440 300" width={300} height={204}>
    <ellipse cx={0} cy={90} rx={200} ry={56} fill="#FFFFFF" /><ellipse cx={0} cy={90} rx={140} ry={38} fill="#EDEDEA" />
    <path d="M-125 -20 C-125 80 -90 110 0 110 C90 110 125 80 125 -20Z" fill="#F4F4F2" />
    <path d="M118 0 A40 34 0 1 1 118 60" fill="none" stroke="#F4F4F2" strokeWidth={22} />
    <ellipse cx={0} cy={-20} rx={125} ry={34} fill="#FFFFFF" /><ellipse cx={0} cy={-18} rx={110} ry={27} fill="#A0643A" />
    <path d="M0 2 C-50 -20 -36 -44 0 -28 C36 -44 50 -20 0 2Z" fill="#F3E3CC" />
  </svg>
);
const FlipCard: React.FC<{ y: number; flipAt: number; enterAt: number; front: React.ReactNode; label: string; price: string; sub: string; color: string }> = ({ y, flipAt, enterAt, front, label, price, sub, color }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [enterAt, enterAt + 16], [0, 1], { ...clamp, easing: ease.back });
  const a = frame < flipAt + 18
    ? interpolate(frame, [flipAt, flipAt + 18], [0, 192], { ...clamp, easing: Easing.bezier(0.55, 0, 0.3, 1) })
    : interpolate(frame, [flipAt + 18, flipAt + 26], [192, 180], { ...clamp, easing: Easing.out(Easing.poly(5)) });
  const glint = Math.max(0, Math.sin((Math.min(180, a) / 180) * Math.PI)) * 0.4;
  const face: React.CSSProperties = { position: 'absolute', inset: 0, borderRadius: 34, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.45)' };
  if (frame < enterAt) return null;
  return (
    <div style={{ position: 'absolute', left: 140, top: y - 200, width: 800, height: 400, perspective: 1200, translate: `${(1 - enter) * 900}px 0px`, opacity: Math.min(1, enter * 2) }}>
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', rotate: `y ${a}deg` }}>
        <div style={{ ...face, background: `linear-gradient(160deg, #1A2340, #0E1528)`, border: '2px solid rgba(255,255,255,0.12)' }}>
          {front}
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.white, letterSpacing: 3, marginTop: 10 }}>{label}</div>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent ${30 + a / 3}%, rgba(255,255,255,${glint}) ${40 + a / 3}%, transparent ${50 + a / 3}%)` }} />
        </div>
        <div style={{ ...face, rotate: 'y 180deg', background: C.card }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 190, color, lineHeight: 1, textShadow: `0 0 40px ${color}55` }}>{price}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.cardInk, letterSpacing: 2, marginTop: 12 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
};
export const Eat: React.FC = () => {
  const frame = useCurrentFrame();
  const meal = local(cue('eat.meal'), 'eat') - 9, coffee = local(cue('eat.coffee'), 'eat') - 9;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #2A1206 0%, #120A10 48%, #06161A 52%, #0E2A2E 100%)' }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,160,60,0.25), transparent 30%), radial-gradient(circle at 80% 30%, rgba(255,120,40,0.18), transparent 25%), radial-gradient(circle at 70% 80%, rgba(120,220,220,0.14), transparent 30%)', translate: `${Math.sin(frame / 30) * 20}px 0px` }} />
      <Center y={400}><Chip at={4} size={46}>EATING OUT</Chip></Center>
      <FlipCard y={680} enterAt={6} flipAt={meal} front={<Burger />} label="CASUAL MEAL" price="~$20" sub="inexpensive restaurant" color="#0E9F5B" />
      <FlipCard y={1120} enterAt={40} flipAt={coffee} front={<Cup />} label="CAPPUCCINO" price="~$5.51" sub="one coffee" color="#0E9F5B" />
    </AbsoluteFill>
  );
};

/* 18–23 s · TRANSIT — L train with camera motion blur, then crash-zoom-punch on the fare as it locks */
const Train: React.FC = () => (
  <svg viewBox="0 0 1800 150" width={1800} height={150}>
    {[0, 1, 2, 3].map((c) => (
      <g key={c} transform={`translate(${c * 444} 0)`}>
        <rect x={0} y={10} width={430} height={128} rx={c === 3 ? 30 : 10} fill="url(#steel)" />
        <rect x={26} y={32} width={378} height={46} fill="#1B2638" />
        {Array.from({ length: 6 }, (_, k) => <rect key={k} x={40 + k * 64} y={36} width={14} height={38} fill="rgba(255,255,255,0.18)" />)}
        <rect x={10} y={98} width={410} height={8} fill="#C8102E" />
      </g>
    ))}
    <defs><linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F5FA" /><stop offset="0.45" stopColor="#C3CBD8" /><stop offset="1" stopColor="#8C96A8" /></linearGradient></defs>
    <circle cx={1765} cy={100} r={10} fill="#FFF5D0" />
  </svg>
);
const TrainPass: React.FC<{ from: number; dur: number; dir: 1 | -1; y: number; scale?: number; opacity?: number }> = ({ from, dur, dir, y, scale = 1, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = dir > 0 ? -1900 + p * 3300 : 1300 - p * 3300;
  if (frame < from || frame > from + dur) return null;
  return <div style={{ position: 'absolute', left: x, top: y, scale: String(scale), transformOrigin: '0 0', opacity }}><Train /></div>;
};
export const Transit: React.FC = () => {
  const frame = useCurrentFrame();
  const L = local(cue('transit.price'), 'transit') + 4;
  const enter = interpolate(frame, [52, 66], [0, 1], { ...clamp, easing: ease.back });
  const zoom = frame < L - 6 ? 1 : frame < L ? interpolate(frame, [L - 6, L], [1, 1.22], { ...clamp, easing: Easing.in(Easing.quad) }) : 1.22;
  const shake = frame >= L ? 14 * Math.exp(-(frame - L) / 1.8) : 0;
  const locked = frame >= L;
  const scramble = String(10 + Math.floor(rand(frame * 7 + 3)() * 89));
  return (
    <AbsoluteFill>
      <SkyBg mood="dusk" />
      <div style={placeSky(0.72, 1180)}><Skyline mood={MOODS.dusk} frame={frame} showNear={false} /></div>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,8,18,0.55), rgba(5,8,18,0.1) 50%, rgba(5,8,18,0.6))' }} />
      {/* elevated "L" structure */}
      <svg viewBox="0 0 1080 900" width={1080} height={900} style={{ position: 'absolute', top: 1110 }}>
        <rect x={0} y={0} width={1080} height={46} fill="#323C52" />
        {Array.from({ length: 24 }, (_, i) => { const x = ((i * 52 - frame * 6) % 1248 + 1248) % 1248 - 52; return <path key={i} d={`M${x} 6 L${x + 26} 40 L${x + 52} 6`} stroke="#4A5672" strokeWidth={5} fill="none" />; })}
        {Array.from({ length: 6 }, (_, i) => { const x = ((i * 260 - frame * 6) % 1560 + 1560) % 1560 - 260; return <rect key={i} x={x + 20} y={46} width={26} height={860} fill="#2A3346" />; })}
        <rect x={0} y={-10} width={1080} height={12} fill="#1E2536" />
      </svg>
      <CameraMotionBlur shutterAngle={180} samples={8}>
        <AbsoluteFill><TrainPass from={0} dur={50} dir={1} y={980} /></AbsoluteFill>
      </CameraMotionBlur>
      <TrainPass from={118} dur={70} dir={-1} y={1010} scale={0.85} opacity={0.6} />
      {/* fare card with crash zoom */}
      {frame >= 52 && (
        <div style={{ position: 'absolute', left: 140, top: 590, width: 800, height: 470, scale: String(zoom * (0.8 + 0.2 * enter)), translate: `${Math.sin(frame * 2.3) * shake}px ${Math.cos(frame * 1.7) * shake + (1 - enter) * 400}px`, opacity: Math.min(1, enter * 2), borderRadius: 40, background: 'linear-gradient(160deg, #18213A, #0B1226)', border: `3px solid ${locked ? C.green : 'rgba(255,255,255,0.15)'}`, boxShadow: locked ? `0 0 60px ${C.green}55` : '0 30px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.white, letterSpacing: 3 }}>CTA 30-DAY PASS</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 200, color: locked ? C.green : C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, textShadow: locked ? `0 0 50px ${C.green}88` : undefined }}>${locked ? '85' : frame > L - 30 ? scramble : '--'}</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 4 }}>PER MONTH · REGULAR FARE</div>
        </div>
      )}
      <Center y={1250}><Chip at={L + 6} size={40} bg={C.green} fg="#06120C" weight={900}>✓ PAID</Chip></Center>
      <Center y={420}><Chip at={4} size={46}>GETTING AROUND</Chip></Center>
    </AbsoluteFill>
  );
};

/* 23–28 s · UTILITIES — hatch-depth bars (striped placeholder wipes in, then solid value) */
const Bar: React.FC<{ y: number; at: number; label: string; value: string; width: number; color: string }> = ({ y, at, label, value, width, color }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [at - 12, at], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const solid = interpolate(frame, [at, at + 6], [0, 1], clamp);
  const v = interpolate(frame, [at + 2, at + 10], [0, 1], { ...clamp, easing: ease.back });
  if (frame < at - 12) return null;
  return (
    <div style={{ position: 'absolute', left: 110, top: y, width: 860 }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, letterSpacing: 2, marginBottom: 16 }}>{label}</div>
      <div style={{ position: 'relative', height: 92, width: 860, borderRadius: 18, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width * grow, borderRadius: 18, background: `repeating-linear-gradient(-45deg, ${color}55 0 14px, transparent 14px 28px)` }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width * grow, borderRadius: 18, background: color, opacity: solid }} />
        <div style={{ position: 'absolute', left: width + 24, top: 0, height: 92, display: 'flex', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 76, color, scale: String(v), opacity: Math.min(1, v * 2), transformOrigin: 'left center', textShadow: `0 0 30px ${color}66` }}>{value}</div>
      </div>
    </div>
  );
};
export const Util: React.FC = () => {
  const frame = useCurrentFrame();
  const c1 = local(cue('util.price'), 'util') + 3, c2 = local(cue('util.internet'), 'util') + 3;
  const icons = [['bolt', C.gold], ['flame', C.orange], ['drop', '#5AB4FF'], ['wifi', C.green], ['phone', C.white]] as const;
  return (
    <AbsoluteFill>
      <DarkGrid glow={C.orange} />
      <Center y={440}><BlurWords text="MONTHLY BILLS" start={2} size={100} /></Center>
      <Center y={600}>
        <div style={{ display: 'flex', gap: 26 }}>
          {icons.map(([k, col], i) => {
            const p = interpolate(frame, [8 + i * 5, 20 + i * 5], [0, 1], { ...clamp, easing: ease.back });
            return <div key={k} style={{ scale: String(p), translate: `0px ${Math.sin(frame / 10 + i) * 6}px` }}><Icon kind={k} size={120} color={col} /></div>;
          })}
        </div>
      </Center>
      <Bar y={730} at={c1} label="UTILITIES" value="~$186" width={500} color={C.orange} />
      <Bar y={930} at={c2} label="INTERNET + PHONE" value="~$131" width={352} color={C.green} />
      <Center y={1210}><Chip at={c2 + 18} size={44} bg={C.white} fg={C.ink} weight={900}>TOGETHER ≈ $317 / MONTH</Chip></Center>
    </AbsoluteFill>
  );
};

/* 28–34 s · TOTAL — receipt prints the categories, subtotal counts up, then the range slams (counter + impact ring + $ burst) */
const ROWS: [string, number][] = [['RENT', 2457], ['FOOD', 386], ['TRANSIT', 85], ['UTILITIES', 186], ['INTERNET + PHONE', 131]];
export const Total: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const R = local(cue('total.price'), 'total') + 3;
  const rowAt = (i: number) => 14 + i * 11;
  const drop = interpolate(frame, [R - 4, R + 8], [0, 1], { ...clamp, easing: ease.out });
  const slam = interpolate(frame, [R, R + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const burst = R - 5; // the burst leads the landing by ~5 frames (counter-confetti)
  return (
    <AbsoluteFill>
      <DarkGrid glow={C.green} drift={0.9} />
      {frame >= R && (
        <AbsoluteFill style={{ opacity: 0.32 * prog(frame, R, R + 12), mixBlendMode: 'screen' }}>
          <Solid width={width} height={height} effects={[starburst({ rays: 18, rotation: frame * 0.4, colors: ['#2BE38B', '#06120C'], smoothness: 0.6, origin: [0.5, 0.31] } as never)]} />
        </AbsoluteFill>
      )}
      <Center y={400}><BlurWords text="BASIC MONTHLY BUDGET" start={2} size={74} /></Center>
      {/* receipt */}
      <div style={{ position: 'absolute', left: 170, top: 500 + drop * 290, width: 740, scale: String(1 - drop * 0.2), transformOrigin: '50% 0%', background: C.card, borderRadius: '18px 18px 0 0', padding: '28px 44px 46px', boxSizing: 'border-box', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', clipPath: `inset(0 0 ${100 - Math.min(100, prog(frame, 6, 80, Easing.linear) * 100)}% 0)`, WebkitMaskImage: 'linear-gradient(#000 calc(100% - 22px), transparent 0), conic-gradient(from -45deg at 50% 100%, #000 90deg, transparent 0)' }}>
        {ROWS.map(([lab, v], i) => (
          <div key={lab} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.cardInk, padding: '9px 0', opacity: prog(frame, rowAt(i), rowAt(i) + 6), translate: `0px ${(1 - prog(frame, rowAt(i), rowAt(i) + 8)) * 14}px` }}>
            <span>{lab}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(v)}</span>
          </div>
        ))}
        <div style={{ borderTop: '4px dashed rgba(20,27,45,0.35)', margin: '14px 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: C.cardInk, opacity: prog(frame, 70, 76) }}>
          <span>SUBTOTAL</span>
          <span style={{ color: '#0E9F5B', fontVariantNumeric: 'tabular-nums' }}>{money(3245 * interpolate(frame, [72, 98], [0, 1], { ...clamp, easing: Easing.out(Easing.poly(4)) }))}</span>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: 'rgba(20,27,45,0.6)', marginTop: 10, opacity: prog(frame, 78, 86) }}>+ some eating out &amp; coffee</div>
      </div>
      {/* $ burst */}
      {frame >= burst && Array.from({ length: 28 }, (_, i) => {
        const r = rand(i * 13 + 5); const side = i % 2 ? 1 : -1;
        const t = (frame - burst) / 30, vx = side * (200 + r() * 420), vy = -(380 + r() * 420), g = 700 + r() * 400;
        const x = 540 + side * (60 + r() * 300) + vx * t, y = 590 + vy * t + 0.5 * g * t * t;
        const op = interpolate(t, [0, 0.08, 0.7, 1.0], [0, 1, 0.7, 0], clamp);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, fontFamily: FONT, fontWeight: 900, fontSize: 36 + r() * 30, color: i % 3 ? C.green : C.green2, rotate: `${t * (r() - 0.5) * 900}deg`, opacity: op }}>$</div>;
      })}
      <Center y={585}><ImpactRing at={R} color={C.green} size={560} /></Center>
      {frame >= R && (
        <Center y={590}>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 108, color: C.green, scale: String(interpolate(slam, [0, 1], [1.8, 1])), opacity: slam, textShadow: `0 0 50px ${C.green}99, 0 10px 30px rgba(0,0,0,0.6)`, whiteSpace: 'nowrap' }}>≈ $3,200–$3,300</div>
        </Center>
      )}
      <Center y={700}>{frame >= R + 6 && <BlurWords text="PER MONTH" start={R + 6} size={52} weight={800} dy={16} color={C.white} />}</Center>
      <Center y={1270}><Chip at={R + 16} size={30} bg="rgba(10,15,30,0.9)" fg="#fff" border="rgba(255,255,255,0.25)" weight={600}>Before healthcare, insurance, taxes &amp; entertainment</Chip></Center>
      <Center y={1335}><Chip at={R + 26} size={24} bg="rgba(10,15,30,0.75)" fg="rgba(255,255,255,0.8)" weight={500}>Illustrative budget from the categories shown</Chip></Center>
    </AbsoluteFill>
  );
};

/* 34–37 s · PAYOFF — drop-blackout-slam: black during the music drop, slam on the hit */
const wordAt = (word: string, afterSec: number) => {
  const w = CAPTIONS.find((c) => c.startMs / 1000 >= afterSec && c.text.trim().toLowerCase().startsWith(word));
  return w ? f(w.startMs / 1000) : 0;
};
export const Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const HIT = f(0.9);
  const lit = frame >= HIT;
  const s = interpolate(frame, [HIT, HIT + 6], [1.9, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shake = lit ? 16 * Math.exp(-(frame - HIT) / 2) : 0;
  const chips = [['+ HEALTHCARE', 'healthcare'], ['+ INSURANCE', 'insurance'], ['+ TAXES', 'taxes'], ['+ ENTERTAINMENT', 'entertainment']] as const;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {lit && (
        <AbsoluteFill style={{ translate: `${Math.sin(frame * 2.1) * shake}px ${Math.cos(frame * 1.7) * shake}px` }}>
          <SkyBg mood="night" />
          <div style={placeSky(1.0 + (frame - HIT) * 0.0015, 1950)}><Skyline mood={MOODS.night} frame={frame} /></div>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.4))' }} />
          <Center y={470}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 176, color: C.white, scale: String(s), textShadow: '0 10px 40px rgba(0,0,0,0.7)' }}>CHICAGO</div></Center>
          <Center y={640}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.red, scale: String(s), textShadow: `0 0 40px ${C.red}88, 0 10px 40px rgba(0,0,0,0.7)`, whiteSpace: 'nowrap' }}>ISN&apos;T CHEAP.</div></Center>
        </AbsoluteFill>
      )}
      {/* during the drop: a thin line stretches from the centre (tension before the hit; the frame never freezes) */}
      {!lit && <div style={{ position: 'absolute', top: 959, left: 540 - interpolate(frame, [0, HIT], [10, 330], { ...clamp, easing: (u) => 0.35 * u + 0.65 * u * u }), width: 2 * interpolate(frame, [0, HIT], [10, 330], { ...clamp, easing: (u) => 0.35 * u + 0.65 * u * u }), height: 3, background: C.green, boxShadow: `0 0 18px ${C.green}`, opacity: interpolate(frame, [0, HIT], [0.25, 0.9], clamp) }} />}
      {frame >= HIT && frame < HIT + 3 && <AbsoluteFill style={{ background: '#fff', opacity: 0.55 * (1 - (frame - HIT) / 3) }} />}
      {chips.map(([t, w], i) => {
        const at = wordAt(w, 34) - CUTS.payoff;
        return <div key={t} style={{ position: 'absolute', left: i % 2 ? 560 : 120, top: 860 + Math.floor(i / 2) * 120 }}><Chip at={at} size={40} bg={i % 2 ? C.orange : C.red} fg="#fff" weight={900}>{t}</Chip></div>;
      })}
    </AbsoluteFill>
  );
};

/* 37–40 s · CTA — YES / NO pulse alternately, freeze for the final half-second (handled globally) */
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const yesAt = local(cue('cta.yes'), 'cta');
  return (
    <AbsoluteFill>
      <SkyBg mood="dusk" />
      <div style={placeSky(0.98 + frame * 0.0006, 1880, 540 + Math.sin(frame / 25) * 14)}><Skyline mood={MOODS.dusk} frame={frame} /></div>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,8,18,0.7), rgba(5,8,18,0.2) 60%, rgba(5,8,18,0.3))' }} />
      <Center y={430}><BlurWords text="WOULD YOU LIVE" start={2} size={112} /></Center>
      <Center y={570}><BlurWords text="IN CHICAGO?" start={8} size={136} color={C.gold} /></Center>
      <Center y={790}>
        <div style={{ scale: String(prog(frame, 8, 20, ease.back)), position: 'relative', width: 420, height: 170, borderRadius: 50, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, boxShadow: '0 20px 40px rgba(0,0,0,0.45)' }}>
          {[0, 1, 2].map((k) => { const a = Math.max(0, Math.sin(frame / 3.5 - k * 0.9)); return <div key={k} style={{ width: 40, height: 40, borderRadius: 20, background: `rgba(20,30,50,${0.35 + 0.65 * a})`, translate: `0px ${-10 * a}px` }} />; })}
          <div style={{ position: 'absolute', left: 90, bottom: -50, width: 0, height: 0, borderLeft: '30px solid transparent', borderRight: '30px solid transparent', borderTop: '60px solid #fff', rotate: '20deg' }} />
        </div>
      </Center>
      <Center y={1110}>
        <div style={{ display: 'flex', gap: 60 }}>
          {[['YES', C.green, '#05140C'], ['NO', C.red, '#FFFFFF']].map(([t, bg, fg], k) => {
            const p = prog(frame, 14 + k * 4, 26 + k * 4, ease.back);
            const ph = ((frame / 30) * 2.2 + k * 0.5) % 1, pulse = 1 + 0.09 * Math.max(0, Math.sin(ph * Math.PI));
            const said = frame >= yesAt + k * 9 ? 1 + 0.12 * Math.exp(-(frame - yesAt - k * 9) / 4) : 1;
            return <div key={t} style={{ width: 380, height: 190, borderRadius: 95, background: bg, color: fg, fontFamily: FONT, fontWeight: 900, fontSize: 110, letterSpacing: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(p * pulse * said), boxShadow: `0 20px 50px ${bg}66`, border: '6px solid rgba(255,255,255,0.6)' }}>{t}</div>;
          })}
        </div>
      </Center>
      <Center y={1300}><Chip at={24} size={40} weight={900}>COMMENT BELOW</Chip></Center>
    </AbsoluteFill>
  );
};
