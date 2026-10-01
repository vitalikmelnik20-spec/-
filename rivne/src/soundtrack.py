"""Soundtrack for "Рівне за 40 секунд": bright, upbeat synthesised track at 120 BPM
(I-V-vi-IV in C major, built from the Lviv short's instruments), SFX locked to the
visuals, Ukrainian voice-over with ducking.   python src/soundtrack.py out.wav"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src", "audio"))
import soundtrack as S  # Lviv synth: kick, clap, hat, pluck, bass_note, pad_chord, impact, riser, whoosh, ...

DUR = 40.0
S.DUR = DUR; S.N = int(S.SR * DUR)  # the synth reads N at call time -> 40 s buses
SR, N = S.SR, S.N
tl = json.load(open("src/timeline.json")); sc = tl["scenes"]
pads, bass, drums, arps, lead, sfx = S.Bus(), S.Bus(), S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
BEAT = 0.5
CH = {"C": [60, 64, 67, 72], "G": [59, 62, 67, 71], "Am": [57, 60, 64, 69], "F": [57, 60, 65, 69]}
ROOT = {"C": 36, "G": 43, "Am": 45, "F": 41}
prog_ = ["C", "G", "Am", "F"]
drop = sc["f1"]
HOOK = [76, 79, 81, 79, 76, 74, 72, 74]  # catchy 8-note motif, played on the fact scenes
for bar in range(20):
    t0 = bar * 2.0; c = prog_[bar % 4]
    if t0 >= DUR - 0.5: break
    pads.add(S.pad_chord(CH[c], 2.9), t0, gain=0.55 if t0 < drop else 0.8)
    tones = [m + 12 for m in CH[c]]
    for k in range(16):  # 16th-note arpeggio throughout (filtered darker before the drop)
        tk = t0 + k * 0.125
        if tk >= DUR - 0.6: break
        arps.add(S.pluck(tones[[0, 2, 1, 3][k % 4]], 0.22, 2200 if tk < drop else 4200), tk, gain=0.16 if tk < drop else 0.2, pan=-0.45 if k % 2 else 0.45)
    if t0 + 2.0 <= drop: continue
    for k in range(8):  # driving off-beat bass
        tk = t0 + k * 0.25
        if tk < drop or tk >= DUR - 0.6: continue
        bass.add(S.bass_note(ROOT[c] + 12 * (k % 2), 0.2, 1.6), tk, gain=0.5)
    if bar % 2 == 1:
        for i, m in enumerate(HOOK):
            tk = t0 - 2.0 + i * 0.5
            if drop <= tk < sc["out"] - 0.2: lead.add(S.pluck(m, 0.45, 5000), tk, gain=0.22, pan=0.1)
    for b in range(4):
        tb = t0 + b * BEAT
        if tb < drop or tb >= DUR - 0.6: continue
        drums.add(S.kick(), tb, gain=0.9); kicks.append(tb)
        if b % 2 == 1: drums.add(S.clap(), tb, gain=0.55)
        drums.add(S.hat(), tb + 0.25, gain=0.32, pan=0.3)
        drums.add(S.hat(), tb + 0.125, gain=0.12, pan=-0.3); drums.add(S.hat(), tb + 0.375, gain=0.12, pan=-0.3)
# hook: tension build into the drop
for k in range(int(drop / 0.25)):
    tk = k * 0.25
    if tk > 1.0: drums.add(S.hat(), tk, gain=0.08 + 0.2 * tk / drop, pan=0.2)
for k in range(8):  # snare-roll style claps accelerating into the drop
    drums.add(S.clap(), drop - 1.0 + k * 0.125, gain=0.15 + k * 0.05)
sfx.add(S.impact(1.4, 40), 0.15, gain=0.9)
sfx.add(S.riser(drop - 0.6, 250, 7000), 0.6, gain=0.45)
sfx.add(S.impact(1.6, 38), drop, gain=0.8)
# scene transitions
for k in ("f1", "f2", "f3", "f4", "f5", "out"):
    sfx.add(S.whoosh(0.6, 400, 6000, 0.5), sc[k] - 0.32, gain=0.9)
    sfx.add(S.tick_hit(), sc[k] + 0.12, gain=0.5)
def ding(f0=1320, amp=0.15):
    t = S.tt(1.5); return sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in [(1, 0.4, 3), (4 / 3, 0.3, 3.5), (2, 0.1, 5)]) * amp
# f1: the four year digits land
for i in range(4):
    sfx.add(S.tick_hit(), sc["f1"] + 0.8 + i * 0.22 + 0.9, gain=0.7, pan=(i - 1.5) / 2)
sfx.add(ding(1047), sc["f1"] + 2.35, gain=0.8)
# f2: water
water = S.filt(S.noise(5.0), "bp", (500, 5000)) * np.minimum(1, S.tt(5.0) / 0.8) * np.minimum(1, (5.0 - S.tt(5.0)) / 0.8) * 0.08
sfx.add(water, sc["f2"] + 0.2, gain=1.0)
sfx.add(ding(1568), sc["f2"] + 1.7, gain=0.6)
# f3: heart pops
for i in range(8):
    sfx.add(ding(1760 + 220 * (i % 3), 0.07), sc["f3"] + 0.5 + i * 0.5, gain=0.6, pan=(i % 5 - 2) / 3)
# f4: amber sparkles
for i in range(12):
    sfx.add(ding(2093 + 262 * (i % 4), 0.05), sc["f4"] + 0.4 + i * 0.27, gain=0.6, pan=(i % 5 - 2) / 2.5)
# f5: columns thump up, counter lands
for i in range(10):
    sfx.add(S.impact(0.3, 60 + i * 2), sc["f5"] + 0.3 + i * 0.12, gain=0.25)
sfx.add(S.impact(0.9, 46), sc["f5"] + 1.1, gain=0.7)
# outro: big hit + confetti pops
sfx.add(S.impact(2.2, 34), sc["out"], gain=0.9)
for i in range(10):
    sfx.add(S.tick_hit() * 0.6, sc["out"] + 0.25 + i * 0.09, gain=0.3, pan=(i % 5 - 2) / 2)
# voice
voice = np.zeros(N)
for key, t0 in tl["voice"].items():
    sr, x = wavfile.read(f"assets/voice/{key}.wav"); x = x.astype(np.float64) / 32768
    x = signal.resample_poly(x, SR, sr); x = S.filt(x, "highpass", 80); x = x + 0.25 * signal.sosfilt(S.sos("bp", (2500, 5000)), x)
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    i = int(t0 * SR); n = min(len(x), N - i); voice[i:i + n] += x[:n]
venv = np.clip(signal.sosfilt(S.sos("lowpass", 6), np.abs(voice)) * 6, 0, 1)
sc_ = S.sidechain(kicks)[:, None]
music = pads.x * sc_ + bass.x * sc_ * 0.75 + drums.x * 0.7 + arps.x * sc_ * 0.7 + lead.x * 0.8
music = music + S.convolve_st(pads.x * 0.4 + arps.x * 0.5 + lead.x * 0.5, S.reverb_ir(2.0, 6000, 1)) * 0.4
music *= (1 - 0.55 * venv)[:, None]
fx = (sfx.x + S.convolve_st(sfx.x, S.reverb_ir(1.2, 6000, 2)) * 0.3) * (1 - 0.3 * venv)[:, None]
mix = music * 0.8 + fx * 0.75 + voice[:, None] * 1.05
mix = S.filt(mix.T, "highpass", 25).T
mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.87
t = np.arange(N) / SR; mix *= (np.clip((DUR - 0.05 - t) / 1.2, 0, 1) ** 1.5)[:, None]
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else "render/audio/mix.wav", SR, (mix * 32767).astype(np.int16))
print("ok")
