// "Ціни на заході України, осінь 2026" - YouTube Short without narration (the author records it to
// output/zahid_tsiny_osin/teleprompter.txt). 1080x1920 @ 30 fps; music + SFX are muxed by zahid/render.sh.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FloorPlan, FrankPlate, Icon, Leaves, LvivPlate, ShelvesBg, UzhPlate, Cam } from './Plates';
import { UA_H, UA_PATH, UA_W, FRANK, LVIV, UZH } from './uaMap';
import { BODY, C, CUT, DURATION, HEAD, NEXT, SceneKey, beat, clamp, ease, lerp, money, prog, word } from './theme';
import { Card, Chip, Dollars, Headline, Label, NavyBg, Pop, Rise, Scene, Shade, Vignette } from './ui';

const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: 'absolute', left: 50, right: 50, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>{children}</div>
);
const camAt = (frame: number, a: number, b: number, c0: Cam, c1: Cam): Cam => {
  const p = prog(frame, a, b, (t) => t);
  return { x: lerp(c0.x, c1.x, p), y: lerp(c0.y, c1.y, p), z: lerp(c0.z, c1.z, p) };
};
/** quick punch-in at a frame (adds energy on every number) */
const punch = (frame: number, at: number, amt = 0.05) => 1 + amt * Math.exp(-Math.max(0, frame - at) / 5) * (frame >= at ? 1 : 0);
const shake = (frame: number, at: number, amp = 14) => (frame >= at && frame < at + 12 ? Math.sin((frame - at) * 2.7) * amp * (1 - (frame - at) / 12) : 0);
const Pct: React.FC<{ v: string; color: string; size: number; at: number }> = ({ v, color, size, at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 6, at + 12], [2.2, 0.92, 1], clamp);
  if (frame < at) return null;
  return <span style={{ display: 'inline-block', fontFamily: HEAD, fontWeight: 900, fontSize: size, lineHeight: 1, color, scale: String(p), textShadow: `0 0 40px ${color}66, 0 8px 30px rgba(0,0,0,0.5)` }}>{v}</span>;
};
const Arrow: React.FC<{ up: boolean; size: number; color: string }> = ({ up, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ rotate: up ? '0deg' : '180deg' }}><path d="M20 3 L36 21 H26 V37 H14 V21 H4 Z" fill={color} /></svg>
);
const Trophy: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40"><path d="M10 4h20v8a10 10 0 0 1-20 0z" fill={C.yellow} /><path d="M10 7H4a6 6 0 0 0 6 7M30 7h6a6 6 0 0 1-6 7" stroke={C.yellow} strokeWidth={3} fill="none" /><rect x={17} y={21} width={6} height={8} fill={C.yellow} /><rect x={11} y={29} width={18} height={6} rx={2} fill={C.yellow} /></svg>
);

/* ---------------- 1 hook ---------------- */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const b1 = beat('hook', 1), b2 = beat('hook', 2);
  const draw = prog(frame, 2, 26, ease.inOut);
  const zp = prog(frame, 30, b1 + 10, ease.inOut);
  const zoom = lerp(1, 2, zp);
  // zoom the west (Lviv / Uzhhorod / Ivano-Frankivsk) into the middle of the frame, below the title
  const tx = lerp(0, 540 - 110 * 2 - 60, zp), ty = lerp(0, 1010 - 265 * 2 - 700, zp);
  const mapOut = prog(frame, b2 - 6, b2 + 4, ease.inOut);
  const pins: [string, { x: number; y: number }, number][] = [['ЛЬВІВ', LVIV, 34], ['УЖГОРОД', UZH, 42], ['ІВАНО-ФРАНКІВСЬК', FRANK, 50]];
  const nums: [string, string][] = [['25 000', C.coral], ['36 000', C.coral], ['+44%', C.coral], ['−6%', C.green]];
  // spoiler: the rent arrow breaks the ceiling slab
  const rise = prog(frame, b2 + 4, b2 + 22, ease.quart);
  const hit = b2 + 14;
  const sh = shake(frame, hit, 18);
  return (
    <AbsoluteFill>
      <NavyBg tint={C.blue} />
      {/* map of Ukraine, zooming to the west */}
      <div style={{ position: 'absolute', left: 60, top: 700, width: UA_W, height: UA_H, transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: '0 0', opacity: 1 - mapOut * 0.85, filter: frame > b1 ? `blur(${prog(frame, b1, b1 + 8) * 6}px)` : undefined }}>
        <svg width={UA_W} height={UA_H} viewBox={`-10 -10 ${UA_W + 20} ${UA_H + 20}`} style={{ overflow: 'visible' }}>
          <path d={UA_PATH} fill={C.blue} fillOpacity={0.18 * draw} stroke={C.yellow} strokeWidth={4 / zoom} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinejoin="round" />
          <ellipse cx={LVIV.x} cy={LVIV.y + 60} rx={150} ry={110} fill={C.yellow} opacity={0.12 * prog(frame, 26, 40)} />
          {pins.map(([n, p, at]) => {
            const s = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: ease.back });
            return (
              <g key={n} transform={`translate(${p.x} ${p.y}) scale(${s / zoom})`}>
                <circle r={30} fill={C.coral} opacity={0.25 + 0.15 * Math.sin(frame / 4)} />
                <circle r={13} fill={C.coral} stroke={C.off} strokeWidth={4} />
                <text x={n === 'УЖГОРОД' ? 0 : 22} y={n === 'УЖГОРОД' ? 44 : n === 'ЛЬВІВ' ? -18 : 40} textAnchor={n === 'УЖГОРОД' ? 'middle' : 'start'} fontFamily="Montserrat" fontWeight={900} fontSize={34} fill={C.off} stroke={C.navyDeep} strokeWidth={6} paintOrder="stroke">{n}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <Center top={290} style={{ opacity: 1 - mapOut, translate: `0px ${-mapOut * 80}px` }}>
        <Chip at={3} bg={C.yellow} fg={C.navyDeep} border={C.yellow} size={34}>ОСІНЬ 2026</Chip>
        <div style={{ height: 20 }} />
        <Headline text="ЦІНИ НА ЗАХОДІ" size={112} at={5} stagger={3} />
        <Headline text="УКРАЇНИ" size={140} at={12} color={C.yellow} style={{ marginTop: 8 }} />
      </Center>
      {/* "concrete numbers": number tiles slam in */}
      {frame >= b1 && frame < b2 + 6 && (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, opacity: 1 - mapOut }}>
          {nums.map(([n, col], i) => (
            <Pop key={n} at={b1 + 4 + i * 5} from={0.3}>
              <div style={{ background: 'rgba(6,13,29,0.85)', border: `3px solid ${col}`, borderRadius: 26, padding: '22px 0', textAlign: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 76, color: col, rotate: `${(i % 2 ? 2 : -2)}deg` }}>{n}</div>
            </Pop>
          ))}
        </div>
      )}
      {/* spoiler */}
      {frame >= b2 - 4 && (
        <AbsoluteFill style={{ translate: `${sh}px ${sh * 0.6}px` }}>
          <Center top={300}>
            <Chip at={b2 - 2} bg={C.coral} fg={C.off} border={C.coral} size={34}>СПОЙЛЕР</Chip>
            <div style={{ height: 18 }} />
            <Headline text="ОРЕНДА" size={150} at={b2} />
          </Center>
          {/* ceiling slab, cracked on impact */}
          <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
            {[[-1, 0], [1, 0]].map(([s], i) => {
              const fly = prog(frame, hit, hit + 16);
              return <g key={i} transform={`translate(${s * fly * 120} ${fly * 160}) rotate(${s * fly * 12} ${540 + s * 270} 860)`}>
                <rect x={s < 0 ? 60 : 540} y={830} width={480} height={56} fill="#C9CED6" />
                <rect x={s < 0 ? 60 : 540} y={830} width={480} height={12} fill="#E7EBF0" />
                {frame >= hit && <path d={s < 0 ? 'M540 830 L500 850 L525 865 L490 886' : 'M540 830 L575 852 L548 868 L585 886'} stroke={C.navyDeep} strokeWidth={5} fill="none" />}
              </g>;
            })}
            {frame >= hit && Array.from({ length: 10 }).map((_, i) => {
              const u = prog(frame, hit, hit + 22, (t) => t), a = -Math.PI / 2 + (i - 4.5) * 0.28;
              return <rect key={i} x={540 + Math.cos(a) * 340 * u - 10} y={850 + Math.sin(a) * 300 * u + 600 * u * u} width={20 + (i % 3) * 8} height={14} fill="#C9CED6" transform={`rotate(${i * 40 + u * 300} ${540 + Math.cos(a) * 340 * u} ${850 + Math.sin(a) * 300 * u + 600 * u * u})`} opacity={1 - u} />;
            })}
            {/* rent line shooting up */}
            <path d={`M140 1500 L340 1400 L480 1430 L${lerp(540, 620, rise)} ${lerp(1500, 600, rise)}`} stroke={C.coral} strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <g transform={`translate(${lerp(540, 620, rise)} ${lerp(1500, 600, rise)}) rotate(5)`}><path d="M0 -60 L40 0 L-40 0 Z" fill={C.coral} /></g>
          </svg>
          <Center top={1520}><Headline text="ПРОБИЛА СТЕЛЮ" size={96} at={hit - 2} color={C.coral} /></Center>
        </AbsoluteFill>
      )}
      <Leaves n={10} opacity={0.6} />
    </AbsoluteFill>
  );
};

/* ---------------- 2-4 cities ---------------- */
const CityScene: React.FC<{ k: SceneKey; city: string; rooms: 1 | 2; plate: (cam: Cam) => React.ReactNode; children: React.ReactNode }> = ({ k, city, rooms, plate, children }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame, CUT[k], NEXT[k] + 8, { x: -40, y: 40, z: 1.08 }, { x: 40, y: 0, z: 1.28 });
  return (
    <AbsoluteFill>
      {plate(cam)}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,13,29,0.82) 0%, rgba(6,13,29,0.25) 30%, rgba(6,13,29,0.55) 48%, rgba(6,13,29,0.9) 70%)' }} />
      <Center top={250}>
        <Chip at={CUT[k] + 2} size={28}>ОРЕНДА · {rooms === 1 ? '1-КІМНАТНА' : '2-КІМНАТНА'}</Chip>
        <div style={{ height: 12 }} />
        <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: city.length > 10 ? 104 : 170, lineHeight: 1, color: C.off, letterSpacing: -2, textAlign: 'center', textShadow: '0 10px 40px rgba(0,0,0,0.55)', scale: String(interpolate(frame, [CUT[k] + 2, CUT[k] + 10, CUT[k] + 16], [1.6, 0.96, 1], clamp)), opacity: prog(frame, CUT[k] + 2, CUT[k] + 8) }}>{city}</div>
      </Center>
      <Rise at={CUT[k] + 6} dy={100} dur={14} style={{ position: 'absolute', left: 70, right: 70, top: 600 }}>
        <Card style={{ padding: '26px 30px', display: 'flex', justifyContent: 'center' }}><FloorPlan rooms={rooms} at={CUT[k] + 10} w={800} /></Card>
      </Rise>
      {children}
    </AbsoluteFill>
  );
};
const Lviv: React.FC = () => {
  const frame = useCurrentFrame();
  const from = word('lviv', '18'), to = word('lviv', '25');
  const strike = prog(frame, to - 4, to + 6);
  return (
    <CityScene k="lviv" city="ЛЬВІВ" rooms={1} plate={(cam) => <LvivPlate cam={cam} />}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1170, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(punch(frame, to + 8)) }}>
        <Rise at={from - 4} dy={30}>
          <div style={{ position: 'relative', fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: C.gray }}>
            було 18 000 грн
            <div style={{ position: 'absolute', left: -6, top: '52%', height: 8, width: `${strike * 104}%`, background: C.coral, borderRadius: 4 }} />
          </div>
        </Rise>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 10 }}>
          {frame >= to - 2 && <Arrow up size={90} color={C.coral} />}
          <Dollars value={25000} from={to - 6} land={to + 8} size={124} lockColor={C.coral} />
        </div>
        <div style={{ marginTop: 14 }}><Pct v="+39%" color={C.coral} size={84} at={to + 14} /></div>
      </div>
    </CityScene>
  );
};
const Uzh: React.FC = () => {
  const frame = useCurrentFrame();
  const rec = word('uzh', 'рекорди'), p = word('uzh', '36');
  const st = interpolate(frame, [rec, rec + 6, rec + 12], [2.4, 0.92, 1], clamp);
  return (
    <CityScene k="uzh" city="УЖГОРОД" rooms={2} plate={(cam) => <UzhPlate cam={cam} />}>
      {frame >= rec && (
        <div style={{ position: 'absolute', right: 70, top: 560, rotate: '-6deg', scale: String(st), display: 'flex', alignItems: 'center', gap: 12, background: C.yellow, color: C.navyDeep, padding: '12px 24px', borderRadius: 18, fontFamily: HEAD, fontWeight: 900, fontSize: 40, boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}>
          <Trophy size={46} />РЕКОРД УКРАЇНИ
        </div>
      )}
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(punch(frame, p + 10)) }}>
        <Dollars value={36000} from={p - 8} land={p + 10} size={140} lockColor={C.coral} />
        <Rise at={p + 12} dy={20}><Label size={36} color={C.off}>НА МІСЯЦЬ</Label></Rise>
      </div>
    </CityScene>
  );
};
const Frank: React.FC = () => {
  const frame = useCurrentFrame();
  const p = word('frank', '22'), up = word('frank', 'підтягнувся');
  const bars: [string, number, string][] = [['Львів · 1к', 25000, C.gray], ['Франківськ · 1к', 22500, C.coral]];
  return (
    <CityScene k="frank" city="ІВАНО-ФРАНКІВСЬК" rooms={1} plate={(cam) => <FrankPlate cam={cam} />}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1170, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(punch(frame, p + 10)) }}>
        <Dollars value={22500} from={p - 8} land={p + 10} size={130} lockColor={C.coral} />
        <div style={{ height: 22 }} />
        <div style={{ width: 860, display: 'flex', flexDirection: 'column', gap: 12, opacity: prog(frame, up - 4, up + 6) }}>
          {bars.map(([l, v, col], i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 270, fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.off }}>{l}</span>
              <div style={{ height: 30, borderRadius: 15, background: col, width: 520 * (v / 25000) * (i ? prog(frame, up, p + 14, ease.out) : prog(frame, up - 4, up + 8)) }} />
            </div>
          ))}
        </div>
      </div>
    </CityScene>
  );
};

/* ---------------- 5 supermarket ---------------- */
const Shop: React.FC = () => {
  const frame = useCurrentFrame();
  const b1 = beat('shop', 1), b2 = beat('shop', 2), b3 = beat('shop', 3);
  const egg44 = word('shop', '44');
  const cartX = interpolate(frame, [CUT.shop, CUT.shop + 20], [-500, 0], { ...clamp, easing: ease.out });
  const heroOut = prog(frame, b2 - 8, b2 + 2, ease.inOut);
  const rows: [React.ComponentProps<typeof Icon>['kind'], string, string, number, number][] = [
    ['eggs', 'Яйця', '+44%', 44, b2 - 4], ['sugar', 'Цукор', '+8%', 8, b2 + 6], ['milk', 'Молоко', '≈ +7%', 7, b3 + 10], ['cheese', 'Сир', '≈ +7%', 7, b3 + 18],
  ];
  return (
    <AbsoluteFill>
      <ShelvesBg />
      <Center top={260}>
        <Chip at={CUT.shop + 2} size={30} bg={C.coral} fg={C.off} border={C.coral}>ЗА ОСТАННІЙ МІСЯЦЬ</Chip>
        <div style={{ height: 14 }} />
        <Headline text="СУПЕРМАРКЕТ" size={112} at={CUT.shop + 4} />
      </Center>
      {/* intro: cart rolls in */}
      {frame < b1 + 6 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', translate: `${cartX}px 0px`, opacity: 1 - prog(frame, b1 - 4, b1 + 4), rotate: `${Math.sin(frame / 3) * 2}deg` }}><Icon kind="cart" size={420} /></div>
      )}
      {/* hero: eggs +44% */}
      {frame >= b1 - 4 && heroOut < 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - heroOut, scale: String((1 - heroOut * 0.4) * punch(frame, egg44, 0.08)) }}>
          <Pop at={b1 - 2} from={0.2}><Icon kind="eggs" size={380} /></Pop>
          <Label size={44} color={C.off}>ЯЙЦЯ</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 10 }}>
            {frame >= egg44 && <div style={{ translate: `0px ${-prog(frame, egg44, egg44 + 20) * 30}px` }}><Arrow up size={130} color={C.coral} /></div>}
            <Pct v="+44%" color={C.coral} size={220} at={egg44} />
          </div>
        </div>
      )}
      {/* list: all four with bars on one scale */}
      {frame >= b2 - 8 && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rows.map(([ic, l, v, n, at]) => (
            <Rise key={l} at={at} dy={50} dur={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(6,13,29,0.82)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: '16px 26px', scale: String(punch(frame, at + 6, 0.04)) }}>
                <Icon kind={ic} size={110} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: C.off }}>{l}</div>
                  <div style={{ height: 18, marginTop: 10, borderRadius: 9, background: C.coral, width: 440 * (n / 44) * prog(frame, at + 4, at + 20) }} />
                </div>
                <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: n > 10 ? 86 : 70, color: C.coral }}>{v}</span>
              </div>
            </Rise>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ---------------- 6 the upside ---------------- */
const Plus: React.FC = () => {
  const frame = useCurrentFrame();
  const b1 = beat('plus', 1), b2 = beat('plus', 2), b3 = beat('plus', 3);
  const p6 = word('plus', '6%'), p2 = word('plus', '2%');
  const potIn = prog(frame, b3 - 6, b3 + 6);
  const drop = (i: number) => prog(frame, b3 + 4 + i * 4, b3 + 16 + i * 4, ease.inOut);
  const card = (icons: React.ComponentProps<typeof Icon>['kind'][], label: string, sub: string, v: string, at: number, pAt: number, top: number) => (
    <Rise at={at} dy={70} dur={12} style={{ position: 'absolute', left: 60, right: 60, top, opacity: 1 - potIn }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(6,13,29,0.82)', border: `3px solid ${C.green}`, borderRadius: 32, padding: '22px 28px', scale: String(punch(frame, pAt + 4, 0.05)) }}>
        <div style={{ display: 'flex' }}>{icons.map((ic, i) => <Pop key={ic} at={at + 3 + i * 4}><Icon kind={ic} size={104} /></Pop>)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: C.off }}>{label}</div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.gray }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{frame >= pAt && <Arrow up={false} size={56} color={C.green} />}<Pct v={v} color={C.green} size={96} at={pAt} /></div>
      </div>
    </Rise>
  );
  return (
    <AbsoluteFill>
      <NavyBg tint="#1F7A4A" />
      <Center top={280} style={{ opacity: 1 - potIn }}>
        <Pop at={CUT.plus + 2} from={0.2}><svg width={120} height={120} viewBox="-20 -20 40 40"><circle r={18} fill={C.green} /><path d="M-8 0 L-2 6 L9 -6" stroke={C.navyDeep} strokeWidth={4.5} fill="none" strokeLinecap="round" /></svg></Pop>
        <Headline text="АЛЕ Є І ПЛЮСИ" size={106} at={CUT.plus + 4} color={C.green} />
      </Center>
      {card(['apple', 'pear'], 'Фрукти', 'завдяки врожаю', '−6%', b1 - 2, p6, 700)}
      {card(['carrot', 'beet', 'cabbage'], 'Овочі', 'трохи більше ніж на 2%', '−2%', b2 - 2, p2, 980)}
      {/* borscht */}
      {frame >= b3 - 6 && (
        <AbsoluteFill style={{ opacity: potIn }}>
          <Center top={330}><Headline text="ХОЧ НА БОРЩІ" size={110} at={b3} color={C.yellow} /><Headline text="ЗЕКОНОМИМО" size={110} at={b3 + 5} /></Center>
          {(['beet', 'carrot', 'cabbage'] as const).map((ic, i) => (
            <div key={ic} style={{ position: 'absolute', left: 300 + i * 170, top: lerp(560, 930, drop(i)), opacity: 1 - prog(frame, b3 + 14 + i * 4, b3 + 18 + i * 4), rotate: `${drop(i) * 200}deg` }}><Icon kind={ic} size={140} /></div>
          ))}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', justifyContent: 'center', scale: String(punch(frame, b3 + 16, 0.06)) }}>
            <svg width={460} height={300} viewBox="-120 -110 240 160">
              {[-30, 0, 30].map((x, i) => <path key={x} d={`M${x} -30 Q${x + 12} -55 ${x} -75 Q${x - 12} -95 ${x} -110`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.25 + 0.2 * Math.sin(frame / 5 + i)} transform={`translate(0 ${-((frame * 0.8 + i * 10) % 20)})`} />)}
            </svg>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1080, display: 'flex', justifyContent: 'center' }}><Icon kind="pot" size={380} /></div>
        </AbsoluteFill>
      )}
      <Leaves n={8} opacity={0.5} />
    </AbsoluteFill>
  );
};

/* ---------------- 7 comment prompt ---------------- */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const b1 = beat('cta', 1);
  const typed = 'Моє місто — ____ грн/міс';
  const n = Math.floor(interpolate(frame, [b1 + 6, b1 + 40], [0, typed.length], clamp));
  const close = interpolate(frame, [DURATION - 10, DURATION - 1], [0, 0.8], clamp);
  return (
    <AbsoluteFill>
      <LvivPlate cam={{ x: 0, y: -60 + (frame - CUT.cta) * 0.3, z: 1.4 }} dim={0.35} />
      <Shade from={0.25} strength={0.9} />
      <Center top={320}>
        <Pop at={CUT.cta + 2} from={0.2}>
          <svg width={150} height={150} viewBox="0 0 40 40"><path d="M4 18 L20 5 L36 18 V36 H4 Z" fill={C.yellow} /><text x={20} y={32} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={16} fill={C.navyDeep}>?</text></svg>
        </Pop>
        <Headline text="А СКІЛЬКИ" size={120} at={CUT.cta + 4} />
        <Headline text="ПЛАТИТЕ ВИ?" size={120} at={CUT.cta + 9} color={C.yellow} style={{ marginTop: 6 }} />
      </Center>
      <Rise at={b1 - 2} dy={80} style={{ position: 'absolute', left: 80, right: 80, top: 900 }}>
        <div style={{ background: C.off, borderRadius: 30, padding: '26px 30px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: C.blue }} />
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.navy }}>Ваш коментар</div>
          </div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.navyDeep, minHeight: 56 }}>{typed.slice(0, n)}<span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: C.blue }}>|</span></div>
        </div>
      </Rise>
      <Center top={1220}>
        <Chip at={b1 + 10} size={40} bg={C.yellow} fg={C.navyDeep} border={C.yellow}>ПИШІТЬ МІСТО І ЦИФРИ ↓</Chip>
      </Center>
      <Leaves n={10} opacity={0.6} />
      <AbsoluteFill style={{ background: C.navyDeep, opacity: close }} />
    </AbsoluteFill>
  );
};

export const Zahid: React.FC = () => (
  <AbsoluteFill style={{ background: C.navyDeep }}>
    <Scene k="hook" enter="none"><Hook /></Scene>
    <Scene k="lviv" enter="zoom"><Lviv /></Scene>
    <Scene k="uzh" enter="wipe"><Uzh /></Scene>
    <Scene k="frank" enter="push"><Frank /></Scene>
    <Scene k="shop" enter="zoom"><Shop /></Scene>
    <Scene k="plus" enter="wipe"><Plus /></Scene>
    <Scene k="cta" enter="iris"><Cta /></Scene>
    <Leaves n={5} opacity={0.35} />
    <Vignette />
  </AbsoluteFill>
);
