"""Ukrainian voice-over via the open-source robinhad/ukrainian-tts v6 model
(ESPnet Tacotron2 + HiFi-GAN, runs locally on CPU).

Usage: python voiceover.py <model_dir> <out_dir> [voice]
Stress is marked manually with '+' before the stressed vowel.
"""
import os, sys, json
import numpy as np
import soundfile as sf
from kaldiio import load_ark
from espnet2.bin.tts_inference import Text2Speech
import torch

LINES = [
    ("vo01", "ц+е льв+ів."),
    ("vo02", "м+істо, д+е іст+орія зустріч+ається з суч+асністю."),
    ("vo03", "пл+оща р+инок."),
    ("vo04", "старов+инні в+улиці."),
    ("vo05", "+опера."),
    ("vo06", "+і к+ава, як+а ст+ала част+иною хар+актеру м+іста."),
    ("vo07", "льв+ів в+ажко поясн+ити."),
    ("vo08", "йог+о тр+еба поб+ачити."),
]

def main():
    model_dir, out_dir = sys.argv[1], sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "dmytro"
    os.makedirs(out_dir, exist_ok=True)
    torch.manual_seed(7); np.random.seed(7)
    cwd = os.getcwd(); os.chdir(model_dir)  # config refers to feats_stats.npz relatively
    tts = Text2Speech(train_config="config.yaml", model_file=None, device="cpu")
    # the released checkpoint's GAN discriminator uses an older weight-norm layout;
    # the discriminator is training-only, so load the generator weights non-strictly
    state = torch.load("model.pth", map_location="cpu")
    res = tts.model.load_state_dict(state, strict=False)
    bad = [k for k in res.missing_keys + res.unexpected_keys if "discriminator" not in k]
    assert not bad, bad
    tts.model.eval()
    xv = {k: v for k, v in load_ark("spk_xvector.ark")}
    os.chdir(cwd)
    meta = {}
    for name, text in LINES:
        with torch.no_grad():
            wav = tts(text, spembs=xv[voice][0])["wav"].view(-1).cpu().numpy()
        path = os.path.join(out_dir, f"{name}.wav")
        sf.write(path, wav, tts.fs, "PCM_16")
        meta[name] = {"text": text, "seconds": round(len(wav) / tts.fs, 3), "sr": tts.fs}
        print(name, meta[name])
    json.dump(meta, open(os.path.join(out_dir, "voice.json"), "w"), ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
