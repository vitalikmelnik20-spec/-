"""Music + sound design for the Wiesn 2026 intro, mixed under voice.mp3.
    python3 audio.py [voice.mp3] [out.wav]
Music: an original synthesised Bavarian oom-pah polka (tuba, accordion, clarinet, brass, snare)
at 132 BPM in F major; the toilet scene switches to a tense drone with accelerating ticks.
SFX are placed on the exact animation times from index.html. No samples are used.
"""
import os, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "audio"))
import soundtrack as S  # shared synth toolkit (kick, clap, hat, impact, whoosh, riser, pour, reverb, ...)

DUR = 20.0
S.DUR = DUR; S.N = int(S.SR * DUR)
SR, N = S.SR, S.N
tt, filt, midi = S.tt, S.filt, S.midi
rng = np.random.default_rng(7)


def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=0.005, rel=0.05):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, np.maximum(0, (d - t) / max(rel, 1e-4)))


# ---------------- instruments ----------------
def tuba(m, d):
    f, t = midi(m), tt(d)
    x = sum(h ** -1.3 * np.sin(2 * np.pi * f * h * t + h) for h in range(1, 8))
    x = filt(x, "lowpass", 700) * env(d, 0.025, 0.06) * (0.6 + 0.4 * np.exp(-t * 5))
    return np.tanh(x * 1.6) * 0.55
def accordion(ms, d):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        f = midi(m)
        x += S.saw(f * 1.004, t) + S.saw(f * 0.996, t, 0.3) + 0.5 * np.sign(np.sin(2 * np.pi * f * 2 * t))
    x = filt(x, "bp", (250, 3800)) * (1 + 0.18 * np.sin(2 * np.pi * 6.5 * t)) * env(d, 0.012, 0.05)
    return x * 0.06 / len(ms)
def clarinet(m, d):
    t = tt(d); f = midi(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * h) / h for h in (1, 3, 5, 7))
    return filt(x, "lowpass", 3200) * env(d, 0.02, 0.06) * 0.14
def brass(ms, d, bright=2600):
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        f = midi(m); x += S.saw(f, t) + S.saw(f * 1.006, t, 0.5)
    x = S.sweep_filter(x, lambda s: 600 + bright * min(1, s / 0.06) * (0.55 + 0.45 * np.exp(-s * 3)))
    return np.tanh(x * env(d, 0.03, 0.15) * 0.8) * 0.16 / np.sqrt(len(ms))
def snare():
    t = tt(0.25)
    return (filt(noise(0.25), "bp", (1500, 7000)) * np.exp(-t * 22) * 0.5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4) * 0.7
def cymbal(d=1.6):
    t = tt(d); return filt(noise(d), "highpass", 5000) * np.exp(-t * 2.6) * 0.25


# ---------------- sfx ----------------
def tick(pitch=1.0):
    t = tt(0.05)
    return (np.sin(2 * np.pi * 2600 * pitch * t) * np.exp(-t * 160) + filt(noise(0.05), "highpass", 4000) * np.exp(-t * 300) * 0.5) * 0.35
def bell(f0=2400, d=1.4, a=0.3):
    t = tt(d); return sum(g * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * k) for r, g, k in [(1, 1, 3), (1.5, 0.5, 4), (2.76, 0.3, 6), (4.1, 0.12, 9)]) * a
def kaching():
    x = np.zeros(int(1.6 * SR))
    thunk = thud(0.5)[:int(0.12 * SR)]; x[:len(thunk)] += thunk  # drawer
    b = bell(2350, 1.5, 0.28); x[int(0.03 * SR):int(0.03 * SR) + len(b)] += b[:len(x) - int(0.03 * SR)]
    for k in range(9):  # coins
        c = filt(noise(0.06), "bp", (3500, 9000)) * np.exp(-tt(0.06) * 70) * 0.25 + bell(4200 + 600 * rng.random(), 0.25, 0.05)[:int(0.06 * SR)]
        i = int((0.06 + 0.045 * k + 0.02 * rng.random()) * SR); x[i:i + len(c)] += c
    return x
def water_pour(d):
    t = tt(d); x = filt(noise(d), "bp", (900, 6500)) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 9 * t + 3 * np.sin(2 * np.pi * 2.3 * t))))
    for k in range(int(d * 14)):  # little bubbles
        f0 = 500 + 900 * rng.random(); bt = tt(0.05)
        bub = np.sin(2 * np.pi * f0 * (1 + 3 * bt) * bt) * np.exp(-bt * 60) * 0.25
        i = int(rng.random() * (d - 0.06) * SR); x[i:i + len(bub)] += bub
    return x * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25) * 0.12
def fizz(d):
    t = tt(d); x = np.zeros(len(t))
    for k in range(int(d * 90)):
        i = int(rng.random() * (d - 0.01) * SR); x[i:i + 40] += rng.standard_normal(40) * 0.4
    return filt(x, "highpass", 3500) * np.exp(-t * 1.5) * 0.25
def stamp():
    t = tt(0.5)
    return np.tanh((np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) * 1.2 + filt(noise(0.5), "lowpass", 2500) * np.exp(-t * 40) * 0.9) * 1.5) * 0.6
def creak(d=0.7):
    t = tt(d); x = np.zeros(len(t)); p = 0.0
    while p < d - 0.01:
        i = int(p * SR); g = np.exp(-tt(0.006) * 900); x[i:i + len(g)] += g
        p += 0.012 + 0.03 * (0.5 + 0.5 * np.sin(p * 9))
    return (filt(x, "bp", (350, 900)) * 3 + filt(x, "bp", (1200, 1600)) * 1.5) * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.2) * 0.35
def rumble(d=0.8):
    t = tt(d); return filt(noise(d), "lowpass", 110) * np.exp(-t * 4) * 1.4
def squeak(f0=2100):
    t = tt(0.13); f = f0 * (1 + 0.25 * t / 0.13) * (1 + 0.02 * np.sin(2 * np.pi * 40 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.13) * 0.07
def pop(f0=900):
    t = tt(0.12); f = f0 * np.exp(-t * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) + filt(noise(0.12), "highpass", 3000) * np.exp(-t * 200) * 0.3) * 0.35
def chirp(f0=3000, f1=4200, d=0.08):
    t = tt(d); f = np.linspace(f0, f1, len(t)) + 500 * np.sin(2 * np.pi * 45 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.12
def flap():
    t = tt(0.07); return filt(noise(0.07), "bp", (300, 1800)) * np.sin(np.pi * t / 0.07) * 0.25
def squawk():
    t = tt(0.28); f = 1100 + 250 * np.sin(2 * np.pi * 7 * t)
    x = S.saw(1, np.cumsum(f) / SR) * (0.6 + 0.4 * filt(noise(0.28), "lowpass", 200))
    return filt(x, "bp", (700, 4000)) * np.sin(np.pi * t / 0.28) * 0.12
def thud(size=1.0):
    t = tt(0.35); return np.tanh(np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14) * 1.4 * size + filt(noise(0.35), "lowpass", 1200) * np.exp(-t * 35) * 0.4 * size) * 0.55
def sparkle(d=0.9):
    x = np.zeros(int(d * SR))
    for k in range(10):
        b = bell(2800 + 260 * k, 0.4, 0.035); i = int(k * 0.06 * SR); x[i:i + len(b)] += b[:len(x) - i]
    return x


# ---------------- arrangement ----------------
mus, drm, sfx = S.Bus(), S.Bus(), S.Bus()
BPM = 132; BEAT = 60 / BPM
CH = {"F": [65, 69, 72], "C7": [64, 67, 70], "Bb": [65, 70, 74]}
ROOT = {"F": (41, 48), "C7": (36, 43), "Bb": (46, 41)}
PROG = ["F", "F", "C7", "C7", "C7", "C7", "F", "F", "Bb", "Bb", "F", "F", "C7", "C7", "F", "F"]  # per half bar
MEL = [72, 74, 76, 77, 79, 77, 76, 74, 72, 76, 79, 84, 82, 79, 76, 72]  # bouncy clarinet line, 8th notes
def polka(t_from, t_to, gain=1.0, mel=True):
    b = int(np.ceil(t_from / BEAT))
    while b * BEAT < t_to - 0.05:
        tb = b * BEAT; ch = PROG[(b // 2) % len(PROG)]
        if b % 2 == 0:  # "oom"
            mus.add(tuba(ROOT[ch][(b // 2) % 2], BEAT * 0.9), tb, gain=0.75 * gain)
            drm.add(S.kick(0.6) * 0.5, tb, gain=0.6 * gain)
        else:            # "pah"
            mus.add(accordion(CH[ch], BEAT * 0.55), tb, gain=1.0 * gain, pan=0.2)
            drm.add(snare(), tb, gain=0.45 * gain, pan=-0.1)
        drm.add(S.hat(), tb + BEAT / 2, gain=0.18 * gain, pan=0.35)
        if mel:
            for k in range(2):
                n = MEL[(2 * b + k) % len(MEL)]
                mus.add(clarinet(n, BEAT * 0.45), tb + k * BEAT / 2, gain=0.8 * gain, pan=-0.3)
        b += 1

polka(0.0, 6.0)                                  # beer + water
mus.add(tuba(29, 3.4) * 0.8, 6.05, gain=0.9)     # toilet: low drone
mus.add(accordion([53, 56, 59], 3.2) * 0.8, 6.1, gain=0.7, pan=0.2)  # diminished, uneasy
sfx.add(S.riser(2.6, 200, 6000), 6.2, gain=0.5)
polka(9.5, 14.0, gain=0.95)                      # oddities
polka(14.0, 18.0, gain=1.0)                      # title
mus.add(brass([65, 69, 72, 77], 0.35), 14.3, gain=1.0)            # title slam stab
for i, tw in enumerate([15.0, 15.35, 15.7, 16.05]):
    sfx.add(S.pluck(72 + [0, 4, 7, 12][i], 0.3, 4000), tw, gain=0.5, pan=(i - 1.5) / 3)
mus.add(brass([60, 64, 67, 72], 0.18), 18.0, gain=0.9)            # finale "ta-"
mus.add(brass([65, 69, 72, 77, 81], 1.55), 18.2, gain=1.1)        # "-daa!"
mus.add(tuba(29, 1.5), 18.2, gain=0.9)
drm.add(cymbal(1.8), 18.2, gain=0.9); drm.add(S.kick(1.0), 18.2, gain=0.8)

# scene 1 (0–3): mug fills, foam overflows, counter to 15,90 €
sfx.add(S.whoosh(0.4, 600, 5000, 0.4), 0.0, gain=0.6)
sfx.add(S.pour(1.0), 0.2, gain=1.6)
sfx.add(fizz(1.6), 1.05, gain=1.0)
def ticks_for(a, b, target, ease, step, pitch=1.0, gain=0.55):
    """one tick each time the counter passes a multiple of `step`"""
    us = np.linspace(0, 1, 4000); vals = target * ease(us); last = 0
    for u, v in zip(us, vals):
        k = int(v // step)
        if k > last:
            last = k; sfx.add(tick(pitch), a + u * (b - a), gain=gain, pan=0.3)
out_cubic = lambda u: 1 - (1 - u) ** 3
ticks_for(0.35, 1.7, 15.90, out_cubic, 1.0)
sfx.add(kaching(), 1.7, gain=0.8, pan=0.3)
# scene 2 (3–6): shift, glass, water, counter to 11,13 €, stamp at 5.0
sfx.add(S.whoosh(0.3, 500, 6000, 0.5), 2.88, gain=0.8)
sfx.add(pop(600), 3.03, gain=0.6)
sfx.add(water_pour(0.9), 3.15, gain=1.5)
ticks_for(3.2, 4.5, 11.13, out_cubic, 1.0, 1.15)
sfx.add(kaching(), 4.5, gain=0.7, pan=0.3)
sfx.add(stamp(), 5.0, gain=1.0, pan=0.3)
# scene 3 (6–9.5): darkening boom, door creak, accelerating counter, hit + shake
sfx.add(S.whoosh(0.3, 300, 3000, 0.5), 5.9, gain=0.8)
sfx.add(S.impact(1.2, 36), 6.0, gain=0.8)
sfx.add(creak(0.8), 6.2, gain=0.8, pan=-0.4)
ticks_for(6.25, 8.75, 30000, lambda u: u * u, 1000, 0.9, 0.5)
sfx.add(S.impact(1.6, 40), 8.75, gain=0.9)
sfx.add(kaching(), 8.75, gain=0.9, pan=0.3)
sfx.add(rumble(0.7), 8.75, gain=1.0)
# scene 4 (9.5–14): card whooshes, squeaky rollator, vanishing mugs, parrot
for tc in (9.38, 10.88, 12.38):
    sfx.add(S.whoosh(0.35, 500, 6000, 0.5), tc, gain=0.8)
for k in range(9):
    sfx.add(squeak(1900 + 300 * (k % 3)), 9.65 + k * 0.15, gain=1.0, pan=-0.3)
for i in range(5):
    sfx.add(pop(1000 - 90 * i), 11.0 + 0.3 + i * 0.2, gain=0.8, pan=-0.5 + i * 0.25)
for k in range(10):
    sfx.add(flap(), 12.6 + k * 0.065, gain=0.8, pan=0.3 - k * 0.05)
for k, tc in enumerate([12.62, 12.8, 12.95, 13.45, 13.62]):
    sfx.add(chirp(2800 + 300 * k, 3800 + 200 * k), tc, gain=1.0, pan=-0.2)
sfx.add(squawk(), 13.27, gain=1.0, pan=-0.3)
# scene 5 (14–18): props land with bounces, title slam
sfx.add(S.whoosh(0.35, 400, 5000, 0.5), 13.88, gain=0.8)
for t0, pan in ((0.05, -0.6), (0.25, 0.5), (0.45, 0.75)):
    for u, g in ((1 / 2.75, 1.0), (2 / 2.75, 0.45), (2.5 / 2.75, 0.2)):
        sfx.add(thud(g), 14 + t0 + 0.75 * u, gain=0.7, pan=pan)
sfx.add(S.impact(0.9, 46), 14.28, gain=0.7)
drm.add(cymbal(1.2), 14.28, gain=0.6)
# scene 6 (18–20): badge pop + shine
sfx.add(S.whoosh(0.3, 300, 4500, 0.6), 17.95, gain=0.7)
sfx.add(pop(500), 18.12, gain=0.6)
sfx.add(sparkle(0.9), 18.3, gain=0.8, pan=0.2)

# ---------------- mix ----------------
vpath = sys.argv[1] if len(sys.argv) > 1 else "voice.mp3"
voice = np.zeros(N)
if os.path.exists(vpath):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vpath, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.float32).astype(np.float64)[:N]
    v = filt(v, "highpass", 90)
    v = v + 0.18 * filt(v, "bp", (2500, 6000))  # presence
    voice[:len(v)] = v / (np.abs(v).max() + 1e-9) * 0.95
    print("voice:", vpath)
else:
    print("voice: none (music + sfx only)")
duck = np.clip(signal.sosfilt(S.sos("lowpass", 5), np.abs(voice)) * 7, 0, 1)
room = S.reverb_ir(1.3, 6000, 2)
music = mus.x + drm.x * 0.8
music = S.filt(music.T, "highpass", 45).T  # keep the tuba from booming on small speakers
music = music + S.convolve_st(mus.x * 0.5, room) * 0.25
music *= (1 - 0.72 * duck)[:, None]
fx = (sfx.x + S.convolve_st(sfx.x, room) * 0.18) * (1 - 0.4 * duck)[:, None]
vox = voice[:, None] + S.convolve_st(voice[:, None] * np.ones((1, 2)) * 0.5, S.reverb_ir(0.6, 7000, 4)) * 0.05
mix = music * 0.45 + fx * 0.55 + vox * 1.0
act = duck > 0.5  # voice-active samples: report voice vs background level
if act.any():
    db = lambda z: 10 * np.log10(np.mean(z[act] ** 2) + 1e-12)
    print(f"voice/background during speech: {db(vox[:, 0]) - db((music * 0.45 + fx * 0.55)[:, 0]):+.1f} dB")
mix = S.filt(mix.T, "highpass", 30).T
mix = np.tanh(mix / np.abs(mix).max() * 1.1) / np.tanh(1.1) * 0.8
t = np.arange(N) / SR
mix *= np.clip((DUR - 0.02 - t) / 0.25, 0, 1)[:, None]
out = sys.argv[2] if len(sys.argv) > 2 else "mix.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("written", out)
