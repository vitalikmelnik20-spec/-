"""Music + SFX bed for "Ціни на заході України" (all generated locally, no samples, NO narration -
the author records the voice himself). 112 BPM, energetic: tense minor groove under the rent and
grocery numbers, a bright major lift for "але є і плюси", stop-time before the comment prompt.
SFX land on the picture events (number slams, stamps, ceiling crack, cart, pops).
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
BPM = 112; BEAT = 60 / BPM; BAR = 4 * BEAT


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
ORDER = ["hook", "lviv", "uzh", "frank", "shop", "plus", "cta"]
def section(t):
    for k in reversed(ORDER):
        if t >= CUT[k]: return k

mus, drm, bass, sfx = S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
MINOR = [("Am", [57, 60, 64, 67], 45), ("F", [53, 57, 60, 64], 41), ("C", [55, 60, 64, 67], 48), ("G", [55, 59, 62, 67], 43)]
MAJOR = [("C", [55, 60, 64, 67], 48), ("G", [55, 59, 62, 67], 43), ("Am", [57, 60, 64, 69], 45), ("F", [53, 57, 60, 65], 41)]
LEVEL = {"hook": 0.6, "lviv": 0.9, "uzh": 0.95, "frank": 0.9, "shop": 0.85, "plus": 0.8, "cta": 0.6}
STOP = B("cta", 1) - 0.1
nbars = int(np.ceil(DUR / BAR)) + 1
for bar in range(nbars):
    t0 = bar * BAR
    if t0 >= DUR: break
    sec = section(t0 + 0.01)
    name, ch, root = (MAJOR if sec == "plus" else MINOR)[bar % 4]
    mus.add(S.pad_chord(ch, BAR * 1.05), t0, gain=0.38)
    for b in range(16):
        tb = t0 + b * BEAT / 4
        if tb >= DUR - 0.5: break
        sec = section(tb); I = LEVEL[sec]
        if B("hook", 2) - 0.2 <= tb < CUT["lviv"] - 0.3 and b % 4: continue    # half-time tension before the first city
        if STOP <= tb < STOP + 0.6: continue
        if b % 4 == 0: drm.add(soft_kick(), tb, gain=0.9 * I + 0.1); kicks.append(tb)
        if b in (4, 12) and I >= 0.8: drm.add(S.clap(), tb, gain=0.4)
        drm.add(shaker(), tb, gain=(0.9 if b % 2 else 0.5) * I, pan=0.35)
        if b % 2 == 0: bass.add(pulse_bass(root - 12, BEAT * 0.45), tb, gain=0.6 * I)
        if b % 4 == 2: mus.add(keys([ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12][(b // 4) % 4], 0.45, 2600), tb, gain=0.5 * I, pan=-0.3 if (b // 4) % 2 else 0.3)
        if sec == "plus" and b % 4 == 0: mus.add(glass(ch[-1] + 12 + [0, 7, 5, 3][(b // 4) % 4], 1.0), tb, gain=0.7)

def ticks(t0, t1, n=16, g=0.4, pan=0.0):
    for k in range(n):
        u = k / n; sfx.add(tick(1 + 0.4 * u), t0 + (1 - (1 - u) ** 0.6) * (t1 - t0), gain=g, pan=pan)

# hook: impact, map pins, number tiles, ceiling crash
sfx.add(S.impact(1.4, 36), 0.0, gain=0.8); sfx.add(S.whoosh(0.6, 250, 6500, 0.3), 0.0, gain=0.7)
for k, fr in enumerate((34, 42, 50)): sfx.add(pop(700 + 120 * k), F(fr), gain=0.5, pan=(k - 1) * 0.4)
for k in range(4): sfx.add(stamp(), B("hook", 1) + F(4 + k * 5), gain=0.4, pan=(k % 2 - 0.5) * 0.6)
sfx.add(S.riser(0.5, 300, 6000), B("hook", 2), gain=0.3)
hit = B("hook", 2) + F(14)
sfx.add(S.impact(1.8, 34), hit, gain=1.0)
for k in range(8): sfx.add(filt(noise(0.12), "bp", (1500, 7000)) * np.exp(-tt(0.12) * 30) * 0.5, hit + 0.02 + k * 0.035, gain=0.6, pan=(k % 3 - 1) * 0.5)
# cities: whoosh in, plan drawing (paper), furniture pops, price slams
for k in ("lviv", "uzh", "frank"):
    c = CUT[k]
    sfx.add(S.whoosh(0.5, 300, 7000, 0.55), c - 0.2, gain=0.7)
    sfx.add(S.impact(0.9, 46), c + F(4), gain=0.45)
    sfx.add(paper(0.6), c + F(10), gain=0.6)
    for j in range(6): sfx.add(pop(520 + 60 * j), c + F(16 + 2 * j), gain=0.22, pan=(j % 3 - 1) * 0.4)
ticks(W("lviv", "25") - 0.2, W("lviv", "25") + F(8)); sfx.add(S.impact(1.0, 42), W("lviv", "25") + F(8), gain=0.6); sfx.add(pop(900), W("lviv", "25") + F(14), gain=0.5)
sfx.add(stamp(), W("uzh", "рекорди"), gain=0.7); sfx.add(chime(1568, 2093), W("uzh", "рекорди") + 0.1, gain=0.5)
ticks(W("uzh", "36") - 0.27, W("uzh", "36") + F(10)); sfx.add(S.impact(1.1, 40), W("uzh", "36") + F(10), gain=0.6)
ticks(W("frank", "22") - 0.27, W("frank", "22") + F(10)); sfx.add(S.impact(0.9, 44), W("frank", "22") + F(10), gain=0.5)
# shop: cart roll, egg slam, rows
c = CUT["shop"]; sfx.add(S.whoosh(0.5, 300, 7000, 0.55), c - 0.2, gain=0.7)
roll = filt(noise(0.8), "bp", (200, 2500)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 18 * tt(0.8)))) * np.sin(np.pi * tt(0.8) / 0.8) * 0.35
sfx.add(roll, c, gain=1.0)
sfx.add(pop(600), B("shop", 1) - F(2), gain=0.5)
e = W("shop", "44"); sfx.add(S.riser(0.6, 400, 7000), e - 0.6, gain=0.3); sfx.add(S.impact(1.3, 38), e, gain=0.85)
for at in (B("shop", 2) - F(4), B("shop", 2) + F(6), B("shop", 3) + F(10), B("shop", 3) + F(18)): sfx.add(S.whoosh(0.3, 600, 6000, 0.6), at, gain=0.4); sfx.add(pop(800), at + F(6), gain=0.4)
# plus: bright chime, green drops, borscht splash
c = CUT["plus"]; sfx.add(S.whoosh(0.5, 300, 7000, 0.55), c - 0.2, gain=0.7); sfx.add(chime(1318.5, 1975.5), c + F(4), gain=0.6)
for at in (W("plus", "6%"), W("plus", "2%")): sfx.add(downlifter(0.6), at - 0.1, gain=0.4); sfx.add(chime(1760, 1318.5), at + 0.05, gain=0.45)
b3 = B("plus", 3)
for i in range(3): sfx.add(pop(400 - 40 * i), b3 + F(14 + i * 4), gain=0.6); sfx.add(filt(noise(0.25), "lowpass", 1800) * np.exp(-tt(0.25) * 14) * 0.5, b3 + F(16 + i * 4), gain=0.6)
# cta
c = CUT["cta"]; sfx.add(S.whoosh(0.6, 300, 7000, 0.55), c - 0.2, gain=0.7); sfx.add(pop(820), c + F(4), gain=0.5)
b1 = B("cta", 1)
for k in range(22): sfx.add(tick(1.6 + 0.2 * (k % 3)) * 0.6, b1 + F(6) + k * F(34) / 22, gain=0.35)     # typing
sfx.add(chime(1318.5, 1975.5), b1 + F(10), gain=0.5)
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
