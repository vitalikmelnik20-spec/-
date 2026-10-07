# Video toolchain

Restore everything in a new cloud session:

```bash
bash tools/setup-video-tools.sh
```

## What gets installed

| Tool | Where | What it's for | License |
|---|---|---|---|
| [Remotion](https://github.com/remotion-dev/remotion) 4.0.534 with transitions, lottie, captions, media, shapes, paths and noise | `remotion-lab/` | Videos written in React: springs, transitions, captions, Lottie | Free for individuals and companies with up to 3 employees; larger companies need a company license |
| [HyperFrames](https://github.com/heygen-com/hyperframes) CLI 0.8.140 | `remotion-lab/node_modules/.bin/hyperframes` | HTML+GSAP → video, plus checks (`lint`, `check`, `snapshot`), beat detection, LUFS matching | Apache-2.0 |
| GSAP 3, lottie-web 5 | `remotion-lab/node_modules` | Professional timelines and easing; After Effects animations | GSAP: free standard license |
| [remotion-dev/skills](https://github.com/remotion-dev/skills), 12 skills | `.claude/skills/remotion-*` | Official Remotion guidance for agents | — |
| HyperFrames skills, 21 | `.claude/skills/hyperframes*`, `motion-graphics`, `faceless-explainer`, … | Video workflows: explainers, launch videos, captions, audio | Apache-2.0 |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | `.claude/skills/video-shotcraft` | 152 shot "recipes" and a motion library for Remotion | Apache-2.0 |
| [anything2explainer](https://github.com/Vincentwei1021/anything2explainer) | `.claude/skills/anything2explainer` | Topic → narrated explainer video | **PolyForm Noncommercial**: commercial use (a monetised channel) needs the author's permission |
| [last30days](https://github.com/mvanhorn/last30days-skill) | `.claude/skills/last30days` | Research of what people say about a topic in the last 30 days (Reddit, X, YouTube, HN, Polymarket, web) → video ideas and hooks. Needs Python 3.12 (`LAST30DAYS_PYTHON` in `.claude/settings.json`). Reading browser cookies is off by default and only enabled with explicit consent | MIT |
| pyloudnorm, kokoro-onnx | pip | Accurate LUFS loudness; local English TTS | MIT / Apache-2.0 |

## This sandbox's quirks

- **Browser.** Remotion can't download its own Chrome here. `remotion-lab/remotion.config.ts` uses the preinstalled one, `/opt/pw-browsers/chromium_headless_shell-1194/...`. You can override it with `REMOTION_BROWSER=...`. For HyperFrames, set `PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **CDN is blocked.** cdn.jsdelivr.net doesn't load, and neither do Google Fonts or unpkg. HyperFrames templates load GSAP from a CDN, so copy the file from `remotion-lab/node_modules/gsap/dist/gsap.min.js` next to `index.html` and change the `src`. Keep fonts local too.
- **Research sources are blocked.** reddit.com, hn.algolia.com, youtube.com, x.com and api.scrapecreators.com are unreachable here, so last30days runs in fallback mode on the built-in web search. To get its full data, add these domains to Allowed domains.
- **HuggingFace is blocked.** Model weights don't download, so WhisperX, fish-speech, index-tts, VoxCPM and MusicGen won't work yet. To enable them, add `huggingface.co` to Allowed domains in the environment settings: https://code.claude.com/docs/en/cloud-environments#network-access

## Smoke test

```bash
cd remotion-lab && npx remotion render src/index.ts Smoke out/smoke.mp4   # 3 s, 1080x1920, with a slide transition
```
