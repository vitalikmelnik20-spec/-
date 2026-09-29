#!/usr/bin/env bash
# Rebuilds "The Last Trick-or-Treater of Maple Falls" from story.md:
#   parse script -> narration (local Kokoro TTS, cached) -> timeline + subtitles -> soundtrack -> frames -> MP4 -> verify
#   ./make_video.sh             FORCE_TTS=1 ./make_video.sh (re-voice)        WORKERS=8 ./make_video.sh
set -euo pipefail
cd "$(dirname "$0")"
OUT=output/the_last_trick_or_treater.mp4
KOKORO=${KOKORO_DIR:-.kokoro}
mkdir -p output render/audio
python3 -c "import numpy, scipy, soundfile" 2>/dev/null || pip install -q numpy scipy soundfile
[ -d ../node_modules/playwright ] || [ -d node_modules/playwright ] || npm install --silent playwright@1.56.1

echo "== 1/6 parse story.md";   python3 src/parse_story.py story.md src/shots.json
echo "== 2/6 narration"
if [ "${FORCE_TTS:-0}" = 1 ] || [ ! -f assets/narration/narration.json ]; then
  python3 -c "import kokoro_onnx" 2>/dev/null || pip install -q kokoro-onnx
  mkdir -p "$KOKORO"; for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f "$KOKORO/$f" ] || curl -sSL -o "$KOKORO/$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"; done
  python3 src/narrate.py "$KOKORO" src/shots.json assets/narration storyteller 0.9
else echo "  using cached narration (assets/narration)"; fi
echo "== 3/6 timeline + subtitles"; python3 src/build_timeline.py
echo "== 4/6 soundtrack";          python3 src/audio_mix.py render/audio/mix.wav
echo "== 5/6 frames";              node render/render.mjs --workers "${WORKERS:-4}"
echo "== 6/6 encode"
ffmpeg -y -loglevel error -stats -f concat -safe 0 -i render/segments/list.txt -i render/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -preset medium -crf 19 -pix_fmt yuv420p -r 30 -g 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
  -metadata title="The Last Trick-or-Treater of Maple Falls" "$OUT"
python3 render/verify.py "$OUT"
echo "done -> $OUT  (+ output/subtitles_en.srt)"
