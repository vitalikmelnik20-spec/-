#!/usr/bin/env bash
# Hannover in 30 Sekunden: voice (Piper "Thorsten", German male) -> timeline + captions -> soundtrack -> frames -> MP4 -> verify
set -euo pipefail; cd "$(dirname "$0")"
PIPER=${PIPER_MODEL:-.piper/de-thorsten-low.onnx}
if [ ! -f "$PIPER" ]; then mkdir -p .piper; curl -sSL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-de-thorsten-low.tar.gz | tar xz -C .piper; fi
python3 -c "import piper" 2>/dev/null || pip install -q piper-tts
mkdir -p render/audio output
python3 src/voice.py "$PIPER" 1.0
python3 src/soundtrack.py render/audio/mix.wav
node render/render.mjs --workers "${WORKERS:-4}"
ffmpeg -y -loglevel error -f concat -safe 0 -i render/segments/list.txt -i render/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level:v 4.2 -preset slow -crf 16 -pix_fmt yuv420p -r 60 -g 60 -bf 2 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -af "alimiter=limit=0.89:level=false" -t 30 -movflags +faststart output/hannover_30s_shorts.mp4
python3 render/verify.py output/hannover_30s_shorts.mp4
