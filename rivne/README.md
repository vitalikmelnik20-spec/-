# Рівне за 40 секунд — YouTube Shorts / Reels / TikTok

This is a bright, fast 40-second vertical video with five facts about Rivne. Everything in it is generated in code: the graphics, the animation, the music, the sound effects and the Ukrainian voice-over. It uses no stock footage, samples or video-generation model.

**Result:** `output/rivne_40s_shorts.mp4`. It is 1080×1920 at 60 fps, 40.000 s long, H.264 High with AAC 320 kbps stereo audio, and has burned-in karaoke captions.

## Script

| Scene | Voice-over | Visual |
|---|---|---|
| Hook | «Рівне. П'ять фактів, які тебе здивують!» | The word «РІВНЕ» slams in. A yellow-and-blue map of Ukraine appears with a pin on Rivne and light rays, followed by the «5 ФАКТІВ» sticker. |
| 1 | «Вперше Рівне згадується в літописі 1283 року.» | A parchment scroll unrolls and the year spins in like a slot machine. Sticker: «ПОНАД 740 РОКІВ». |
| 2 | «Колись посеред річки Усті, на острові, стояв палац князів Любомирських.» | The palace rises on an island. The water has moving waves and reflections. |
| 3 | «Зовсім поруч — Тунель кохання. Цей зелений коридор знає весь світ.» | A flight through a green tunnel of arches along the rails, with floating hearts. |
| 4 | «Рівненщина — бурштиновий край України. Сонячний камінь тут шукають віками.» | A large amber stone with an insect inside, surrounded by orbiting stones and sparkles. |
| 5 | «На Рівненщині стоять базальтові стовпи. Їм понад півмільярда років!» | Hexagonal basalt columns grow isometrically. Counter: «500+ МЛН РОКІВ». |
| Outro | «А ти вже був у Рівному? Пиши в коментарях!» | The map with the pin, «РІВНЕ 🇺🇦», confetti and a call to comment. |

## Dynamics

- Each fact has its own saturated colour world (orange-crimson, azure, green, amber, violet) on top of a rotating sunburst with drifting bokeh.
- The camera pulses on every beat at 120 BPM, in sync with the music. Every cut gets a camera kick: a short zoom with a shake.
- Scenes change through three-colour diagonal stripe wipes. Headlines and stickers slam in with an overshoot.
- Karaoke captions highlight the current word in yellow.

## Sound

| Layer | Technology |
|---|---|
| Voice-over | Local Ukrainian TTS: [robinhad/ukrainian-tts](https://github.com/robinhad/ukrainian-tts) v6 with the male voice "Dmytro". Stresses are marked by hand in `src/voice.py`. |
| Music | `src/soundtrack.py` is original synthesis with numpy/scipy, built from the instruments of the Lviv short. It is at 120 BPM with the progression C–G–Am–F, plus a riser and a drop on fact 1, a melodic motif, a sidechain and ducking under the voice. |
| SFX | Whooshes on the transitions, digit ticks, water, "ding" chimes, heart pops, amber sparkles, thumps as the columns rise, and a final hit with confetti. |

## Build

```bash
./make_video.sh                # cached voice-over -> music -> 2400 frames -> MP4 -> verify
FORCE_TTS=1 ./make_video.sh    # re-synthesise the voice-over (installs .tts/ on first run)
node render/snapshot.mjs 1.5 12 25   # individual frames -> render/snapshots/
```
