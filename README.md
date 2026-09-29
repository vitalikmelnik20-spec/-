# Львів за 30 секунд — YouTube Shorts / Reels / TikTok

A 30-second vertical motion-design video about Lviv, made entirely in code.
It uses no After Effects, no stock footage and no video-generation model.

**Result:** `output/lviv_30s_shorts.mp4`. It is 1080×1920 at 60 fps, 30.000 s long, H.264 High@4.2 with AAC stereo 48 kHz audio, and normalised to −15 LUFS.

## How it is made

| Layer | Technology |
|---|---|
| Graphics and animation | HTML5 Canvas 2D (`src/*.js`). Every frame is a pure function of time `t`, so rendering is deterministic. |
| 3D map and city | A small perspective camera (`Cam` in `src/engine.js`) with near-plane clipping and painter's-order extruded buildings. The camera does a continuous log-scale zoom from Ukraine (~3000 km) down to the Market Square (~300 m). |
| Architecture | Procedural line-art "sketches" (Opera, Armenian Cathedral, Ratusha, Latin/Dominican churches, tenement houses) that draw themselves from the ground up (`src/arch.js`). |
| Rendering | Headless Chromium through Playwright. Four parallel pages each render a contiguous range of real frames. FFmpeg writes intermediate segments. |
| Encoding | FFmpeg / libx264 (yuv420p, BT.709, faststart) + AAC 320 kbps. |
| Music and SFX | `src/audio/soundtrack.py` is an original synthesised soundtrack (numpy/scipy) at 120 BPM in D minor. It includes the pads, bass, drums, arpeggios, choir pad, risers, whooshes, typography impacts, city ambience with a tram bell, a coffee cup clink and pour, and the final cinematic hit. It uses no samples or copyrighted music. |
| Voice-over | A local Ukrainian TTS: the open-source [robinhad/ukrainian-tts](https://github.com/robinhad/ukrainian-tts) v6 model with the male voice "Dmytro", running on CPU. Stress marks were placed by hand. The synthesised lines are cached in `assets/voice/`. |
| Fonts | Montserrat and Noto Serif Display for the Cyrillic text, and Noto Color Emoji for 🇺🇦. All are local copies in `assets/fonts/`. |

## Timeline

| Time | Scene |
|---|---|
| 0:00–0:02 | **Hook.** A glowing map of Ukraine with light rays bursting from Lviv. The camera zooms fast into western Ukraine and the map tilts into 3D. "ЦЕ ЛЬВІВ." slams in, followed by "АЛЕ ТИ ЗНАЄШ ЙОГО НЕ ВЕСЬ." |
| 0:02–0:06 | The oblast outline and "Львівська область". The camera dives into the 3D city, the buildings rise, and the historic centre ring appears. Labels: "Львів" and "заснований у XIII столітті". |
| 0:06–0:10 | The Market Square is built house by house. The Ratusha rises with a light shaft. Labels: "СЕРЦЕ ЛЬВОВА" and "Площа Ринок". The camera orbits the square. |
| 0:10–0:14 | A slit transition leads into a parallax street journey. Tenement houses, the Armenian quarter and the Opera draw themselves in line-art. Label: "МІСТО, ДЕ ІСТОРІЯ — НА КОЖНОМУ КРОЦІ". |
| 0:14–0:18 | A hard cut to a coffee cup. Its steam morphs into the Lviv skyline. The camera dives into the cup and lands on a coffee map with moving café icons. Label: "КАВА — ОКРЕМА ІСТОРІЯ". |
| 0:18–0:22 | City energy: tram lines, flows of people, pulsing venues and walking silhouettes. A counter shows one word per beat: ЛЬВІВ / ІСТОРІЯ / АРХІТЕКТУРА / КАВА / КУЛЬТУРА. |
| 0:22–0:26 | A skyline assembled from landmarks, with the Opera as the hero element under god rays while the camera pulls back. Label: "МІСТО, ЯКЕ ВАЖКО СПЛУТАТИ". |
| 0:26–0:30 | The camera pulls back to the map of Ukraine and Lviv becomes a glowing point. Final text: "ЛЬВІВ 🇺🇦" and "Скільки разів ти тут був?". The video ends on a clean 0.5 s hold. |

## Regenerate from scratch

```bash
./make_video.sh                # voice (cached) -> soundtrack -> frames -> encode -> verify
FORCE_TTS=1 ./make_video.sh    # also re-synthesise the voice-over (run src/audio/setup_tts.sh once first)
NO_VOICE=1 ./make_video.sh     # music + sound design only
WORKERS=6 ./make_video.sh      # more parallel renderers
```

Requirements: Node 18+, Python 3 with numpy and scipy, FFmpeg with libx264, and Chromium for Playwright (`npm install` installs Playwright).
A full build takes about 4 minutes on 4 CPU cores.

Useful while editing:

```bash
node render/snapshot.mjs 0.4 7.5 23.6     # render single moments to render/snapshots/*.png
# or open src/index.html?t=12.5 / ?play through any static server
python3 render/verify.py output/lviv_30s_shorts.mp4
```

## Folder layout

```
src/            engine.js (camera, easing, text, overlays) · geo.js (map outlines) · city.js (procedural Lviv)
                arch.js (architectural line-art) · scenes.js (all scenes + compositor) · main.js · index.html
src/audio/      soundtrack.py (music + SFX + mix) · voiceover.py (Ukrainian TTS) · setup_tts.sh
assets/         fonts/ · voice/ (cached TTS voice-over lines)
render/         render.mjs (parallel frame renderer) · snapshot.mjs · common.mjs · verify.py
output/         lviv_30s_shorts.mp4
make_video.sh   one-command build
```
