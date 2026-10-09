# Production notes: "Could You Afford Washington's Capital?"

The video is a 1080×1920 YouTube Short at 30 fps, about 49.4 s long, H.264 + AAC in MP4, entirely in American English.

## Environment inspection: what was reused

| Need | Found in the repo or container | Decision |
|---|---|---|
| Rendering | Remotion 4.0.534 in `remotion-lab/`, using the preinstalled headless Chromium. A HyperFrames CLI and a Canvas pipeline also exist. | **Remotion**. It gives deterministic frames, React components and the most reusable patterns (Chicago v2). |
| Encode and QC | FFmpeg / FFprobe 6.1 | Muxing, two-pass loudnorm, frame checks. |
| TTS | Kokoro-82M ONNX, local, already used for the Chicago Shorts | American male voice `am_puck`. No cloud TTS is reachable, since HuggingFace and Bing are blocked. |
| Music and SFX | Shared synth toolkit `src/audio/soundtrack.py` | An original soundtrack synthesised in code: copyright-safe, no samples. |
| Fonts | Montserrat in the repo; Inter downloaded from its GitHub release (OFL-1.1, licence at `remotion-lab/public/fonts/Inter-LICENSE.txt`) | Montserrat Black/ExtraBold for headlines and numbers, Inter for labels and sources. |
| Footage | **None reachable.** Wikimedia, Unsplash, Pexels, Pixabay, Flickr, Openverse and OSM tiles are all blocked by the network policy. | Original layered vector "plates" of Olympia with parallax camera moves (see below). No footage from another city and no fake logos are used. |
| Map | GitHub raw is reachable | Washington outline from the public-domain `world.geo.json`. |

## Visual design

- **Palette.** Navy `#0B1630` and `#060D1D`, forest `#0F3B2C`, off-white `#F4F1EA`, soft gray `#A8B3C1`, electric blue `#3C9EFF` (used sparingly for labels), coral `#FF7A52` (prices and surprises), evergreen green `#4FD08F` (positives such as $0 and YES).
- **Plates** (`remotion-lab/src/olympia/Landscapes.tsx`). Each plate is an SVG built from 5–7 depth layers: sky, Mount Rainier, ridges, firs, buildings, water and foreground firs. A camera `{x, y, z}` moves each layer by its depth, which gives real parallax push-ins, pans and pull-backs. The plates are:
  - The Washington State Capitol (Legislative Building) dome over Capitol Lake, with its reflection, at blue hour.
  - The downtown waterfront and marina boardwalk, with the dome on the hill.
  - A four-storey apartment block.
  - A Pacific Northwest craftsman house.
  - A local street with a generic city bus whose sign reads "DOWNTOWN". It carries no agency logo or branding.
- **Safe areas.**
  - Nothing important sits above y=220, under the Shorts top bar.
  - Cards end by y≈1290.
  - Captions sit in the band y=1352–1500, x=120–960, so they stay clear of the right-hand action buttons and the bottom title/description area.
  - Captions never overlap a financial figure.
- **Reusable components** (`ui.tsx`):
  - `Scene`, a wrapper with push, zoom, wipe and iris transitions plus motion blur.
  - `Headline`, word-staggered blur-rise text.
  - `Dollars`, an easeOutQuart counter with a single 6% lock pulse.
  - `Card`, `Label`, `Source` (a label with a document icon), `Chip`, `Captions`, `CalendarIcon`, `Check`.

## Scene timing (from the measured voice, not from fixed windows)

| # | Time | Content | Visual beats |
|---|---|---|---|
| 1 | 0.00–2.65 | Hook | Dark frame punches into the Capitol (blur 14→0, push 1.18→1.45). "WASHINGTON STATE" chip, then "NO STATE", then "INCOME TAX" + coral **?** slam, landing on the spoken word "income". |
| 2 | 2.65–7.91 | City | Zoom transition to the waterfront pan. "OLYMPIA, WASHINGTON" → "CAN YOU AFFORD IT?" on "affordable". On "Meet": iris-wipe to a map, the outline draws, the Olympia pin drops (Seattle grey for reference), and a "$?" house chip appears on "housing". |
| 3 | 7.91–16.28 | Rent | Push up to the apartment plate. The card slides in and the counter runs from "Census" to land just after "sixteen hundred". "ACS 2020–2024" highlights coral on "based on data from…", plus a note: "Rent + utilities paid by renters · not today's listings". |
| 4 | 16.28–22.55 | Buy | Wipe to the house with a slow push. Rent and home-value cards sit side by side; the value counts up on "four hundred…", then the rent card exits and the value card grows to centre with its full label and source. |
| 5 | 22.55–29.63 | Tax | Paycheck stub flies in. "State income tax on wages … $0" lights up and a NONE stamp lands. "NO BROAD STATE PERSONAL INCOME TAX" appears. On "but": a coral card "OTHER TAXES STILL APPLY" with Sales tax in Olympia **10.0%** (DOR, eff. July 1, 2026), Property tax and Federal income tax. |
| 6 | 29.63–37.59 | Transit | Wipe in; the bus pulls into the stop with air-brake sound. A BUS / FARE ticket tears apart and becomes **$0 FARE** on "fare-free". On "Check": "Zero-fare since 2020 · extended to Jan. 1, 2028" + source. |
| 7 | 37.59–45.62 | Summary | Four-shot montage cut on the words (dome close-up, PNW pan to Rainier, bus street, house) with flash cuts. Checklist rows: CAPITAL CITY ✓, PACIFIC NORTHWEST ✓, TRANSIT PERK ✓, then **HOUSING COSTS !** in coral. "HOUSING IS THE BIG QUESTION" with the two medians returning. |
| 8 | 45.62–49.43 | CTA | Iris back to the opening Capitol shot. "WOULD YOU LIVE HERE?", a COMMENT chip, YES and NO cards sliding in on the spoken words. The camera pulls back to the hook's first framing and the frame dims, so the loop restarts on the same shot. |

## Audio

- **Voice.**
  - Kokoro `am_puck` at 1.2× (~190 wpm, a normal Shorts pace), one rate for every line.
  - Lines are placed with 0.22–0.34 s breaths, and the timeline is derived from the voice.
  - Processing: high-pass 85 Hz, slight 2.6–5.5 kHz presence lift, a 6.5–9.5 kHz de-ess dip and a gentle levelling compressor.
- **Music.** Original 96 BPM D-minor documentary pulse: pad, eighth-note bass, soft kick and shaker, sparse keys.
  - It builds through the numbers and tightens on the tax twist (thicker pad, riser).
  - It lifts to a brighter major voicing with glass mallets for the transit perk.
  - It drops to a breakdown under "But housing is the number…".
  - It has a stop-time on "Comment YES or NO".
  - Ducked 80% under speech; sidechained to the kick.
- **SFX**, all synthesised: impact and whoosh on the hook, pin pop and chime, counter ticks that end before each spoken figure (no loud hit lands on a number), paper and stamp, air brakes, ticket tear, chimes, downlifter, YES/NO pops.
- **Mix.** Voice sits about +13 dB over the music and SFX during speech. Two-pass loudnorm to −14 LUFS integrated with a −1.5 dBTP ceiling, AAC 256 kb/s at 48 kHz.

## Captions

- Word timings come from synthesising each line's prefix. They are then **snapped to the real pauses detected in the voice audio** (`olympia/src/align.py`), because prefix timing drifted up to 0.3 s.
- Pages break at sentence ends and are at most two lines; no one- or two-word orphan pages.
- Spoken numbers are shown as numerals ("about $1,600", "2020 through 2024", "$486,000").
- The active word is highlighted. Money is coral, positives are green, keywords are light blue.
- `captions.srt` uses the same pages.

## Limitations (stated plainly)

- **No real footage.** The stock and photo hosts are blocked here, so every location is an original illustration. The video avoids presenting it as photography. Real licensed Olympia footage could be swapped in by replacing the `*Plate` components.
- **Speech was not machine-verified.** HuggingFace and OpenAI are blocked, so no ASR model could be downloaded, and nobody listened to the voice in this environment. Caption sync rests on prefix timing plus pause snapping, which is accurate to about ±0.1 s at sentence boundaries. Listen once before publishing; "Olympia" and "Intercity" are the words to check.
- **Official sites could not be opened directly** (DNS blocked). Facts were verified through web search of the official pages and PDFs (see `sources.md`).
- **Duration.** 49.4 s, inside the 45–50 s target. The brief's script runs about 47 s of speech at a natural pace, so the rate was set to 1.2× rather than cutting words.

## Reproduce

```bash
bash tools/setup-video-tools.sh            # remotion-lab deps, kokoro-onnx, etc. (new session)
bash olympia/render.sh                     # voice -> align -> captions -> mix -> Remotion -> mux -> QC
bash olympia/render.sh --skip-voice        # keep the existing voice clips
cd remotion-lab && npx remotion studio     # live preview: composition "Olympia"
```

Files:
- `olympia/src/`: `lines.py` (script), `voice.py`, `align.py`, `captions.py`, `soundtrack.py`, `make_map.py`, `verify.py`.
- `remotion-lab/src/olympia/`: `theme.ts`, `Landscapes.tsx`, `ui.tsx`, `Olympia.tsx`, `waMap.ts`.
