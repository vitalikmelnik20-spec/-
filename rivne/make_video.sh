#!/usr/bin/env bash
# Рівне за 40 секунд: voice (robinhad/ukrainian-tts v6, male "Dmytro") -> timeline + captions -> soundtrack -> frames -> MP4 -> verify
#   ./make_video.sh              # uses the cached voice-over in assets/voice + src/timeline.json
#   FORCE_TTS=1 ./make_video.sh  # re-synthesise the voice (installs the TTS env into .tts/ on first run)
set -euo pipefail; cd "$(dirname "$0")"
OUT=output/rivne_40s_shorts.mp4
python3 -c "import numpy, scipy" 2>/dev/null || pip install -q numpy scipy
[ -d ../node_modules/playwright ] || (cd .. && npm install --silent)
if [ "${FORCE_TTS:-0}" = 1 ] || [ ! -f assets/voice/hook.wav ]; then
  if [ ! -x .tts/venv/bin/python ]; then
    python3 -m venv .tts/venv
    .tts/venv/bin/pip install -q torch==2.3.1 torchaudio==2.3.1 espnet==202402 "scipy<1.13" kaldiio soundfile
  fi
  mkdir -p .tts/model
  for f in model.pth config.yaml spk_xvector.ark feats_stats.npz; do
    [ -f .tts/model/$f ] || curl -sSL -o .tts/model/$f "https://github.com/robinhad/ukrainian-tts/releases/download/v6.0.0/$f"
  done
  .tts/venv/bin/python src/voice.py .tts/model dmytro
fi
mkdir -p render/audio output
python3 src/soundtrack.py render/audio/mix.wav
node render/render.mjs --workers "${WORKERS:-4}"
ffmpeg -y -loglevel error -f concat -safe 0 -i render/segments/list.txt -i render/audio/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -profile:v high -level:v 4.2 -preset slow -crf 16 -pix_fmt yuv420p -r 60 -g 60 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -af "alimiter=limit=0.89:level=false" -t 40 -movflags +faststart \
  -metadata title="Рівне за 40 секунд" "$OUT"
python3 render/verify.py "$OUT"
