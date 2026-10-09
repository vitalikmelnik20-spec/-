// "Olympia, WA - cost of living" (YouTube Short, 1080x1920, 30 fps). Silent picture; the mixed soundtrack
// (olympia/build/mix.wav) is muxed in by olympia/render.sh. All timings come from the measured voice-over.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ApartmentPlate, BusStreetPlate, Cam, CapitolPlate, HousePlate, WaterfrontPlate } from './Landscapes';
import { WA_H, WA_PATHS, WA_W, OLYMPIA, SEATTLE } from './waMap';
import { BODY, C, CUT, DURATION, HEAD, NEXT, XF, clamp, cue, ease, lerp, prog } from './theme';
import { CalendarIcon, Captions, Card, Check, Chip, Dollars, Headline, Label, NavyBg, Pop, Rise, Scene, Shade, Source, Vignette } from './ui';

const camLerp = (frame: number, a: number, b: number, c0: Cam, c1: Cam, e = ease.inOut): Cam => {
  const p = prog(frame, a, b, e);
  return { x: lerp(c0.x, c1.x, p), y: lerp(c0.y, c1.y, p), z: lerp(c0.z, c1.z, p) };
};
const Center: React.FC<{ top: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ top, children, style }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, top, display: 'flex', flexDirection: 'column', alignItems: 'center', ...style }}>{children}</div>
);
const CENSUS = 'U.S. Census Bureau · ACS 2020–2024';
const HOOK_CAM: Cam = { x: 0, y: -250, z: 1.45 };

/* 1 - hook: dark frame punches into the Capitol, two-stage headline */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, 0, NEXT.hook, { x: 0, y: -190, z: 1.18 }, HOOK_CAM, ease.out);
  const dark = interpolate(frame, [0, 7], [1, 0], clamp);
  const q = cue('hook.income') + 9;
  const qs = interpolate(frame, [q, q + 5, q + 12], [2.2, 0.92, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: dark > 0.02 ? `blur(${dark * 14}px)` : undefined }}><CapitolPlate cam={cam} /></AbsoluteFill>
      <Shade from={0.6} strength={0.8} />
      <Center top={300}><Chip at={2} size={30}>WASHINGTON STATE</Chip></Center>
      <Center top={410}>
        <Headline text="NO STATE" size={150} at={3} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginTop: 8 }}>
          <Headline text="INCOME TAX" size={128} at={cue('hook.income') - 2} />
          {frame >= q && <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 150, color: C.coral, marginLeft: 6, scale: String(qs), display: 'inline-block', textShadow: '0 8px 34px rgba(0,0,0,0.5)' }}>?</span>}
        </div>
      </Center>
      <AbsoluteFill style={{ background: C.navyDeep, opacity: dark }} />
    </AbsoluteFill>
  );
};

/* 2 - waterfront reveal, then the map that pins Olympia (not Seattle) */
const City: React.FC = () => {
  const frame = useCurrentFrame();
  const meet = cue('city.meet');
  const camW = camLerp(frame, CUT.city, meet + 6, { x: -70, y: -60, z: 1.12 }, { x: 60, y: -40, z: 1.24 }, ease.inOut);
  // map: outline draws, pin drops, gentle push toward Olympia
  const draw = prog(frame, meet, meet + 18, ease.inOut);
  const mp = prog(frame, meet, NEXT.city + XF, ease.inOut);
  const mz = 1 + 0.1 * mp;
  const pin = interpolate(frame, [meet + 8, meet + 20], [0, 1], { ...clamp, easing: ease.back });
  const house = cue('city.housing');
  const mapOn = frame >= meet;
  const wipe = prog(frame, meet - 2, meet + 8, ease.inOut);
  return (
    <AbsoluteFill>
      <WaterfrontPlate cam={camW} />
      <Shade from={0.5} />
      {mapOn && (
        <AbsoluteFill style={{ clipPath: `circle(${wipe * 130}% at 30% 52%)` }}>
          <NavyBg />
          <div style={{ position: 'absolute', left: 90, top: 700, width: WA_W, height: WA_H, scale: String(mz), transformOrigin: `${OLYMPIA.x}px ${OLYMPIA.y}px` }}>
            <svg width={WA_W} height={WA_H} viewBox={`-10 -10 ${WA_W + 20} ${WA_H + 20}`} style={{ overflow: 'visible' }}>
              {WA_PATHS.map((d, i) => <path key={i} d={d} fill={C.forest} fillOpacity={draw} stroke={C.green} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />)}
              <circle cx={SEATTLE.x} cy={SEATTLE.y} r={8} fill={C.gray} opacity={pin} />
              <text x={SEATTLE.x + 16} y={SEATTLE.y + 9} fontFamily={BODY} fontWeight={600} fontSize={28} fill={C.gray} opacity={pin}>Seattle</text>
              <g transform={`translate(${OLYMPIA.x} ${OLYMPIA.y - (1 - pin) * 80})`} opacity={Math.min(1, pin * 2)}>
                <circle r={30 + 14 * Math.sin(frame / 5)} fill={C.coral} opacity={0.18} />
                <path d="M0 0 C-16 -22 -22 -32 -22 -44 A22 22 0 1 1 22 -44 C22 -32 16 -22 0 0 Z" fill={C.coral} stroke={C.off} strokeWidth={3} />
                <polygon points="0,-58 4,-48 15,-48 6,-41 9,-31 0,-37 -9,-31 -6,-41 -15,-48 -4,-48" fill={C.off} />
              </g>
            </svg>
            {/* label kept outside the svg so it stays crisp */}
            <div style={{ position: 'absolute', left: OLYMPIA.x + 34, top: OLYMPIA.y - 58, width: 340, textAlign: 'left', opacity: pin }}>
              <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, color: C.off }}>OLYMPIA</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.coral }}>STATE CAPITAL</div>
            </div>
            {frame >= house && (
              <div style={{ position: 'absolute', left: OLYMPIA.x + 30, top: OLYMPIA.y + 40 }}>
                <Pop at={house}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.off, borderRadius: 22, padding: '12px 20px', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}>
                    <svg width={52} height={48} viewBox="0 0 26 24"><path d="M2 12 L13 2 L24 12 V23 H2 Z" fill={C.forest} /><rect x={10} y={15} width={6} height={8} fill={C.off} /></svg>
                    <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, color: C.coral }}>$?</span>
                  </div>
                </Pop>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
      <Center top={300}>
        <Headline text="OLYMPIA," size={150} at={CUT.city + 4} />
        <Rise at={CUT.city + 10}><div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 52, letterSpacing: 16, color: C.off, marginTop: 10 }}>WASHINGTON</div></Rise>
        <div style={{ height: 34 }} />
        <Chip at={cue('city.afford') - 3} bg={C.coral} fg={C.navyDeep} border={C.coral} size={46}>CAN YOU AFFORD IT?</Chip>
      </Center>
    </AbsoluteFill>
  );
};

/* 3 - rent: card, count-up, data period made obvious */
const Rent: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, CUT.rent, NEXT.rent, { x: 0, y: 70, z: 1.0 }, { x: 0, y: 0, z: 1.22 }, ease.inOut);
  const land = cue('rent.price') + 12;
  const period = cue('rent.period');
  const hi = prog(frame, period, period + 10);
  const flip = interpolate(frame % 40, [30, 40], [0, 1], clamp) * (frame > land ? 1 : 0);
  return (
    <AbsoluteFill>
      <ApartmentPlate cam={cam} />
      <Shade from={0.3} />
      <Center top={300}><Chip at={CUT.rent + 4} size={30}>01 · RENT</Chip></Center>
      <Rise at={CUT.rent + 8} dy={120} dur={16} style={{ position: 'absolute', left: 70, right: 70, top: 860 }}>
        <Card accent={C.blue} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', right: 34, top: -64 }}><Pop at={CUT.rent + 18}><CalendarIcon size={110} flip={flip} label="RENT" /></Pop></div>
          <Label>MEDIAN GROSS RENT</Label>
          <div style={{ height: 18 }} />
          <Dollars value={1599} from={cue('rent.census') + 6} land={land} size={150} lockColor={C.off}
            suffix={<span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 46, color: C.gray, whiteSpace: 'nowrap' }}>/ MONTH</span>} />
          <div style={{ height: 22 }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.off }}>
              <span style={{ color: C.gray, fontWeight: 600 }}>U.S. Census Bureau ·</span>
              <span style={{ padding: '4px 14px', borderRadius: 12, background: `rgba(255,122,82,${0.95 * hi})`, color: hi > 0.5 ? C.navyDeep : C.off, scale: String(1 + 0.08 * Math.sin(Math.PI * hi)) }}>ACS 2020–2024</span>
            </div>
          </div>
          <Rise at={period + 8} dy={20}><div style={{ marginTop: 18, textAlign: 'center', fontFamily: BODY, fontWeight: 500, fontSize: 28, color: C.gray }}>Rent + utilities paid by renters · not today’s listings</div></Rise>
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 4 - buy: rent vs home value side by side, then the home value takes over */
const Buy: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camLerp(frame, CUT.buy, NEXT.buy, { x: -30, y: 90, z: 1.0 }, { x: 30, y: 0, z: 1.26 }, ease.inOut);
  const land = cue('buy.price') + 16;
  const grow = prog(frame, land + 8, land + 26, ease.inOut);
  const leftOut = prog(frame, land + 4, land + 18, ease.inOut);
  return (
    <AbsoluteFill>
      <HousePlate cam={cam} />
      <Shade from={0.32} />
      <Center top={300}><Chip at={CUT.buy + 4} size={30}>02 · BUYING</Chip></Center>
      {/* rent mini card (left) */}
      <Rise at={CUT.buy + 6} dy={60} style={{ position: 'absolute', left: 60, top: 930, width: 330, opacity: 1 - leftOut, translate: `${-leftOut * 120}px 0px` }}>
        <Card style={{ padding: '26px 18px' }}>
          <Label size={26} color={C.gray}>RENT</Label>
          <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 78, color: C.off, textAlign: 'center', marginTop: 8 }}>$1,599</div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.gray, textAlign: 'center' }}>per month</div>
        </Card>
      </Rise>
      {/* home value card (right -> centre) */}
      <Rise at={cue('buy.median') - 8} dy={80} style={{ position: 'absolute', left: lerp(410, 70, grow), right: 60, top: lerp(930, 860, grow) }}>
        <Card accent={C.coral} style={{ padding: `${lerp(26, 34, grow)}px 24px` }}>
          <Label size={lerp(26, 32, grow)} color={C.coral}>{grow > 0.5 ? 'MEDIAN OWNER-OCCUPIED HOME VALUE' : 'HOME VALUE'}</Label>
          <div style={{ height: lerp(8, 18, grow) }} />
          <Dollars value={486200} from={cue('buy.median') + 4} land={land} size={lerp(84, 150, grow)} lockColor={C.off} />
          <div style={{ height: lerp(8, 22, grow) }} />
          {grow > 0.02 ? <div style={{ opacity: grow }}><Source size={30}>{CENSUS}</Source></div> : <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.gray, textAlign: 'center' }}>median</div>}
        </Card>
      </Rise>
    </AbsoluteFill>
  );
};

/* 5 - tax twist: paycheck stub ($0 state income tax on wages) -> other taxes still apply */
const Tax: React.FC = () => {
  const frame = useCurrentFrame();
  const no = cue('tax.no'), but = cue('tax.but');
  const stubIn = prog(frame, CUT.tax + 2, CUT.tax + 20, ease.out);
  const stubUp = prog(frame, but - 6, but + 10, ease.inOut);
  const stamp = interpolate(frame, [no + 26, no + 32, no + 38], [2, 0.92, 1], clamp);
  const row = (label: string, val: string, color: string, k: number) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '2px dashed rgba(11,22,48,0.15)', fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.navy }}>
      <span>{label}</span><span style={{ color }}>{val}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <NavyBg />
      <Center top={300}><Chip at={CUT.tax + 4} size={30}>03 · THE TAX TWIST</Chip></Center>
      {/* paycheck stub */}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 430, opacity: 1 - stubUp, translate: `${(1 - stubIn) * 900}px ${-stubUp * 160}px`, rotate: `${(1 - stubIn) * 8 - stubUp * 3}deg` }}>
        <div style={{ background: C.off, borderRadius: 30, padding: '32px 40px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 52, color: C.forest }}>
            <span>PAYCHECK</span>
            <svg width={60} height={40} viewBox="0 0 30 20"><rect x={1} y={1} width={28} height={18} rx={3} fill={C.green} /><circle cx={15} cy={10} r={5} fill={C.off} /><text x={15} y={13.5} fontSize={9} textAnchor="middle" fontWeight={900} fill={C.green} fontFamily="Montserrat">$</text></svg>
          </div>
          {row('Federal income tax', 'withheld', C.grayDim, 1)}
          {frame >= no - 4 && <div style={{ background: `rgba(79,208,143,${0.18 * prog(frame, no - 4, no + 6)})`, borderRadius: 10, margin: '0 -12px', padding: '0 12px' }}>{row('State income tax on wages', '$0', C.forest, 2)}</div>}
          {frame < no - 4 && row('State income tax on wages', '…', C.grayDim, 2)}
          {frame >= no + 26 && (
            <div style={{ position: 'absolute', right: 24, bottom: -46, rotate: '-8deg', scale: String(stamp), border: `5px solid ${C.green}`, color: C.green, background: 'rgba(244,241,234,0.94)', borderRadius: 14, padding: '6px 18px', fontFamily: HEAD, fontWeight: 900, fontSize: 40, letterSpacing: 2 }}>NONE</div>
          )}
        </div>
      </div>
      <Rise at={no} out={but - 8} style={{ position: 'absolute', left: 70, right: 70, top: 900 }}>
        <Label size={34} color={C.gray}>STATE INCOME TAX ON WAGES</Label>
        <div style={{ height: 18 }} />
        <Headline text="NO BROAD STATE PERSONAL INCOME TAX" size={80} at={no + 8} stagger={2.5} color={C.green} />
      </Rise>
      {/* other taxes */}
      {frame >= but - 2 && (
        <Rise at={but - 2} dy={140} dur={14} style={{ position: 'absolute', left: 60, right: 60, top: 520 }}>
          <Card accent={C.coral}>
            <Headline text="OTHER TAXES STILL APPLY" size={80} at={but} stagger={2.5} color={C.coral} />
            <div style={{ height: 26 }} />
            {[
              ['Sales tax in Olympia', '10.0%', but + 14],
              ['Property tax', 'yes', but + 24],
              ['Federal income tax', 'yes', but + 34],
            ].map(([l, v, at]) => (
              <Rise key={l as string} at={at as number} dy={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 6px', borderTop: '2px solid rgba(255,255,255,0.1)', fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.off }}>
                  <span>{l}</span><span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 46, color: v === 'yes' ? C.gray : C.coral }}>{v === 'yes' ? 'APPLIES' : v}</span>
                </div>
              </Rise>
            ))}
            <div style={{ height: 12 }} />
            <Rise at={but + 40} dy={10}><Source size={26}>Sales tax: WA Dept. of Revenue · City of Olympia rate eff. July 1, 2026</Source></Rise>
          </Card>
        </Rise>
      )}
    </AbsoluteFill>
  );
};

/* 6 - transit: bus pulls in, ticket tears into $0 */
const Transit: React.FC = () => {
  const frame = useCurrentFrame();
  const busX = interpolate(frame, [CUT.transit, CUT.transit + 46], [1250, 110], { ...clamp, easing: ease.out });
  const cam = camLerp(frame, CUT.transit, NEXT.transit, { x: 0, y: -150, z: 1.02 }, { x: 0, y: -130, z: 1.08 }, ease.inOut);
  const fare = cue('transit.fare');
  const tear = prog(frame, fare - 16, fare - 4, ease.inOut);
  const zero = interpolate(frame, [fare - 4, fare + 8], [0, 1], { ...clamp, easing: ease.back });
  return (
    <AbsoluteFill>
      <BusStreetPlate cam={cam} busX={busX} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,13,29,0.9) 0%, rgba(6,13,29,0.7) 38%, rgba(6,13,29,0) 50%, rgba(6,13,29,0) 66%, rgba(6,13,29,0.9) 76%)' }} />
      <Center top={300}><Chip at={CUT.transit + 4} size={30}>04 · GETTING AROUND</Chip></Center>
      <Center top={380}>
        <Rise at={cue('transit.buses') - 4}><Label size={34} color={C.gray}>INTERCITY TRANSIT · LOCAL BUSES</Label></Rise>
        <div style={{ position: 'relative', height: 260, width: 900, marginTop: 6 }}>
          {/* ticket: two halves pull apart */}
          {frame >= cue('transit.buses') && tear < 1 && (
            <Pop at={cue('transit.buses') + 4} style={{ position: 'absolute', left: 230, top: 40, opacity: 1 - tear }}>
              <div style={{ display: 'flex' }}>
                {[0, 1].map((h) => (
                  <div key={h} style={{ width: 220, height: 170, background: C.off, borderRadius: h ? '0 22px 22px 0' : '22px 0 0 22px', borderLeft: h ? `4px dashed ${C.grayDim}` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 58, color: C.forest, translate: `${(h ? 1 : -1) * tear * 160}px ${tear * 30}px`, rotate: `${(h ? 1 : -1) * tear * 18}deg` }}>{h ? 'FARE' : 'BUS'}</div>
                ))}
              </div>
            </Pop>
          )}
          {frame >= fare - 4 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, scale: String(0.5 + 0.5 * zero), opacity: Math.min(1, zero * 2) }}>
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 230, color: C.green, lineHeight: 1, textShadow: `0 0 70px ${C.green}55` }}>$0</span>
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 110, color: C.off, lineHeight: 1 }}>FARE</span>
            </div>
          )}
        </div>
        <Rise at={cue('transit.check') - 2} dy={24}>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.off }}>Zero-fare since 2020 · extended to Jan. 1, 2028</div>
            <Source size={27}>Intercity Transit · Transit Guide, eff. Sept. 20, 2026</Source>
          </div>
        </Rise>
      </Center>
    </AbsoluteFill>
  );
};

/* 7 - summary montage: three ticks, then housing is the question */
const Summary: React.FC = () => {
  const frame = useCurrentFrame();
  const c1 = cue('summary.capital'), c2 = cue('summary.pnw'), c3 = cue('summary.perk'), hb = cue('summary.but');
  const shot = frame < c2 - 2 ? 0 : frame < c3 - 2 ? 1 : frame < hb - 2 ? 2 : 3;
  const at = [CUT.summary, c2 - 2, c3 - 2, hb - 2][shot];
  const flash = interpolate(frame, [at, at + 5], [shot ? 0.35 : 0, 0], clamp);
  const local = frame - at;
  const plate = [
    <CapitolPlate key="a" cam={{ x: 0, y: -330 - local * 0.6, z: 2.3 + local * 0.004 }} />,
    <CapitolPlate key="b" cam={{ x: 300 + local * 1.2, y: -90, z: 1.7 }} />,
    <BusStreetPlate key="c" cam={{ x: -40 + local * 1.4, y: 30, z: 1.25 }} busX={110} />,
    <HousePlate key="d" cam={{ x: 0, y: 0, z: 1.08 + local * 0.0015 }} />,
  ][shot];
  const rows: [string, number, string, 'check' | 'alert'][] = [
    ['CAPITAL CITY', c1, C.green, 'check'], ['PACIFIC NORTHWEST', c2, C.green, 'check'], ['TRANSIT PERK', c3, C.green, 'check'], ['HOUSING COSTS', hb, C.coral, 'alert'],
  ];
  const watch = cue('summary.watch');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale: String(1 + 0.04 * interpolate(local, [0, 6], [1, 0], clamp)) }}>{plate}</AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(6,13,29,${shot === 3 ? 0.55 : 0.35})` }} />
      <Shade from={0.5} />
      <div style={{ position: 'absolute', left: 110, top: 330, display: 'flex', flexDirection: 'column', gap: 30 }}>
        {rows.map(([t, a, col, mk]) => (
          <Rise key={t} at={a - 3} dy={0} style={{ translate: '0px 0px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, translate: `${(1 - prog(frame, a - 3, a + 9)) * -80}px 0px` }}>
              <Pop at={a + 2}><Check size={64} color={col} mark={mk} /></Pop>
              <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 62, color: mk === 'alert' ? C.coral : C.off, textShadow: '0 6px 26px rgba(0,0,0,0.6)' }}>{t}</span>
            </div>
          </Rise>
        ))}
      </div>
      {frame >= hb + 6 && (
        <Center top={830}>
          <Headline text="HOUSING IS THE BIG QUESTION" size={92} at={hb + 6} stagger={3} />
          <div style={{ height: 10, width: 640 * prog(frame, hb + 20, hb + 40), background: C.coral, borderRadius: 6, marginTop: 22, boxShadow: `0 0 24px ${C.coral}88` }} />
          <div style={{ display: 'flex', gap: 24, marginTop: 34 }}>
            {[['RENT', '$1,599/mo', hb + 26], ['HOME VALUE', '$486,200', hb + 32]].map(([l, v, a]) => (
              <Pop key={l as string} at={a as number}>
                <div style={{ background: 'rgba(7,14,31,0.86)', border: `2px solid ${frame >= watch ? C.coral : 'rgba(255,255,255,0.16)'}`, borderRadius: 26, padding: '16px 28px', textAlign: 'center' }}>
                  <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.gray }}>MEDIAN {l}</div>
                  <div style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 58, color: C.off }}>{v}</div>
                </div>
              </Pop>
            ))}
          </div>
        </Center>
      )}
      <AbsoluteFill style={{ background: C.off, opacity: flash }} />
    </AbsoluteFill>
  );
};

/* 8 - the question, back on the opening shot (loops into the hook) */
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  // pulls back to the hook's first framing, so the loop restarts on the same shot
  const cam = camLerp(frame, CUT.cta, DURATION, { x: 0, y: -240, z: 1.34 }, { x: 0, y: -190, z: 1.18 }, ease.inOut);
  const yes = cue('cta.yes'), no = cue('cta.no');
  const close = interpolate(frame, [DURATION - 10, DURATION - 1], [0, 0.75], clamp);
  const card = (txt: string, col: string, at: number, side: number) => {
    const p = interpolate(frame, [at - 4, at + 10], [0, 1], { ...clamp, easing: ease.back });
    return (
      <div style={{ width: 400, height: 210, borderRadius: 36, background: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 120, color: C.navyDeep, translate: `${(1 - p) * side * 600}px 0px`, rotate: `${(1 - p) * side * 10}deg`, boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.12)`, opacity: frame >= at - 4 ? 1 : 0 }}>{txt}</div>
    );
  };
  return (
    <AbsoluteFill>
      <CapitolPlate cam={cam} />
      <Shade from={0.6} strength={0.8} />
      <Center top={380}>
        <Headline text="WOULD YOU" size={128} at={CUT.cta + 3} />
        <Headline text="LIVE HERE?" size={128} at={CUT.cta + 8} color={C.off} style={{ marginTop: 8 }} />
        <div style={{ height: 30 }} />
        <Chip at={cue('cta.comment') - 2} size={34} bg={C.off} fg={C.navyDeep} border={C.off}>
          <svg width={36} height={34} viewBox="0 0 24 22"><path d="M3 3h18v12H9l-5 4v-4H3z" fill={C.navyDeep} /></svg>COMMENT
        </Chip>
      </Center>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1030, display: 'flex', justifyContent: 'center', gap: 40 }}>
        {card('YES', C.green, yes, -1)}
        {card('NO', C.coral, no, 1)}
      </div>
      <AbsoluteFill style={{ background: C.navyDeep, opacity: close }} />
    </AbsoluteFill>
  );
};

/* persistent series label (kept below the Shorts top bar) */
const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [CUT.rent, CUT.rent + 10, CUT.cta - 6, CUT.cta], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', top: 222, width: 1080, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: 'rgba(244,241,234,0.85)' }}>OLYMPIA, WA · COST OF LIVING</div>
    </div>
  );
};

export const Olympia: React.FC = () => (
  <AbsoluteFill style={{ background: C.navyDeep }}>
    <Scene k="hook" enter="none"><Hook /></Scene>
    <Scene k="city" enter="zoom"><City /></Scene>
    <Scene k="rent" enter="push"><Rent /></Scene>
    <Scene k="buy" enter="wipe"><Buy /></Scene>
    <Scene k="tax" enter="push"><Tax /></Scene>
    <Scene k="transit" enter="wipe"><Transit /></Scene>
    <Scene k="summary" enter="zoom"><Summary /></Scene>
    <Scene k="cta" enter="iris"><Cta /></Scene>
    <Vignette />
    <Hud />
    <Captions />
  </AbsoluteFill>
);
