"""Narration the author records himself (NOT voiced in the video). Each scene's on-screen time is estimated
from its syllable count at an energetic Shorts pace, so the picture is cut to how the text will be read.
    python3 src/script.py   -> src/timeline.json + prints the teleprompter with timecodes"""
import json, re
SYL_PER_S = 5.6     # energetic Ukrainian narration (~ 2.6-2.8 words/s)
BREATH = 0.35       # pause between sentences
SCENES = [  # (key, [sentences]) - beats inside a scene start at each sentence
    ("hook", ["Що з цінами на заході України цієї осені?", "Даю конкретні цифри.", "Спойлер: оренда просто пробила стелю."]),
    ("lviv", ["Оренда однушки у Львові злетіла з 18 до 25 тисяч гривень!"]),
    ("uzh", ["Двокімнатна в Ужгороді б'є всі рекорди України — 36 тисяч на місяць."]),
    ("frank", ["Франківськ теж підтягнувся до 22 з половиною тисяч за однокімнатну."]),
    ("shop", ["У супермаркетах теж весело.", "Лише за останній місяць яйця злетіли в ціні аж на 44%!", "Цукор додав 8%,", "а молоко та сир подорожчали майже на 7%."]),
    ("plus", ["Але є і плюси.", "Завдяки врожаю фрукти скинули 6% від ціни,", "а овочі стали дешевшими трохи більше ніж на 2%.", "Хоч на борщі зекономимо."]),
    ("cta", ["А скільки ви зараз платите за житло?", "Пишіть своє місто і цифри у коментарі!"]),
]
SPOKEN = {"18": "вісімнадцяти", "25": "двадцяти п'яти", "36": "тридцять шість", "22": "двадцяти двох", "44%": "сорок чотири відсотки",
          "8%": "вісім відсотків", "7%": "сім відсотків", "6%": "шість відсотків", "2%": "два відсотки"}
def syl(s):
    for k, v in SPOKEN.items(): s = s.replace(k, v)
    return len(re.findall(r"[аеєиіїоуюяАЕЄИІЇОУЮЯ]", s))
t, out, tele = 0.25, {}, []
for key, sents in SCENES:
    beats = []
    for s in sents:
        d = syl(s) / SYL_PER_S
        words, acc, total_s = [], 0, max(1, syl(s))
        for w in s.split():                       # word onsets estimated by syllable position
            words.append({"w": w, "t": round(t + d * acc / total_s, 2)}); acc += syl(w)
        beats.append({"t": round(t, 2), "dur": round(d, 2), "text": s, "words": words})
        t += d + BREATH
    t += 0.25 if key != "cta" else 0
    out[key] = {"start": beats[0]["t"], "beats": beats}
total = round(t + 1.2, 2)
cuts = {k: (0 if k == "hook" else round(v["start"] - 0.15, 2)) for k, v in out.items()}
json.dump({"scenes": out, "cuts": cuts, "total": total, "frames": int(total * 30 + 0.999)}, open("src/timeline.json", "w"), indent=1, ensure_ascii=False)
for k, v in out.items():
    for b in v["beats"]: print(f"{b['t']:5.2f}-{b['t']+b['dur']:5.2f}  {b['text']}")
print("total", total)
