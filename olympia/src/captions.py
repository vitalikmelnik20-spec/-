"""On-screen caption pages + captions.srt from the aligned word timings.
    python3 src/captions.py [srt_out]
Spoken numbers are shown as numerals (e.g. "sixteen hundred dollars" -> "$1,600", matching what is
said: "about $1,600"); a merged token spans the timing of the words it replaces. Pages break at
sentence ends, never exceed 30 characters (two lines at the on-screen size) and never straddle lines.
"""
import json, re, sys

T = json.load(open("src/timeline.json"))
MERGE = [  # (spoken words, display tokens -> how many spoken words each covers)
    (["sixteen", "hundred", "dollars"], [("$1,600", 3)]),
    (["twenty", "twenty", "through", "twenty", "twenty-four."], [("2020", 2), ("through", 1), ("2024.", 2)]),
    (["four", "hundred", "eighty-six", "thousand", "dollars."], [("$486,000.", 5)]),
    (["yes"], [("YES", 1)]), (["no."], [("NO.", 1)]),
]
KEY = {"money": r"^\$", "good": r"^(fare-free|YES)", "warn": r"^(NO\.|escape)",
       "key": r"^(rent|income|tax|housing|Olympia|capital|buy)"}


def tokens(key):
    ws = [w for w in T["words"] if w["key"] == key]; out = []; i = 0
    while i < len(ws):
        for spoken, disp in MERGE:
            if [w["text"].lower() for w in ws[i:i + len(spoken)]] == spoken:
                j = i
                for text, n in disp:
                    out.append({"text": text, "start": ws[j]["start"], "end": ws[j + n - 1]["end"]}); j += n
                i += len(spoken); break
        else:
            out.append({"text": ws[i]["text"], "start": ws[i]["start"], "end": ws[i]["end"]}); i += 1
    for t in out:
        t["em"] = next((k for k, rx in KEY.items() if re.search(rx, t["text"].strip(".,?!:"))), None)
    return out


pages = []
for key in T["starts"]:
    cur = []
    toks = tokens(key)
    for j, t in enumerate(toks):
        n = len(" ".join(x["text"] for x in cur + [t]))
        rest = next((k for k in range(j, len(toks)) if toks[k]["text"][-1] in ".?!:"), len(toks) - 1) - j + 1
        too_long = n > 30 and not (rest <= 2 and n <= 42)   # no one/two-word orphan pages at a sentence end
        brk = cur and (too_long or cur[-1]["text"][-1] in ".?!:" or (cur[-1]["text"][-1] == "," and len(cur) >= 3))
        if brk: pages.append(cur); cur = []
        cur.append(t)
    pages.append(cur)
out = []
for i, p in enumerate(pages):
    end = p[-1]["end"] + 0.25
    if i + 1 < len(pages): end = min(end, pages[i + 1][0]["start"])
    out.append({"start": round(p[0]["start"], 3), "end": round(end, 3), "tokens": p})
json.dump(out, open("src/caption_pages.json", "w"), indent=1)


def ts(s):
    ms = int(round(s * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
def two_lines(words):
    s = " ".join(words)
    if len(s) <= 22: return s
    best = min(range(1, len(words)), key=lambda k: abs(len(" ".join(words[:k])) - len(" ".join(words[k:]))))
    return " ".join(words[:best]) + "\n" + " ".join(words[best:])
srt = "\n".join(f"{i + 1}\n{ts(p['start'])} --> {ts(p['end'])}\n{two_lines([t['text'] for t in p['tokens']])}\n" for i, p in enumerate(out))
dst = sys.argv[1] if len(sys.argv) > 1 else "build/captions.srt"
import os; os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
open(dst, "w").write(srt)
print(len(out), "pages ->", dst)
