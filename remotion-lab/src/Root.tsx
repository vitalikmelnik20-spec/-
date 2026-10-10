import { Composition } from 'remotion';
import { Smoke } from './Smoke';
import { FxTest } from './FxTest';
import { ChicagoV2 } from './chicago/ChicagoV2';
import { PlateTest } from './olympia/PlateTest';
import { Olympia } from './olympia/Olympia';
import { BernPlateTest } from './bern/PlateTest';
import { Bern } from './bern/Bern';
import { DURATION as BERN_DUR } from './bern/theme';
import { DURATION as OLY_DUR } from './olympia/theme';
export const Root = () => (
  <>
  <Composition id="ChicagoV2" component={ChicagoV2} durationInFrames={1200} fps={30} width={1080} height={1920} />
  <Composition id="Olympia" component={Olympia} durationInFrames={OLY_DUR} fps={30} width={1080} height={1920} />
  <Composition id="Bern" component={Bern} durationInFrames={BERN_DUR} fps={30} width={1080} height={1920} />
  <Composition id="BernPlateTest" component={BernPlateTest} durationInFrames={4} fps={30} width={1080} height={1920} />
  <Composition id="PlateTest" component={PlateTest} durationInFrames={5} fps={30} width={1080} height={1920} />
  <Composition id="FxTest" component={FxTest} durationInFrames={30} fps={30} width={540} height={960} />
  <Composition id="Smoke" component={Smoke} durationInFrames={90} fps={30} width={1080} height={1920} />
  </>
);
