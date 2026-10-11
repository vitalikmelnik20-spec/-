# Ціни на заході України: осінь 2026 (Shorts, без озвучки)

Відео 1080×1920, 30 fps, 54 с. Картинка зроблена в Remotion (`remotion-lab/src/zahid/`). Музика й ефекти згенеровані кодом. **Голосу у відео немає**, автор начитує текст сам за файлом `output/zahid_tsiny_osin/teleprompter.md`.

```bash
bash zahid/render.sh
```

| Файл | Що робить |
|---|---|
| `src/script.py` | Текст і таймінг: темп рахується за складами, ≈ 2,7 слова/с |
| `src/soundtrack.py` | Музика 112 BPM та SFX. Окремі доріжки `music.wav` і `sfx.wav` |
| `src/make_map.py` | Контур України з Кримом (public domain) |
| `src/verify.py` | Перевірка якості (QC) |

Змінили текст або темп: правте `src/script.py` і запускайте `bash zahid/render.sh`.
