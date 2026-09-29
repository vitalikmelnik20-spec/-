#!/usr/bin/env bash
# Optional: installs the local Ukrainian TTS used for the voice-over
# (open-source robinhad/ukrainian-tts v6 — ESPnet Tacotron2 + HiFi-GAN, CPU).
# Only needed to re-synthesise assets/voice (FORCE_TTS=1 ./make_video.sh).
set -euo pipefail
cd "$(dirname "$0")/../.."
python3 -m venv .tts/venv
.tts/venv/bin/pip install -q torch==2.3.1 torchaudio==2.3.1
.tts/venv/bin/pip install -q espnet==202402 "scipy<1.13" kaldiio soundfile
mkdir -p .tts/model
for f in model.pth config.yaml spk_xvector.ark feats_stats.npz; do
  [ -f .tts/model/$f ] || curl -sSL -o .tts/model/$f "https://github.com/robinhad/ukrainian-tts/releases/download/v6.0.0/$f"
done
echo "TTS ready: .tts/venv/bin/python src/audio/voiceover.py .tts/model assets/voice dmytro"
