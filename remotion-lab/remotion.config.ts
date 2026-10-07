import { Config } from '@remotion/cli/config';
// Use the pre-installed headless Chromium (the sandbox cannot download Remotion's own browser)
Config.setBrowserExecutable(process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// @remotion/effects use WebGL2
Config.setChromiumOpenGlRenderer('angle');
