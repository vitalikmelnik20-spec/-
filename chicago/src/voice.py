"""American English voice-over (Kokoro-82M, voice "af_heart", local ONNX on CPU) + timeline.
    python3 src/voice.py [.kokoro] [voice]
Writes assets/voice/<key>.wav and src/timeline.json (voice starts + caption-free word timing).
Scene windows are fixed by the edit; each line starts just after its scene cut. The speaking
rate starts at an energetic 1.1x and is raised (max 1.25x, still natural) only as far as needed.
A line may run up to 0.25 s past its cut; the next line then starts after it.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

MD = sys.argv[1] if len(sys.argv) > 1 else ".kokoro"
VOICE = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
SCENES = [("hook", 0.0), ("rent", 3.0), ("food", 8.0), ("eat", 13.0), ("transit", 18.0),
          ("util", 23.0), ("total", 28.0), ("payoff", 34.0), ("cta", 37.0), ("end", 39.75)]  # the voice may finish inside the 0.5 s visual hold
LINES = {  # spoken text (numbers written the way they are said)
    "hook": "Could you actually afford to live in Chicago?",
    "rent": "First, rent. A typical one-bedroom averages around twenty-four fifty-seven a month.",
    "food": "Then groceries. A basic food budget for one adult is roughly three hundred eighty-six dollars a month.",
    "eat": "Eating out isn't cheap either. A casual meal, about twenty dollars. A cappuccino, around five-fifty.",
    "transit": "And getting around? A regular C-T-A thirty-day pass costs about eighty-five dollars.",
    "util": "Utilities add roughly one hundred eighty-six dollars, and internet and phone push it even higher.",
    "total": "Put the basics together, and a single person could easily spend around thirty-two to thirty-three hundred dollars a month.",
    "payoff": "And that's before healthcare, insurance, taxes, or entertainment.",
    "cta": "Would you live here for that price? Comment yes or no!",
}
BASE, CAP, SPILL = 1.1, 1.25, 0.35

# word cues: the moment a key phrase starts = duration of the line's prefix before it
CUES = {
    "rent": {"rent_word": "First,", "price": "First, rent. A typical one-bedroom averages around"},
    "food": {"price": "Then groceries. A basic food budget for one adult is roughly"},
    "eat": {"meal": "Eating out isn't cheap either. A casual meal, about", "coffee": "Eating out isn't cheap either. A casual meal, about twenty dollars. A cappuccino, around"},
    "transit": {"price": "And getting around? A regular C-T-A thirty-day pass costs about"},
    "util": {"price": "Utilities add roughly", "internet": "Utilities add roughly one hundred eighty-six dollars, and"},
    "total": {"price": "Put the basics together, and a single person could easily spend around"},
    "cta": {"yes": "Would you live here for that price? Comment"},
}
k = Kokoro(f"{MD}/kokoro-v1.0.onnx", f"{MD}/voices-v1.0.bin")


def trim(w, sr):
    nz = np.where(np.abs(w) > 0.01 * np.abs(w).max())[0]
    return w[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.06 * sr)]


def tighten(w, sr, max_pause=0.14):
    """shorten pauses inside a line (sentence breaks) to max_pause seconds"""
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


os.makedirs("assets/voice", exist_ok=True)
starts = dict(SCENES)
voice_at, durs, speeds, cues, prev_end = {}, {}, {}, {}, 0.0
for idx, (key, s0) in enumerate(SCENES[:-1]):
    nxt = SCENES[idx + 1][1]
    t0 = max(s0 + (0.12 if key != "hook" else 0.25), prev_end + 0.1)
    limit = nxt - t0 + 0.05                    # aim to finish by the next cut ...
    hard = (nxt + SPILL if SCENES[idx + 1][0] != "end" else nxt) - t0  # ... and never later than this
    limit = min(limit, hard)
    sp = BASE
    while True:
        w, sr = k.create(LINES[key], voice=VOICE, speed=sp, lang="en-us")
        w = tighten(trim(w, sr), sr, 0.12 if key == "eat" else 0.14)
        if len(w) / sr <= limit or sp >= CAP: break
        sp = round(min(CAP, sp + 0.03), 2)
    w = w / (np.abs(w).max() + 1e-9) * 0.9
    sf.write(f"assets/voice/{key}.wav", w, sr, "PCM_16")
    voice_at[key], durs[key], speeds[key] = round(t0, 3), round(len(w) / sr, 3), sp
    for name, prefix in CUES.get(key, {}).items():
        if name == "rent_word": cues[f"{key}.{name}"] = round(t0, 3); continue
        pw, _ = k.create(prefix, voice=VOICE, speed=sp, lang="en-us")
        cues[f"{key}.{name}"] = round(t0 + len(tighten(trim(pw, sr), sr, 0.12 if key == "eat" else 0.14)) / sr - 0.04, 3)
    prev_end = t0 + len(w) / sr
    flag = "" if prev_end <= hard + t0 + 1e-6 else "  !! OVER"
    print(f"{key:8s} {t0:6.2f} -> {prev_end:6.2f}  (cut {nxt:5.2f})  speed {sp}{flag}")
json.dump({"scenes": starts, "voice": voice_at, "durs": durs, "speed": speeds, "cues": cues, "lines": LINES, "voice_name": VOICE},
          open("src/timeline.json", "w"), indent=1)
