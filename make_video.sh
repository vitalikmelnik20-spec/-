#!/usr/bin/env bash
# Regenerates "Львів за 30 секунд" from scratch:
#   voice-over (optional local Ukrainian TTS) -> soundtrack -> 1800 frames -> MP4 -> verification
#
#   ./make_video.sh              # uses the cached voice-over in assets/voice if present
#   FORCE_TTS=1 ./make_video.sh  # re-synthesise the voice-over (needs the TTS env, see src/audio/setup_tts.sh)
#   NO_VOICE=1 ./make_video.sh   # music + sound design only
#   WORKERS=6 ./make_video.sh    # parallel headless-Chrome renderers
set -euo pipefail
cd "$(dirname "$0")"
OUT=output/lviv_30s_shorts.mp4
mkdir -p output render/audio

for bin in node ffmpeg ffprobe python3; do command -v $bin >/dev/null || { echo "missing: $bin"; exit 1; }; done
python3 -c "import numpy, scipy" 2>/dev/null || pip install -q numpy scipy
[ -d node_modules/playwright ] || npm install --silent

echo "== 1/5 voice-over"
VOICE_DIR=assets/voice
if [ "${NO_VOICE:-0}" = 1 ]; then VOICE_DIR=""; echo "  skipped (NO_VOICE=1)"
elif [ "${FORCE_TTS:-0}" = 1 ] || [ ! -f assets/voice/voice.json ]; then
  if [ -x "${TTS_PY:-.tts/venv/bin/python}" ] && [ -f "${TTS_MODEL:-.tts/model}/model.pth" ]; then
    "${TTS_PY:-.tts/venv/bin/python}" src/audio/voiceover.py "${TTS_MODEL:-.tts/model}" assets/voice dmytro
  elif [ -f assets/voice/voice.json ]; then echo "  TTS env not found — using cached voice-over"
  else echo "  TTS unavailable — rendering without voice-over (typography carries the story)"; VOICE_DIR=""; fi
else echo "  using cached voice-over (assets/voice)"; fi

echo "== 2/5 soundtrack + sound design + mix"
python3 src/audio/soundtrack.py "$VOICE_DIR" render/audio/soundtrack.wav

echo "== 3/5 frames (headless Chrome, 1080x1920, 60 fps)"
node render/render.mjs --workers "${WORKERS:-4}"

echo "== 4/5 encode H.264 + AAC"
ffmpeg -y -loglevel error -stats \
  -f concat -safe 0 -i render/segments/list.txt \
  -i render/audio/soundtrack.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level:v 4.2 -preset slow -crf 16 -pix_fmt yuv420p \
  -r 60 -g 60 -bf 2 -x264-params "aq-mode=3:deblock=-1,-1" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 \
  -af "alimiter=limit=0.89:level=false" \
  -t 30 -movflags +faststart \
  -metadata title="Львів за 30 секунд" \
  "$OUT"

echo "== 5/5 verify"
python3 render/verify.py "$OUT"
echo "done -> $OUT"
