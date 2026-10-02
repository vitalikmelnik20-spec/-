"""German female voice-over for the Wiesn 2026 intro.
Model: Coqui VITS trained on CSS10 German (one native female speaker), runs locally on CPU.
    .tts/venv/bin/python voice.py
Writes voice/<n>.wav (one per line), voice.mp3 (20 s voice-only track) and voice.json (timing).
Each line starts shortly after its scene starts; if it would not fit its window,
the speaking rate (VITS length_scale) is raised until it does.
"""
import json, os, subprocess
import numpy as np
import soundfile as sf
from TTS.api import TTS

MODEL = ".tts/tts_models--de--css10--vits"
DUR = 20.0
LINES = [  # (start, window end, text)
    (0.15, 3.0, "Fünfzehn Euro neunzig für eine Maß."),
    (3.15, 6.0, "Über elf Euro für einen Liter Wasser."),
    (6.15, 9.5, "Dreißigtausend Euro für einen Gang zur Toilette."),
    (9.55, 14.05, "Ein geklauter Rollator, tausend verschwundene Krüge, und ein Vogel im Bierzelt."),
    # the script's "Das ist die Wiesn 2026: ..." needs >5 s at a natural pace; the spoken line follows
    # the on-screen title instead, with the year said the colloquial way ("zwanzig sechsundzwanzig")
    (14.1, 18.5, "Wiesn zwanzig sechsundzwanzig: alle Preise, alle Kuriositäten."),
    (18.5, 19.95, "In zwanzig Minuten."),  # right after the badge pops in (18.0–18.35)
]
GAP = 0.2  # breathing room before the next scene

# the released config points speakers_file at the original author's HF cache; use the bundled copy
cfg = json.load(open(f"{MODEL}/config.json"))
cfg["model_args"]["speakers_file"] = os.path.abspath(f"{MODEL}/speaker_ids.json")
json.dump(cfg, open(f"{MODEL}/config_local.json", "w"), indent=1)
tts = TTS(model_path=f"{MODEL}/model_file.pth.tar", config_path=f"{MODEL}/config_local.json", progress_bar=False)
model = tts.synthesizer.tts_model
SR = tts.synthesizer.output_sample_rate


def trim(x):
    nz = np.where(np.abs(x) > 0.015 * np.abs(x).max())[0]
    return x[max(0, nz[0] - int(0.03 * SR)): nz[-1] + int(0.08 * SR)]


def synth(text, ls):
    model.length_scale = ls
    np.random.seed(0)
    import torch; torch.manual_seed(0)
    return trim(np.asarray(tts.tts(text.lower()), dtype=np.float64))


def tighten(x, max_pause):
    """shorten pauses inside a line to at most max_pause seconds (10 ms crossfade at each cut)"""
    hop = int(0.01 * SR)
    fr = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    quiet = fr < 0.03 * fr.max()
    keep = np.ones(len(x), bool); i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            run = (j - i) * hop
            if run > max_pause * SR:
                a = i * hop + int(max_pause * SR / 2); b = j * hop - int(max_pause * SR / 2)
                keep[a:b] = False
            i = j
        else: i += 1
    y = x[keep]
    return y


os.makedirs("voice", exist_ok=True)
track = np.zeros(int(DUR * SR))
meta = []
for i, (t0, t1, text) in enumerate(LINES):
    room = t1 - t0 - GAP
    ls, mp = 0.92, 0.22   # a lively promo pace; the CSS10 narrator reads at audiobook speed
    x = tighten(synth(text, ls), mp)
    while len(x) / SR > room and ls > 0.70:   # ~4.5-5 syllables/s at the floor = normal speech
        ls = round(ls - 0.02, 3)
        x = tighten(synth(text, ls), mp)
    if len(x) / SR > room:                     # last resort: even shorter pauses
        x = tighten(x, 0.12); mp = 0.12
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    sf.write(f"voice/{i + 1}.wav", x, SR, "PCM_16")
    a = int(t0 * SR); n = min(len(x), len(track) - a)
    track[a:a + n] += x[:n]
    meta.append({"start": t0, "end": round(t0 + len(x) / SR, 3), "window_end": t1, "length_scale": ls, "max_pause": mp, "text": text})
    print(f"{i + 1}: {t0:5.2f}-{t0 + len(x) / SR:5.2f}s (window to {t1}) ls={ls} pause<={mp}s  {text}")
sf.write("voice/track.wav", track, SR, "PCM_16")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "voice/track.wav", "-ar", "44100", "-ac", "1", "-b:a", "192k", "voice.mp3"], check=True)
json.dump({"sr": SR, "lines": meta}, open("voice.json", "w"), ensure_ascii=False, indent=1)
print("voice.mp3 written")
