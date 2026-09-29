"""Soundtrack for "Hannover in 30 Sekunden": upbeat synthesised electronic track
(reusing the instruments of the Lviv short), SFX locked to the visuals, German
voice-over with ducking.   python src/soundtrack.py out.wav"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src", "audio"))
import soundtrack as S  # Lviv synth: kick, clap, hat, pluck, bass_note, pad_chord, impact, riser, whoosh, ...

SR, N = S.SR, S.N
tl = json.load(open("src/timeline.json")); sc = tl["scenes"]
pads, bass, drums, arps, sfx = S.Bus(), S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
BEAT = 0.5
CH = {"Am": [57, 60, 64, 69], "F": [53, 57, 60, 65], "C": [55, 60, 64, 67], "G": [55, 59, 62, 67]}
ROOT = {"Am": 45, "F": 41, "C": 48, "G": 43}
prog_ = ["Am", "F", "C", "G"]
for bar in range(15):
    t0 = bar * 2.0; c = prog_[bar % 4]
    pads.add(S.pad_chord(CH[c], 2.9), t0, gain=0.9 if bar else 0.6)
    if bar >= 1:
        for k in range(8): bass.add(S.bass_note(ROOT[c] - 12 * (k % 4 == 3) + 12, 0.22, 1.5), t0 + k * 0.25, gain=0.5)
        tones = [m + 12 for m in CH[c]]
        for k in range(16):
            if bar < 13 or k < 8: arps.add(S.pluck(tones[[0, 2, 1, 3][k % 4]], 0.25, 3000), t0 + k * 0.125, gain=0.2, pan=-0.4 if k % 2 else 0.4)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb >= 29.5: continue
        if bar >= 1: drums.add(S.kick(), tb, gain=0.85); kicks.append(tb)
        if bar >= 1 and b % 2 == 1: drums.add(S.clap(), tb, gain=0.5)
        if bar >= 1: drums.add(S.hat(), tb + 0.25, gain=0.3, pan=0.3); drums.add(S.hat(), tb + 0.125, gain=0.12, pan=-0.3); drums.add(S.hat(), tb + 0.375, gain=0.12, pan=-0.3)
# sound design
sfx.add(S.impact(1.3, 40), 0.0, gain=0.7)
sfx.add(S.impact(1.0, 46), 0.25, gain=0.9)
sfx.add(S.riser(1.6, 250, 6000), sc["f1"] - 1.6, gain=0.5)
for k in ("f1", "f2", "f3", "f4", "f5", "out"):
    sfx.add(S.whoosh(0.6, 400, 5000, 0.5), sc[k] - 0.3, gain=0.9)
    sfx.add(S.tick_hit(), sc[k] + 0.05, gain=0.5)
for i in range(36):  # Roter Faden: a pop per sight
    t = sc["f2"] + 0.3 + (i + 0.5) / 36 * 3.3 * (1 - 0) ; sfx.add(S.tick_hit() * 0.5, t, gain=0.25, pan=(i % 5 - 2) / 3)
def ding():
    t = S.tt(1.5); return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(1320, 0.4, 3), (1760, 0.3, 3.5), (2640, 0.1, 5)]) * 0.15
sfx.add(ding(), sc["f3"] + 4.0, gain=0.8)
water = S.filt(S.noise(4.5), "bp", (800, 7000)) * np.minimum(1, S.tt(4.5) / 0.6) * np.minimum(1, (4.5 - S.tt(4.5)) / 0.8) * 0.12
sfx.add(water, sc["f4"] + 0.3, gain=1.0)
sfx.add(S.impact(0.8, 50), sc["f5"] + 1.6, gain=0.7)
sfx.add(S.impact(2.0, 34), sc["out"], gain=0.9)
# voice
voice = np.zeros(N)
for key, t0 in tl["voice"].items():
    sr, x = wavfile.read(f"assets/voice/{key}.wav"); x = x.astype(np.float64) / 32768
    x = signal.resample_poly(x, SR, sr); x = S.filt(x, "highpass", 80); x = x + 0.2 * signal.sosfilt(S.sos("bp", (2500, 5000)), x)
    x = x / (np.abs(x).max() + 1e-9) * 0.85
    i = int(t0 * SR); n = min(len(x), N - i); voice[i:i + n] += x[:n]
venv = np.clip(signal.sosfilt(S.sos("lowpass", 6), np.abs(voice)) * 6, 0, 1)
sc_ = S.sidechain(kicks)[:, None]
music = pads.x * sc_ + bass.x * sc_ * 0.7 + drums.x * 0.7 + arps.x * sc_ * 0.7
music = music + S.convolve_st(pads.x * 0.4 + arps.x * 0.5, S.reverb_ir(2.2, 5000, 1)) * 0.4
music *= (1 - 0.6 * venv)[:, None]
fx = (sfx.x + S.convolve_st(sfx.x, S.reverb_ir(1.2, 6000, 2)) * 0.3) * (1 - 0.3 * venv)[:, None]
mix = music * 0.8 + fx * 0.8 + voice[:, None] * 1.0
mix = S.filt(mix.T, "highpass", 25).T
mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.87
t = np.arange(N) / SR; mix *= (np.clip((29.95 - t) / 1.0, 0, 1) ** 1.5)[:, None]
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else "render/audio/mix.wav", SR, (mix * 32767).astype(np.int16))
print("ok")
