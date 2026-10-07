// Audio: voice-over clips at their measured starts, the synthesised music/ambience bed (already ducked
// under the voice), and Mixkit SFX pinned to picture events (video-shotcraft sound-design rules:
// riser -> impact -> sparkle on the big reveal, stepped volumes + alternating rates on repeats, foley that matches the action).
import React from 'react';
import { Sequence, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { CUTS, TL, cue, f } from './theme';

const Sfx: React.FC<{ at: number; name: string; vol: number; rate?: number; trim?: number }> = ({ at, name, vol, rate = 1, trim = 0 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, at)} premountFor={fps}>
      <Audio src={staticFile(`chicago/sfx/${name}.mp3`)} volume={vol} playbackRate={rate} trimBefore={trim ? Math.round(trim * fps) : undefined} />
    </Sequence>
  );
};

export const Sound: React.FC = () => {
  const { fps } = useVideoConfig();
  const rentLock = f(6.6);
  const foodCards = [16, 28, 40, 52, 64].map((c) => CUTS.food + c + 22);
  const meal = cue('eat.meal') - 9, coffee = cue('eat.coffee') - 9;
  const L = cue('transit.price') + 4;
  const c1 = cue('util.price') + 3, c2 = cue('util.internet') + 3;
  const R = cue('total.price') + 3;
  const HIT = CUTS.payoff + f(0.9);
  return (
    <>
      {/* music + ambience bed and the voice */}
      <Audio src={staticFile('chicago/bed.wav')} volume={0.95} />
      {Object.entries(TL.voice).map(([k, t]) => (
        <Sequence key={k} from={f(t)} premountFor={fps}>
          <Audio src={staticFile(`chicago/voice/${k}.wav`)} volume={1} />
        </Sequence>
      ))}
      {/* hook */}
      <Sfx at={0} name="transition-soft" vol={0.45} />
      <Sfx at={f(1.05)} name="shimmer-sparkle-sweep" vol={0.22} />
      <Sfx at={CUTS.rent - 10} name="whoosh-big" vol={0.4} />
      {/* rent: one tick per digit lock, then the low "confirm" */}
      {[3, 2, 1, 0].map((k, i) => <Sfx key={k} at={rentLock - k * 7} name="clock-tick-single" vol={0.3 + i * 0.06} rate={i % 2 ? 1.08 : 1} />)}
      <Sfx at={rentLock} name="bass-hit-short" vol={0.55} />
      <Sfx at={rentLock + 14} name="swoosh-quick" vol={0.18} />
      {/* groceries */}
      <Sfx at={CUTS.food - 6} name="whoosh-fast" vol={0.35} />
      {foodCards.map((t, i) => <Sfx key={t} at={t} name="pop-electric" vol={0.34 - i * 0.03} rate={i % 2 ? 1.1 : 1} />)}
      <Sfx at={cue('food.price') + 14} name="click-camera" vol={0.55} />
      {/* eating out: flip = page turn, landing = shutter click */}
      <Sfx at={CUTS.eat - 4} name="swoosh-quick" vol={0.3} />
      {[meal, coffee].map((t) => <React.Fragment key={t}><Sfx at={t + 4} name="paper-page-turn" vol={0.5} /><Sfx at={t + 18} name="click-camera" vol={0.45} /></React.Fragment>)}
      {/* transit */}
      <Sfx at={CUTS.transit - 2} name="warp-slide" vol={0.5} />
      <Sfx at={CUTS.transit + 118} name="whoosh-fast" vol={0.22} rate={0.9} />
      <Sfx at={L - 30} name="data-compute" vol={0.14} />
      <Sfx at={L - 6} name="zoom-swipe-fast" vol={0.4} />
      <Sfx at={L} name="ui-confirm-bleep" vol={0.5} />
      <Sfx at={L} name="bass-hit-short" vol={0.35} />
      {/* utilities */}
      <Sfx at={CUTS.util - 4} name="swoosh-quick" vol={0.3} />
      {[c1, c2].map((c, i) => <React.Fragment key={c}><Sfx at={c - 12} name="paper-slide" vol={0.38} rate={i ? 1.06 : 1} /><Sfx at={c} name="click-camera" vol={0.4} /></React.Fragment>)}
      <Sfx at={c2 + 18} name="ui-success-soft" vol={0.4} />
      {/* total: print ticks -> riser -> impact -> sparkle */}
      <Sfx at={CUTS.total - 8} name="whoosh-big" vol={0.38} />
      {[0, 1, 2, 3, 4].map((i) => <Sfx key={i} at={CUTS.total + 14 + i * 11} name="clock-tick-single" vol={0.26 - i * 0.02} rate={i % 2 ? 1.1 : 1} />)}
      <Sfx at={R - f(4.0)} name="riser-cine" vol={0.4} trim={0.85} />
      <Sfx at={R} name="impact-movie-epic" vol={0.6} />
      <Sfx at={R + 6} name="sparkle" vol={0.25} />
      {/* payoff: silence (the music drops in the bed), then the hit */}
      <Sfx at={HIT} name="impact-deep-whoosh" vol={0.65} />
      <Sfx at={HIT} name="bass-hit-short" vol={0.45} />
      {/* call to action */}
      <Sfx at={CUTS.cta + 8} name="ui-message-pop" vol={0.45} />
      <Sfx at={CUTS.cta + 16} name="swoosh-quick" vol={0.22} />
      <Sfx at={f(39.05)} name="transition-soft" vol={0.3} />
    </>
  );
};
