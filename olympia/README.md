# Olympia, WA: cost of living (YouTube Short)

A 1080×1920, 30 fps, roughly 49 s video in English.

- Picture: Remotion (`remotion-lab/src/olympia/`).
- Voice: Kokoro, run locally.
- Music and SFX: synthesized in code.

```bash
bash olympia/render.sh               # voice -> align -> captions/SRT -> mix -> render -> mux (-14 LUFS) -> QC
bash olympia/render.sh --skip-voice  # reuse assets/voice/*.wav
```

| File | Role |
|---|---|
| `src/lines.py` | Narration, one line per scene |
| `src/voice.py` | Kokoro `am_puck` at 1.2×. Writes `assets/voice/*.wav` and `timeline_raw.json` (word timings from prefix synthesis) |
| `src/align.py` | Snaps word timings to real pauses. Writes cues, scene cuts and the frame count to `timeline.json` |
| `src/captions.py` | Caption pages (spoken numbers shown as numerals) and the SRT file |
| `src/soundtrack.py` | 96 BPM score, SFX on picture events, voice EQ, ducking, mix |
| `src/make_map.py` | Washington outline (public-domain GeoJSON) to `waMap.ts` |
| `src/verify.py` | ffprobe, decode/black/freeze checks, loudness and contact sheet |

Deliverables, sources and production notes are in `output/olympia_cost_of_living/`.
