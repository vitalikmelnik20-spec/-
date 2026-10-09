// Design system for "Olympia, WA - cost of living": palette, type, timing (from the measured voice-over), helpers.
import { loadFont } from '@remotion/fonts';
import { Easing, interpolate, staticFile } from 'remotion';
import timeline from '../../public/olympia/timeline.json';
import pages from '../../public/olympia/caption_pages.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  navy: '#0B1630',
  navyDeep: '#060D1D',
  forest: '#0F3B2C',
  forestDeep: '#082219',
  fir: '#123F30',
  off: '#F4F1EA',
  gray: '#A8B3C1',
  grayDim: '#6E7B8D',
  blue: '#3C9EFF',
  coral: '#FF7A52',
  green: '#4FD08F',
  ink: '#0B1630',
};

export const HEAD = 'Montserrat'; // headlines / big numbers
export const BODY = 'Inter';      // labels, sources, captions support
for (const [file, weight] of [['Montserrat-Black.ttf', '900'], ['Montserrat-ExtraBold.ttf', '800'], ['Montserrat-Bold.ttf', '700']] as const) {
  loadFont({ family: HEAD, url: staticFile(`fonts/${file}`), weight });
}
for (const [file, weight] of [['Inter-Medium.ttf', '500'], ['Inter-SemiBold.ttf', '600'], ['Inter-Bold.ttf', '700']] as const) {
  loadFont({ family: BODY, url: staticFile(`fonts/${file}`), weight });
}

type Word = { key: string; i: number; text: string; start: number; end: number };
export const TL = timeline as unknown as {
  frames: number; total: number;
  starts: Record<string, number>; durs: Record<string, number>;
  cues: Record<string, number>; cuts: Record<string, number>;
  lines: Record<string, string>; words: Word[];
};
export type Tok = { text: string; start: number; end: number; em: null | 'money' | 'good' | 'warn' | 'key' };
export const PAGES = pages as unknown as { start: number; end: number; tokens: Tok[] }[];

export const f = (s: number) => Math.round(s * FPS);
export const cue = (name: string) => f(TL.cues[name]);
export const DURATION = TL.frames;
const order = ['hook', 'city', 'rent', 'buy', 'tax', 'transit', 'summary', 'cta'] as const;
export type SceneKey = (typeof order)[number];
export const CUT = Object.fromEntries(order.map((k) => [k, f(TL.cuts[k])])) as Record<SceneKey, number>;
export const NEXT = Object.fromEntries(order.map((k, i) => [k, i + 1 < order.length ? CUT[order[i + 1]] : DURATION])) as Record<SceneKey, number>;
export const XF = 9; // transition overlap (frames)

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  back: Easing.bezier(0.34, 1.45, 0.64, 1),
  quart: Easing.out(Easing.poly(4)),
};
export const prog = (frame: number, a: number, b: number, easing = ease.out) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing });
export const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
