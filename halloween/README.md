# The Last Trick-or-Treater of Maple Falls — Halloween story video (21:58)

A 22-minute narrated Halloween story built entirely in code from `story.md`. It uses no image generators, no video models and no stock footage.
All 123 shots from the script are drawn as storybook-style illustrations: 111 stills with slow zooms and pans, plus 12 animated "clips".
One narrator voice tells the whole story, subtitles are burned in, and the audio has autumn ambience, a quiet score and sound effects.

**Outputs**
- `output/the_last_trick_or_treater.mp4`: 1920×1080, 30 fps, H.264 + AAC, loudness normalised to −16 LUFS. It is too large for git, so run `./make_video.sh` to build it.
- `output/subtitles_en.srt`: the same subtitles as a separate file for YouTube, so viewers can switch them on or off, or you can translate them.

## Pipeline

| Step | File | What it does |
|---|---|---|
| 1 | `src/parse_story.py` | Parses `story.md` into `src/shots.json`: the shots, their narration text and the acts. |
| 2 | `src/narrate.py` | Generates the narration with local **Kokoro-82M** TTS (CPU). The voice is a warm male "storyteller" blend of am_michael and am_fenrir at 0.9× speed. The result is cached in `assets/narration/`. |
| 3 | `src/build_timeline.py` | Sets each shot's length to fit its narration (at least the script's 10 s / 8 s) and writes the subtitle cues and the `.srt` file. |
| 4 | `src/audio_mix.py` | Mixes the narration with synthesised ambience per location, the score (a mood for each act plus a music-box motif) and sound effects: three knocks, the clock, matches, an owl, a heartbeat, frost footsteps, church bells, door creaks. Music and ambience duck under the voice. |
| 5 | `render/render.mjs` | Renders every frame in headless Chromium through Playwright, with parallel workers. |
| 6 | `make_video.sh` | Runs the whole pipeline, encodes the video and runs `render/verify.py`. |

Visual code: `src/engine.js` (camera, fog, grain), `figures.js` (characters: Walter, Walter as the scarecrow, Billy, Margaret, Dorothy, Elena and others), `paint.js` (sky, field, farmhouse, pumpkins), `sets.js` / `places.js` (porch, field, interiors, library, cemetery and other locations), `closeups.js` (inserts and photographs) and `shots.js` (one entry per shot of the script).

## Run locally

```bash
npm install playwright@1.56.1 && npx playwright install chromium
pip install numpy scipy soundfile kokoro-onnx
./make_video.sh                 # uses the cached narration
FORCE_TTS=1 ./make_video.sh     # re-generate the narration after editing story.md
node render/snapshot.mjs F001 V07   # preview single shots -> render/snapshots/
```

A full render takes about 40 minutes on 4 CPU cores. `WORKERS=8` speeds it up on a machine with more cores.

## YouTube chapters (actual timing)

```
0:00 Three soft knocks at 11:47
1:08 The scarecrow of Orchard Lane
5:21 The child who never grew
9:45 Dorothy
11:59 The field
15:34 Two trick-or-treaters
```
