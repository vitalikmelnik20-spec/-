# Bern: Lebenshaltungskosten (YouTube Short, Deutsch, Preise in EUR)

A 1080×1920, 30 fps, 53 s video.

- Picture: Remotion (`remotion-lab/src/bern/`).
- Voice: Coqui VITS CSS10 German, run locally, female voice. It uses the venv in `wiesn2026/.tts`.
- Music and SFX: synthesised in code.
- Pipeline and helper modules: the same as `olympia/`.

```bash
bash bern/render.sh               # voice -> align -> captions/SRT -> mix -> render -> mux (-14 LUFS) -> QC
bash bern/render.sh --skip-voice
```

Text, prices and the exchange rate live in `src/lines.py`. Deliverables are in `output/bern_lebenshaltungskosten/`.
