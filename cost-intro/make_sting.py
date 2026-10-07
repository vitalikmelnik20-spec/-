"""6-second music sting for the intro (112 BPM, synthesised with the shared toolkit; no samples).
    python3 make_sting.py assets/sting.wav"""
import os, sys
import numpy as np
from scipy.io import wavfile
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "audio"))
import soundtrack as S
DUR = 6.0; S.DUR = DUR; S.N = int(S.SR * DUR)
BEAT = 60 / 112
drm, mus, fx = S.Bus(), S.Bus(), S.Bus()
fx.add(S.riser(BEAT * 4, 200, 8000), 0, gain=0.45)              # bar 1: riser into the drop
for k in range(4): drm.add(S.hat(), k * BEAT / 2 + BEAT * 2, gain=0.15)
drop = BEAT * 4
fx.add(S.impact(1.6, 38), drop, gain=0.9)
for b in range(int((DUR - drop) / BEAT) + 1):                    # bars 2-3: kick on every beat, 808 + stabs
    t = drop + b * BEAT
    if t > DUR - 0.3: break
    drm.add(S.kick(), t, gain=0.9)
    if b % 2: drm.add(S.clap(), t, gain=0.5)
    drm.add(S.hat(), t + BEAT / 2, gain=0.25)
    mus.add(S.bass_note(33 if (b // 2) % 2 == 0 else 36, BEAT * 0.9, 1.6), t, gain=0.6)
    mus.add(S.pluck([69, 72, 76, 79][b % 4], 0.3, 4200), t + BEAT / 2, gain=0.3)
fx.add(S.impact(2.0, 34), drop + BEAT * 6, gain=0.7)             # end hit on the lock-up
mix = drm.x * 0.8 + mus.x * 0.8 + fx.x * 0.7
mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * 0.85
t = np.arange(S.N) / S.SR; mix *= np.clip((DUR - 0.02 - t) / 0.4, 0, 1)[:, None]
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else "assets/sting.wav", S.SR, (mix * 32767).astype(np.int16))
print("sting ok, drop at", round(drop, 3), "s")
