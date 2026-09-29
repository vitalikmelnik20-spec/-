"""Full soundtrack for the 22-minute story: narration + ambience + quiet score + SFX.
Everything except the narration is synthesised (no samples, no copyrighted music).
    python src/audio_mix.py [out.wav]
"""
import json, sys, zlib
import numpy as np
from scipy import signal
from scipy.io import wavfile
import soundfile as sf

SR = 48000
TL = json.load(open("src/timeline.json"))
TOTAL = TL["total"]
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(1951)
f32 = np.float32


def tt(d): return (np.arange(int(d * SR)) / SR).astype(f32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(f32)
def sos(kind, f, order=2):
    if kind == "bp": return signal.butter(order, [f[0] / (SR / 2), min(f[1] / (SR / 2), 0.99)], "bandpass", output="sos")
    return signal.butter(order, min(f / (SR / 2), 0.99), kind, output="sos")
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x).astype(f32)
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, r):
    e = np.ones(n, f32); a, r = int(a * SR), int(r * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


class Bus:
    def __init__(self): self.x = np.zeros(N, f32)
    def add(self, sig, t0, gain=1.0):
        i = int(t0 * SR)
        if i >= N: return
        n = min(len(sig), N - i); self.x[i:i + n] += sig[:n] * gain


shots = {s["id"]: s for s in TL["shots"]}
voice, amb, music, sfx = Bus(), Bus(), Bus(), Bus()

# ---------------- narration ----------------
for s in TL["shots"]:
    if not s["voLen"]: continue
    x, sr = sf.read(f"assets/narration/{s['id']}.wav", dtype="float32")
    x = signal.resample_poly(x, SR, sr).astype(f32)
    x = filt(x, "highpass", 70)
    x = x + 0.12 * filt(x, "lowpass", 220)           # a little fireside warmth
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    voice.add(x, s["vo"])

# ---------------- ambience per shot ----------------
TAGS = {}
def tag(ids, t):
    for i in ids.split(): TAGS[i] = t
tag("V01 F001 F002 F003 F004 F005 F006 F013 F018 F019 V03 F022 F023 F024 F025 F026 F027 F030 F031 F032 F033 V04 F037 F040 V05 F064 F065 F066 V07 F067 F068 F069 F070 F071 V08 F072 F073 F074 F086 F099 F100 V10 F097 F098 V11 F103 F104 F105 F106 F107 F108 V12 F110 F111 F017 F011 F062 F087 V02 F094", "night")
tag("F009 F010 F015 F020 F021 F028 F029 F034 F035 F036 F041 F055 V06 F063 F076 F084 F085 F088 F095 F096 F109 F044 F045 F046 F047 F050", "interior")
tag("F007 F014 F016 F012 F051 F052 F053 F054 F058 F061 F075 F077 F078 F079 F089 F090 F091 F092 F093 F101 F102 F008 F038 F048 F049 F056", "day")
tag("F042 F043", "winter")
tag("F080 F081 F082 F083 V09", "cemetery")
tag("F057 F059 F060", "vintage")
CLOCK = set("F021 F029 F036 F041 F084 F085 F096 F063 F034 F028".split())

def wind(d, strength=1.0, seed=0):
    r = np.random.default_rng(seed)
    x = r.standard_normal(int(d * SR)).astype(f32)
    lfo = filt(r.standard_normal(int(d * SR)).astype(f32), "lowpass", 0.4)
    lfo = (lfo / (np.abs(lfo).max() + 1e-9) * 0.5 + 0.6).clip(0.15, 1.2)
    w = filt(x, "bp", (180, 900)) * lfo * 0.5 + filt(x, "lowpass", 160) * 0.6
    return w * 0.05 * strength
def rustle(d, dens=1.0, seed=1):
    r = np.random.default_rng(seed)
    x = filt(r.standard_normal(int(d * SR)).astype(f32), "bp", (2500, 9000))
    gate = filt((r.random(int(d * SR)) < 0.0004 * dens).astype(f32) * 40, "lowpass", 6)
    return x * gate.clip(0, 1) * 0.05
def birds(d, seed=2):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR), f32)
    t = 0.5
    while t < d - 0.5:
        for k in range(r.integers(2, 5)):
            n = tt(0.08); f = r.uniform(2800, 4200) * (1 + np.sin(np.pi * n / 0.08) * 0.25)
            chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * n / 0.08)
            i = int((t + k * 0.12) * SR); out[i:i + len(chirp)] += chirp[:len(out) - i] * 0.02
        t += r.uniform(1.2, 3.5)
    return out
def roomtone(d): return filt(noise(d), "lowpass", 300) * 0.012 + filt(noise(d), "bp", (58, 62)) * 0.004
def crackle(d):
    x = np.zeros(int(d * SR), f32); idx = rng.integers(0, len(x), int(d * 40)); x[idx] = rng.uniform(-0.3, 0.3, len(idx)).astype(f32)
    return filt(x, "highpass", 1500) + filt(noise(d), "lowpass", 400) * 0.006

for s in TL["shots"]:
    t0, d = s["start"], s["dur"] + 0.6
    k = TAGS.get(s["id"], "night"); seed = zlib.crc32(s["id"].encode()) % 10000
    e = env(int(d * SR), 0.5, 0.6)
    if k == "night": a = wind(d, 1.0, seed) + rustle(d, 1.0, seed)
    elif k == "interior": a = roomtone(d) + wind(d, 0.25, seed)
    elif k == "day": a = wind(d, 0.5, seed) + birds(d, seed) + rustle(d, 0.5, seed)
    elif k == "winter": a = wind(d, 1.4, seed)
    elif k == "cemetery": a = wind(d, 0.7, seed) + rustle(d, 1.5, seed) + birds(d, seed) * 0.5
    else: a = crackle(d) + wind(d, 0.5, seed)
    amb.add(a * e, t0)
    if s["id"] in CLOCK:  # ticking clock
        for j in range(int(d)):
            tk = filt(noise(0.02), "bp", (2500, 5000)) * np.exp(-tt(0.02) * 300) * (0.05 if j % 2 else 0.035)
            sfx.add(tk, t0 + j + 0.3)

# ---------------- sound effects ----------------
def knock():
    t = tt(0.35); body = np.sin(2 * np.pi * 110 * t) * np.exp(-t * 28) + filt(noise(0.35), "lowpass", 900) * np.exp(-t * 60) * 0.6
    return (body * 0.35).astype(f32)
def knocks3(t0):
    for k in range(3): sfx.add(knock(), t0 + k * 0.42, 0.9 - k * 0.1)
def creak(d=1.4):
    t = tt(d); f = 180 + 60 * np.sin(2 * np.pi * 0.7 * t) + 30 * np.sin(2 * np.pi * 3.1 * t)
    saw = ((np.cumsum(f) / SR) % 1.0) * 2 - 1
    return (filt(saw.astype(f32), "bp", (400, 2200)) * env(len(t), 0.1, 0.4) * 0.05).astype(f32)
def match():
    t = tt(1.0); strike = filt(noise(0.12), "bp", (1500, 7000)) * np.exp(-tt(0.12) * 25)
    x = np.zeros(len(t), f32); x[:len(strike)] += strike * 0.25
    x += filt(noise(1.0), "bp", (300, 1500)) * np.exp(-t * 2.5) * 0.04
    return x
def owl():
    out = np.zeros(int(2.2 * SR), f32)
    for k, (st, d) in enumerate([(0, 0.35), (0.55, 0.25), (0.9, 0.7)]):
        t = tt(d); f = 400 - 25 * t / d
        o = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 0.6
        i = int(st * SR); out[i:i + len(o)] += o.astype(f32) * 0.05
    return out
def heartbeat(n=6, bpm=66):
    out = np.zeros(int(n * 60 / bpm * SR) + SR, f32)
    for k in range(n):
        for off, a in ((0, 1), (0.22, 0.7)):
            t = tt(0.25); b = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 18) * a
            i = int((k * 60 / bpm + off) * SR); out[i:i + len(b)] += b.astype(f32) * 0.25
    return out
def crunch(steps, interval=0.62):
    out = np.zeros(int(steps * interval * SR) + SR, f32)
    for k in range(steps):
        b = filt(noise(0.18), "bp", (1200, 6000)) * np.exp(-tt(0.18) * 18) * rng.uniform(0.6, 1.0)
        i = int(k * interval * SR); out[i:i + len(b)] += b * 0.12
    return out
def bell(f0=330, d=5.0):
    t = tt(d); return (sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * dd) for r, a, dd in [(1, 0.5, 0.8), (2.0, 0.25, 1.2), (2.4, 0.2, 1.6), (3.0, 0.12, 2), (4.2, 0.08, 3)]) * 0.05).astype(f32)
def engine(d):
    t = tt(d); return (filt(noise(d), "lowpass", 120) * 0.05 + np.sin(2 * np.pi * 32 * t) * 0.02 * (1 + 0.2 * np.sin(2 * np.pi * 8 * t))).astype(f32) * env(len(t), 0.3, 0.5)
def whoosh_soft(d=2.0):
    t = tt(d); return filt(noise(d), "bp", (300, 1800)) * np.sin(np.pi * t / d) ** 2 * 0.04
def chime(): t = tt(3.0); return (sum(np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 2.2) for m in (84, 88, 91)) * 0.012).astype(f32)

S = lambda i: shots[i]["start"]
knocks3(S("V01") + 0.05)
knocks3(S("F021") + 3.2)
knocks3(S("F029") + 5.8)
knocks3(S("F036") + 5.2)
knocks3(S("V10") - 0.9)
sfx.add(creak(), S("V03") + 0.2); sfx.add(creak(), S("V10") + 0.2); sfx.add(creak(1.0), S("F041") + 0.5)
for k in (0.8, 1.8, 2.8, 4.0): sfx.add(match(), S("V02") + k - 0.1)
sfx.add(owl(), S("V04") + 4.5); sfx.add(owl(), S("F064") + 3.0); sfx.add(owl(), S("F033") + 4.0, 0.7); sfx.add(owl(), S("F111") + 3.0, 0.6)
sfx.add(heartbeat(7), S("F030") + 3.0); sfx.add(heartbeat(9, 76), S("F070")); sfx.add(heartbeat(7, 80), S("V08"))
sfx.add(crunch(12), S("V07") + 0.3); sfx.add(crunch(14, 0.7), S("F067")); sfx.add(crunch(10), S("F068")); sfx.add(crunch(12, 0.8), S("F075"))
for k in range(4): sfx.add(bell(300), S("F012") + 1 + k * 2.5, 0.8); sfx.add(bell(300), S("F089") + 1 + k * 2.5, 0.6)
sfx.add(engine(shots["F052"]["dur"]), S("F052"))
sfx.add(whoosh_soft(2.5), S("V05")); sfx.add(whoosh_soft(3), S("V08") + 3.0); sfx.add(whoosh_soft(3), S("V11") + 3.5)
for i in ("F011", "F017", "F062", "F087"): sfx.add(chime(), S(i) + 0.8)
sfx.add(chime(), S("F101") + 1.0)
# kettle whistle, very soft
t = tt(3.0); sfx.add((np.sin(2 * np.pi * 2100 * t) * env(len(t), 1.2, 1.0) * 0.006).astype(f32), S("F020") + 2)

# ---------------- score ----------------
def pad(chord, d, bright=900):
    t = tt(d); x = np.zeros(len(t), f32)
    for m in chord:
        for dt in (-0.06, 0.06):
            f = midi(m + dt); x += (((f * t + rng.random()) % 1.0) * 2 - 1).astype(f32)
    x = filt(x, "lowpass", bright) * env(len(t), 2.5, 2.5)
    return x * (0.018 / len(chord))
def piano(m, d=3.5, vel=1.0):
    t = tt(d); f = midi(m)
    x = sum(a * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t * (1.2 + h * 0.9)) for h, a in [(1, 1), (2, 0.45), (3, 0.2), (4, 0.1), (5, 0.05)])
    x = x + filt(noise(d), "bp", (800, 3000)) * np.exp(-t * 80) * 0.05
    return (x * np.minimum(1, t / 0.004) * 0.03 * vel).astype(f32)
def musicbox(m, d=2.5):
    t = tt(d); f = midi(m); return ((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4.02 * t) * np.exp(-t * 6)) * np.exp(-t * 2.5) * 0.02).astype(f32)

ACT_STARTS = {}
for s in TL["shots"]: ACT_STARTS.setdefault(s["act"], s["start"])
acts = list(ACT_STARTS.items()) + [("END", TOTAL)]
MOOD = {  # chords (MIDI), piano register, density (notes per chord), brightness
    "COLD OPEN": ([[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]], 72, 3, 700),
    "АКТ 1": ([[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]], 72, 4, 1000),
    "АКТ 2": ([[38, 45, 50, 53], [38, 44, 50, 53], [34, 41, 46, 50], [37, 44, 49, 52]], 69, 2, 600),
    "АКТ 3": ([[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [40, 47, 52, 56]], 72, 3, 900),
    "АКТ 4": ([[38, 45, 50, 51], [37, 44, 49, 50], [36, 43, 48, 49], [38, 45, 50, 53]], 62, 1, 500),
    "АКТ 5": ([[41, 48, 53, 57], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]], 77, 4, 1100),
}
CH = 8.0
for (name, a0), (_, a1) in zip(acts, acts[1:]):
    chords, reg, dens, bright = MOOD[name]
    t, k = a0, 0
    while t < a1:
        ch = chords[k % len(chords)]; d = min(CH, a1 - t) + 2.5
        music.add(pad(ch, d, bright), t)
        music.add(pad([ch[0] - 12], d, 300) * 1.6, t)
        for j in range(dens):
            nt = t + 0.4 + j * CH / dens + rng.uniform(-0.2, 0.2)
            if nt < a1 - 1: music.add(piano(ch[(j + k) % len(ch)] + (reg - 60), 4.0, rng.uniform(0.6, 1.0)), nt)
        t += CH; k += 1
# music-box motif: hook, Dorothy's photo, final
MOTIF = [76, 79, 81, 79, 76, 74, 76]
for st in (S("V01") + 1, S("V06") + 0.5, S("F083") + 1, S("F111") + 0.5, S("V11") + 1):
    for i, m in enumerate(MOTIF): music.add(musicbox(m), st + i * 0.55)
# tension swell before the well, release after
t = tt(16); music.add((filt(noise(16), "bp", (80, 400)) * (t / 16) ** 2 * 0.06).astype(f32), S("F069"))

# ---------------- mix ----------------
v = voice.x
ve = signal.sosfilt(sos("lowpass", 4), np.abs(v)).astype(f32)
ve = np.clip(ve / (np.percentile(ve[ve > 1e-4], 90) + 1e-9), 0, 1)
ve = signal.sosfilt(sos("lowpass", 2), ve).astype(f32).clip(0, 1)
duck_m = 1 - 0.55 * ve; duck_a = 1 - 0.35 * ve
bed = music.x * duck_m * 0.9 + amb.x * duck_a + sfx.x
# stereo: music/amb widened with small delays, voice centred
d1, d2 = int(0.011 * SR), int(0.017 * SR)
L = v + bed + 0.25 * np.roll(music.x * duck_m, d1)
R = v + bed + 0.25 * np.roll(music.x * duck_m, d2)
# simple room reverb on music (sparse FIR)
ir = np.zeros(int(1.8 * SR), f32); idx = rng.integers(200, len(ir), 900); ir[idx] = (rng.standard_normal(900) * np.exp(-idx / SR * 3.5)).astype(f32)
wet = signal.oaconvolve(music.x * duck_m, ir, mode="full")[:N].astype(f32) * 0.25
L += wet; R += np.roll(wet, 331)
mix = np.stack([L, R], 1)[: int(TOTAL * SR)]
mix = filt(mix.T, "highpass", 30).T
fade = int(2.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
peak = np.abs(mix).max(); mix = mix / peak * 0.89
out = sys.argv[1] if len(sys.argv) > 1 else "render/audio/mix.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("wrote", out, f"{len(mix) / SR:.1f}s")
