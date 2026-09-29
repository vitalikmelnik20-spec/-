"""shots.json + narration durations -> src/timeline.json (shot start/dur + voice placement)."""
import json, sys
shots = json.load(open("src/shots.json"))
narr = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "assets/narration/narration.json"))
T, out = 0.0, []
for s in shots:
    vo = narr.get(s["id"], {}).get("seconds", 0)
    lead = 0.55 if s["kind"] == "image" else 0.45
    dur = max(s["dur"], round(lead + vo + (0.95 if s["kind"] == "image" else 0.6), 2))
    out.append({"id": s["id"], "kind": s["kind"], "act": s["act"], "start": round(T, 3), "dur": dur, "vo": round(T + lead, 3), "voLen": vo})
    T += dur
import re
def chunks(text):
    parts = []
    for sent in re.split(r"(?<=[.!?])\s+", text.strip()):
        pieces = [sent]
        if len(sent) > 80:
            pieces = [p.strip() for p in re.split(r"(?<=,)\s+", sent) if p.strip()]
        for p in pieces:
            while len(p) > 84:
                words = p.split(); half = len(words) // 2
                parts.append(" ".join(words[:half])); p = " ".join(words[half:])
            parts.append(p)
    merged = []
    for p in parts:
        if merged and len(merged[-1]) + len(p) < 58: merged[-1] += " " + p
        else: merged.append(p)
    return merged
subs = []
for o, s in zip(out, shots):
    text = narr.get(s["id"], {}).get("text", "")
    text = s["narration"]
    if not text or not o["voLen"]: continue
    cs = chunks(text); w = [len(c) + 12 for c in cs]; tot = sum(w); t0 = o["vo"]
    for c, k in zip(cs, w):
        d = o["voLen"] * k / tot
        subs.append({"s": round(t0, 3), "e": round(t0 + d + 0.25, 3), "text": c}); t0 += d
for a, b in zip(subs, subs[1:]):
    a["e"] = min(a["e"], b["s"] - 0.04)
json.dump({"total": round(T, 3), "shots": out, "subs": subs}, open("src/timeline.json", "w"), indent=0)
def ts(x):
    ms = int(round(x * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
with open("output/subtitles_en.srt", "w", encoding="utf-8") as f:
    for i, c in enumerate(subs, 1): f.write(f"{i}\n{ts(c['s'])} --> {ts(c['e'])}\n{c['text']}\n\n")
print(len(subs), "subtitle cues")
print(f"total {T:.1f}s = {int(T // 60)}:{T % 60:04.1f}; longest VO {max(narr[k]['seconds'] for k in narr):.1f}s")
acts = {}
for o in out: acts.setdefault(o["act"], o["start"])
print({k: f"{int(v // 60)}:{int(v % 60):02d}" for k, v in acts.items()})
