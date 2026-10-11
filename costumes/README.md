# Halloween costumes 2026 (Shorts, English, no narration)

A 1080×1920, 30 fps, 43.6 s video.

- Picture: Remotion (`remotion-lab/src/costumes/`).
- Music and SFX: synthesised in code, mixed at −20 LUFS to leave room for the author's voice.

```bash
# 1. put photos in costumes/photos/: kpop / penny / wed / mario / dolly (.jpg/.png/.webp)
#    plus optional photos/credits.json with {"kpop": {"credit": "...", "pos": "50% 20%"}, ...}
# 2. render
bash costumes/render.sh
```

| File | Role |
|---|---|
| `src/script.py` | Script and timing (syllable estimate) |
| `src/add_photos.py` | Photos → `remotion-lab/public/costumes/` |
| `src/soundtrack.py` | Music, SFX and stems |
| `src/verify.py` | QC |
