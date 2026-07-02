export const REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

export const FINE_POINTER = window.matchMedia(
  '(hover: hover) and (pointer: fine)',
).matches;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** deterministic PRNG — same seed, same artwork, every visit */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
