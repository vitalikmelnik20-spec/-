"""Snap word timings to the real pauses in the rendered voice clips.
    python3 src/align.py        (run after src/voice.py)
Prefix synthesis drifts by up to ~0.3 s inside long lines. Every word that ends in punctuation is
anchored to the nearest detected pause in the actual audio (word end -> pause start, next word ->
pause end); words in between are re-mapped piecewise-linearly. Then cues and captions are rebuilt.
"""
import json
import numpy as np
import soundfile as sf

T = json.load(open("src/timeline_raw.json"))


def pauses(key, t0):
    w, sr = sf.read(f"assets/voice/{key}.wav"); hop = int(0.01 * sr)
    fr = np.array([np.sqrt(np.mean(w[i:i + hop] ** 2)) for i in range(0, len(w) - hop, hop)])
    q = fr < 0.03 * fr.max(); out = []; i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if j - i >= 6 and i > 0 and j < len(q): out.append((t0 + i * 0.01, t0 + j * 0.01))
            i = j
        else:
            i += 1
    return out


for key, t0 in T["starts"].items():
    ws = [w for w in T["words"] if w["key"] == key]
    gp = pauses(key, t0)
    old, new = [t0, t0 + T["durs"][key]], [t0, t0 + T["durs"][key]]
    last, fix = t0, []
    for a, b in zip(ws, ws[1:]):
        if a["text"][-1] not in ".,?!:": continue
        near = [g for g in gp if abs(g[0] - a["end"]) < 0.4 and g[0] > last]
        if not near: continue
        # sentence ends take the longest pause nearby, commas the closest one
        g = max(near, key=lambda g: g[1] - g[0]) if a["text"][-1] in ".?!:" else min(near, key=lambda g: abs(g[0] - a["end"]))
        old += [a["end"] - 1e-4, b["start"] + 1e-4]; new += [g[0], g[1]]; last = g[1]
        fix.append((a, b, g))
    o = np.array(old); n = np.array(new); idx = np.argsort(o); o, n = o[idx], n[idx]
    for w in ws:
        w["start"] = round(float(np.interp(w["start"], o, n)), 3)
        w["end"] = round(float(np.interp(w["end"], o, n)), 3)
    for a, b, g in fix:                       # the pause itself: word ends at its start, next word starts at its end
        a["end"], b["start"] = round(g[0], 3), round(g[1], 3)
    ws[-1]["end"] = round(t0 + T["durs"][key] - 0.06, 3)


def cue(key, p):
    return next(w["start"] for w in T["words"] if w["key"] == key and w["text"].lower().startswith(p.lower()))


SPEC = {"hook.income": ("hook", "income"), "city.afford": ("city", "affordable"), "city.meet": ("city", "Meet"),
        "city.housing": ("city", "housing"), "rent.census": ("rent", "Census"), "rent.price": ("rent", "sixteen"),
        "rent.period": ("rent", "based"), "buy.median": ("buy", "median"), "buy.price": ("buy", "four"),
        "tax.no": ("tax", "Washington"), "tax.but": ("tax", "but"), "tax.escape": ("tax", "escape"),
        "transit.buses": ("transit", "local"), "transit.fare": ("transit", "fare-free"), "transit.check": ("transit", "Check"),
        "summary.capital": ("summary", "state-capital"), "summary.pnw": ("summary", "Pacific"),
        "summary.perk": ("summary", "transit"), "summary.but": ("summary", "But"), "summary.watch": ("summary", "watch"),
        "cta.comment": ("cta", "Comment"), "cta.yes": ("cta", "yes"), "cta.no": ("cta", "no.")}
T["cues"] = {k: cue(*v) for k, v in SPEC.items()}
# scene cuts lead each line by 0.12 s (picture first, then the word); the hook starts on frame 0
T["cuts"] = {k: (0.0 if k == "hook" else round(t - 0.12, 3)) for k, t in T["starts"].items()}
T["frames"] = int(np.ceil(T["total"] * 30))
json.dump(T, open("src/timeline.json", "w"), indent=1)
caps = [{"text": (" " if w["i"] else "") + w["text"], "startMs": round(w["start"] * 1000), "endMs": round(w["end"] * 1000),
         "timestampMs": round((w["start"] + w["end"]) * 500), "confidence": None} for w in T["words"]]
json.dump(caps, open("src/captions.json", "w"), indent=1)
print(json.dumps(T["cues"]))
