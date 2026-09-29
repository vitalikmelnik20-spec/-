"""Verify the final MP4: resolution, fps, duration vs timeline, codecs, audio, integrity."""
import json, subprocess, sys
path = sys.argv[1] if len(sys.argv) > 1 else "output/the_last_trick_or_treater.mp4"
total = json.load(open("src/timeline.json"))["total"]
ok = True
def check(name, cond, detail):
    global ok; ok &= bool(cond); print(f"  [{'OK' if cond else 'FAIL'}] {name}: {detail}")
p = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path]))
v = next(s for s in p["streams"] if s["codec_type"] == "video"); a = [s for s in p["streams"] if s["codec_type"] == "audio"]
dur = float(p["format"]["duration"])
print("Verifying", path)
check("resolution", (v["width"], v["height"]) == (1920, 1080), f'{v["width"]}x{v["height"]}')
check("frame rate", v["avg_frame_rate"] == "30/1", v["avg_frame_rate"])
check("duration", abs(dur - total) < 0.2, f"{dur:.2f} s ({int(dur // 60)}:{dur % 60:05.2f}), timeline {total:.2f} s")
check("video codec", v["codec_name"] == "h264", f'{v["codec_name"]} {v.get("profile")} {v["pix_fmt"]}')
check("audio", len(a) == 1 and a[0]["codec_name"] == "aac", f'{a[0]["codec_name"]} {a[0]["sample_rate"]} Hz {a[0]["channels"]} ch' if a else "missing")
dec = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"], capture_output=True, text=True)
check("integrity (full decode)", dec.returncode == 0 and not dec.stderr.strip(), "no decode errors" if not dec.stderr.strip() else dec.stderr[:300])
loud = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = [l for l in loud.splitlines() if l.strip().startswith("I:")][-1].split()[1]
pk = [l for l in loud.splitlines() if l.strip().startswith("Peak:")][-1].split()[1]
print(f"  [info] loudness {I} LUFS, true peak {pk} dBFS, size {int(p['format']['size']) / 1e6:.0f} MB")
print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED"); sys.exit(0 if ok else 1)
