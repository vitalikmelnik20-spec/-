"""On-screen caption pages + captions.srt (German) from the aligned word timings.
    python3 src/captions.py [srt_out]
Spoken amounts are shown as figures ("tausenddreihundertvierzig Euro" -> "1.340 €"); a merged token
spans the timing of the words it replaces. Pages break at sentence ends, max ~30 characters (two
lines on screen), no one/two-word orphan pages, never across lines.
"""
import json, os, re, sys

T = json.load(open("src/timeline.json"))
NUM = {"tausenddreihundertvierzig": "1.340", "tausendsiebenhundertachtzig": "1.780", "fünfhundertfünfzig": "550",
       "vierhundertzehn": "410", "fünfundneunzig": "95", "dreitausenddreihundert": "3.300", "dreitausendneunhundert": "3.900",
       "sechstausendvierhundert": "6.400", "neunhundertachtzigtausend": "980.000"}
KEY = {"money": r"€|^Million", "good": r"^(JA|Nettogehalt)", "warn": r"^NEIN",
       "key": r"^(Bern|Miete|Lebensmittel|Krankenversicherung|Transport|Wohnung|Zentrum|Preis)"}


def tokens(key):
    ws = [w for w in T["words"] if w["key"] == key]; out = []; i = 0
    while i < len(ws):
        w = ws[i]; bare = w["text"].strip(".,?!:")
        if bare in NUM and i + 1 < len(ws) and ws[i + 1]["text"].startswith("Euro"):
            tail = ws[i + 1]["text"][4:]
            out.append({"text": f"{NUM[bare]} €{tail}", "start": w["start"], "end": ws[i + 1]["end"]}); i += 2; continue
        if bare in NUM:
            out.append({"text": NUM[bare] + w["text"][len(bare):], "start": w["start"], "end": w["end"]}); i += 1; continue
        txt = {"ja": "JA", "nein": "NEIN"}.get(w["text"], w["text"])
        out.append({"text": txt, "start": w["start"], "end": w["end"]}); i += 1
    for t in out:
        t["em"] = next((k for k, rx in KEY.items() if re.search(rx, t["text"].strip(".,?!:"))), None)
    return out


pages = []
for key in T["starts"]:
    cur = []; toks = tokens(key)
    for j, t in enumerate(toks):
        n = len(" ".join(x["text"] for x in cur + [t]))
        rest = next((k for k in range(j, len(toks)) if toks[k]["text"][-1] in ".?!:"), len(toks) - 1) - j + 1
        too_long = n > 30 and not (rest <= 2 and n <= 40)
        brk = cur and (too_long or cur[-1]["text"][-1] in ".?!:" or (cur[-1]["text"][-1] == "," and (len(cur) >= 2 or "€" in cur[-1]["text"])))
        if brk: pages.append(cur); cur = []
        cur.append(t)
    pages.append(cur)
out = []
for i, p in enumerate(pages):
    end = p[-1]["end"] + 0.25
    if i + 1 < len(pages): end = min(end, pages[i + 1][0]["start"])
    out.append({"start": round(p[0]["start"], 3), "end": round(end, 3), "tokens": p})
json.dump(out, open("src/caption_pages.json", "w"), indent=1, ensure_ascii=False)


def ts(s):
    ms = int(round(s * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
def two_lines(words):
    s = " ".join(words)
    if len(s) <= 22: return s
    b = min(range(1, len(words)), key=lambda k: abs(len(" ".join(words[:k])) - len(" ".join(words[k:]))))
    return " ".join(words[:b]) + "\n" + " ".join(words[b:])
srt = "\n".join(f"{i + 1}\n{ts(p['start'])} --> {ts(p['end'])}\n{two_lines([t['text'] for t in p['tokens']])}\n" for i, p in enumerate(out))
dst = sys.argv[1] if len(sys.argv) > 1 else "build/captions.srt"
os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
open(dst, "w").write(srt)
print(len(out), "pages ->", dst)
