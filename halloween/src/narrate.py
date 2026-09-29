"""Narration with the local Kokoro-82M TTS (ONNX, CPU): one wav per shot.
    python src/narrate.py <model_dir> <shots.json> <out_dir> [voice] [speed]"""
import json, os, sys, time
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

model_dir, shots_p, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "am_michael"
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 0.9
only = set(sys.argv[6].split(",")) if len(sys.argv) > 6 else None
os.makedirs(out, exist_ok=True)
k = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))
# a touch of fenrir for a deeper, warmer storyteller timbre
style = k.get_voice_style("am_michael") * 0.7 + k.get_voice_style("am_fenrir") * 0.3 if voice == "storyteller" else voice
meta_p = os.path.join(out, "narration.json")
meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
t0 = time.time()
for s in json.load(open(shots_p)):
    if only and s["id"] not in only: continue
    text = s["narration"].replace("11:47", "eleven forty-seven").replace("11:48", "eleven forty-eight")
    if meta.get(s["id"], {}).get("text") == text and os.path.exists(os.path.join(out, s["id"] + ".wav")): continue
    wav, sr = k.create(text, voice=style, speed=speed, lang="en-us")
    sf.write(os.path.join(out, s["id"] + ".wav"), wav, sr)
    meta[s["id"]] = {"text": text, "seconds": round(len(wav) / sr, 3)}
    json.dump(meta, open(meta_p, "w"), indent=1)
    print(s["id"], meta[s["id"]]["seconds"], f"{time.time() - t0:.0f}s", flush=True)
