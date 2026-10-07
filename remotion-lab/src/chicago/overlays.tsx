// Global layers: TikTok-style word captions, header + running monthly tally, light-leak accents.
import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, Solid, useCurrentFrame, useVideoConfig } from 'remotion';
import { createTikTokStyleCaptions } from '@remotion/captions';
import { lightLeak } from '@remotion/effects/light-leak';
import { C, CAPTIONS, CUTS, FONT, TL, clamp, cue, ease, f, money } from './theme';

/* word-by-word captions (only where the screen isn't already carrying the line as big type) */
export const Captions: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  // pages are built per voice line, so a page never straddles two lines / two scenes
  const pages = useMemo(() => Object.keys(TL.voice).flatMap((k) => {
    const a = TL.voice[k] * 1000 - 5, b = (TL.voice[k] + TL.durs[k]) * 1000 + 5;
    // ...and never across a sentence break inside a line
    const words = CAPTIONS.filter((c) => c.startMs >= a && c.startMs < b);
    const sentences: (typeof CAPTIONS)[] = [[]];
    words.forEach((w) => { sentences[sentences.length - 1].push(w); if (/[.?!]$/.test(w.text)) sentences.push([]); });
    return sentences.filter((g) => g.length).flatMap((g) => createTikTokStyleCaptions({ captions: g, combineTokensWithinMilliseconds: 700 }).pages);
  }), []);
  const ms = (frame / 30) * 1000;
  if (frame < from || frame >= to) return null;
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  const pin = interpolate(ms - page.startMs, [0, 120], [0.85, 1], { ...clamp, easing: ease.back });
  return (
    <div style={{ position: 'absolute', left: 60, width: 960, top: 1395, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 18, scale: String(pin), fontFamily: FONT, fontWeight: 900, fontSize: 62, lineHeight: 1.15, textTransform: 'uppercase' }}>
      {page.tokens.map((t, i) => {
        const on = ms >= t.fromMs && ms < t.toMs;
        const done = ms >= t.toMs;
        return (
          <span key={i} style={{ color: on ? '#06120C' : done ? C.white : 'rgba(255,255,255,0.75)', background: on ? C.green : 'transparent', borderRadius: 14, padding: '0 12px', WebkitTextStroke: on ? undefined : '3px rgba(4,7,16,0.85)', paintOrder: 'stroke fill', textShadow: on ? undefined : '0 6px 20px rgba(0,0,0,0.6)' }}>{t.text.trim()}</span>
        );
      })}
    </div>
  );
};

/* header + running monthly tally (bumps green each time a monthly category lands) */
export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const steps: [number, number][] = [
    [f(6.6), 2457], [cue('food.price') + 14, 2843], [cue('transit.price') + 4, 2928], [cue('util.price') + 3, 3114], [cue('util.internet') + 3, 3245],
  ];
  let val = 0, last = -99;
  steps.forEach(([t, v]) => { if (frame >= t) { val = v; last = t; } });
  const headA = interpolate(frame, [18, 30, CUTS.payoff - 6, CUTS.payoff], [0, 1, 1, 0], clamp);
  const tallyA = interpolate(frame, [CUTS.rent + 10, CUTS.rent + 20, CUTS.total - 4, CUTS.total + 4], [0, 1, 1, 0], clamp);
  const hot = frame - last < 12;
  const bump = frame - last < 18 ? 1 + 0.16 * Math.exp(-(frame - last) / 4) : 1;
  return (
    <>
      <div style={{ position: 'absolute', top: 228, width: 1080, display: 'flex', justifyContent: 'center', opacity: headA }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 27, letterSpacing: 3, color: 'rgba(255,255,255,0.92)', background: 'rgba(8,12,24,0.72)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '9px 26px' }}>CHICAGO, IL · 2026 · APPROX. COSTS</div>
      </div>
      <div style={{ position: 'absolute', top: 296, width: 1080, display: 'flex', justifyContent: 'center', opacity: tallyA }}>
        <div style={{ scale: String(bump), fontFamily: FONT, fontWeight: 900, fontSize: 31, letterSpacing: 2, color: hot ? '#05140C' : C.green, background: hot ? C.green : 'rgba(43,227,139,0.14)', border: `2px solid ${C.green}99`, borderRadius: 999, padding: '9px 26px' }}>
          MONTHLY TALLY&nbsp;&nbsp;{money(val)}
        </div>
      </div>
    </>
  );
};

/* WebGL light-leak accent on a cut (screen-blended) */
export const LeakAt: React.FC<{ at: number; dur?: number; seed?: number; hue?: number; strength?: number }> = ({ at, dur = 22, seed = 0, hue = 0, strength = 0.7 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (frame < at || frame > at + dur) return null;
  const p = (frame - at) / dur;
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: strength * Math.sin(p * Math.PI) }}>
      <Solid width={width} height={height} effects={[lightLeak({ progress: p, seed, hueShift: hue })]} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />;
