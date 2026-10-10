// "Bern - Lebenshaltungskosten" (YouTube Short, German, prices in EUR). 1080x1920 @ 30 fps, silent picture;
// the mixed soundtrack (bern/build/mix.wav) is muxed in by bern/render.sh. All timings come from the voice.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { AltstadtPlate, BundeshausPlate, Cam, FlatPlate, TramPlate } from './Landscapes';
import { BODY, C, CUT, DURATION, HEAD, NEXT, clamp, cue, ease, lerp, money, prog } from './theme';
import { Captions, Card, Chip, Dollars, Headline, Label, NavyBg, Pop, Rise, Scene, Shade, Source, Vignette } from './ui';

const camLerp = (frame: number, a: number, b: number, c0: Cam, c1: Cam, e = ease.inOut): Cam => {
  const p = prog(frame, a, b, e);
  return { x: lerp(c0.x, c1.x, p), y: lerp(c0.y, c1.y, p), z: lerp(c0.z, c1.z, p) };
};
const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>{children}</div>
);
const RATE = 'Richtwerte, umgerechnet: 1 € = 1,1206 $ (EZB, 9.10.2026)';
const HOOK_START: Cam = { x: 0, y: -330, z: 1.2 };
const SwissFlag: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32"><rect width={32} height={32} rx={4} fill="#E5372B" /><rect x={13} y={6} width={6} height={20} fill="#fff" /><rect x={6} y={13} width={20} height={6} fill="#fff" /></svg>
);
const Bar: React.FC<{ w: number; color: string; h?: number; label?: React.ReactNode }> = ({ w, color, h = 26, label }) => (
  <div style={{ height: h, width: Math.max(0, w), background: color, borderRadius: h / 2, boxShadow: `0 0 18px ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>{label}</div>
);

/* 1 - hook: Bundeshaus above the Aare, Alps behind */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, 0, NEXT.hook + 9, HOOK_START, { x: 0, y: -390, z: 1.42 }, (t) => t); // constant push, never settles
  const dark = interpolate(frame, [0, 7], [1, 0], clamp);
  const b = cue('hook.bern');
  const bs = interpolate(frame, [b - 2, b + 4, b + 12], [2.0, 0.94, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: dark > 0.02 ? `blur(${dark * 14}px)` : undefined }}><BundeshausPlate cam={cam} /></AbsoluteFill>
      <Shade from={0.64} strength={0.75} />
      <Center top={290}>
        <Chip at={2} size={30}><SwissFlag size={32} />SCHWEIZ</Chip>
        <div style={{ height: 22 }} />
        <Headline text="WIE VIEL KOSTET DAS LEBEN IN" size={78} at={4} stagger={2.5} style={{ maxWidth: 900 }} />
        {frame >= b - 2 && (
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 230, lineHeight: 1, color: C.off, scale: String(bs), opacity: Math.min(1, (frame - b + 2) / 3), textShadow: '0 10px 40px rgba(0,0,0,0.5)', marginTop: 10 }}>
            BERN<span style={{ color: C.coral }}>?</span>
          </div>
        )}
        <div style={{ height: 14 }} />
        <Chip at={cue('hook.capital') - 2} bg={C.coral} fg={C.off} border={C.coral} size={38}>HAUPTSTADT DER SCHWEIZ</Chip>
      </Center>
      <AbsoluteFill style={{ background: C.navyDeep, opacity: dark }} />
    </AbsoluteFill>
  );
};

/* 2 - rent: walk down the arcaded old town toward the Zytglogge; outside vs centre */
const Rent: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, CUT.rent, NEXT.rent, { x: 0, y: 120, z: 1.0 }, { x: 0, y: 60, z: 1.3 }, ease.inOut);
  const o = cue('rent.out_price'), c = cue('rent.center_price');
  const bo = prog(frame, o, o + 18), bc = prog(frame, c, c + 18);
  const col = (lab: string, val: number, at: number, bar: number, color: string, hi: boolean) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 27, letterSpacing: 3, color: hi ? C.coral : C.gray }}>{lab}</div>
      <Dollars value={val} from={at - 26} land={at + 10} size={84} lockColor={C.off} />
      <div style={{ width: 360, height: 26, background: 'rgba(255,255,255,0.08)', borderRadius: 13 }}><Bar w={360 * (val / 1780) * bar} color={color} /></div>
    </div>
  );
  return (
    <AbsoluteFill>
      <AltstadtPlate cam={cam} />
      <Shade from={0.36} />
      <Center top={300}><Chip at={CUT.rent + 4} size={30}>01 · MIETE</Chip></Center>
      <Rise at={CUT.rent + 8} dy={120} dur={16} style={{ position: 'absolute', left: 50, right: 50, top: 880 }}>
        <Card accent={C.blue} style={{ padding: '30px 26px' }}>
          <Label>EINZIMMERWOHNUNG · PRO MONAT</Label>
          <div style={{ height: 24 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            {col('AUSSERHALB', 1340, o, bo, C.blue, frame >= cue('rent.out') && frame < c - 10)}
            <div style={{ width: 2, background: 'rgba(255,255,255,0.12)' }} />
            {col('IM ZENTRUM', 1780, c, bc, C.coral, frame >= cue('rent.center'))}
          </div>
          <div style={{ height: 20 }} />
          <Rise at={o + 12} dy={10}><Source size={24}>{RATE}</Source></Rise>
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 3 - monthly costs: tram arrives; groceries, health insurance, transport */
const Basket: React.FC = () => <svg width={56} height={56} viewBox="0 0 28 28"><path d="M3 9h22l-3 14H6z" fill={C.green} /><path d="M9 9l4-6M19 9l-4-6" stroke={C.green} strokeWidth={2.2} strokeLinecap="round" /></svg>;
const Health: React.FC = () => <svg width={56} height={56} viewBox="0 0 28 28"><rect x={1} y={1} width={26} height={26} rx={7} fill={C.coral} /><rect x={11} y={5} width={6} height={18} fill="#fff" /><rect x={5} y={11} width={18} height={6} fill="#fff" /></svg>;
const TramIcon: React.FC = () => <svg width={56} height={56} viewBox="0 0 28 28"><rect x={5} y={6} width={18} height={17} rx={4} fill={C.blue} /><rect x={8} y={9} width={12} height={6} rx={1.5} fill={C.navyDeep} /><circle cx={10} cy={19} r={1.6} fill={C.navyDeep} /><circle cx={18} cy={19} r={1.6} fill={C.navyDeep} /><path d="M11 6l3-3 3 3" stroke={C.blue} strokeWidth={1.8} fill="none" /></svg>;
const Month: React.FC = () => {
  const frame = useCurrentFrame();
  const tramX = interpolate(frame, [CUT.month, CUT.month + 50], [1250, 40], { ...clamp, easing: ease.out });
  const cam = camLerp(frame, CUT.month, NEXT.month, { x: 0, y: -170, z: 1.02 }, { x: 0, y: -150, z: 1.1 }, ease.inOut);
  const rows: [React.ReactNode, string, number, number, number][] = [
    [<Basket />, 'Lebensmittel', 550, cue('month.food'), cue('month.food_price')],
    [<Health />, 'Krankenversicherung', 410, cue('month.health'), cue('month.health_price')],
    [<TramIcon />, 'Transport', 95, cue('month.transport'), cue('month.transport_price')],
  ];
  return (
    <AbsoluteFill>
      <TramPlate cam={cam} tramX={tramX} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,13,29,0.9) 0%, rgba(6,13,29,0.75) 40%, rgba(6,13,29,0) 50%, rgba(6,13,29,0) 66%, rgba(6,13,29,0.9) 76%)' }} />
      <Center top={300}><Chip at={CUT.month + 4} size={30}>02 · JEDEN MONAT</Chip></Center>
      <Rise at={CUT.month + 6} dy={80} style={{ position: 'absolute', left: 60, right: 60, top: 400 }}>
        <Card accent={C.green} style={{ padding: '24px 36px' }}>
          {rows.map(([icon, lab, val, at, price], i) => (
            <Rise key={lab} at={at - 6} dy={30}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '24px 0', borderTop: i ? '2px solid rgba(255,255,255,0.08)' : undefined }}>
                <Pop at={at - 2}>{icon}</Pop>
                <span style={{ flex: 1, fontFamily: BODY, fontWeight: 700, fontSize: lab.length > 14 ? 36 : 44, color: C.off }}>{lab}</span>
                <div style={{ minWidth: 260 }}><Dollars value={val} from={price - 18} land={price + 8} size={76} lockColor={C.off} /></div>
              </div>
            </Rise>
          ))}
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 4 - the monthly total as a range on a 0-4.000 € scale */
const Total: React.FC = () => {
  const frame = useCurrentFrame();
  const lo = cue('total.lo'), hi = cue('total.hi');
  const band = prog(frame, hi + 6, hi + 26, ease.inOut);
  const fill = prog(frame, lo - 6, lo + 20, ease.out);
  const W = 860, scale = (v: number) => (v / 4000) * W;
  return (
    <AbsoluteFill>
      <NavyBg />
      <Center top={300}><Chip at={CUT.total + 4} size={30}>03 · ALLES ZUSAMMEN</Chip></Center>
      <Center top={410} style={{ position: 'absolute', scale: String(1 + 0.04 * prog(frame, CUT.total, NEXT.total + 9, (t) => t)) }}>
        <Rise at={cue('total.extra') - 4}><Label size={32} color={C.gray}>MIT NEBENKOSTEN & ANDEREN AUSGABEN</Label></Rise>
        <div style={{ height: 30 }} />
        <div style={{ position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, opacity: 1 - prog(frame, lo - 30, lo - 22, ease.inOut) }}>
          {[['Miete', C.blue], ['Lebensmittel', C.green], ['Krankenkasse', C.coral], ['Transport', C.blue], ['Nebenkosten', C.gray], ['Freizeit & mehr', C.gray]].map(([t, col], i) => (
            <Chip key={t} at={CUT.total + 10 + i * 9} size={40} border={col} fg={C.off}><span style={{ width: 16, height: 16, borderRadius: 8, background: col, display: 'inline-block' }} />{t}</Chip>
          ))}
          <Pop at={CUT.total + 66}><div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 120, color: C.off, width: 900, textAlign: 'center', marginTop: 20 }}>= ?</div></Pop>
        </div>
        <Dollars value={3300} from={lo - 24} land={lo + 10} size={150} lockColor={C.off} />
        <Rise at={lo + 14} dy={16}><div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 54, color: C.gray, margin: '6px 0' }}>BIS</div></Rise>
        <Dollars value={3900} from={hi - 24} land={hi + 10} size={150} lockColor={C.coral} />
        <div style={{ height: 22 }} />
        <Rise at={hi + 12} dy={16}><Label size={30} color={C.gray}>PRO PERSON · PRO MONAT</Label></Rise>
        <div style={{ height: 44 }} />
        <div style={{ position: 'relative', width: W, height: 34, background: 'rgba(255,255,255,0.08)', borderRadius: 17, opacity: prog(frame, lo - 10, lo) }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 34, width: scale(3300) * fill, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, borderRadius: 17 }} />
          <div style={{ position: 'absolute', left: scale(3300), top: -8, height: 50, width: (scale(3900) - scale(3300)) * band, background: C.coral, borderRadius: 10, boxShadow: `0 0 26px ${C.coral}88` }} />
          {[0, 1000, 2000, 3000, 4000].map((v) => (
            <div key={v} style={{ position: 'absolute', left: scale(v) - 60, width: 120, top: 48, textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 24, color: C.grayDim }}>{money(v)}</div>
          ))}
        </div>
      </Center>
    </AbsoluteFill>
  );
};

/* 5 - net salary vs monthly spending */
const Salary: React.FC = () => {
  const frame = useCurrentFrame();
  const p = cue('salary.price');
  const g = prog(frame, p - 20, p + 14, ease.out);
  const e = prog(frame, p + 16, p + 34, ease.out);
  const W = 820, sc = (v: number) => (v / 6400) * W;
  return (
    <AbsoluteFill>
      <BundeshausPlate cam={{ x: 120 + (frame - CUT.salary) * 0.5, y: -260, z: 1.6 }} dim={0.55} />
      <Shade from={0.2} strength={0.85} />
      <Center top={300}><Chip at={CUT.salary + 4} size={30}>04 · GEHALT</Chip></Center>
      <Rise at={CUT.salary + 6} dy={90} style={{ position: 'absolute', left: 60, right: 60, top: 420 }}>
        <Card accent={C.green} style={{ padding: '34px 40px' }}>
          <Label color={C.green}>DURCHSCHNITTLICHES NETTOGEHALT</Label>
          <div style={{ height: 14 }} />
          <Dollars value={6400} from={p - 22} land={p + 10} size={150} lockColor={C.green} suffix={<span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: C.gray }}>/ MONAT</span>} />
          <div style={{ height: 34 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.gray, letterSpacing: 2 }}>NETTOGEHALT</div>
            <Bar w={sc(6400) * g} color={C.green} h={34} />
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.gray, letterSpacing: 2, marginTop: 8, opacity: e }}>AUSGABEN 3.300–3.900 €</div>
            <div style={{ position: 'relative', height: 34, opacity: e }}>
              <div style={{ position: 'absolute', left: 0, height: 34, width: sc(3300) * e, background: C.coral, borderRadius: 17 }} />
              <div style={{ position: 'absolute', left: sc(3300) * e - 17, height: 34, width: (sc(3900) - sc(3300)) * e + 17, borderRadius: 17, background: `repeating-linear-gradient(45deg, ${C.coral} 0 10px, ${C.coral}55 10px 20px)` }} />
            </div>
          </div>
          <div style={{ height: 30 }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Chip at={p + 36} bg="rgba(79,208,143,0.16)" fg={C.green} border={C.green} size={36}>BLEIBEN: CA. 2.500–3.100 €</Chip>
          </div>
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 6 - buying: price counter, then "almost a million" */
const Buy: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, CUT.buy, NEXT.buy, { x: 0, y: 140, z: 1.0 }, { x: 0, y: 60, z: 1.25 }, ease.inOut);
  const p = cue('buy.price'), m = cue('buy.million');
  const st = interpolate(frame, [m - 2, m + 4, m + 12], [2.4, 0.92, 1], clamp);
  return (
    <AbsoluteFill>
      <FlatPlate cam={cam} />
      <Shade from={0.34} />
      <Center top={300}><Chip at={CUT.buy + 4} size={30}>05 · KAUFEN</Chip></Center>
      <Rise at={CUT.buy + 8} dy={120} dur={16} style={{ position: 'absolute', left: 60, right: 60, top: 860 }}>
        <Card accent={C.coral} style={{ position: 'relative' }}>
          <Headline text="EIGENE WOHNUNG KAUFEN?" size={62} at={cue('buy.q') - 30} stagger={3} />
          <div style={{ height: 20 }} />
          <Label size={28} color={C.gray}>KAUFPREIS CA.</Label>
          <div style={{ height: 6 }} />
          <Dollars value={980000} from={p - 30} land={p + 12} size={128} lockColor={C.off} />
          <div style={{ height: 14 }} />
          <Rise at={p + 16} dy={10}><Source size={24}>≈ 1,1 Mio. $ · {RATE.replace('Richtwerte, umgerechnet: ', '')}</Source></Rise>
          {frame >= m - 2 && (
            <div style={{ position: 'absolute', right: 30, top: -170, rotate: '-7deg', scale: String(st), background: C.coral, color: C.off, borderRadius: 18, padding: '10px 26px', fontFamily: HEAD, fontWeight: 900, fontSize: 70, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', border: `4px solid ${C.off}` }}>FAST 1 MIO. €</div>
          )}
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 7 - the question, back on the opening shot (loops into the hook) */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, CUT.cta, DURATION, { x: 0, y: -390, z: 1.38 }, HOOK_START, ease.inOut);
  const ja = cue('cta.ja'), nein = cue('cta.nein');
  const close = interpolate(frame, [DURATION - 10, DURATION - 1], [0, 0.75], clamp);
  const card = (txt: string, col: string, at: number, side: number) => {
    const p = interpolate(frame, [at - 4, at + 10], [0, 1], { ...clamp, easing: ease.back });
    return <div style={{ width: 420, height: 200, borderRadius: 36, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 104, color: C.navyDeep, translate: `${(1 - p) * side * 600}px 0px`, rotate: `${(1 - p) * side * 10}deg`, boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.12)', opacity: frame >= at - 4 ? 1 : 0 }}>{txt}</div>;
  };
  return (
    <AbsoluteFill>
      <BundeshausPlate cam={cam} />
      <Shade from={0.64} strength={0.75} />
      <Center top={330}>
        <Headline text="IST BERN" size={120} at={CUT.cta + 3} />
        <Headline text="DIESEN PREIS WERT?" size={96} at={cue('cta.worth') - 8} style={{ marginTop: 10 }} />
        <div style={{ height: 30 }} />
        <Chip at={cue('cta.write') - 2} size={34} bg={C.off} fg={C.navyDeep} border={C.off}>
          <svg width={36} height={34} viewBox="0 0 24 22"><path d="M3 3h18v12H9l-5 4v-4H3z" fill={C.navyDeep} /></svg>KOMMENTIEREN
        </Chip>
      </Center>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', gap: 36 }}>
        {card('JA', C.green, ja, -1)}
        {card('NEIN', C.coral, nein, 1)}
      </div>
      <AbsoluteFill style={{ background: C.navyDeep, opacity: close }} />
    </AbsoluteFill>
  );
};

const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [CUT.rent, CUT.rent + 10, CUT.cta - 6, CUT.cta], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', top: 222, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: 'rgba(244,241,234,0.85)' }}>BERN · LEBENSHALTUNGSKOSTEN</div>
    </div>
  );
};

export const Bern: React.FC = () => (
  <AbsoluteFill style={{ background: C.navyDeep }}>
    <Scene k="hook" enter="none"><Hook /></Scene>
    <Scene k="rent" enter="zoom"><Rent /></Scene>
    <Scene k="month" enter="wipe"><Month /></Scene>
    <Scene k="total" enter="push"><Total /></Scene>
    <Scene k="salary" enter="wipe"><Salary /></Scene>
    <Scene k="buy" enter="push"><Buy /></Scene>
    <Scene k="cta" enter="iris"><Cta /></Scene>
    <Vignette />
    <Hud />
    <Captions />
  </AbsoluteFill>
);
