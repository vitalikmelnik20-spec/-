"""German narration for the Bern Short: Coqui VITS trained on CSS10 German (one native female speaker),
local CPU model shared with wiesn2026/.tts.
    .tts/venv/bin/python src/voice.py
Writes assets/voice/<key>.wav and src/timeline_raw.json (line starts, durations, word timings).
One speaking rate for every line; lines follow each other with a short breath. Word ends are measured
by synthesising each line's prefix with the same seed and settings; src/align.py then snaps them to
the real pauses in the audio.
"""
import json, os, sys
import numpy as np
import soundfile as sf
import torch
from TTS.api import TTS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES
from vo_util import trim, tighten

MODEL = ".tts/tts_models--de--css10--vits"
LS, MAX_PAUSE = 0.88, 0.2       # length_scale < 1 = a little brisker than the audiobook narrator
LEAD, TAIL = 0.15, 0.8
GAP = {"rent": 0.32, "month": 0.34, "total": 0.34, "salary": 0.34, "buy": 0.36, "cta": 0.36}

cfg = json.load(open(f"{MODEL}/config.json"))
cfg["model_args"]["speakers_file"] = os.path.abspath(f"{MODEL}/speaker_ids.json")
json.dump(cfg, open(f"{MODEL}/config_local.json", "w"), indent=1)
tts = TTS(model_path=f"{MODEL}/model_file.pth.tar", config_path=f"{MODEL}/config_local.json", progress_bar=False)
tts.synthesizer.tts_model.length_scale = LS
SR = tts.synthesizer.output_sample_rate


def say(text):
    np.random.seed(0); torch.manual_seed(0)
    w = np.asarray(tts.tts(text.lower()), dtype=np.float64)
    return tighten(trim(w, SR), SR, MAX_PAUSE)


os.makedirs("assets/voice", exist_ok=True)
t, starts, durs, words_all = LEAD, {}, {}, []
for key, text in LINES:
    t += GAP.get(key, 0)
    w = say(text); w = w / (np.abs(w).max() + 1e-9) * 0.89
    sf.write(f"assets/voice/{key}.wav", w, SR, "PCM_16")
    dur = len(w) / SR
    words = text.split(); ends = []
    for i in range(len(words) - 1):
        ends.append(min(dur, len(say(" ".join(words[:i + 1]))) / SR - 0.08))
    ends.append(dur - 0.08)
    ends = list(np.maximum.accumulate(ends))
    mins = [0.07 + 0.024 * len(x.strip(".,?!:")) for x in words]
    fixed, prev = [], 0.0
    for e, m in zip(ends, mins): prev = max(e, prev + m); fixed.append(prev)
    if fixed[-1] > dur: fixed = [e * dur / fixed[-1] for e in fixed]
    s = 0.0
    for i, x in enumerate(words):
        words_all.append({"key": key, "i": i, "text": x, "start": round(t + s, 3), "end": round(t + fixed[i], 3)})
        s = fixed[i]
    starts[key], durs[key] = round(t, 3), round(dur, 3)
    print(f"{key:7s} {t:6.2f} -> {t + dur:6.2f}  ({len(words)} words)", flush=True)
    t += dur
total = round(t + TAIL, 3)
print("total", total)
json.dump({"voice_name": "CSS10 German (VITS)", "speed": round(1 / LS, 3), "total": total, "starts": starts, "durs": durs,
           "lines": dict(LINES), "words": words_all}, open("src/timeline_raw.json", "w"), indent=1)
