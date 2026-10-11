"""The author's script (NOT voiced in the video - the author records it). Each line's on-screen time is
estimated from its syllable count at an energetic Shorts pace; word onsets are estimated the same way.
    python3 src/script.py   -> src/timeline.json"""
import json, re
SYL_PER_S = 4.6     # energetic US Shorts narration (~ 3 words/s)
BREATH = 0.35
SCENES = [
    ("hook",  ["How much does it cost to dress up for Halloween in America?"]),
    ("trend", ["In 2026, these costumes are trending!"]),
    ("kpop",  ["First, K-Pop Demon Hunters — around $41."]),
    ("penny", ["Want something scarier?", "Pennywise from IT costs approximately $49."]),
    ("wed",   ["Wednesday Addams?", "Expect to pay around $34."]),
    ("mario", ["Mario fans can get their look for about $38."]),
    ("dolly", ["And if you want to become Dolly Parton, expect to spend around $56."]),
    ("scary", ["But here's the scary part:", "a full Halloween outfit can cost even more when you add makeup and accessories!"]),
    ("cta",   ["So, which costume would you choose?", "Comment below!"]),
]
SPOKEN = {"2026": "twenty twenty six", "$41": "forty one dollars", "$49": "forty nine dollars", "$34": "thirty four dollars",
          "$38": "thirty eight dollars", "$56": "fifty six dollars", "K-Pop": "kay pop", "IT": "it"}
def syl(s):
    for k, v in SPOKEN.items(): s = s.replace(k, v)
    n = 0
    for w in re.findall(r"[a-zA-Z']+", s.lower()):
        g = len(re.findall(r"[aeiouy]+", w)) - (1 if w.endswith("e") and not w.endswith(("le", "ee")) and len(w) > 3 else 0)
        n += max(1, g)
    return n
t, out = 0.25, {}
for key, sents in SCENES:
    beats = []
    for s in sents:
        d = syl(s) / SYL_PER_S
        words, acc, tot = [], 0, max(1, syl(s))
        for w in s.split():
            words.append({"w": w, "t": round(t + d * acc / tot, 2)}); acc += syl(w) if re.search(r"[A-Za-z0-9$]", w) else 0
        beats.append({"t": round(t, 2), "dur": round(d, 2), "text": s, "words": words})
        t += d + BREATH
    t += 0.3 if key != "cta" else 0
    out[key] = {"start": beats[0]["t"], "beats": beats}
total = round(t + 1.2, 2)
cuts = {k: (0 if k == "hook" else round(v["start"] - 0.15, 2)) for k, v in out.items()}
json.dump({"scenes": out, "cuts": cuts, "total": total, "frames": int(total * 30 + 0.999)}, open("src/timeline.json", "w"), indent=1)
for k, v in out.items():
    for b in v["beats"]: print(f"{b['t']:5.2f}-{b['t']+b['dur']:5.2f}  {b['text']}")
print("total", total)
