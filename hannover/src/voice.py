"""German male voice-over (Piper TTS, voice "Thorsten", runs locally on CPU) + timeline.
    python src/voice.py <model.onnx> [length_scale]
Writes assets/voice/*.wav and src/timeline.json (scene starts + subtitle cues).
"""
import json, os, sys, wave
from piper import PiperVoice

LINES = [  # (scene key, text)
    ("hook", "Hannover. Fünf Fakten, die kaum jemand kennt."),
    ("f1", "Eins: Über hundert Jahre lang regierten Hannovers Herrscher auch Großbritannien."),
    ("f2", "Zwei: Ein roter Strich auf dem Pflaster führt zu sechsunddreißig Sehenswürdigkeiten."),
    ("f3", "Drei: Im Neuen Rathaus fährt ein Aufzug schräg, im Bogen bis unter die Kuppel."),
    ("f4", "Vier: Die Große Fontäne in Herrenhausen schießt über siebzig Meter hoch."),
    ("f5", "Fünf: Hier liegt das größte Messegelände der Welt."),
    ("out", "Warst du schon mal in Hannover?"),
]
SUB = {  # on-screen spelling (digits instead of spelled-out numbers)
    "f2": "Zwei: Ein roter Strich auf dem Pflaster führt zu 36 Sehenswürdigkeiten.",
    "f4": "Vier: Die Große Fontäne in Herrenhausen schießt über 70 Meter hoch.",
}
model = sys.argv[1]; ls = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
os.makedirs("assets/voice", exist_ok=True)
v = PiperVoice.load(model)
durs = {}
for key, text in LINES:
    p = f"assets/voice/{key}.wav"
    with wave.open(p, "wb") as w:
        try:
            from piper import SynthesisConfig
            v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=ls))
        except ImportError:
            v.synthesize(text, w, length_scale=ls)
    with wave.open(p) as w: durs[key] = w.getnframes() / w.getframerate()
    print(key, round(durs[key], 2))
# scene layout: each scene = short lead-in + voice + breath; outro keeps a 0.5 s hold before 30 s
lead = {"hook": 0.35}
scenes, t = {}, 0.0
for key, _ in LINES:
    scenes[key] = round(t, 3)
    t += lead.get(key, 0.3) + durs[key] + 0.35
scale = (29.2 - 0.5) / t if t > 28.7 else 1.0
scenes = {k: round(v * scale, 3) for k, v in scenes.items()}
voice_at, subs = {}, []
keys = [k for k, _ in LINES]
for i, (key, text) in enumerate(LINES):
    st = scenes[key] + lead.get(key, 0.3) * scale
    voice_at[key] = round(st, 3)
    # short caption chunks (<= ~30 chars) timed by character share
    words, chunks, cur = SUB.get(key, text).split(), [], ""
    for wd in words:
        if cur and (len(cur) + len(wd) > 24 or cur.endswith(":")): chunks.append(cur); cur = wd
        else: cur = (cur + " " + wd).strip()
    chunks.append(cur)
    tot = sum(len(c) + 4 for c in chunks); t0 = st
    for c in chunks:
        d = durs[key] * (len(c) + 4) / tot
        subs.append({"s": round(t0, 3), "e": round(t0 + d, 3), "text": c}); t0 += d
    subs[-1]["e"] = round(subs[-1]["e"] + 0.2, 3)
json.dump({"scenes": {**scenes, "end": 30.0}, "voice": voice_at, "durs": durs, "subs": subs}, open("src/timeline.json", "w"), indent=1, ensure_ascii=False)
print("spoken total", round(sum(durs.values()), 2), "scale", round(scale, 3), scenes)
