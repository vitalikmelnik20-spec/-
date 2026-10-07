import { Solid, useVideoConfig, AbsoluteFill } from 'remotion';
import { lightLeak } from '@remotion/effects/light-leak';
export const FxTest = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#0B1020' }}>
      <Solid width={width} height={height} effects={[lightLeak({ progress: 0.5 })]} />
    </AbsoluteFill>
  );
};
