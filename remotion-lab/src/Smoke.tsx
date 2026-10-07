// Install check: spring animation + a slide transition (@remotion/transitions)
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';

const Card = ({ text, bg }: { text: string; bg: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ background: bg, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontFamily: 'sans-serif', fontWeight: 900, fontSize: 160, color: 'white', transform: `scale(${s})`, opacity: interpolate(frame, [0, 8], [0, 1]) }}>{text}</div>
    </AbsoluteFill>
  );
};
export const Smoke = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={55}><Card text="REMOTION" bg="#0B1020" /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={linearTiming({ durationInFrames: 10 })} />
    <TransitionSeries.Sequence durationInFrames={45}><Card text="WORKS" bg="#14B86A" /></TransitionSeries.Sequence>
  </TransitionSeries>
);
