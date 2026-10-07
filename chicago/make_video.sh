#!/usr/bin/env bash
# Chicago — the REAL cost of living (40 s, 1080x1920, 30 fps)
#   voice (Kokoro "af_heart", cached in assets/voice) -> music + SFX + ambience mix -> 1200 frames -> MP4 -> verify
#   FORCE_TTS=1 ./make_video.sh   re-synthesise the voice-over (downloads Kokoro into .kokoro/ on first run)
set -euo pipefail; cd "$(dirname "$0")"
OUT=output/chicago_cost_of_living_40s.mp4
python3 -c "import numpy, scipy, soundfile" 2>/dev/null || pip install -q numpy scipy soundfile
[ -d ../node_modules/playwright ] || (cd .. && npm install --silent)
if [ "${FORCE_TTS:-0}" = 1 ] || [ ! -f src/timeline.json ]; then
  python3 -c "import kokoro_onnx" 2>/dev/null || pip install -q kokoro-onnx
  mkdir -p .kokoro; for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f .kokoro/$f ] || curl -sSL -o .kokoro/$f "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"; done
  python3 src/voice.py .kokoro af_heart
fi
mkdir -p render/audio output
python3 src/soundtrack.py render/audio/mix.wav
node render/render.mjs --workers "${WORKERS:-4}"
ffmpeg -y -loglevel error -f concat -safe 0 -i render/segments/list.txt -i render/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level:v 4.2 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -g 30 -bf 0 \
  -force_key_frames "expr:eq(n,1185)" -x264-params "zones=1186,1199,q=51" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -t 40 -movflags +faststart \
  -metadata title="Chicago — the real cost of living" "$OUT"
python3 render/verify.py "$OUT"
