import { Composition } from 'remotion';
import { Smoke } from './Smoke';
export const Root = () => (
  <Composition id="Smoke" component={Smoke} durationInFrames={90} fps={30} width={1080} height={1920} />
);
