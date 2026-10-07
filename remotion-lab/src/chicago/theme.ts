// Shared theme, timing data and helpers for "Chicago — the real cost of living (v2)".
import { loadFont } from '@remotion/fonts';
import { Easing, interpolate, staticFile } from 'remotion';
import timeline from '../../public/chicago/timeline.json';
import captions from '../../public/chicago/captions.json';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  bg: '#060A15',
  navy: '#0B1226',
  ink: '#0E1528',
  white: '#FFFFFF',
  green: '#2BE38B',
  green2: '#8CFFC8',
  orange: '#FF8A1F',
  red: '#FF4B3E',
  gold: '#FFC857',
  muted: '#9AA6BD',
  card: '#F6F7FA',
  cardInk: '#141B2D',
};

export const FONT = 'Montserrat';
for (const [file, weight] of [
  ['Montserrat-Black.ttf', '900'],
  ['Montserrat-ExtraBold.ttf', '800'],
  ['Montserrat-Bold.ttf', '700'],
  ['Montserrat-SemiBold.ttf', '600'],
  ['Montserrat-Medium.ttf', '500'],
] as const) {
  loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight });
}

export const TL = timeline as {
  scenes: Record<string, number>;
  voice: Record<string, number>;
  durs: Record<string, number>;
  cues: Record<string, number>;
  lines: Record<string, string>;
};
export const CAPTIONS = captions as { text: string; startMs: number; endMs: number; timestampMs: number; confidence: null }[];

/** seconds -> frame */
export const f = (s: number) => Math.round(s * FPS);
/** cue time (absolute frame) */
export const cue = (name: string) => f(TL.cues[name]);

// scene cut points (absolute frames) — fixed by the edit, the voice was fitted to them
export const CUTS = {
  hook: 0,
  rent: f(3),
  food: f(8),
  eat: f(13),
  transit: f(18),
  util: f(23),
  total: f(28),
  payoff: f(34),
  cta: f(37),
  end: f(40),
};
export const FREEZE_AT = f(39.5); // final half-second hold

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  quart: Easing.out(Easing.poly(4)),
};
/** 0..1 progress between two frames */
export const prog = (frame: number, a: number, b: number, easing = ease.out) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

export const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

/** deterministic pseudo-random (mulberry32) */
export const rand = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
