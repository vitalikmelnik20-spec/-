#!/usr/bin/env bash
# "Ціни на заході України" (YouTube Short, Ukrainian on-screen text, NO narration - the author voices it).
#   script timing -> music/SFX bed -> Remotion picture -> mux (bed at -20 LUFS, headroom for the voice) -> QC
set -euo pipefail
cd "$(dirname "$0")"
OUT=../output/zahid_tsiny_osin
mkdir -p build "$OUT/stems"
python3 src/script.py > /dev/null
python3 src/make_map.py >/dev/null
python3 src/soundtrack.py build/
mkdir -p ../remotion-lab/public/zahid && cp src/timeline.json ../remotion-lab/public/zahid/
FRAMES=$(python3 -c "import json; print(json.load(open('src/timeline.json'))['frames'])")
( cd ../remotion-lab && npx remotion render src/index.ts Zahid ../zahid/build/picture.mp4 --concurrency=4 --crf=14 --muted --log=error )
M=$(ffmpeg -nostats -i build/bed.wav -af loudnorm=I=-20:TP=-3:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
LN=$(echo "$M" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ENC="-c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 30 -g 60 -frames:v $FRAMES -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart"
ffmpeg -y -loglevel error -i build/picture.mp4 -i build/bed.wav -map 0:v -map 1:a $ENC \
  -af "loudnorm=I=-20:TP=-3:LRA=11:$LN:linear=true,aresample=48000" -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest \
  -metadata title="Ціни на заході України — осінь 2026" "$OUT/zahid_tsiny_osin_muzyka.mp4"
ffmpeg -y -loglevel error -i build/picture.mp4 -map 0:v $ENC -an "$OUT/zahid_tsiny_osin_bez_zvuku.mp4"
for s in music sfx; do ffmpeg -y -loglevel error -i build/$s.wav -c:a pcm_s16le "$OUT/stems/$s.wav"; done
python3 src/verify.py "$OUT/zahid_tsiny_osin_muzyka.mp4"
