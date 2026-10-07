"""Music + SFX + ambience + voice mix for "Chicago — the real cost of living" (40 s).
    python3 src/soundtrack.py render/audio/mix.wav
Original synthesised urban/electronic track at 112 BPM (no samples, no lyrics) that builds toward
the total reveal, drops at the payoff and returns on the cinematic hit. Every SFX is placed on
the scene cuts / voice cues from src/timeline.json. Voice is kept >= ~10 dB above the bed.
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "audio"))
import soundtrack as S  # shared synth toolkit from the Lviv short

DUR = 40.0
S.DUR = DUR; S.N = int(S.SR * DUR)
SR, N = S.SR, S.N
tt, filt, midi = S.tt, S.filt, S.midi
rng = np.random.default_rng(11)
TL = json.load(open("src/timeline.json"))
SC, CUE, VO = TL["scenes"], TL["cues"], TL["voice"]
BPM = 112; BEAT = 60 / BPM; BAR = 4 * BEAT


def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=0.005, r=0.05):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def fade(x, a=0.3, r=0.5):
    n = len(x); t = np.arange(n) / SR; return x * np.minimum(1, t / a) * np.clip((n / SR - t) / r, 0, 1)


# ---------------- instruments ----------------
def sub808(m, d, glide_from=None):
    t = tt(d); f0 = midi(m); f = f0 if glide_from is None else midi(glide_from) + (f0 - midi(glide_from)) * np.minimum(1, t / 0.06)
    x = np.sin(2 * np.pi * np.cumsum(np.full(len(t), f) if np.isscalar(f) else f) / SR)
    return np.tanh(x * 1.8) * env(d, 0.004, 0.08) * np.exp(-t * 1.2) * 0.55
def pluck2(m, d=0.3, bright=4200):
    return S.pluck(m, d, bright)
def stab(ms, d):
    t = tt(d); x = sum(S.saw(midi(m), t) + S.saw(midi(m) * 1.007, t, 0.3) for m in ms)
    x = S.sweep_filter(x, lambda s: 400 + 4200 * np.exp(-s * 6)); return x * env(d, 0.005, 0.1) * 0.08 / len(ms)
def hat(open_=False, g=1.0): return S.hat(open_) * g
def snare():
    t = tt(0.3); return (filt(noise(0.3), "bp", (1200, 8000)) * np.exp(-t * 18) * 0.55 + np.sin(2 * np.pi * 200 * t) * np.exp(-t * 25) * 0.4) * 0.7


# ---------------- sfx ----------------
def bell(f0, d=1.2, a=0.25):
    t = tt(d); return sum(g * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * k) for r, g, k in [(1, 1, 3), (1.5, 0.45, 4), (2.76, 0.3, 6), (4.1, 0.1, 9)]) * a
def coins(n=7, d=0.6):
    x = np.zeros(int(d * SR) + SR // 2)
    for k in range(n):
        c = bell(3800 + 1600 * rng.random(), 0.3, 0.05) + np.concatenate([filt(noise(0.04), "bp", (4000, 10000)) * np.exp(-tt(0.04) * 90) * 0.2, np.zeros(int(0.26 * SR))])
        i = int(k * d / n * SR + rng.random() * 0.02 * SR); x[i:i + len(c)] += c[:len(x) - i]
    return x
def chaching():
    x = np.zeros(int(1.6 * SR))
    th = (np.sin(2 * np.pi * 90 * tt(0.15)) * np.exp(-tt(0.15) * 30) + filt(noise(0.15), "lowpass", 2000) * np.exp(-tt(0.15) * 40) * 0.5) * 0.5
    x[:len(th)] += th                                  # drawer "cha"
    b = bell(2300, 1.4, 0.3); i = int(0.09 * SR); x[i:i + len(b)] += b[:len(x) - i]   # bell "ching"
    c = coins(6, 0.4); i = int(0.12 * SR); x[i:i + len(c)] += c[:len(x) - i] * 0.8
    return x
def tick(p=1.0):
    t = tt(0.03); return (np.sin(2 * np.pi * 3000 * p * t) * np.exp(-t * 220) + filt(noise(0.03), "highpass", 5000) * np.exp(-t * 400) * 0.5) * 0.3
def click():
    t = tt(0.04); return (filt(noise(0.04), "bp", (1500, 6000)) * np.exp(-t * 260) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 150) * 0.4) * 0.35
def notif(f1=1318.5, f2=1760, d=0.11):
    a = np.sin(2 * np.pi * f1 * tt(d)) * np.exp(-tt(d) * 18); b = np.sin(2 * np.pi * f2 * tt(0.35)) * np.exp(-tt(0.35) * 9)
    x = np.zeros(int((d + 0.35) * SR)); x[:len(a)] += a; x[int(d * SR):int(d * SR) + len(b)] += b; return x * 0.14
def beep_pay():
    x = np.zeros(int(0.5 * SR)); a = np.sin(2 * np.pi * 2093 * tt(0.09)) * env(0.09, 0.003, 0.02); b = np.sin(2 * np.pi * 2637 * tt(0.2)) * env(0.2, 0.003, 0.08)
    x[:len(a)] += a; i = int(0.11 * SR); x[i:i + len(b)] += b; return x * 0.16
def blip(f):
    return np.sin(2 * np.pi * f * tt(0.035)) * env(0.035, 0.002, 0.01) * 0.08
def pop(f0=700):
    t = tt(0.12); f = f0 * np.exp(-t * 10); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * 0.3
def paper(d=0.35):
    t = tt(d); return filt(noise(d), "bp", (1500, 9000)) * np.sin(np.pi * t / d) ** 2 * 0.18
def plate_hit():
    t = tt(0.8); return (bell(1900, 0.8, 0.12) + bell(3100, 0.8, 0.05)[:len(t)] + np.sin(2 * np.pi * 120 * t) * np.exp(-t * 20) * 0.3) * 1.0
def cup_clink(): return bell(2600, 0.6, 0.1) + bell(4100, 0.6, 0.04)
def hiss(d):
    t = tt(d); return filt(noise(d), "bp", (2500, 9000)) * np.minimum(1, t / 0.05) * np.clip((d - t) / 0.2, 0, 1) * (0.7 + 0.3 * np.sin(2 * np.pi * 13 * t)) * 0.12
def downlifter(d=1.0):
    t = tt(d); f = 900 * np.exp(-t * 3) + 60
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + filt(noise(d), "lowpass", 3000) * 0.3) * np.exp(-t * 2.5) * 0.5
def train_pass(d, pan_dir=1):
    t = tt(d); u = t / d
    rumble = filt(noise(d), "lowpass", 260) * 1.2 + filt(noise(d), "bp", (300, 1500)) * 0.4
    x = rumble * np.sin(np.pi * u) ** 1.5
    for k in range(int(d * 7)):  # wheel clacks over rail joints
        c = (np.sin(2 * np.pi * 180 * tt(0.05)) * np.exp(-tt(0.05) * 60) + filt(noise(0.05), "bp", (800, 4000)) * np.exp(-tt(0.05) * 80) * 0.5)
        i = int(k / 7 * SR); x[i:i + len(c)] += c[:len(x) - i] * 0.6 * np.sin(np.pi * min(1, i / len(x)))
    x = S.sweep_filter(x, lambda s: 900 + 3500 * np.sin(np.pi * min(1, s / d)))
    st = np.stack([x * (1 - 0.6 * u * pan_dir if pan_dir > 0 else 0.4 + 0.6 * u), x * (0.4 + 0.6 * u if pan_dir > 0 else 1 - 0.6 * u)], 1)
    return st * 0.35
# ambiences
def babble(d, lo=300, hi=2600, n=6):
    x = np.zeros(int(d * SR))
    for k in range(n):
        e = np.abs(filt(noise(d), "lowpass", 4)) ; e = e / (e.max() + 1e-9)
        x += filt(noise(d), "bp", (lo + 100 * k, hi - 150 * k)) * e
    return fade(x / n * 0.25, 0.25, 0.3)
def city(d):
    x = filt(noise(d), "lowpass", 500) * 0.3 + filt(noise(d), "bp", (500, 2500)) * 0.06
    for k in range(int(d / 1.4)):  # distant car passes + an occasional horn
        cp = filt(noise(2.0), "bp", (200, 1800)) * np.sin(np.pi * tt(2.0) / 2.0) ** 2 * 0.25
        i = int(rng.random() * max(1, (d - 2.0)) * SR); x[i:i + len(cp)] += cp[:len(x) - i]
    if d > 3:
        h = (np.sign(np.sin(2 * np.pi * 415 * tt(0.35))) + np.sign(np.sin(2 * np.pi * 523 * tt(0.35)))) * env(0.35, 0.02, 0.1) * 0.02
        i = int(d * 0.6 * SR); x[i:i + len(h)] += filt(h, "lowpass", 2500)[:len(x) - i]
    return fade(x, 0.3, 0.4)
def store(d):
    x = (np.sin(2 * np.pi * 120 * tt(d)) * 0.02 + filt(noise(d), "lowpass", 900) * 0.1) + babble(d, 400, 2400, 4) * 0.6
    for k in range(4):  # checkout scanner beeps in the distance
        b = np.sin(2 * np.pi * 2900 * tt(0.08)) * env(0.08, 0.002, 0.02) * 0.03; i = int((0.6 + k * 1.1) * SR); x[i:i + len(b)] += b
    return fade(x, 0.2, 0.3)


# ---------------- music ----------------
mus, drm, bass, sfx, amb = S.Bus(), S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
PROG = [("Am", [57, 60, 64, 67], 33), ("F", [53, 57, 60, 64], 29), ("C", [55, 60, 64, 67], 36), ("G", [55, 59, 62, 67], 31)]  # i-VI-III-VII, minor 7 colours
DROP_A, DROP_B = SC["payoff"], SC["payoff"] + 0.9          # music drops out, returns on the hit
REVEAL = CUE["total.price"]
def intensity(t):  # 0..1 build curve: hook 0.35 → groove → full before the reveal; breakdown at the payoff
    if DROP_A <= t < DROP_B: return 0.0
    if t < SC["rent"]: return 0.35
    if t < SC["eat"]: return 0.55
    if t < SC["util"]: return 0.7
    if t < SC["total"]: return 0.8
    if t < REVEAL: return 0.9
    if t < DROP_A: return 1.0
    if t < SC["cta"]: return 0.95
    return 0.7
nbars = int(np.ceil(DUR / BAR))
for bar in range(nbars):
    t0 = bar * BAR; name, ch, root = PROG[bar % 4]
    mus.add(S.pad_chord(ch, BAR * 1.05), t0, gain=0.55)
    for b in range(16):  # sixteenth grid
        tb = t0 + b * BEAT / 4
        if tb >= DUR - 0.25: break
        I = intensity(tb)
        if I == 0: continue
        if b % 4 == 0 and I >= 0.5: drm.add(S.kick(), tb, gain=0.85); kicks.append(tb)
        if b in (4, 12) and I >= 0.7: drm.add(S.clap(), tb, gain=0.5); drm.add(snare(), tb, gain=0.25)
        if I >= 0.5: drm.add(hat(False), tb, gain=(0.22 if b % 2 == 0 else 0.1) * I, pan=0.3)
        if b == 14 and I >= 0.8 and bar % 2: drm.add(hat(True), tb, gain=0.18, pan=-0.3)
        if I >= 0.55 and b in (0, 3, 6, 10):  # 808 pattern
            bass.add(sub808(root, BEAT * 0.9, root + 12 if b == 10 else None), tb, gain=0.75)
        if I >= 0.7 and b % 2 == 0:            # plucked arp
            arp = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[3] + 12]
            mus.add(pluck2(arp[(b // 2) % 4], 0.22, 2600 + 2400 * I), tb, gain=0.16 * I, pan=-0.4 if b % 4 else 0.4)
    if intensity(t0) >= 0.9: mus.add(stab(ch, BEAT * 0.5), t0 + BEAT * 1.5, gain=0.8)
# hook: whoosh + subtle bass impact, risers into the reveal, the payoff hit
sfx.add(S.whoosh(0.7, 300, 6000, 0.35), 0.0, gain=0.9); sfx.add(S.impact(1.2, 38), 0.05, gain=0.55)
sfx.add(S.riser(2.8, 200, 7000), SC["rent"] - 2.8, gain=0.25)
sfx.add(S.riser(REVEAL - SC["total"] - 0.2, 180, 9000), SC["total"] + 0.2, gain=0.55)
sfx.add(S.impact(2.2, 34), REVEAL, gain=1.0); drm.add(S.hat(True) * 2, REVEAL, gain=0.4)
sfx.add(downlifter(0.9), DROP_A, gain=0.7)
mus.add(S.pad_chord([45, 52, 57, 60], 1.0) * 0.5, DROP_A, gain=0.5)  # filtered breath in the breakdown
sfx.add(S.impact(2.6, 32), DROP_B, gain=1.1); drm.add(S.hat(True) * 2.5, DROP_B, gain=0.45); mus.add(stab([57, 60, 64, 69], 0.6), DROP_B, gain=1.4)

# ---------------- scene SFX ----------------
for k in ("rent", "food", "eat", "transit", "util", "cta"):
    sfx.add(S.whoosh(0.45, 350, 7000, 0.55), SC[k] - 0.2, gain=0.8)
sfx.add(S.whoosh(0.7, 200, 9000, 0.7), SC["total"] - 0.35, gain=0.9)            # zoom whip
for i in range(8): sfx.add(coins(2, 0.1), 0.9 + i * 0.12, gain=0.5, pan=(i - 3.5) / 4)  # money burst
for i in range(4): sfx.add(S.whoosh(0.35, 800, 6000, 0.5), 1.4 + i * 0.28, gain=0.25, pan=(-1) ** i * 0.5)
# rent: facade swings open, counter ticks, cha-ching on the number
sfx.add(S.whoosh(0.5, 300, 3000, 0.5), SC["rent"] + 0.65, gain=0.5); sfx.add(pop(400), SC["rent"] + 1.2, gain=0.6)
tr = CUE["rent.price"] + 0.2
for k in range(36):
    u = (k / 36); tk = SC["rent"] + 1.2 + (1 - (1 - u) ** 0.5) * (tr - SC["rent"] - 1.25)
    sfx.add(tick(1 + 0.3 * u), tk, gain=0.5, pan=0.2)
sfx.add(chaching(), tr, gain=0.9, pan=0.15); sfx.add(S.impact(0.9, 46), tr, gain=0.5)
sfx.add(notif(), CUE["rent.price"] + 0.65, gain=0.6)
# groceries: store ambience, cart, item pops, coin on the price
amb.add(store(SC["eat"] - SC["food"]), SC["food"], gain=0.9)
cart_roll = filt(noise(0.9), "bp", (200, 2500)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 18 * tt(0.9)))) * env(0.9, 0.05, 0.3) * 0.25
sfx.add(cart_roll, SC["food"] + 0.02, gain=1.0, pan=-0.3)
for i in range(7): sfx.add(pop(600 + 70 * i), SC["food"] + 0.55 + i * 0.36 + 0.45, gain=0.7, pan=(-1) ** i * 0.3)
tf_ = CUE["food.price"] + 0.2
for k in range(14): sfx.add(tick(1.1), CUE["food.price"] - 0.75 + k * 0.065, gain=0.4)
sfx.add(coins(7, 0.5), tf_, gain=0.8); sfx.add(S.impact(0.7, 50), tf_, gain=0.35)
# eating out: restaurant then coffee-shop ambience, plate, espresso hiss, coins
amb.add(babble(3.0, 250, 2400, 7), SC["eat"], gain=1.0)
for k in range(5): sfx.add(bell(3200 + 500 * rng.random(), 0.25, 0.03), SC["eat"] + 0.3 + k * 0.5, gain=0.6, pan=rng.random() - 0.5)  # cutlery
sfx.add(plate_hit(), SC["eat"] + 0.62, gain=0.8)
mc, cc = CUE["eat.meal"] + 0.15, CUE["eat.coffee"] + 0.15
sfx.add(coins(5, 0.35), mc, gain=0.7); sfx.add(S.impact(0.6, 52), mc, gain=0.3)
amb.add(babble(SC["transit"] - (SC["eat"] + 2.6), 300, 2800, 6) * 0.9, SC["eat"] + 2.6, gain=1.0)
sfx.add(hiss(0.9), SC["eat"] + 2.5, gain=1.0)                      # espresso machine
sfx.add(S.whoosh(0.5, 600, 5000, 0.4), SC["eat"] + 2.7, gain=0.5)  # cup spins in
sfx.add(cup_clink(), SC["eat"] + 3.35, gain=0.8)
sfx.add(coins(4, 0.3), cc, gain=0.7)
# transit: city ambience, L train pass, scrambling digits, tap-to-pay beep
amb.add(city(5.2), SC["transit"] - 0.1, gain=1.0)
sfx.add(train_pass(2.2, 1), SC["transit"] + 0.0, gain=1.0)
sfx.add(train_pass(2.8, -1) * 0.5, SC["transit"] + 2.5, gain=0.9)
tp = CUE["transit.price"]
for k in range(12): sfx.add(blip(1500 + 120 * (k % 5)), tp - 0.4 + k * 0.045, gain=0.8)
sfx.add(beep_pay(), tp - 0.12, gain=0.9); sfx.add(coins(3, 0.2), tp + 0.15, gain=0.6); sfx.add(S.impact(0.5, 55), tp + 0.15, gain=0.3)
# utilities: icon notifications, bills sliding in, ping on the total
for i in range(5): sfx.add(notif(1046.5 + 90 * i, 1568 + 90 * i, 0.07) * 0.6, SC["util"] + 0.2 + i * 0.16 + 0.2, gain=0.8, pan=(i - 2) / 3)
c1, c2 = CUE["util.price"], CUE["util.internet"]
for c in (c1, c2): sfx.add(paper(0.35), c - 0.25, gain=1.0); sfx.add(S.impact(0.4, 60), c + 0.15, gain=0.25); sfx.add(coins(3, 0.2), c + 0.15, gain=0.5)
sfx.add(notif(1568, 2093), c2 + 0.6, gain=0.7)
# total: cards whoosh in, calculator clicks accelerate, big impact + cha-ching on the reveal
for i in range(5): sfx.add(S.whoosh(0.35, 500, 6000, 0.6), SC["total"] + 0.25 + i * 0.42, gain=0.45, pan=(-1) ** i * 0.4)
for i in range(5): sfx.add(click(), SC["total"] + 0.65 + i * 0.42, gain=0.9)
tc = SC["total"] + 2.4
while tc < REVEAL - 0.05:
    sfx.add(click(), tc, gain=0.7, pan=0.1); tc += max(0.045, 0.16 * (REVEAL - tc) / (REVEAL - SC["total"] - 2.4) + 0.04)
sfx.add(chaching(), REVEAL + 0.02, gain=1.0)
# payoff chips + CTA
for w in ("healthcare", "insurance", "taxes", "entertainment"):
    line = TL["lines"]["payoff"]; i = line.lower().index(w); tw = VO["payoff"] + TL["durs"]["payoff"] * i / len(line)
    sfx.add(pop(500), tw, gain=0.5)
amb.add(city(3.0) * 0.6, SC["payoff"] + 0.1, gain=1.0)
sfx.add(notif(1318.5, 1975.5), SC["cta"] + 0.28, gain=0.9)                         # comment notification
sfx.add(pop(800), SC["cta"] + 0.5, gain=0.6); sfx.add(pop(650), SC["cta"] + 0.62, gain=0.6)
sfx.add(S.whoosh(0.8, 2500, 300, 0.4), 39.05, gain=0.45)                             # final soft whoosh

# ---------------- voice ----------------
voice = np.zeros(N)
for key, t0 in VO.items():
    sr, x = wavfile.read(f"assets/voice/{key}.wav"); x = x.astype(np.float64) / 32768
    x = signal.resample_poly(x, SR, sr)
    x = filt(x, "highpass", 85)
    x = x + 0.22 * filt(x, "bp", (2800, 6500))               # presence / clarity
    e = np.sqrt(np.abs(signal.sosfilt(S.sos("lowpass", 12), x ** 2)) + 1e-9)   # gentle levelling compressor
    x = x * np.minimum(1, (0.12 / e) ** 0.35)
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    i = int(t0 * SR); n = min(len(x), N - i); voice[i:i + n] += x[:n]

# ---------------- mix ----------------
duck = np.clip(signal.sosfiltfilt(S.sos("lowpass", 3), np.abs(voice)) * 14, 0, 1)  # holds through a phrase
side = S.sidechain(kicks, depth=0.45)[:, None]
room = S.reverb_ir(1.6, 6500, 3)
music = mus.x * side + bass.x * side * 0.9 + drm.x * 0.75
music = music + S.convolve_st(mus.x * 0.5, room) * 0.3
music = S.filt(music.T, "highpass", 32).T
music *= (1 - 0.82 * duck)[:, None]
fx = (sfx.x + S.convolve_st(sfx.x, S.reverb_ir(0.9, 7000, 4)) * 0.15) * (1 - 0.6 * duck)[:, None]
am = amb.x * (1 - 0.4 * duck)[:, None]
vox = voice[:, None] * np.ones((1, 2))
bed = music * 0.36 + fx * 0.4 + am * 0.5
for nm, z in (("music", music), ("fx", fx), ("amb", am), ("voice", vox)):
    if not np.isfinite(z).all(): print("NaN in", nm)
act = duck > 0.5
db = lambda z: 10 * np.log10(np.mean(z[act] ** 2) + 1e-12)
print(f"voice/background during speech: {db(vox[:, 0]) - db(bed[:, 0]):+.1f} dB  (music {db(music[:, 0] * 0.36):.1f}, fx {db(fx[:, 0] * 0.4):.1f}, amb {db(am[:, 0] * 0.5):.1f}, voice {db(vox[:, 0]):.1f} dBFS)")
mix = bed + vox * 1.0
mix = np.tanh(mix / np.abs(mix).max() * 1.15) / np.tanh(1.15) * 0.85
t = np.arange(N) / SR; mix *= np.clip((DUR - 0.02 - t) / 0.35, 0, 1)[:, None]
out = sys.argv[1] if len(sys.argv) > 1 else "render/audio/mix.wav"
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("written", out)
