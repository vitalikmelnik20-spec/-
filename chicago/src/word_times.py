"""Word-level timings for the Chicago voice-over, in Remotion's Caption format.
    python3 src/word_times.py [.kokoro] [out.json]
Kokoro returns no timestamps, so each word's end time is measured by synthesising the line's
prefix up to that word with the same voice/speed/pause-tightening as src/voice.py (accurate to
roughly +-50 ms, enough for word highlighting). Output: [{text, startMs, endMs, timestampMs, confidence}].
"""
import json, sys
import numpy as np
from kokoro_onnx import Kokoro

sys.path.insert(0, "src")
MD = sys.argv[1] if len(sys.argv) > 1 else ".kokoro"
OUT = sys.argv[2] if len(sys.argv) > 2 else "src/captions.json"
TL = json.load(open("src/timeline.json"))
k = Kokoro(f"{MD}/kokoro-v1.0.onnx", f"{MD}/voices-v1.0.bin")


def trim(w, sr):
    nz = np.where(np.abs(w) > 0.01 * np.abs(w).max())[0]
    return w[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.06 * sr)]


def tighten(w, sr, max_pause):
    hop = int(0.01 * sr)
    fr = np.array([np.sqrt(np.mean(w[i:i + hop] ** 2)) for i in range(0, len(w) - hop, hop)])
    q = fr < 0.02 * fr.max(); keep = np.ones(len(w), bool); i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) * hop > max_pause * sr:
                keep[i * hop + int(max_pause * sr / 2): j * hop - int(max_pause * sr / 2)] = False
            i = j
        else:
            i += 1
    return w[keep]


caps = []
for key, text in TL["lines"].items():
    t0, sp, dur = TL["voice"][key], TL["speed"][key], TL["durs"][key]
    mp = 0.12 if key == "eat" else 0.14
    words = text.split()
    ends = []
    for i in range(len(words)):
        if i == len(words) - 1:
            ends.append(dur); break
        w, sr = k.create(" ".join(words[:i + 1]), voice=TL["voice_name"], speed=sp, lang="en-us")
        ends.append(min(dur, len(tighten(trim(w, sr), sr, mp)) / sr - 0.03))
    ends = list(np.maximum.accumulate(ends))  # monotone
    # very short prefixes synthesise unevenly: give every word a minimum length (by letters), then refit to the line
    mins = [0.06 + 0.03 * len(wd.strip(".,?!")) for wd in words]
    fixed, prev = [], 0.0
    for e, m in zip(ends, mins): prev = max(e, prev + m); fixed.append(prev)
    if fixed[-1] > dur: fixed = [e * dur / fixed[-1] for e in fixed]
    ends = fixed
    start = 0.0
    for i, wd in enumerate(words):
        s, e = t0 + start, t0 + ends[i]
        caps.append({"text": (" " if i else "") + wd, "startMs": round(s * 1000), "endMs": round(e * 1000),
                     "timestampMs": round((s + e) / 2 * 1000), "confidence": None})
        start = ends[i]
    print(f"{key:8s} {len(words):2d} words  {t0:6.2f}-{t0 + dur:6.2f}s", flush=True)
json.dump(caps, open(OUT, "w"), indent=1)
print("written", OUT, len(caps), "words")
