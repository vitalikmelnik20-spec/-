#!/usr/bin/env bash
# Olympia, WA - cost of living (YouTube Short). Full pipeline:
#   voice (Kokoro) -> word alignment -> captions/SRT -> soundtrack mix -> Remotion picture -> mux + loudnorm
# Usage: bash olympia/render.sh [--skip-voice]
set -euo pipefail
cd "$(dirname "$0")"
OUT=../output/olympia_cost_of_living
mkdir -p build "$OUT"
[ -e .kokoro ] || ln -s ../chicago/.kokoro .kokoro      # kokoro-v1.0.onnx + voices-v1.0.bin (see chicago/README.md)
if [ "${1:-}" != "--skip-voice" ]; then python3 src/voice.py; fi
python3 src/align.py >/dev/null
python3 src/captions.py "$OUT/captions.srt"
python3 src/make_map.py >/dev/null
python3 src/soundtrack.py build/mix.wav
mkdir -p ../remotion-lab/public/olympia
cp src/timeline.json src/caption_pages.json ../remotion-lab/public/olympia/
FRAMES=$(python3 -c "import json; print(json.load(open('src/timeline.json'))['frames'])")
( cd ../remotion-lab && npx remotion render src/index.ts Olympia ../olympia/build/picture.mp4 --concurrency=4 --crf=14 --muted --log=error )
# two-pass loudness normalisation to -14 LUFS integrated, -1.5 dBTP
M=$(ffmpeg -nostats -i build/mix.wav -af loudnorm=I=-14:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -y -loglevel error -i build/picture.mp4 -i build/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -frames:v "$FRAMES" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-14:TP=-2:LRA=11:$LN:linear=true,aresample=48000" -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -shortest -movflags +faststart -metadata title="Could You Afford Washington's Capital?" -metadata language=eng \
  "$OUT/olympia_cost_of_living.mp4"
python3 src/verify.py "$OUT/olympia_cost_of_living.mp4"
