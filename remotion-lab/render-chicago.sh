#!/usr/bin/env bash
# Chicago v2 (Remotion + video-shotcraft): render -> two-pass loudnorm (-14 LUFS, -1.5 dBTP) -> hold-safe H.264
# Inputs live in public/chicago (voice, captions, timeline, music bed) — regenerate them with ../chicago/src/*.py
set -euo pipefail; cd "$(dirname "$0")"
mkdir -p out
[ -f public/chicago/sfx/whoosh-big.mp3 ] || bash scripts/fetch-sfx.sh
npx remotion render src/index.ts ChicagoV2 out/chicago_v2_raw.mp4 --concurrency=4 --crf=17 --log=error
M=$(ffmpeg -nostats -i out/chicago_v2_raw.mp4 -map 0:a -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
# keyframe on 1185 + max quantiser on 1186-1199: the final 0.5 s decodes pixel-identical (clean splice)
ffmpeg -y -loglevel error -i out/chicago_v2_raw.mp4 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 30 -g 30 -bf 0 \
  -force_key_frames "expr:eq(n,1185)" -x264-params "zones=1186,1199,q=51" -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:$LN:linear=true,aresample=48000" -c:a aac -b:a 256k -ar 48000 -t 40 -movflags +faststart \
  -metadata title="Chicago — the real cost of living (v2)" out/chicago_v2.mp4
python3 ../chicago/render/verify.py out/chicago_v2.mp4
