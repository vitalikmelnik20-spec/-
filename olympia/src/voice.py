"""Olympia narration: Kokoro-82M (local ONNX, CPU), American male voice "am_puck".
    python3 src/voice.py
Writes assets/voice/<key>.wav and src/timeline_raw.json (line starts, durations, word timings);
then run src/align.py to snap words to real pauses and write timeline.json + captions.json. The timeline follows the voice, not the other way round:
each line is spoken at one natural rate (no per-line speed fitting) and placed after the previous
line with a short breath; scene cuts are derived from these starts in the composition.
Kokoro returns no timestamps, so a word's end is measured by synthesising the line's prefix up to
that word with identical settings (+-50 ms, enough for caption highlighting).
"""
import json, os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

sys.path.insert(0, os.path.dirname(__file__))
from lines import LINES
from vo_util import trim, tighten

VOICE, SPEED, MAX_PAUSE = "am_puck", 1.2, 0.17
LEAD = 0.12                     # first word lands at 0.12 s: the hook starts immediately
GAP = {"city": 0.22, "rent": 0.30, "buy": 0.34, "tax": 0.34, "transit": 0.30, "summary": 0.30, "cta": 0.30}
TAIL = 0.75                     # end card holds after the last word
k = Kokoro(".kokoro/kokoro-v1.0.onnx", ".kokoro/voices-v1.0.bin")


def say(text):
    w, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
    return tighten(trim(w, sr), sr, MAX_PAUSE), sr


os.makedirs("assets/voice", exist_ok=True)
t, starts, durs, words_all = LEAD, {}, {}, []
for key, text in LINES:
    t += GAP.get(key, 0)
    w, sr = say(text)
    w = w / (np.abs(w).max() + 1e-9) * 0.89
    sf.write(f"assets/voice/{key}.wav", w, sr, "PCM_16")
    dur = len(w) / sr
    words = text.split()
    ends = []
    for i in range(len(words) - 1):
        pw, _ = say(" ".join(words[:i + 1]))
        ends.append(min(dur, len(pw) / sr - 0.06))
    ends.append(dur - 0.06)
    ends = list(np.maximum.accumulate(ends))
    mins = [0.07 + 0.028 * len(x.strip(".,?!:")) for x in words]   # very short prefixes synthesise unevenly
    fixed, prev = [], 0.0
    for e, m in zip(ends, mins): prev = max(e, prev + m); fixed.append(prev)
    if fixed[-1] > dur: fixed = [e * dur / fixed[-1] for e in fixed]
    s = 0.0
    for i, x in enumerate(words):
        words_all.append({"key": key, "i": i, "text": x, "start": round(t + s, 3), "end": round(t + fixed[i], 3)})
        s = fixed[i]
    starts[key], durs[key] = round(t, 3), round(dur, 3)
    print(f"{key:8s} {t:6.2f} -> {t + dur:6.2f}  ({len(words)} words)", flush=True)
    t += dur
total = round(t + TAIL, 3)
print("total", total)


json.dump({"voice_name": VOICE, "speed": SPEED, "total": total, "starts": starts, "durs": durs,
           "lines": dict(LINES), "words": words_all}, open("src/timeline_raw.json", "w"), indent=1)
