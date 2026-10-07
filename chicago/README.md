# Chicago: the real cost of living (YouTube Short)

**Output:** `output/chicago_cost_of_living_40s.mp4`. It is a 40.000 s vertical video, 1080×1920 at 30 fps, encoded as H.264 with AAC audio. All on-screen text is burned in, and the file has no logos or watermarks. The final 0.5 s (15 frames) is a pixel-identical hold.

## Figures used

All figures are the approximate 2026 reference values supplied in the brief. They were not independently re-sourced here.

| Category | On screen | Note shown |
|---|---|---|
| Rent, 1-bedroom | ~$2,457/month | "Average asking rent · citywide", "Varies a lot by neighborhood" |
| Groceries | ~$386/month | "1 adult estimate" |
| Casual restaurant meal | ~$20 | |
| Cappuccino | ~$5.51 | |
| CTA 30-day pass | $85 | "Regular fare pass" |
| Utilities | ~$186 | |
| Internet + phone | ~$131 | |

The monthly total is an illustrative sum of the monthly categories shown. Rent, food, transit, utilities and internet + phone add up to a subtotal of $3,245. Allowing for some eating out and coffee, it is presented as "≈ $3,200–$3,300", with the notes "Before healthcare, insurance, taxes & entertainment" and "Illustrative budget from the categories shown". The video has no charts and makes no claim to be an official statistic. A header that stays on screen reads "CHICAGO, IL · 2026 · APPROX. COSTS".

## Voice-over

The voice is Kokoro-82M with the American English voice `af_heart`, running locally. It is delivered at 1.10–1.25× speed in an energetic creator style. Each line starts just after its scene cut, and every price animation lands on the moment the narrator says that number. These cue times are measured from the real audio by synthesising each line's prefix.

The brief's script reads at about 49 s at a natural pace, which does not fit into 40 s. These lines were tightened without changing any figure:

| Brief | Spoken |
|---|---|
| "…averages around twenty-four hundred fifty-seven dollars a month." | "…averages around twenty-four fifty-seven a month." |
| "…works out to roughly three hundred eighty-six dollars…" | "…is roughly three hundred eighty-six dollars…" |
| "An inexpensive restaurant meal is about twenty dollars, and a cappuccino is around five-fifty." | "A casual meal, about twenty dollars. A cappuccino, around five-fifty." |
| "Utilities can add roughly … while internet and phone can push that total even higher." | "Utilities add roughly one hundred eighty-six dollars, and internet and phone push it even higher." |
| "…three thousand two hundred to three thousand three hundred dollars a month." | "…thirty-two to thirty-three hundred dollars a month." |
| "So… would you live here for that price? Comment YES or NO." | "Would you live here for that price? Comment yes or no!" |

## Sound

- **Music:** an original synthesised urban/electronic track at 112 BPM in a minor key. It uses an 808 bass, trap hats, plucks, pads and stabs. It builds from the hook through to the total reveal at 31.6 s, drops out at 34.0 s and returns on the cinematic hit at 34.9 s.
- **Effects:**
  - money: cha-ching, coins on each price, cash-counter ticks and calculator clicks;
  - transitions: whooshes and a zoom whip;
  - interface: notifications, a tap-to-pay beep and digital blips as the $85 locks in;
  - objects: the L train passing, a shopping cart, item pops, a plate, an espresso hiss and a cup clink, paper bills.
- **Ambience:** city, supermarket, restaurant and coffee-shop beds.
- **Mix:** the music is ducked under the voice, so the voice sits about 10 dB above the background. The mix is at about −14.6 LUFS with a −1.4 dBFS peak.

## Build

```bash
./make_video.sh               # mix -> 1200 frames (headless Chromium) -> MP4 -> verify
FORCE_TTS=1 ./make_video.sh   # also re-synthesise the voice-over
node render/snapshot.mjs 6.5 31.8   # single frames -> render/snapshots/
```

Graphics are drawn with Canvas 2D in `src/art.js` (illustrations and the cached skyline) and `src/scenes.js` (scenes, camera and transitions). Every frame is a pure function of time.
