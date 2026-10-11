"""Music + SFX bed for "Halloween costumes 2026" (all generated locally, no samples, NO narration -
the author records the voice himself). 108 BPM spooky-pop: minor groove with a wobbly theremin lead,
a creepy breakdown for "the scary part", stop-time before "Comment below". SFX land on picture events
(price-tag drops, card whooshes, balloon squeak, ghost, receipt).
    python3 src/soundtrack.py build/   -> build/music.wav, build/sfx.wav, build/bed.wav (music+sfx)
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "audio"))
import soundtrack as S  # shared synth toolkit (Lviv / Chicago shorts)

TL = json.load(open("src/timeline.json"))
CUT = TL["cuts"]
DUR = TL["frames"] / 30
S.DUR = DUR; S.N = int(S.SR * DUR)
SR, N = S.SR, S.N
tt, filt, midi = S.tt, S.filt, S.midi
rng = np.random.default_rng(7)
BPM = 108; BEAT = 60 / BPM; BAR = 4 * BEAT


def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=0.005, r=0.05):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)


# ---------------- instruments ----------------
def pulse_bass(m, d):
    t = tt(d); x = np.sin(2 * np.pi * midi(m) * t) + 0.35 * np.sin(2 * np.pi * midi(m) * 2 * t) + 0.12 * S.saw(midi(m), t)
    return filt(np.tanh(x * 1.4), "lowpass", 900) * env(d, 0.004, 0.06) * np.exp(-t * 3.5) * 0.4
def soft_kick(): return S.kick(0.8) * 0.8
def shaker(g=1.0):
    t = tt(0.07); return filt(noise(0.07), "bp", (5000, 12000)) * np.sin(np.pi * t / 0.07) ** 2 * 0.12 * g
def keys(m, d, bright=2400):
    t = tt(d); x = sum(np.sin(2 * np.pi * midi(m) * h * t) * a * np.exp(-t * (1.8 + h)) for h, a in [(1, 1), (2, 0.4), (3, 0.15), (4, 0.06)])
    return filt(x, "lowpass", bright) * env(d, 0.003, 0.25) * 0.12
def glass(m, d=1.6):  # bell-like mallet for the bright "perk" section
    t = tt(d); return sum(a * np.sin(2 * np.pi * midi(m) * r * t) * np.exp(-t * k) for r, a, k in [(1, 1, 2.5), (2.01, 0.3, 4), (3.9, 0.12, 7)]) * 0.07


# ---------------- sfx ----------------
def tick(p=1.0):
    t = tt(0.03); return (np.sin(2 * np.pi * 2600 * p * t) * np.exp(-t * 240) + filt(noise(0.03), "highpass", 5000) * np.exp(-t * 400) * 0.4) * 0.22
def pop(f0=700):
    t = tt(0.12); f = f0 * np.exp(-t * 10); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.3
def chime(f=1318.5, f2=1975.5):
    a = np.sin(2 * np.pi * f * tt(0.12)) * np.exp(-tt(0.12) * 16); b = np.sin(2 * np.pi * f2 * tt(0.5)) * np.exp(-tt(0.5) * 7)
    x = np.zeros(int(0.62 * SR)); x[:len(a)] += a; x[int(0.1 * SR):int(0.1 * SR) + len(b)] += b; return x * 0.12
def paper(d=0.35):
    t = tt(d); return filt(noise(d), "bp", (1500, 9000)) * np.sin(np.pi * t / d) ** 2 * 0.16
def stamp():
    t = tt(0.25); return (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 30) * 0.6 + filt(noise(0.25), "bp", (300, 2500)) * np.exp(-t * 45) * 0.4)
def bus_air(d=0.9):  # door "pssh" + short engine hum
    t = tt(d); h = filt(noise(d), "bp", (2000, 8000)) * np.exp(-t * 6) * 0.25
    e = filt(np.tanh(S.saw(55, t) * 2), "lowpass", 400) * np.sin(np.pi * t / d) * 0.12
    return h + e
def ticket_tear():
    t = tt(0.22); return filt(noise(0.22), "bp", (2500, 9000)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 60 * t))) * np.exp(-t * 9) * 0.25
def downlifter(d=1.0):
    t = tt(d); f = 900 * np.exp(-t * 3) + 60
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + filt(noise(d), "lowpass", 3000) * 0.3) * np.exp(-t * 2.5) * 0.5



def W(key, prefix):
    for b in TL["scenes"][key]["beats"]:
        for x in b["words"]:
            if x["w"].lower().startswith(prefix.lower()): return x["t"]
    raise KeyError(prefix)
B = lambda key, i: TL["scenes"][key]["beats"][i]["t"]
F = lambda fr: fr / 30
ORDER = ["hook", "trend", "kpop", "penny", "wed", "mario", "dolly", "scary", "cta"]
def section(t):
    for k in reversed(ORDER):
        if t >= CUT[k]: return k

def theremin(m, d):
    t = tt(d); f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t)) * (1 + 0.04 * np.exp(-t * 8))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.08, 0.2) * 0.12
mus, drm, bass, sfx = S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
PROG = [("Dm", [50, 57, 62, 65], 38), ("Bb", [46, 53, 58, 62], 34), ("Gm", [43, 50, 55, 58], 31), ("A", [45, 52, 57, 61], 33)]
LEVEL = {"hook": 0.7, "trend": 0.85, "kpop": 0.95, "penny": 0.9, "wed": 0.95, "mario": 0.95, "dolly": 0.95, "scary": 0.5, "cta": 0.7}
LEAD = [74, 77, 76, 73, 74, 70, 69, 73]
STOP = B("cta", 1) - 0.1
nbars = int(np.ceil(DUR / BAR)) + 1
for bar in range(nbars):
    t0 = bar * BAR
    if t0 >= DUR: break
    sec = section(t0 + 0.01)
    name, ch, root = PROG[bar % 4]
    mus.add(S.pad_chord(ch, BAR * 1.05), t0, gain=0.34 + (0.2 if sec == "scary" else 0))
    if sec in ("hook", "trend", "scary", "cta"):
        for j in range(2): mus.add(theremin(LEAD[(bar * 2 + j) % 8], BAR / 2 * 0.95), t0 + j * BAR / 2, gain=0.9)
    for b in range(16):
        tb = t0 + b * BEAT / 4
        if tb >= DUR - 0.5: break
        sec = section(tb); I = LEVEL[sec]
        if STOP <= tb < STOP + 0.6: continue
        if b % 4 == 0 and (sec != "scary" or b == 0): drm.add(soft_kick(), tb, gain=0.9 * I + 0.1); kicks.append(tb)
        if b in (4, 12) and I >= 0.8: drm.add(S.clap(), tb, gain=0.42)
        drm.add(shaker(), tb, gain=(0.9 if b % 2 else 0.5) * I, pan=0.35)
        if b % 2 == 0 and sec != "scary": bass.add(pulse_bass(root - 12 + (12 if b % 8 == 6 else 0), BEAT * 0.45), tb, gain=0.6 * I)
        if b % 4 == 2 and I >= 0.8: mus.add(keys([ch[1] + 12, ch[3] + 12, ch[2] + 12, ch[3] + 12][(b // 4) % 4], 0.4, 3000), tb, gain=0.45, pan=-0.3 if (b // 4) % 2 else 0.3)

def creak(d=0.9):
    t = tt(d); f = 180 + 60 * np.sin(2 * np.pi * 1.3 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 23 * t)))
    return filt(x, "bp", (300, 2500)) * env(d, 0.05, 0.3) * 0.12
def ghost(d=1.2):
    t = tt(d); f = 520 * (1 + 0.5 * np.sin(np.pi * t / d)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.18
def squeak(d=0.25):
    t = tt(d); f = 900 + 700 * np.sin(np.pi * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.01, 0.05) * 0.12

sfx.add(S.impact(1.4, 34), 0.0, gain=0.8); sfx.add(creak(1.0), 0.1, gain=0.8)
sfx.add(ghost(1.1), W("hook", "Halloween") - 0.2, gain=0.6); sfx.add(S.impact(1.0, 40), W("hook", "Halloween"), gain=0.5)
c = CUT["trend"]; sfx.add(S.whoosh(0.5, 300, 7000, 0.55), c - 0.2, gain=0.7)
for i in range(5): sfx.add(S.whoosh(0.3, 600, 6000, 0.6), c + F(6 + i * 6), gain=0.35, pan=(i - 2) * 0.35); sfx.add(pop(600 + i * 80), c + F(14 + i * 6), gain=0.3)
sfx.add(chime(1318.5, 1975.5), W("trend", "trending"), gain=0.5)
for k in ("kpop", "penny", "wed", "mario", "dolly"):
    c = CUT[k]; at = W(k, "$")
    sfx.add(S.whoosh(0.55, 300, 7500, 0.55), c - 0.2, gain=0.7)
    sfx.add(S.impact(0.8, 46), c + F(10), gain=0.4)
    sfx.add(S.whoosh(0.35, 2500, 500, 0.5), at - F(10), gain=0.35)          # tag drops in
    for j in range(10): sfx.add(tick(1.2 + 0.05 * j), at - F(8) + j * F(12) / 10, gain=0.3)
    sfx.add(S.impact(1.0, 42), at + F(4), gain=0.6); sfx.add(chime(1568, 2093), at + F(6), gain=0.35)
sfx.add(squeak(), CUT["penny"] + 0.6, gain=0.6)
sfx.add(S.riser(0.9, 150, 3000), B("penny", 0), gain=0.3); sfx.add(ghost(1.0), B("penny", 0) + 0.1, gain=0.5)
c = CUT["scary"]; sfx.add(S.impact(2.0, 30), c, gain=0.9); sfx.add(creak(1.2), c + 0.2, gain=0.9)
for j in range(6): sfx.add(filt(noise(0.06), "bp", (2000, 9000)) * np.exp(-tt(0.06) * 60) * 0.5, c + j * 0.05, gain=0.5, pan=(j % 3 - 1) * 0.5)
b1 = B("scary", 1); sfx.add(paper(0.6), b1 - 0.1, gain=0.8)
for at in (b1 + F(4), W("scary", "makeup"), W("scary", "accessories")): sfx.add(stamp(), at, gain=0.45); sfx.add(pop(700), at + 0.05, gain=0.35)
sfx.add(ghost(1.2), W("scary", "more"), gain=0.7)
sfx.add(S.impact(1.2, 38), W("scary", "accessories") + F(10), gain=0.6)
c = CUT["cta"]; sfx.add(S.whoosh(0.6, 300, 7000, 0.55), c - 0.2, gain=0.7)
for i in range(5): sfx.add(pop(560 + i * 90), c + F(6 + i * 4), gain=0.4, pan=(i - 2) * 0.3)
sfx.add(chime(1318.5, 1975.5), B("cta", 1), gain=0.5)
sfx.add(S.whoosh(0.8, 2500, 300, 0.4), DUR - 0.9, gain=0.35)

# ---------------- mix: two stems + bed (no voice: leave headroom for the author's narration) ----------------
side = S.sidechain(kicks, depth=0.3)[:, None]
room = S.reverb_ir(1.6, 6000, 5)
music = mus.x * side + bass.x * side + drm.x * 0.75 + S.convolve_st(mus.x * 0.5, room) * 0.3
music = S.filt(music.T, "highpass", 35).T
fx = sfx.x + S.convolve_st(sfx.x, S.reverb_ir(0.9, 7000, 4)) * 0.15
t = np.arange(N) / SR; env_ = np.minimum(1, t / 0.01)[:, None] * np.clip((DUR - 0.03 - t) / 0.6, 0, 1)[:, None]
music, fx = music * env_, fx * env_
bed = music * 0.75 + fx * 0.7
pk = np.abs(bed).max()
out = sys.argv[1] if len(sys.argv) > 1 else "build/"
os.makedirs(out, exist_ok=True)
for name, x in (("music", music * 0.75), ("sfx", fx * 0.7), ("bed", bed)):
    wavfile.write(os.path.join(out, f"{name}.wav"), SR, (np.clip(x / pk * 0.89, -1, 1) * 32767).astype(np.int16))
print("written music/sfx/bed", f"{DUR:.2f}s")
