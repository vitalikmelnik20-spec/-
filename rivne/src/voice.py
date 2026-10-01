"""Ukrainian male voice-over (robinhad/ukrainian-tts v6, voice "Dmytro", local CPU) + timeline.
    .tts/venv/bin/python src/voice.py .tts/model [voice]
Writes assets/voice/*.wav and src/timeline.json (scene starts, voice starts, caption cues).
Stress is marked with '+' before the stressed vowel.
"""
import json, os, sys
import numpy as np
import soundfile as sf
import torch
from kaldiio import load_ark
from espnet2.bin.tts_inference import Text2Speech

DUR = 40.0
LINES = [  # (scene key, text for TTS)
    ("hook", "р+івне. п'+ять ф+актів, як+і теб+е зд+ивують!"),
    ("f1", "од+ин. впер+ше р+івне зг+адується в л+ітописі тис+яча дв+істі в+ісімдесят тр+етього р+оку."),
    ("f2", "дв+а. кол+ись посер+еду р+ічки +усті, на +острові, сто+яв пал+ац кн+язів любом+ирських."),
    ("f3", "тр+и. зовс+ім пор+уч, т+унель ох+ання. цей зел+ений кор+идор зн+ає в+есь св+іт."),
    ("f4", "чот+ири. рівн+енщина, бурштин+овий кр+ай укра+їни. с+онячний к+амінь тут шук+ають в+іками."),
    ("f5", "п'+ять. на рівн+енщині стоять базальт+ові стовп+и. +їм п+онад п+івмільярда р+оків!"),
    ("out", "а т+и вж+е б+ув у р+івному? п+иши в коментар+ях!"),
]
SUB = {  # on-screen spelling
    "hook": "Рівне. 5 фактів, які тебе здивують!",
    "f1": "1. Вперше Рівне згадується в літописі 1283 року.",
    "f2": "2. Колись посеред річки Усті, на острові, стояв палац князів Любомирських.",
    "f3": "3. Зовсім поруч — Тунель кохання. Цей зелений коридор знає весь світ.",
    "f4": "4. Рівненщина — бурштиновий край України. Сонячний камінь тут шукають віками.",
    "f5": "5. На Рівненщині стоять базальтові стовпи. Їм понад півмільярда років!",
    "out": "А ти вже був у Рівному? Пиши в коментарях!",
}


def synth(model_dir, voice):
    torch.manual_seed(7); np.random.seed(7)
    cwd = os.getcwd(); os.chdir(model_dir)  # config refers to feats_stats.npz relatively
    tts = Text2Speech(train_config="config.yaml", model_file=None, device="cpu")
    state = torch.load("model.pth", map_location="cpu")  # discriminator keys are training-only
    res = tts.model.load_state_dict(state, strict=False)
    bad = [k for k in res.missing_keys + res.unexpected_keys if "discriminator" not in k]
    assert not bad, bad
    tts.model.eval()
    xv = {k: v for k, v in load_ark("spk_xvector.ark")}
    os.chdir(cwd)
    durs = {}
    for key, text in LINES:
        with torch.no_grad():
            wav = tts(text, spembs=xv[voice][0])["wav"].view(-1).cpu().numpy()
        # trim leading/trailing silence
        nz = np.where(np.abs(wav) > 0.02 * np.abs(wav).max())[0]
        wav = wav[max(0, nz[0] - 400): nz[-1] + 1200]
        wav = wav / (np.abs(wav).max() + 1e-9) * 0.9  # avoid clipping on PCM_16
        sf.write(f"assets/voice/{key}.wav", wav, tts.fs, "PCM_16")
        durs[key] = len(wav) / tts.fs
        print(key, round(durs[key], 2))
    return durs


def chunks_of(text):
    out, cur = [], ""
    for wd in text.split():
        if cur and (len(cur) + len(wd) > 22 or cur[-1] in ".!?"):
            out.append(cur); cur = wd
        else:
            cur = (cur + " " + wd).strip()
    out.append(cur)
    return out


def main():
    model_dir = sys.argv[1]; voice = sys.argv[2] if len(sys.argv) > 2 else "dmytro"
    os.makedirs("assets/voice", exist_ok=True)
    durs = synth(model_dir, voice)
    # scene = lead-in + voice + breath; the outro keeps a 0.5 s hold before the end
    lead = {"hook": 0.4}
    t = 0.0; scenes = {}
    for key, _ in LINES:
        scenes[key] = t
        t += lead.get(key, 0.35) + durs[key] + 0.45
    target = DUR - 0.9
    gaps_total = t - sum(durs.values())
    gap_scale = (target - sum(durs.values())) / gaps_total
    t = 0.0; voice_at = {}
    for key, _ in LINES:
        scenes[key] = round(t, 3)
        st = t + lead.get(key, 0.35) * gap_scale
        voice_at[key] = round(st, 3)
        t = st + durs[key] + 0.45 * gap_scale
    subs = []
    for key, _ in LINES:
        ch = chunks_of(SUB[key]); tot = sum(len(c) + 4 for c in ch); t0 = voice_at[key]
        for c in ch:
            d = durs[key] * (len(c) + 4) / tot
            subs.append({"s": round(t0, 3), "e": round(t0 + d, 3), "text": c}); t0 += d
        subs[-1]["e"] = round(subs[-1]["e"] + 0.25, 3)
    json.dump({"scenes": {**scenes, "end": DUR}, "voice": voice_at, "durs": durs, "subs": subs},
              open("src/timeline.json", "w"), indent=1, ensure_ascii=False)
    print("spoken", round(sum(durs.values()), 2), "gap scale", round(gap_scale, 3), scenes)


if __name__ == "__main__":
    main()
