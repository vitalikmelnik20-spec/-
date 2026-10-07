// "Chicago — the real cost of living" v2: Remotion + video-shotcraft shot cards.
// Every scene starts exactly on its cut (the voice was fitted to these cuts); each transition
// overlaps the END of the outgoing scene by T frames, so absolute timing never drifts.
import React from 'react';
import { AbsoluteFill, Freeze, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';
import { fade } from '@remotion/transitions/fade';
import { CUTS, FREEZE_AT, f } from './theme';
import { Hook, Rent, Food, Eat, Transit, Util, Total, Payoff, Cta } from './scenes';
import { Captions, Hud, LeakAt, Vignette } from './overlays';
import { Sound } from './Sound';

const T = 8; // transition length (frames)

const Picture: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const len = (a: number, b: number) => b - a;
  const seq = (a: number, b: number, withTransition: boolean) => len(a, b) + (withTransition ? T : 0);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.hook, CUTS.rent, true)} premountFor={fps}><Hook /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.rent, CUTS.food, true)} premountFor={fps}><Rent /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-bottom' })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.food, CUTS.eat, true)} premountFor={fps}><Food /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.eat, CUTS.transit, true)} premountFor={fps}><Eat /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.transit, CUTS.util, true) + 4} premountFor={fps}><Transit /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={clockWipe({ width, height })} timing={linearTiming({ durationInFrames: T + 4 })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.util, CUTS.total, false) + T + 4} premountFor={fps}><Util /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris({ width, height })} timing={springTiming({ durationInFrames: T + 4, config: { damping: 200 } })} />
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.total, CUTS.payoff, false)} premountFor={fps}><Total /></TransitionSeries.Sequence>
        {/* hard cut into the music drop (drop-blackout-slam) */}
        <TransitionSeries.Sequence durationInFrames={seq(CUTS.payoff, CUTS.cta, true)} premountFor={fps}><Payoff /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={len(CUTS.cta, CUTS.end)} premountFor={fps}><Cta /></TransitionSeries.Sequence>
      </TransitionSeries>
      <Vignette />
      <LeakAt at={CUTS.rent - 6} seed={2} strength={0.55} />
      <LeakAt at={f(31.6)} seed={5} hue={120} strength={0.45} />
      <LeakAt at={CUTS.payoff + f(0.9)} seed={9} strength={0.6} />
      <Hud />
      <Captions from={CUTS.rent} to={CUTS.total} />
    </AbsoluteFill>
  );
};

export const ChicagoV2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Freeze frame={FREEZE_AT} active={frame >= FREEZE_AT}>
        <Picture />
      </Freeze>
      <Sound />
    </>
  );
};
