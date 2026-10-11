// "How much does it cost to dress up for Halloween in America?" - YouTube Short, English on-screen text,
// no narration (the author records it to output/halloween_costumes/teleprompter.md). 1080x1920 @ 30 fps.
// Costume photos come from public/costumes/photos.json (file + credit per costume); a missing photo shows a
// clearly-marked placeholder card so the edit can be reviewed before the photos are in.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import photos from '../../public/costumes/photos.json';
import { BODY, C, CUT, DURATION, HEAD, NEXT, SPOOKY, SceneKey, beat, clamp, ease, lerp, prog, word } from './theme';
import { Chip, Headline, Pop, Rise, Scene, Vignette } from './ui';

type CK = 'kpop' | 'penny' | 'wed' | 'mario' | 'dolly';
const COST: Record<CK, { name: string; sub: string; price: number; accent: string; rank: number; at: string }> = {
  kpop: { name: 'K-POP DEMON HUNTERS', sub: 'costume set', price: 41, accent: '#FF3DAA', rank: 1, at: '$41' },
  penny: { name: 'PENNYWISE', sub: 'from IT', price: 49, accent: '#E5262B', rank: 2, at: '$49' },
  wed: { name: 'WEDNESDAY ADDAMS', sub: 'costume dress', price: 34, accent: '#9B7BFF', rank: 3, at: '$34' },
  mario: { name: 'MARIO', sub: 'costume set', price: 38, accent: '#FF3B30', rank: 4, at: '$38' },
  dolly: { name: 'DOLLY PARTON', sub: 'costume set', price: 56, accent: '#FFC83D', rank: 5, at: '$56' },
};
const ORDER: CK[] = ['kpop', 'penny', 'wed', 'mario', 'dolly'];
const PH = photos as Record<string, { file: string; credit?: string; pos?: string }>;

const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: 'absolute', left: 40, right: 40, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>{children}</div>
);
const punch = (frame: number, at: number, amt = 0.06) => (frame >= at ? 1 + amt * Math.exp(-(frame - at) / 5) : 1);

/* ---------------- photo (or placeholder) ---------------- */
const Photo: React.FC<{ k: CK; zoom?: number; style?: React.CSSProperties; blur?: number }> = ({ k, zoom = 1, style, blur = 0 }) => {
  const p = PH[k];
  if (p) return <Img src={staticFile(`costumes/${p.file}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.pos ?? '50% 25%', scale: String(zoom), filter: blur ? `blur(${blur}px)` : undefined, ...style }} />;
  const c = COST[k];
  return (
    <div style={{ width: '100%', height: '100%', background: `radial-gradient(80% 60% at 50% 35%, ${c.accent}AA, ${C.night} 75%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, scale: String(zoom), filter: blur ? `blur(${blur}px)` : undefined, ...style }}>
      <svg width="45%" viewBox="0 0 100 120"><circle cx={50} cy={30} r={22} fill="rgba(255,255,255,0.18)" /><path d="M10 120 Q14 62 50 58 Q86 62 90 120 Z" fill="rgba(255,255,255,0.18)" /></svg>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: 'rgba(255,255,255,0.7)' }}>PHOTO · {c.name}</div>
    </div>
  );
};

/* ---------------- atmosphere ---------------- */
const Bat: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => {
  const flap = Math.sin(t * 0.9) * 0.5 + 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 0 Q-14 ${-14 + flap * 22} -34 ${-6 + flap * 20} Q-26 ${2 + flap * 6} -22 ${10 + flap * 4} Q-12 4 -6 8 Q-3 2 0 6 Q3 2 6 8 Q12 4 22 ${10 + flap * 4} Q26 ${2 + flap * 6} 34 ${-6 + flap * 20} Q14 ${-14 + flap * 22} 0 0 Z`} fill="#05020A" />
    </g>
  );
};
export const SpookyBg: React.FC<{ tint?: string; moon?: boolean }> = ({ tint = C.purple, moon = true }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 30%, ${C.night2} 0%, ${C.night} 55%, #07030D 100%)` }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="fogb"><feGaussianBlur stdDeviation="30" /></filter><radialGradient id="moon"><stop offset="0.6" stopColor="#FFF3D6" /><stop offset="1" stopColor="#FFF3D6" stopOpacity="0" /></radialGradient></defs>
        {moon && <g opacity={0.85}><circle cx={900} cy={1380} r={150} fill="url(#moon)" opacity={0.25} /><circle cx={900} cy={1380} r={95} fill="#FFF0CF" /><circle cx={875} cy={1362} r={15} fill="#EADBB8" /><circle cx={925} cy={1405} r={10} fill="#EADBB8" /></g>}
        {[0, 1, 2, 3, 4].map((i) => <Bat key={i} x={((i * 260 + frame * (2 + i * 0.4)) % 1400) - 160} y={240 + i * 90 + Math.sin(frame / 10 + i) * 30} s={0.9 + (i % 3) * 0.4} t={frame + i * 3} />)}
        <g filter="url(#fogb)" opacity={0.35}>{[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((i * 380 + frame * 1.2) % 1600) - 260} cy={1640 + (i % 2) * 60} rx={420} ry={90} fill={tint} />)}</g>
      </svg>
    </AbsoluteFill>
  );
};
const Pumpkin: React.FC<{ size: number; glow: number }> = ({ size, glow }) => (
  <svg width={size} height={size} viewBox="-60 -60 120 120">
    <ellipse cx={0} cy={8} rx={56} ry={46} fill="#E8650F" />
    {[-30, -12, 12, 30].map((x) => <ellipse key={x} cx={x} cy={8} rx={18} ry={44} fill="#FF7A1A" />)}
    <path d="M-4 -36 Q0 -54 10 -58" stroke="#3C6B23" strokeWidth={8} fill="none" strokeLinecap="round" />
    <g fill={`rgba(255,${200 + glow * 40},${80 + glow * 60},1)`}>
      <polygon points="-30,-8 -16,-8 -23,-22" /><polygon points="16,-8 30,-8 23,-22" /><polygon points="-6,4 6,4 0,-6" />
      <path d="M-34 16 Q0 44 34 16 L26 18 L20 28 L12 20 L4 32 L-4 20 L-12 30 L-20 20 L-26 26 Z" />
    </g>
  </svg>
);

/* ---------------- price tag (hangs from a string, swings and settles) ---------------- */
const PriceTag: React.FC<{ price: number; at: number; accent: string }> = ({ price, at, accent }) => {
  const frame = useCurrentFrame();
  if (frame < at - 10) return null;
  const t = frame - (at - 10);
  const drop = interpolate(t, [0, 10], [-420, 0], { ...clamp, easing: ease.out });
  const swing = 22 * Math.exp(-t / 14) * Math.cos(t / 2.6);
  const n = Math.round(interpolate(frame, [at - 8, at + 4], [0, price], { ...clamp, easing: ease.quart }));
  return (
    <div style={{ position: 'absolute', right: 70, top: 300 + drop, width: 300, height: 360, transformOrigin: '150px 0px', rotate: `${swing}deg`, scale: String(punch(frame, at + 4, 0.08)) }}>
      <svg width={300} height={360} viewBox="0 0 300 360" style={{ position: 'absolute', inset: 0 }}>
        <line x1={150} y1={0} x2={150} y2={110} stroke={C.bone} strokeWidth={4} />
        <path d="M60 140 L150 100 L240 140 L240 340 Q240 356 224 356 L76 356 Q60 356 60 340 Z" fill={C.bone} stroke={accent} strokeWidth={8} />
        <circle cx={150} cy={130} r={12} fill={C.night} />
      </svg>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 170, textAlign: 'center' }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: C.night }}>AROUND</div>
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 96, lineHeight: 1.05, color: C.night }}>{frame < at - 8 ? '$?' : `$${n}`}</div>
      </div>
    </div>
  );
};

/* ---------------- 1 hook ---------------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const hw = word('hook', 'Halloween'), am = word('hook', 'America');
  const glow = 0.5 + 0.5 * Math.sin(frame / 3);
  return (
    <AbsoluteFill>
      <SpookyBg />
      <Center top={300}>
        <Pop at={hw - 4} from={0.3}><div style={{ fontFamily: SPOOKY, fontSize: 210, color: C.pumpkin, lineHeight: 1, textShadow: `0 0 40px ${C.pumpkin}88`, rotate: `${Math.sin(frame / 8) * 1.5}deg` }}>HALLOWEEN</div></Pop>
        <div style={{ height: 10 }} />
        <Headline text="HOW MUCH DOES IT COST" size={78} at={4} stagger={2.5} color={C.bone} />
        <Headline text="TO DRESS UP?" size={110} at={12} stagger={3} color={C.bone} style={{ marginTop: 6 }} />
        <div style={{ height: 20 }} />
        <Chip at={am - 2} size={36} bg={C.bone} fg={C.night} border={C.bone}>IN AMERICA · 2026</Chip>
      </Center>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', scale: String(interpolate(frame, [0, 14], [0.2, 1], { ...clamp, easing: ease.back }) * (1 + 0.03 * Math.sin(frame / 4))) }}>
        <Pumpkin size={420} glow={glow} />
      </div>
      {['$', '$', '$'].map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: 170 + i * 330, top: 1110 - ((frame * (3 + i) + i * 60) % 260), fontFamily: HEAD, fontWeight: 900, fontSize: 90, color: C.slime, opacity: 0.8 * (1 - ((frame * (3 + i) + i * 60) % 260) / 260) }}>{d}</div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- 2 trending deck ---------------- */
const Trend: React.FC = () => {
  const frame = useCurrentFrame();
  const tr = word('trend', 'trending!');
  return (
    <AbsoluteFill>
      <SpookyBg moon={false} />
      <Center top={260}>
        <Chip at={CUT.trend + 2} size={34} bg={C.pumpkin} fg={C.night} border={C.pumpkin}>HALLOWEEN 2026</Chip>
        <div style={{ height: 14 }} />
        <Pop at={tr - 6} from={0.3}><div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 132, color: C.bone, lineHeight: 1 }}>TRENDING</div></Pop>
        <Headline text="COSTUMES" size={92} at={tr} color={C.pumpkin} />
      </Center>
      {ORDER.map((k, i) => {
        const a = CUT.trend + 6 + i * 6;
        const p = interpolate(frame, [a, a + 14], [0, 1], { ...clamp, easing: ease.back });
        const ang = (i - 2) * 9, x = (i - 2) * 150, y = Math.abs(i - 2) * 30;
        return (
          <div key={k} style={{ position: 'absolute', left: 540 - 170 + x * p, top: 760 + y * p + (1 - p) * 900, width: 340, height: 480, rotate: `${ang * p}deg`, borderRadius: 26, overflow: 'hidden', border: `8px solid ${C.bone}`, boxShadow: `0 30px 60px rgba(0,0,0,0.6), 0 0 40px ${COST[k].accent}55`, zIndex: i === 2 ? 5 : 5 - Math.abs(i - 2) }}>
            <Photo k={k} zoom={1 + 0.06 * Math.sin(frame / 20 + i)} />
            <div style={{ position: 'absolute', left: 12, top: 12, width: 60, height: 60, borderRadius: 30, background: COST[k].accent, color: C.night, fontFamily: HEAD, fontWeight: 900, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- 3-7 costume scenes ---------------- */
const CostumeScene: React.FC<{ k: CK; side: 1 | -1; extra?: React.ReactNode }> = ({ k, side, extra }) => {
  const frame = useCurrentFrame();
  const c = COST[k];
  const a = CUT[k], b = NEXT[k];
  const at = word(k, c.at);
  const enter = interpolate(frame, [a, a + 14], [0, 1], { ...clamp, easing: ease.out });
  const kb = lerp(1.0, 1.14, prog(frame, a, b + 8, (t) => t));
  return (
    <AbsoluteFill>
      {/* blurred photo backdrop */}
      <AbsoluteFill style={{ overflow: 'hidden' }}><Photo k={k} zoom={1.4} blur={40} /></AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(10,4,20,0.75), rgba(10,4,20,0.45) 40%, rgba(10,4,20,0.9))` }} />
      <SpookyBg moon={false} tint={c.accent} />
      <AbsoluteFill style={{ background: 'transparent' }} />
      <Center top={230}><Chip at={a + 2} size={30} bg="rgba(10,4,20,0.75)" fg={C.bone} border={c.accent}>#{c.rank} · TRENDING 2026</Chip></Center>
      {/* photo card */}
      <div style={{ position: 'absolute', left: 130, top: 320, width: 720, height: 960, borderRadius: 34, overflow: 'hidden', border: `10px solid ${C.bone}`, boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 70px ${c.accent}66`, translate: `${(1 - enter) * side * 900}px ${(1 - enter) * 60}px`, rotate: `${(1 - enter) * side * 14 - side * 2.5}deg`, scale: String(punch(frame, at + 4, 0.025)) }}>
        <Photo k={k} zoom={kb} />
      </div>
      <PriceTag price={c.price} at={at} accent={c.accent} />
      {/* name */}
      <Center top={1300}>
        <Pop at={a + 6} from={0.6}><div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: c.name.length > 14 ? 74 : 104, color: C.bone, textAlign: 'center', lineHeight: 1, textShadow: '0 8px 30px rgba(0,0,0,0.7)' }}>{c.name}</div></Pop>
        <div style={{ height: 10, width: 420 * prog(frame, a + 10, a + 24), background: c.accent, borderRadius: 5, marginTop: 14, boxShadow: `0 0 20px ${c.accent}` }} />
        <Rise at={a + 12} dy={14}><div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 30, color: 'rgba(246,239,226,0.8)', marginTop: 10 }}>{c.sub}</div></Rise>
      </Center>
      {PH[k]?.credit && <div style={{ position: 'absolute', left: 140, top: 1288, fontFamily: BODY, fontWeight: 500, fontSize: 18, color: 'rgba(246,239,226,0.6)' }}>Photo: {PH[k].credit}</div>}
      {extra}
    </AbsoluteFill>
  );
};
const Balloon: React.FC = () => {
  const frame = useCurrentFrame();
  const y = 1500 - ((frame - CUT.penny) * 6) % 1900;
  return (
    <svg width={140} height={300} viewBox="0 0 70 150" style={{ position: 'absolute', left: 60 + Math.sin(frame / 12) * 20, top: y }}>
      <ellipse cx={35} cy={32} rx={28} ry={32} fill="#E5262B" /><ellipse cx={26} cy={20} rx={7} ry={10} fill="#fff" opacity={0.35} />
      <path d="M35 64 L31 70 H39 Z" fill="#B71C1C" /><path d="M35 70 Q25 95 37 115 Q47 135 33 150" stroke="#ddd" strokeWidth={1.5} fill="none" />
    </svg>
  );
};
const Scarier: React.FC = () => {
  const frame = useCurrentFrame();
  const a = beat('penny', 0), b1 = beat('penny', 1);
  if (frame < a || frame > b1 + 4) return null;
  const j = Math.sin(frame * 3.1) * 6;
  return <AbsoluteFill style={{ background: `rgba(120,0,0,${0.35 * (1 - prog(frame, b1 - 6, b1 + 4))})` }}><Center top={760} style={{ translate: `${j}px ${-j}px` }}><div style={{ fontFamily: SPOOKY, fontSize: 170, color: '#FF2E2E', textShadow: '0 0 40px #ff000088' }}>SCARIER?</div></Center></AbsoluteFill>;
};
const Sparkles: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 14 }).map((_, i) => { const s = 0.5 + 0.5 * Math.sin(frame / 4 + i * 1.7); return <path key={i} d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z" fill={color} transform={`translate(${(i * 233) % 1000 + 40} ${(i * 397) % 1300 + 300}) scale(${s * 1.2})`} opacity={s} />; })}
    </svg>
  );
};

/* ---------------- 8 the scary part ---------------- */
const Lipstick: React.FC = () => <svg width={110} height={110} viewBox="0 0 40 40"><rect x={14} y={18} width={12} height={18} rx={2} fill="#C9A44A" /><path d="M15 18 V8 L25 4 V18 Z" fill="#D7263D" /></svg>;
const Hat: React.FC = () => <svg width={110} height={110} viewBox="0 0 40 40"><path d="M6 30 Q20 24 34 30 Q20 36 6 30 Z" fill="#2A1745" /><path d="M14 29 L22 4 L27 28 Z" fill="#3B2160" /><rect x={14} y={25} width={13} height={3} fill={C.pumpkin} /></svg>;
const Bucket: React.FC = () => <svg width={110} height={110} viewBox="0 0 40 40"><path d="M7 16 Q20 4 33 16" stroke="#222" strokeWidth={2.5} fill="none" /><ellipse cx={20} cy={25} rx={14} ry={12} fill={C.pumpkin} /><polygon points="13,22 17,22 15,18" fill="#3B1A00" /><polygon points="23,22 27,22 25,18" fill="#3B1A00" /><path d="M13 28 Q20 33 27 28" stroke="#3B1A00" strokeWidth={2} fill="none" /></svg>;
const Scary: React.FC = () => {
  const frame = useCurrentFrame();
  const a = CUT.scary, b1 = beat('scary', 1), mk = word('scary', 'makeup'), ac = word('scary', 'accessories!'), more = word('scary', 'more');
  const glitch = frame - a < 14 ? Math.sin(frame * 5) * 14 * (1 - (frame - a) / 14) : 0;
  const rows: [React.ReactNode, string, string, number][] = [
    [<div style={{ width: 110, height: 110, borderRadius: 20, overflow: 'hidden', border: `4px solid ${C.bone}` }}><Photo k="wed" /></div>, 'Costume', '$34–$56', b1 + 4],
    [<Lipstick />, '+ Makeup', '$', mk],
    [<div style={{ display: 'flex' }}><Hat /><Bucket /></div>, '+ Accessories', '$', ac],
  ];
  return (
    <AbsoluteFill>
      <SpookyBg tint="#8B0000" moon={false} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 40%, rgba(160,0,0,${0.25 + 0.1 * Math.sin(frame / 3)}), transparent 70%)` }} />
      <Center top={250} style={{ translate: `${glitch}px 0px` }}>
        <Chip at={a + 2} size={30} bg="#B00020" fg={C.bone} border="#FF2E2E">BUT…</Chip>
        <div style={{ fontFamily: SPOOKY, fontSize: 150, color: '#FF2E2E', lineHeight: 1, marginTop: 10, textShadow: '0 0 40px #ff000088', scale: String(interpolate(frame, [a, a + 8], [1.8, 1], { ...clamp, easing: ease.out })) }}>THE SCARY PART</div>
      </Center>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 640, background: C.bone, borderRadius: 18, padding: '26px 34px', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', rotate: '-1.5deg', translate: `0px ${(1 - prog(frame, b1 - 6, b1 + 10)) * 1200}px` }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.night, textAlign: 'center', borderBottom: '3px dashed rgba(18,8,31,0.3)', paddingBottom: 12 }}>FULL HALLOWEEN OUTFIT</div>
        {rows.map(([ic, l, v, at], i) => (
          <Rise key={l} at={at - 4} dy={30}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '16px 0', borderBottom: '3px dashed rgba(18,8,31,0.15)', scale: String(punch(frame, at + 2, 0.04)) }}>
              {ic}<span style={{ flex: 1, fontFamily: HEAD, fontWeight: 900, fontSize: 50, color: C.night }}>{l}</span>
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: i ? 64 : 50, color: i ? '#D7263D' : C.night }}>{v}</span>
            </div>
          </Rise>
        ))}
        <Rise at={ac + 10} dy={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
            <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 54, color: C.night }}>TOTAL</span>
            <span style={{ fontFamily: SPOOKY, fontSize: 84, color: '#D7263D' }}>EVEN MORE!</span>
          </div>
        </Rise>
      </div>
      {frame >= more && <div style={{ position: 'absolute', right: 70, top: 560, rotate: '10deg', scale: String(interpolate(frame, [more, more + 6, more + 12], [2.4, 0.9, 1], clamp)), translate: `0px ${Math.sin(frame / 6) * 12}px` }}><svg width={150} height={170} viewBox="0 0 60 70"><path d="M6 66 V28 A24 24 0 0 1 54 28 V66 L46 58 L38 66 L30 58 L22 66 L14 58 Z" fill="#F6EFE2" /><ellipse cx={22} cy={28} rx={4} ry={6} fill="#12081F" /><ellipse cx={38} cy={28} rx={4} ry={6} fill="#12081F" /><ellipse cx={30} cy={42} rx={5} ry={7} fill="#12081F" /></svg></div>}
    </AbsoluteFill>
  );
};

/* ---------------- 9 comment prompt ---------------- */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const a = CUT.cta, cm = beat('cta', 1);
  const close = interpolate(frame, [DURATION - 10, DURATION - 1], [0, 0.8], clamp);
  return (
    <AbsoluteFill>
      <SpookyBg />
      <Center top={250}>
        <Headline text="WHICH COSTUME" size={98} at={a + 2} color={C.bone} />
        <Headline text="WOULD YOU CHOOSE?" size={84} at={a + 8} color={C.pumpkin} style={{ marginTop: 6 }} />
      </Center>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22 }}>
        {ORDER.map((k, i) => {
          const at = a + 6 + i * 4;
          const pulse = 1 + 0.05 * Math.max(0, Math.sin((frame - a) / 6 - i * 1.2));
          return (
            <Pop key={k} at={at} from={0.2}>
              <div style={{ width: 296, position: 'relative', scale: String(pulse) }}>
                <div style={{ width: 296, height: 380, borderRadius: 22, overflow: 'hidden', border: `6px solid ${COST[k].accent}` }}><Photo k={k} /></div>
                <div style={{ position: 'absolute', left: -10, top: -10, width: 64, height: 64, borderRadius: 32, background: COST[k].accent, color: C.night, fontFamily: HEAD, fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                <div style={{ position: 'absolute', right: 10, bottom: 10, background: C.bone, color: C.night, borderRadius: 14, padding: '4px 14px', fontFamily: HEAD, fontWeight: 900, fontSize: 40 }}>${COST[k].price}</div>
              </div>
            </Pop>
          );
        })}
      </div>
      <Center top={1430}>
        <Chip at={cm - 2} size={44} bg={C.pumpkin} fg={C.night} border={C.pumpkin}>COMMENT BELOW ↓</Chip>
      </Center>
      <AbsoluteFill style={{ background: '#07030D', opacity: close }} />
    </AbsoluteFill>
  );
};

export const Costumes: React.FC = () => (
  <AbsoluteFill style={{ background: C.night }}>
    <Scene k="hook" enter="none"><Hook /></Scene>
    <Scene k="trend" enter="zoom"><Trend /></Scene>
    <Scene k="kpop" enter="wipe"><CostumeScene k="kpop" side={1} extra={<Sparkles color="#FF3DAA" />} /></Scene>
    <Scene k="penny" enter="push"><CostumeScene k="penny" side={-1} extra={<><Balloon /><Scarier /></>} /></Scene>
    <Scene k="wed" enter="wipe"><CostumeScene k="wed" side={1} /></Scene>
    <Scene k="mario" enter="push"><CostumeScene k="mario" side={-1} /></Scene>
    <Scene k="dolly" enter="wipe"><CostumeScene k="dolly" side={1} extra={<Sparkles color="#FFC83D" />} /></Scene>
    <Scene k="scary" enter="zoom"><Scary /></Scene>
    <Scene k="cta" enter="iris"><Cta /></Scene>
    <Vignette />
  </AbsoluteFill>
);
