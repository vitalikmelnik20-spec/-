import { Composition } from 'remotion';
import { Smoke } from './Smoke';
import { FxTest } from './FxTest';
import { ChicagoV2 } from './chicago/ChicagoV2';
export const Root = () => (
  <>
  <Composition id="ChicagoV2" component={ChicagoV2} durationInFrames={1200} fps={30} width={1080} height={1920} />
  <Composition id="FxTest" component={FxTest} durationInFrames={30} fps={30} width={540} height={960} />
  <Composition id="Smoke" component={Smoke} durationInFrames={90} fps={30} width={1080} height={1920} />
  </>
);
