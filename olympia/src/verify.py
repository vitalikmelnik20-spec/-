"""QC for the rendered Short: format, duration, decode integrity, black/frozen frames, loudness,
voice-vs-picture sync points, and a contact sheet of key frames.
    python3 src/verify.py output/olympia_cost_of_living/olympia_cost_of_living.mp4"""
import json, os, re, subprocess, sys

mp4 = sys.argv[1]
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
pr = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video"); a = next(s for s in pr["streams"] if s["codec_type"] == "audio")
nb = run("ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", mp4).stdout.strip()
dec = run("ffmpeg", "-v", "error", "-i", mp4, "-f", "null", "-").stderr.strip()
blk = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", run("ffmpeg", "-i", mp4, "-vf", "blackdetect=d=0.1:pic_th=0.97", "-an", "-f", "null", "-").stderr)
frz = re.findall(r"freeze_start: ([\d.]+)", run("ffmpeg", "-i", mp4, "-vf", "freezedetect=n=0.001:d=0.75", "-an", "-f", "null", "-").stderr)
eb = run("ffmpeg", "-nostats", "-i", mp4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)[-1]; TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", eb)[-1]
sil = re.findall(r"silence_start: ([\d.]+)", run("ffmpeg", "-i", mp4, "-vn", "-af", "silencedetect=n=-45dB:d=0.4", "-f", "null", "-").stderr)
rep = {
    "file": mp4, "size_MB": round(int(pr["format"]["size"]) / 1e6, 2),
    "video": f'{v["codec_name"]} {v["profile"]} {v["width"]}x{v["height"]} {v["r_frame_rate"]} {v["pix_fmt"]}',
    "audio": f'{a["codec_name"]} {a["sample_rate"]} Hz {a["channels"]}ch',
    "duration_s": float(pr["format"]["duration"]), "frames": int(nb),
    "decode_errors": dec or "none", "black_segments": blk or "none", "freezes_over_0.75s": frz or "none",
    "loudness_LUFS": float(I), "true_peak_dBFS": float(TP), "silences_over_0.4s": sil or "none",
}
print(json.dumps(rep, indent=1))
out = os.path.dirname(mp4)
json.dump(rep, open("build/qc.json", "w"), indent=1)
# contact sheet: 12 frames spread over the cut list + the last frame
T = json.load(open("src/timeline.json"))
ts = sorted({0.6, *[c + 1.4 for c in T["cuts"].values()], T["cues"]["rent.price"] + 1, T["cues"]["buy.price"] + 1,
             T["cues"]["tax.but"] + 1.5, T["cues"]["transit.fare"] + 1, T["cues"]["summary.watch"], T["frames"] / 30 - 0.4})
os.makedirs("build/qc", exist_ok=True)
for i, t in enumerate(ts):
    run("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", mp4, "-frames:v", "1", "-vf", "scale=270:480", f"build/qc/{i:02d}.png")
n = len(ts); cols = 6; rows = -(-n // cols)
inputs = sum([["-i", f"build/qc/{i:02d}.png"] for i in range(n)], [])
lay = "|".join(f"{(i % cols) * 270}_{(i // cols) * 480}" for i in range(n))
labels = "".join(f"[{i}]drawtext=text='{ts[i]:.1f}s':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6[v{i}];" for i in range(n))
run("ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", labels + "".join(f"[v{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={lay}:fill=black", "build/contact_sheet.png")
print("contact sheet: build/contact_sheet.png")
