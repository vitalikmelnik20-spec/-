"""Verify the final MP4: resolution, fps, duration, codec, audio, integrity,
and that every frame is unique (no duplicated frames) except the intended
final 0.5 s hold."""
import json
import subprocess
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "output/chicago_cost_of_living_40s.mp4"
ok = True


def check(name, cond, detail):
    global ok
    ok &= bool(cond)
    print(f"  [{'OK' if cond else 'FAIL'}] {name}: {detail}")


probe = json.loads(subprocess.check_output(
    ["ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", path]))
v = next(s for s in probe["streams"] if s["codec_type"] == "video")
a = [s for s in probe["streams"] if s["codec_type"] == "audio"]
num, den = map(int, v["r_frame_rate"].split("/"))
fps = num / den
dur = float(probe["format"]["duration"])
frames = int(v["nb_read_frames"])
print(f"Verifying {path}")
check("resolution", (v["width"], v["height"]) == (1080, 1920), f'{v["width"]}x{v["height"]}')
check("frame rate", abs(fps - 30) < 1e-6 and v["avg_frame_rate"] == "30/1", f'{v["r_frame_rate"]} (avg {v["avg_frame_rate"]})')
check("frame count", frames == 1200, f"{frames} frames")
check("duration", abs(dur - 40.0) < 0.05, f"{dur:.3f} s")
check("video codec", v["codec_name"] == "h264", f'{v["codec_name"]} {v.get("profile")} level {v.get("level")} {v["pix_fmt"]}')
check("audio stream", len(a) == 1 and a[0]["codec_name"] == "aac", f'{a[0]["codec_name"]} {a[0]["sample_rate"]} Hz {a[0]["channels"]} ch' if a else "missing")
if a:
    check("audio duration", abs(float(a[0]["duration"]) - 40.0) < 0.1, f'{float(a[0]["duration"]):.3f} s')
dec = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"], capture_output=True, text=True)
check("integrity (full decode)", dec.returncode == 0 and not dec.stderr.strip(), "no decode errors" if not dec.stderr.strip() else dec.stderr[:300])
md5 = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-map", "0:v", "-f", "framemd5", "-"], text=True)
hashes = [ln.split(",")[-1].strip() for ln in md5.splitlines() if ln and not ln.startswith("#")]
dups = [i for i in range(1, len(hashes)) if hashes[i] == hashes[i - 1]]
motion_dups = [i for i in dups if i < 39.5 * 30 - 1]
check("true 30 fps (no duplicated frames before the final hold)", not motion_dups,
      f"{len(set(hashes))} unique frames; {len(dups)} repeats, all inside the intended 0.5 s end hold" if not motion_dups else f"duplicates at {motion_dups[:10]}")
loud = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
lufs = [ln for ln in loud.splitlines() if ln.strip().startswith("I:")][-1].split()[1]
peak = [ln for ln in loud.splitlines() if ln.strip().startswith("Peak:")][-1].split()[1]
print(f"  [info] loudness {lufs} LUFS, true peak {peak} dBFS, file size {int(probe['format']['size']) / 1e6:.1f} MB, bitrate {int(probe['format']['bit_rate']) / 1e6:.1f} Mb/s")
print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED")
sys.exit(0 if ok else 1)
