"""Music + SFX + voice mix for "Bern - Lebenshaltungskosten" (all audio generated locally, no samples).
    python3 src/soundtrack.py [out.wav]
Same documentary/electronic underscore family as the Olympia Short (96 BPM, D minor): soft pulse that
builds through rent and monthly costs, peaks on the monthly total, lifts to a brighter voicing for the
salary, tightens with a riser into the purchase price and lands a stop-time hit on the final question. SFX sit on scene cuts and on the animation of each number, never on top of
the spoken figure itself. Voice is kept >= ~10 dB above the bed during speech.
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "audio"))
import soundtrack as S  # shared synth toolkit (Lviv / Chicago shorts)

TL = json.load(open("src/timeline.json"))
CUT, CUE, VO, DURS = TL["cuts"], TL["cues"], TL["starts"], TL["durs"]
DUR = TL["frames"] / 30
S.DUR = DUR; S.N = int(S.SR * DUR)
SR, N = S.SR, S.N
tt, filt, midi = S.tt, S.filt, S.midi
rng = np.random.default_rng(7)
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT


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


# ---------------- arrangement ----------------
mus, drm, bass, sfx = S.Bus(), S.Bus(), S.Bus(), S.Bus()
kicks = []
MINOR = [("Dm", [50, 57, 62, 65], 38), ("Bb", [46, 53, 58, 62], 34), ("F", [45, 53, 57, 60], 41), ("C", [48, 55, 60, 64], 36)]
LIFT = [("Bb", [46, 53, 58, 62, 69], 34), ("F", [45, 53, 57, 60, 67], 41), ("C", [48, 55, 60, 64, 67], 36), ("Dm", [50, 57, 62, 65, 69], 38)]
ORDER = ["hook", "rent", "month", "total", "salary", "buy", "cta"]


def section(t):
    for k in reversed(ORDER):
        if t >= CUT[k]: return k
LEVEL = {"hook": 0.45, "rent": 0.7, "month": 0.75, "total": 0.85, "salary": 0.75, "buy": 0.85, "cta": 0.6}
HOLD = CUE["buy.million"] - 0.05      # breakdown under "Fast eine Million!"
STOP = CUE["cta.write"] - 0.12        # stop-time before "Schreib JA oder NEIN"

nbars = int(np.ceil(DUR / BAR)) + 1
for bar in range(nbars):
    t0 = bar * BAR
    if t0 >= DUR: break
    sec = section(t0 + 0.01)
    prog = LIFT if sec == "salary" else MINOR
    name, ch, root = prog[bar % 4]
    mus.add(S.pad_chord(ch, BAR * 1.05), t0, gain=0.42 + (0.15 if sec == "buy" else 0))
    for b in range(16):
        tb = t0 + b * BEAT / 4
        if tb >= DUR - 0.6: break
        sec = section(tb); I = LEVEL[sec]
        if HOLD <= tb < CUT["cta"]: I = 0.35
        if STOP <= tb < STOP + 0.75: continue
        if b % 4 == 0 and (I >= 0.7 or b == 0):
            drm.add(soft_kick(), tb, gain=0.85 if I >= 0.7 else 0.6); kicks.append(tb)
        if b in (4, 12) and I >= 0.8: drm.add(S.clap(), tb, gain=0.32)
        if I >= 0.55: drm.add(shaker(), tb, gain=(0.9 if b % 2 else 0.5) * I, pan=0.35)
        if b % 2 == 0 and I >= 0.45:
            bass.add(pulse_bass(root - 12, BEAT * 0.45), tb, gain=0.55 * (0.6 + 0.4 * I))
        if I >= 0.7 and b % 4 == 2:
            arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12]
            mus.add(keys(arp[(b // 4) % 4], 0.5, 2000 + 1500 * I), tb, gain=0.55 * I, pan=-0.35 if (b // 4) % 2 else 0.35)
        if sec == "salary" and b % 4 == 0:
            mus.add(glass(ch[-1] + 12 + [0, 7, 5, 3][(b // 4) % 4], 1.2), tb, gain=0.8, pan=0.25 * (-1) ** b)


def ticks(t0, t1, n=22, pan=0.0, g=0.42):
    for k in range(n):
        u = k / n; sfx.add(tick(1 + 0.35 * u), t0 + (1 - (1 - u) ** 0.6) * (t1 - t0), gain=g, pan=pan)


# ---------------- SFX (picture events; counters run *into* each spoken figure, never over it) ----------------
sfx.add(S.impact(1.4, 36), 0.0, gain=0.75); sfx.add(S.whoosh(0.6, 250, 6500, 0.3), 0.0, gain=0.7)
sfx.add(S.impact(1.0, 44), CUE["hook.bern"] - 0.02, gain=0.45); sfx.add(chime(1174.7, 1760), CUE["hook.capital"] + 0.1, gain=0.4)
for k in ORDER[1:]:
    sfx.add(S.whoosh(0.5, 300, 7000, 0.55), CUT[k] - 0.22, gain=0.6)
# rent: two counters, a soft stamp after each figure
sfx.add(paper(0.3), CUT["rent"] + 0.4, gain=0.8)
ticks(CUE["rent.out_price"] - 1.0, CUE["rent.out_price"] + 0.05, pan=-0.2)
sfx.add(pop(520), CUE["rent.out"] + 0.1, gain=0.4)
ticks(CUE["rent.center_price"] - 1.0, CUE["rent.center_price"] + 0.05, pan=0.2)
sfx.add(stamp(), CUE["rent.center"] + 0.15, gain=0.35)
# monthly costs: tram bell on the cut, a pop per row, coins after each figure
sfx.add(bus_air(0.8), CUT["month"] + 0.3, gain=0.5)
for i, (row, price) in enumerate((("month.food", "month.food_price"), ("month.health", "month.health_price"), ("month.transport", "month.transport_price"))):
    sfx.add(pop(560 + 90 * i), CUE[row] + 0.02, gain=0.45, pan=(i - 1) * 0.4)
    ticks(CUE[price] - 0.6, CUE[price] + 0.05, n=12, g=0.35)
sfx.add(chime(1568, 2093), CUE["month.transport_price"] + 0.9, gain=0.35)
# total: riser into the range, impact when the range bar lands
sfx.add(S.riser(CUE["total.lo"] - CUE["total.extra"], 200, 6000), CUE["total.extra"], gain=0.18)
ticks(CUE["total.lo"] - 0.8, CUE["total.lo"] + 0.05)
sfx.add(S.impact(1.1, 42), CUE["total.hi"] + 0.9, gain=0.45)
# salary: bright chime, counter
ticks(CUE["salary.price"] - 1.0, CUE["salary.price"] + 0.05, pan=0.15)
sfx.add(chime(1760, 2637), CUE["salary.price"] + 1.0, gain=0.5)
# buy: tension riser, counter, big hit on "Fast eine Million"
sfx.add(S.riser(CUE["buy.price"] - CUT["buy"], 180, 5000), CUT["buy"] + 0.2, gain=0.16)
ticks(CUE["buy.price"] - 1.1, CUE["buy.price"] + 0.05, n=28)
sfx.add(S.impact(1.4, 36), CUE["buy.million"] - 0.03, gain=0.6); sfx.add(downlifter(0.9), CUE["buy.million"] + 0.3, gain=0.35)
# cta
sfx.add(S.riser(STOP - CUT["cta"], 300, 5000), CUT["cta"], gain=0.1)
sfx.add(pop(820), CUE["cta.ja"] + 0.02, gain=0.5, pan=-0.35); sfx.add(pop(560), CUE["cta.nein"] + 0.02, gain=0.5, pan=0.35)
sfx.add(chime(1318.5, 1975.5), CUE["cta.nein"] + 0.4, gain=0.45)
sfx.add(S.whoosh(0.8, 2500, 300, 0.4), DUR - 0.9, gain=0.35)

# ---------------- voice (EQ + gentle levelling) ----------------
voice = np.zeros(N)
for key, t0 in VO.items():
    sr, x = wavfile.read(f"assets/voice/{key}.wav"); x = x.astype(np.float64) / 32768
    x = signal.resample_poly(x, SR, sr)
    x = filt(x, "highpass", 85)
    x = x + 0.18 * filt(x, "bp", (2600, 5500))                   # presence
    x = x - 0.25 * filt(x, "bp", (6500, 9500))                   # tame sibilance
    e = np.sqrt(np.abs(signal.sosfilt(S.sos("lowpass", 12), x ** 2)) + 1e-9)
    x = x * np.minimum(1, (0.12 / e) ** 0.35)                    # soft levelling compressor
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    i = int(t0 * SR); n = min(len(x), N - i); voice[i:i + n] += x[:n]

# ---------------- mix ----------------
duck = np.clip(signal.sosfiltfilt(S.sos("lowpass", 3), np.abs(voice)) * 14, 0, 1)
side = S.sidechain(kicks, depth=0.35)[:, None]
room = S.reverb_ir(1.8, 6000, 5)
music = mus.x * side + bass.x * side + drm.x * 0.7
music = music + S.convolve_st(mus.x * 0.5, room) * 0.35
music = S.filt(music.T, "highpass", 35).T
music *= (1 - 0.8 * duck)[:, None]
fx = (sfx.x + S.convolve_st(sfx.x, S.reverb_ir(0.9, 7000, 4)) * 0.15) * (1 - 0.55 * duck)[:, None]
vox = voice[:, None] * np.ones((1, 2))
bed = music * 0.7 + fx * 0.5
for nm, z in (("music", music), ("fx", fx), ("voice", vox)):
    if not np.isfinite(z).all(): print("NaN in", nm)
act = duck > 0.5
db = lambda z: 10 * np.log10(np.mean(z[act] ** 2) + 1e-12)
print(f"voice/background during speech: {db(vox[:, 0]) - db(bed[:, 0]):+.1f} dB")
mix = bed + vox
mix = np.tanh(mix / np.abs(mix).max() * 1.1) / np.tanh(1.1) * 0.85
t = np.arange(N) / SR
mix *= np.minimum(1, t / 0.004)[:, None] * np.clip((DUR - 0.03 - t) / 0.6, 0, 1)[:, None]
out = sys.argv[1] if len(sys.argv) > 1 else "build/mix.wav"
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("written", out, f"{DUR:.3f}s")
