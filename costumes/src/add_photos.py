"""Collect costume photos into the Remotion project.
Put one image per costume into costumes/photos/ named kpop / penny / wed / mario / dolly (.jpg/.jpeg/.png/.webp),
optionally with costumes/photos/credits.json  {"kpop": {"credit": "Name, CC BY-SA 4.0", "pos": "50% 20%"}, ...}.
Each image is converted to a 1080 px-wide JPEG in remotion-lab/public/costumes/ and listed in photos.json."""
import json, os, subprocess
SRC, DST = "photos", "../remotion-lab/public/costumes"
os.makedirs(DST, exist_ok=True)
credits = json.load(open(f"{SRC}/credits.json")) if os.path.exists(f"{SRC}/credits.json") else {}
out = {}
for k in ("kpop", "penny", "wed", "mario", "dolly"):
    f = next((f"{SRC}/{k}.{e}" for e in ("jpg", "jpeg", "png", "webp") if os.path.exists(f"{SRC}/{k}.{e}")), None)
    if not f: print(f"  {k}: no photo (placeholder card will be shown)"); continue
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-vf", "scale='min(1080,iw)':-2", "-q:v", "3", f"{DST}/{k}.jpg"], check=True)
    out[k] = {"file": f"{k}.jpg", **credits.get(k, {})}
    print(f"  {k}: {f}")
json.dump(out, open(f"{DST}/photos.json", "w"), indent=1)
print(len(out), "of 5 photos")
