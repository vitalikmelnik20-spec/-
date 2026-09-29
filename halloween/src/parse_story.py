"""Parse story.md -> shots.json (id, kind, duration, act, narration, prompt, action)."""
import json, re, sys

src = sys.argv[1] if len(sys.argv) > 1 else "story.md"
out = sys.argv[2] if len(sys.argv) > 2 else "src/shots.json"
text = open(src, encoding="utf-8").read()
SUFFIX = re.compile(r"\s*Cinematic Halloween mystery film still.*$", re.S)
shots, act = [], "HOOK"
for block in re.split(r"\n(?=## |### )", text):
    head = block.split("\n", 1)[0]
    if head.startswith("## "):
        m = re.match(r"## (АКТ \d+|COLD OPEN)", head)
        if m: act = m.group(1)
        continue
    m = re.match(r"### (🖼 КАДР|🎬 ВІДЕО) (\d+)\s+·\s+(\d+):(\d+)–(\d+):(\d+)", head)
    if not m: continue
    kind = "image" if "КАДР" in m.group(1) else "video"
    start = int(m.group(3)) * 60 + int(m.group(4)); end = int(m.group(5)) * 60 + int(m.group(6))
    narr = " ".join(l[2:].strip() for l in block.splitlines() if l.startswith("> "))
    codes = re.findall(r"```\n(.*?)\n```", block, re.S)
    prompt = SUFFIX.sub("", codes[0]).strip() if codes else ""
    act_m = re.search(r"CAMERA & ACTION: (.*?)\n", block)
    shots.append({"id": f"{'F' if kind == 'image' else 'V'}{m.group(2)}", "kind": kind, "start": start, "dur": end - start,
                  "act": act, "narration": narr, "prompt": prompt, "action": act_m.group(1) if act_m else ""})
json.dump(shots, open(out, "w"), ensure_ascii=False, indent=1)
print(len(shots), "shots,", sum(s["dur"] for s in shots), "s,", sum(len(s["narration"].split()) for s in shots), "words")
