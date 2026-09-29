"""Original cinematic-electronic soundtrack + sound design for "Львів за 30 секунд".

Everything is synthesised from scratch (oscillators, filtered noise, synthetic
reverb) -> no samples, no copyrighted material. Deterministic (fixed seeds).

    python soundtrack.py <voice_dir or ''> <out.wav>

Timeline (120 BPM, 1 bar = 2 s) is locked to the visuals in src/scenes.js.
"""
import json
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(20250)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def sos(kind, f, order=2, q=None):
    if kind == "bp":
        lo, hi = f
        return signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], "bandpass", output="sos")
    return signal.butter(order, min(f / (SR / 2), 0.99), kind, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def sweep_filter(x, cut, kind="lowpass", block=256, order=2):
    """time-varying filter: cut(t_seconds) -> Hz, processed in blocks with state carry"""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        fc = float(np.clip(cut((i + block / 2) / SR), 30, SR / 2 * 0.95))
        s = signal.butter(order, fc / (SR / 2), kind, output="sos")
        if zi is None:
            zi = np.zeros((s.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return out


def sweep_bp(x, cut, width=0.6, block=256):
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        fc = float(np.clip(cut((i + block / 2) / SR), 60, 16000))
        lo, hi = fc * (1 - width / 2), min(fc * (1 + width), SR / 2 * 0.95)
        s = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "bandpass", output="sos")
        if zi is None:
            zi = np.zeros((s.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return out


class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        """sig mono (n,) or stereo (n,2); pan -1..1 (equal power)"""
        i0 = int(round(t0 * SR))
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
        if i0 < 0:
            sig = sig[-i0:]
            i0 = 0
        n = min(len(sig), N - i0)
        if n > 0:
            self.x[i0:i0 + n] += sig[:n] * gain


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    e = np.full(n, s)
    e[:a] = np.linspace(0, 1, a, endpoint=False) if a else e[:a]
    e[a:a + d] = np.linspace(1, s, len(e[a:a + d]))
    if r:
        e[-r:] *= np.linspace(1, 0, len(e[-r:]))
    return e


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def reverb_ir(seconds=2.4, tone=5000, seed=3):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-t * 6.9 / seconds)
        x = signal.sosfilt(sos("lowpass", tone), x)
        x[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir[:, c] = x
    ir /= np.sqrt((ir ** 2).sum(0))
    return ir


def convolve_st(x, ir):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = signal.fftconvolve(x[:, c], ir[:, c])[: len(x)]
    return out


# --------------------------------------------------------------------------
# Instruments
# --------------------------------------------------------------------------
def kick(big=1.0):
    t = tt(0.6)
    f = 44 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (5.5 / big))
    click = filt(noise(0.6), "highpass", 3000) * np.exp(-t * 300) * 0.35
    return np.tanh((body + click) * 1.6) * 0.9


def clap():
    t = tt(0.5)
    n = signal.sosfilt(sos("bp", (900, 3200)), noise(0.5))
    e = np.zeros_like(t)
    for k, d in enumerate([0, 0.011, 0.023]):
        e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * 120) * (0.7 if k < 2 else 1)
    e += np.exp(-t * 14) * 0.35
    return n * e * 0.5


def hat(open_=False):
    t = tt(0.4)
    n = filt(noise(0.4), "highpass", 7500)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.35


def rim():
    t = tt(0.15)
    return (np.sin(2 * np.pi * 1750 * t) * 0.6 + filt(noise(0.15), "highpass", 2500)) * np.exp(-t * 60) * 0.3


def pluck(m, dur=0.35, bright=3500):
    t = tt(dur)
    f = midi(m)
    x = 0.6 * saw(f, t) + 0.4 * (np.sign(np.sin(2 * np.pi * f * 1.002 * t)))
    cut = lambda s: 300 + bright * np.exp(-s * 14)
    x = sweep_filter(x, cut, block=128)
    return x * np.exp(-t * 7) * 0.35


def bass_note(m, dur, drive=1.4):
    t = tt(dur)
    f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f / 2 * t) + 0.25 * saw(f, t)
    x = filt(x, "lowpass", 380)
    e = env_adsr(len(t), 0.006, 0.12, 0.7, min(0.08, dur / 3))
    return np.tanh(x * drive) * e * 0.55


def pad_chord(ms, dur, detune=0.08, spread=True):
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for i, m in enumerate(ms):
        for v, dt in enumerate((-detune, 0, detune)):
            f = midi(m + dt)
            x = saw(f, t, phase=rng.random())
            pan = (-0.7 if v == 0 else 0.7 if v == 2 else 0) if spread else 0
            a = (pan + 1) * np.pi / 4
            out[:, 0] += x * np.cos(a)
            out[:, 1] += x * np.sin(a)
    e = env_adsr(len(t), 0.35, 0.3, 0.85, 0.9)
    return out * e[:, None] * (0.12 / len(ms))


def choir(ms, dur):
    """airy vowel-like pad: saws through 'a' formants"""
    t = tt(dur)
    raw = np.zeros(len(t))
    for m in ms:
        for dt in (-0.1, 0.1):
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.random() * 6)
            raw += saw(midi(m + dt) * vib, t)
    x = (signal.sosfilt(sos("bp", (650, 950)), raw) + 0.6 * signal.sosfilt(sos("bp", (1050, 1350)), raw)
         + 0.25 * signal.sosfilt(sos("bp", (2500, 3000)), raw))
    e = env_adsr(len(t), 0.6, 0.2, 0.9, 1.0)
    return x * e * 0.06


def impact(size=1.0, sub=48):
    d = 1.4 + size
    t = tt(d)
    f = sub + 60 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 3.2 / size)
    hitn = filt(noise(d), "lowpass", 2400) * np.exp(-t * 22) * 0.6
    crack = filt(noise(d), "highpass", 4000) * np.exp(-t * 60) * 0.3
    return np.tanh((body + hitn + crack) * 1.3) * 0.8


def tick_hit():
    t = tt(0.3)
    return (np.sin(2 * np.pi * 150 * t) * np.exp(-t * 20) + filt(noise(0.3), "highpass", 3000) * np.exp(-t * 90) * 0.4) * 0.5


def riser(dur, f0=250, f1=7000, tone=True):
    t = tt(dur)
    u = t / dur
    x = sweep_bp(noise(dur), lambda s: f0 * (f1 / f0) ** (s / dur), width=0.8)
    if tone:
        f = 110 * (8 ** u)
        x = x + 0.15 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.1 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return x * (u ** 2.2) * 0.5


def whoosh(dur=0.7, f0=400, f1=4000, peak=0.55):
    t = tt(dur)
    u = t / dur
    fc = lambda s: f0 * (f1 / f0) ** min(1, s / dur / peak) if s / dur < peak else f1 * (f0 / f1) ** ((s / dur - peak) / (1 - peak))
    x = sweep_bp(noise(dur), fc, width=0.9)
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    L = x * e * np.clip(1.2 - u, 0, 1)
    R = x * e * np.clip(0.2 + u, 0, 1)
    return np.stack([L, R], 1) * 0.6


def rev_cymbal(dur):
    t = tt(dur)
    x = filt(noise(dur), "highpass", 3500)
    return x * (t / dur) ** 3 * 0.35


def clink():
    t = tt(1.0)
    parts = [(2210, 0.5, 9), (3350, 0.35, 11), (4870, 0.25, 14), (6120, 0.15, 18), (1390, 0.2, 7)]
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in parts)
    return x * 0.18


def pour(dur=1.0):
    t = tt(dur)
    base = signal.sosfilt(sos("bp", (350, 1400)), noise(dur))
    am = np.clip(signal.sosfilt(sos("lowpass", 18), rng.standard_normal(len(t))) * 8 + 0.6, 0, 1.5)
    x = base * am
    # bubbles: little rising sine chirps
    for k in range(26):
        s = rng.random() * (dur - 0.05)
        bt = tt(0.04)
        f = 500 + rng.random() * 700
        b = np.sin(2 * np.pi * np.cumsum(f * (1 + bt * 12)) / SR) * np.exp(-bt * 90)
        i = int(s * SR)
        x[i:i + len(b)] += b * 0.3
    e = env_adsr(len(t), 0.08, 0.1, 0.8, 0.35)
    return x * e * 0.12


def tram_bell():
    t = tt(1.8)
    x = sum(a * np.sin(2 * np.pi * 1320 * r * t) * np.exp(-t * d) for r, a, d in
            [(1, 0.5, 2.5), (2.76, 0.25, 4), (5.4, 0.12, 6), (8.93, 0.06, 9)])
    return x * 0.12


def city_amb(dur):
    t = tt(dur)
    rumble = filt(noise(dur), "lowpass", 220) * 0.5
    crowd = signal.sosfilt(sos("bp", (300, 2500)), noise(dur))
    mod = np.clip(signal.sosfilt(sos("lowpass", 3), rng.standard_normal(len(t))) * 25 + 0.5, 0.1, 1.2)
    x = rumble + crowd * mod * 0.35
    return x * 0.08


# --------------------------------------------------------------------------
# Arrangement
# --------------------------------------------------------------------------
CH = {
    "Dm": [50, 53, 57, 62], "Bb": [46, 50, 53, 58], "F": [48, 53, 57, 60], "C": [48, 52, 55, 60],
    "Gm": [43, 50, 55, 58], "A": [45, 52, 57, 61], "Dm9": [50, 53, 57, 62, 64],
}
ROOT = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "Gm": 43, "A": 45, "Dm9": 38}
# (start, dur, chord)
PROG = [(0, 2, "Dm"), (2, 2, "Dm"), (4, 2, "Bb"), (6, 2, "F"), (8, 2, "C"), (10, 2, "Dm"), (12, 1, "Gm"), (13, 1, "A"),
        (14, 2, "Dm"), (16, 2, "Bb"), (18, 2, "F"), (20, 2, "C"), (22, 2, "Dm"), (24, 1, "Bb"), (25, 1, "A"),
        (26, 4, "Dm9")]


def chord_at(t):
    for s, d, c in PROG:
        if s <= t < s + d:
            return c
    return "Dm9"


def build():
    pads, bass, drums, arps, sfx, amb, choirs = Bus(), Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
    kicks = []

    # ---- pads (whole song), filtered by a song-long cutoff curve
    for s, d, c in PROG:
        pads.add(pad_chord(CH[c], d + 0.9), s - 0.05)
        pads.add(pad_chord([m + 12 for m in CH[c][1:]], d + 0.9, detune=0.12), s - 0.05, gain=0.5)
    cut_pts = [(0, 350), (0.3, 700), (1.9, 1600), (2.2, 900), (6, 1300), (10, 1500), (13.9, 2600), (14.1, 1400),
               (18, 1800), (21.9, 3800), (22.1, 2600), (25.9, 4500), (26.2, 2200), (29, 500), (30, 300)]
    ts, fs = zip(*cut_pts)
    cut = lambda s: float(np.interp(s, ts, fs))
    for c in range(2):
        pads.x[:, c] = sweep_filter(pads.x[:, c], cut)
    # hook: dark drone + shimmer
    t = tt(2.6)
    drone = (np.sin(2 * np.pi * midi(26) * t) * 0.5 + np.sin(2 * np.pi * midi(38) * t) * 0.3) * np.minimum(1, t / 0.05) * np.exp(-t * 0.6)
    bass.add(drone * 0.8, 0.0)

    # ---- choir for the climax and the final
    for s, d, c in PROG:
        if s >= 22:
            choirs.add(choir([m + 12 for m in CH[c]], d + 1.0), s, gain=1.0 if s < 26 else 0.8)
    choirs.add(choir([62, 65, 69], 4.0), 18.0, gain=0.35)

    # ---- drums
    def K(t0, g=1.0, big=1.0):
        drums.add(kick(big), t0, gain=g)
        kicks.append(t0)

    for i in range(60):
        tb = i * BEAT
        if 2 <= tb < 6:
            if i % 2 == 0:
                K(tb, 0.55)
            if tb >= 4:
                drums.add(hat(), tb + 0.25, gain=0.25, pan=0.3)
        elif 6 <= tb < 10:
            K(tb, 0.62)
            if i % 2 == 1:
                drums.add(clap(), tb, gain=0.35, pan=-0.1)
            drums.add(hat(), tb + 0.25, gain=0.3, pan=0.3)
        elif 10 <= tb < 14:
            K(tb, 0.7)
            if i % 2 == 1:
                drums.add(clap(), tb, gain=0.45)
            for k in (0.25,):
                drums.add(hat(), tb + k, gain=0.35, pan=0.3)
            drums.add(hat(), tb + 0.125, gain=0.12, pan=-0.3)
            if tb >= 13:  # snare roll into the drop
                for k in range(4):
                    drums.add(clap(), tb + k * 0.125, gain=0.15 + 0.2 * (tb - 13 + k * 0.125))
        elif 14 <= tb < 18:
            K(tb, 0.85)
            if i % 2 == 1:
                drums.add(rim(), tb, gain=0.8, pan=0.15)
                drums.add(clap(), tb, gain=0.3)
            for k in (0.125, 0.25, 0.375):
                drums.add(hat(), tb + k, gain=0.22 if k != 0.25 else 0.35, pan=0.35 if k == 0.25 else -0.25)
        elif 18 <= tb < 22:
            K(tb, 0.95)
            if i % 2 == 1:
                drums.add(clap(), tb, gain=0.6)
            for k in (0.125, 0.25, 0.375):
                drums.add(hat(k == 0.25), tb + k, gain=0.25 if k != 0.25 else 0.3, pan=0.35 if k == 0.25 else -0.25)
            drums.add(rim(), tb + 0.375, gain=0.35, pan=-0.5)
            if tb >= 21:
                for k in range(8):
                    drums.add(clap(), tb + k * 0.0625, gain=0.1 + 0.4 * (tb - 21 + k * 0.0625))
        elif 22 <= tb < 26:
            K(tb, 1.0, big=1.2)
            if i % 2 == 1:
                drums.add(clap(), tb, gain=0.75)
                drums.add(impact(0.4, 60), tb, gain=0.18)
            for k in (0.125, 0.25, 0.375):
                drums.add(hat(k == 0.25), tb + k, gain=0.28, pan=0.35 if k == 0.25 else -0.25)
            if tb >= 25.5:
                for k in range(4):
                    drums.add(clap(), tb + k * 0.125, gain=0.3 + 0.3 * k / 4)

    # ---- bass
    for s, d, c in PROG:
        r = ROOT[c]
        if s < 2:
            continue
        if s < 14 and s != 10 and s != 12 and s != 13:
            bass.add(bass_note(r, d - 0.02, 1.1), s, gain=0.6)
        elif s < 14:
            for k in range(int(d / 0.25)):
                bass.add(bass_note(r, 0.22), s + k * 0.25, gain=0.45)
        elif s < 26:
            for k in range(int(d / 0.25)):
                off = 12 if k % 4 == 3 else 0
                bass.add(bass_note(r + off, 0.2, 1.8), s + k * 0.25 + (0.0 if k % 2 == 0 else 0.0), gain=0.6 if s >= 22 else 0.5)
        else:
            bass.add(bass_note(r, 3.8, 1.2), s, gain=0.7)

    # ---- arps (16ths)
    for s, d, c in PROG:
        if s < 10 or s >= 26:
            continue
        tones = [m + 12 for m in CH[c]]
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(int(d / 0.125)):
            m = tones[pattern[k % 8] % len(tones)] + (12 if (s >= 22 and k % 8 in (3, 7)) else 0)
            g = 0.22 if s < 14 else 0.28 if s < 22 else 0.34
            if 14 <= s < 18 and k % 2 == 1:
                continue
            arps.add(pluck(m, 0.3, 2000 if s < 14 else 3500 if s < 22 else 5200), s + k * 0.125, gain=g, pan=(-0.4 if k % 2 else 0.4))

    # ---- sound design
    sfx.add(impact(1.3, 40), 0.0, gain=0.8)              # opening boom
    sfx.add(filt(noise(1.5), "highpass", 6000) * np.exp(-tt(1.5) * 3) * 0.12, 0.0)  # shimmer
    sfx.add(impact(1.0, 46), 0.24, gain=1.0)             # "ЦЕ ЛЬВІВ." slam
    sfx.add(tick_hit(), 0.98, gain=0.5)
    sfx.add(riser(1.6, 200, 6000), 0.32, gain=0.8)       # map zoom
    sfx.add(whoosh(0.8, 300, 5000, 0.6), 1.55, gain=0.9)
    sfx.add(tick_hit(), 2.2, gain=0.35)
    sfx.add(whoosh(1.4, 200, 3000, 0.5), 3.3, gain=0.8)  # dive into the city
    sfx.add(impact(0.6, 55), 3.8, gain=0.55)             # "Львів"
    sfx.add(whoosh(0.9, 250, 3500, 0.5), 5.85, gain=0.7)  # descend to the square
    for k in range(8):                                    # houses rising
        sfx.add(tick_hit(), 6.05 + k * 0.16, gain=0.12 + 0.02 * k, pan=(-0.5 + k / 7))
    sfx.add(impact(0.7, 50), 7.3, gain=0.7)              # "СЕРЦЕ ЛЬВОВА"
    sfx.add(rev_cymbal(0.5), 9.6, gain=0.8)
    sfx.add(whoosh(0.6, 500, 6000, 0.6), 9.7, gain=0.9)  # slit transition
    sfx.add(impact(0.4, 60), 10.1, gain=0.4)
    sfx.add(whoosh(1.8, 200, 1500, 0.5), 10.4, gain=0.35)  # street pan
    sfx.add(riser(1.0, 400, 8000, tone=False), 13.0, gain=0.6)
    sfx.add(impact(1.0, 44), 14.0, gain=1.0)             # the drop
    sfx.add(clink(), 14.04, gain=1.0, pan=0.15)
    sfx.add(clink(), 14.13, gain=0.5, pan=0.15)
    sfx.add(pour(1.1), 14.25, gain=1.0)
    sfx.add(whoosh(1.0, 300, 2500, 0.6), 14.9, gain=0.5)  # steam -> skyline
    sfx.add(whoosh(0.6, 800, 7000, 0.7), 16.1, gain=0.8)  # dive into the cup
    amb.add(city_amb(4.6), 17.6)
    amb.add(city_amb(4.0) * np.linspace(0, 1, int(4.0 * SR)), 10.0, gain=0.5)
    sfx.add(tram_bell(), 18.25, gain=1.0, pan=-0.3)
    sfx.add(tram_bell(), 18.45, gain=0.8, pan=-0.3)
    for k in range(5):                                    # word counter impacts
        sfx.add(impact(0.35, 70), 18.5 + k * BEAT, gain=0.45)
    sfx.add(riser(1.0, 300, 9000), 21.0, gain=0.9)
    sfx.add(rev_cymbal(1.0), 21.0, gain=0.8)
    sfx.add(impact(1.6, 38), 22.0, gain=1.0)             # climax hit
    sfx.add(filt(noise(3), "highpass", 5000) * np.exp(-tt(3) * 1.5) * 0.15, 22.0)
    sfx.add(impact(0.5, 60), 23.25, gain=0.5)
    sfx.add(rev_cymbal(1.5), 24.5, gain=1.0)
    sfx.add(riser(1.0, 300, 7000), 25.0, gain=0.7)
    # final cinematic hit: boom + low brass swell
    sfx.add(impact(2.2, 34), 26.0, gain=1.1)
    t = tt(3.5)
    brass = sum(saw(midi(m) * (1 + 0.002 * i), t) for i, m in enumerate([26, 38, 45, 50]))
    brass = filt(brass, "lowpass", 600) * np.exp(-t * 0.9) * np.minimum(1, t / 0.02) * 0.12
    sfx.add(brass, 26.0)
    sfx.add(whoosh(1.6, 3000, 200, 0.2), 26.05, gain=0.6)  # pull back to Ukraine
    sfx.add(impact(0.6, 55), 27.25, gain=0.45)
    t = tt(2.5)
    sfx.add(sum(np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 1.4) for m in (74, 81, 86)) * 0.05, 27.95, pan=0.2)  # bell shimmer
    return pads, bass, drums, arps, sfx, amb, choirs, kicks


def sidechain(kicks, depth=0.55, rel=7.0):
    g = np.ones(N)
    imp = np.zeros(N)
    for k in kicks:
        i = int(k * SR)
        if i < N:
            imp[i] = 1
    kern = np.exp(-np.arange(int(0.4 * SR)) / SR * rel)
    env = np.clip(signal.fftconvolve(imp, kern)[:N], 0, 1)
    return g - depth * env


def load_voice(vdir):
    """returns stereo voice bus + envelope (for ducking)"""
    meta_p = os.path.join(vdir, "voice.json")
    if not vdir or not os.path.exists(meta_p):
        return None, None
    meta = json.load(open(meta_p))
    place = {"vo01": 0.30, "vo02": 2.25, "vo03": 7.95, "vo04": 10.3, "vo05": 12.9, "vo06": 14.35, "vo07": 23.35, "vo08": 27.4}
    vb = Bus()
    for name, t0 in place.items():
        sr, x = wavfile.read(os.path.join(vdir, f"{name}.wav"))
        x = x.astype(np.float64) / 32768.0
        x = signal.resample_poly(x, SR, sr)
        x = filt(x, "highpass", 90)
        # presence + gentle warmth
        x = x + 0.25 * signal.sosfilt(sos("bp", (2500, 5000)), x)
        # gentle compression: soft knee on the envelope
        env = np.maximum(signal.sosfilt(sos("lowpass", 20), np.abs(x)), 1e-4)
        gain = np.minimum(1.0, (0.12 / env) ** 0.35)
        x = x * gain
        x = x / (np.abs(x).max() + 1e-9) * 0.8
        fade = int(0.01 * SR)
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
        vb.add(x, t0, gain=1.0, pan=0.0)
    mono = np.abs(vb.x[:, 0])
    env = signal.sosfilt(sos("lowpass", 6), mono)
    env = np.clip(env / (env.max() + 1e-9) * 3.0, 0, 1)
    env = signal.sosfilt(sos("lowpass", 3), env)
    return vb.x, np.clip(env * 1.6, 0, 1)


def main():
    vdir = sys.argv[1] if len(sys.argv) > 1 else ""
    out = sys.argv[2] if len(sys.argv) > 2 else "soundtrack.wav"
    pads, bass, drums, arps, sfx, amb, choirs, kicks = build()
    sc = sidechain(kicks)[:, None]
    ir_big, ir_mid = reverb_ir(2.8, 4500, 1), reverb_ir(1.4, 6000, 2)

    music = pads.x * sc * 0.95 + bass.x * sc * 0.7 + drums.x * 0.75 + arps.x * sc * 0.7 + choirs.x * 1.0
    wet = convolve_st(pads.x * 0.4 + arps.x * 0.6 + choirs.x * 0.9 + drums.x * 0.12, ir_big)
    music = music + wet * 0.55
    fx = sfx.x + amb.x
    fx = fx + convolve_st(sfx.x, ir_mid) * 0.35

    voice, venv = load_voice(vdir)
    if voice is not None:
        duck = (1 - 0.5 * venv)[:, None]
        music = music * duck
        fx = fx * (1 - 0.3 * venv)[:, None]
        voice = voice + convolve_st(voice, ir_mid) * 0.08
        mix = music + fx * 0.9 + voice * 0.95
    else:
        mix = music + fx * 0.9

    # master: gentle glue + soft limiter, clean fade to silence at 30.0 s
    mix = filt(mix.T, "highpass", 25).T
    peak = np.abs(mix).max()
    mix = mix / peak * 1.25
    mix = np.tanh(mix) / np.tanh(1.25) * 0.87
    t = np.arange(N) / SR
    fade = np.clip((29.95 - t) / 1.2, 0, 1) ** 1.5
    mix *= fade[:, None]
    mix[:int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
    wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
    print("wrote", out, f"{N / SR:.2f}s", "voice" if voice is not None else "no voice")


if __name__ == "__main__":
    main()
