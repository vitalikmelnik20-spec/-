#!/usr/bin/env bash
# Wiesn 2026 intro: 600 frames (Playwright/Chromium) -> intro_wiesn2026.mp4 + preview.png
# If voice.mp3 lies next to this script it becomes the audio track (trimmed/padded to 20 s), otherwise silence.
set -euo pipefail; cd "$(dirname "$0")"
[ -d ../node_modules/playwright ] || (cd .. && npm install --silent)
[ "${SKIP_FRAMES:-0}" = 1 ] && [ -f frames/0599.png ] || node render.mjs
if [ -f voice.mp3 ]; then
  AIN=(-i voice.mp3); AF=(-af "apad,atrim=0:20,asetpts=N/SR/TB")
  echo "audio: voice.mp3"
else
  AIN=(-f lavfi -t 20 -i "anullsrc=r=48000:cl=stereo"); AF=()
  echo "audio: silent track (voice.mp3 not found)"
fi
ffmpeg -y -loglevel error -framerate 30 -i frames/%04d.png "${AIN[@]}" -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -g 30 -bf 0 \
  -force_key_frames "expr:eq(n,590)" -x264-params "zones=591,599,q=51" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  "${AF[@]}" -c:a aac -b:a 192k -ar 48000 -ac 2 -t 20 -movflags +faststart intro_wiesn2026.mp4
# preview: one frame per scene, 3x2 grid
ffmpeg -y -loglevel error -i intro_wiesn2026.mp4 \
  -vf "select='eq(n\,57)+eq(n\,160)+eq(n\,276)+eq(n\,360)+eq(n\,506)+eq(n\,599)',scale=640:360,tile=3x2" \
  -frames:v 1 preview.png
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,r_frame_rate,nb_read_frames,duration,pix_fmt,codec_name -of default=nw=1 intro_wiesn2026.mp4
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,duration -of default=nw=1 intro_wiesn2026.mp4
ffprobe -v error -show_entries format=duration -of default=nw=1 intro_wiesn2026.mp4
