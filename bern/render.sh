#!/usr/bin/env bash
# Bern - Lebenshaltungskosten (YouTube Short, German, EUR). Full pipeline:
#   voice (Coqui VITS CSS10 German) -> word alignment -> captions/SRT -> soundtrack -> Remotion picture -> mux + loudnorm -> QC
# Usage: bash bern/render.sh [--skip-voice]
set -euo pipefail
cd "$(dirname "$0")"
OUT=../output/bern_lebenshaltungskosten
mkdir -p build "$OUT"
[ -e .tts ] || ln -s ../wiesn2026/.tts .tts      # venv with Coqui TTS + tts_models--de--css10--vits (see wiesn2026/)
if [ "${1:-}" != "--skip-voice" ]; then .tts/venv/bin/python src/voice.py; fi
python3 src/align.py >/dev/null
python3 src/captions.py "$OUT/untertitel.srt"
python3 src/soundtrack.py build/mix.wav
mkdir -p ../remotion-lab/public/bern
cp src/timeline.json src/caption_pages.json ../remotion-lab/public/bern/
FRAMES=$(python3 -c "import json; print(json.load(open('src/timeline.json'))['frames'])")
( cd ../remotion-lab && npx remotion render src/index.ts Bern ../bern/build/picture.mp4 --concurrency=4 --crf=14 --muted --log=error )
M=$(ffmpeg -nostats -i build/mix.wav -af loudnorm=I=-14:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -y -loglevel error -i build/picture.mp4 -i build/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -frames:v "$FRAMES" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-14:TP=-2:LRA=11:$LN:linear=true,aresample=48000" -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -shortest -movflags +faststart -metadata title="Was kostet das Leben in Bern?" -metadata language=deu \
  "$OUT/bern_lebenshaltungskosten.mp4"
python3 src/verify.py "$OUT/bern_lebenshaltungskosten.mp4"
