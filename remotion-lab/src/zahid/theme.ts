// Design system for "Ціни на заході України" (Ukrainian on-screen text, no narration: the author voices it).
// Scene cuts and beats come from zahid/src/script.py (estimated from syllables at an energetic pace).
import { loadFont } from '@remotion/fonts';
import { Easing, interpolate, staticFile } from 'remotion';
import timeline from '../../public/zahid/timeline.json';

export const FPS = 30;
export const C = {
  navy: '#0B1630', navyDeep: '#060D1D', forest: '#123B33', off: '#F6F2E9', gray: '#AAB4C3', grayDim: '#6E7B8D',
  blue: '#3D8BFF', coral: '#FF4D4D', green: '#3DDC84', yellow: '#FFD23F', ink: '#0B1630',
};
export const HEAD = 'Montserrat';
export const BODY = 'Inter';
for (const [file, weight] of [['Montserrat-Black.ttf', '900'], ['Montserrat-ExtraBold.ttf', '800'], ['Montserrat-Bold.ttf', '700']] as const) loadFont({ family: HEAD, url: staticFile(`fonts/${file}`), weight });
for (const [file, weight] of [['Inter-Medium.ttf', '500'], ['Inter-SemiBold.ttf', '600'], ['Inter-Bold.ttf', '700']] as const) loadFont({ family: BODY, url: staticFile(`fonts/${file}`), weight });

type Beat = { t: number; dur: number; text: string; words: { w: string; t: number }[] };
export const TL = timeline as unknown as { scenes: Record<string, { start: number; beats: Beat[] }>; cuts: Record<string, number>; total: number; frames: number };
export type Tok = { text: string; start: number; end: number; em: null | 'money' | 'good' | 'warn' | 'key' };
export const PAGES: { start: number; end: number; tokens: Tok[] }[] = []; // no captions: the author records the voice

export const f = (s: number) => Math.round(s * FPS);
export const DURATION = TL.frames;
const order = ['hook', 'lviv', 'uzh', 'frank', 'shop', 'plus', 'cta'] as const;
export type SceneKey = (typeof order)[number];
export const CUT = Object.fromEntries(order.map((k) => [k, f(TL.cuts[k])])) as Record<SceneKey, number>;
export const NEXT = Object.fromEntries(order.map((k, i) => [k, i + 1 < order.length ? CUT[order[i + 1]] : DURATION])) as Record<SceneKey, number>;
export const XF = 8;
/** frame of beat i (sentence) in a scene */
export const beat = (k: SceneKey, i: number) => f(TL.scenes[k].beats[i].t);
/** frame of the (estimated) onset of the first word starting with `w` in a scene */
export const word = (k: SceneKey, w: string) => {
  for (const b of TL.scenes[k].beats) for (const x of b.words) if (x.w.toLowerCase().startsWith(w.toLowerCase())) return f(x.t);
  throw new Error(`word ${w} not in ${k}`);
};
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = { out: Easing.bezier(0.16, 1, 0.3, 1), inOut: Easing.bezier(0.65, 0, 0.35, 1), back: Easing.bezier(0.34, 1.45, 0.64, 1), quart: Easing.out(Easing.poly(4)) };
export const prog = (frame: number, a: number, b: number, easing = ease.out) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing });
/** Ukrainian format: 25 000 грн (narrow no-break space as thousands separator) */
export const money = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' грн';
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
