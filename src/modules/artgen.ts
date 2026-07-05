/**
 * Generative monochrome artwork — no colour, no image assets.
 * Used for the item previews/overlays and the portrait placeholder.
 * Everything is ink-on-paper: registration marks, halftone, hatching.
 */
import { mulberry32 } from './utils';

const INK = '#0b0b0b';
const PAPER = '#f4f2ed';

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  return ctx;
}

/** deterministic ink composition, one per seed */
export function drawItemArt(canvas: HTMLCanvasElement, seed: number): void {
  const ctx = ctx2d(canvas);
  const { width: w, height: h } = canvas;
  const rnd = mulberry32(seed * 2654435761 + 17);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = INK;

  const mode = Math.floor(rnd() * 4);

  if (mode === 0) {
    // halftone gradient — dots grow across a soft diagonal
    const cell = 8 + Math.floor(rnd() * 6);
    const ang = rnd() * Math.PI;
    const cx = Math.cos(ang);
    const cy = Math.sin(ang);
    for (let y = cell / 2; y < h; y += cell) {
      for (let x = cell / 2; x < w; x += cell) {
        const t = (x * cx + y * cy) / (w * Math.abs(cx) + h * Math.abs(cy) + 1);
        const r = (0.15 + t * 0.9) * (cell / 2) * (0.7 + rnd() * 0.3);
        if (r < 0.4) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (mode === 1) {
    // hatched field with a single reserved void
    const gap = 4 + Math.floor(rnd() * 4);
    ctx.lineWidth = 1;
    ctx.strokeStyle = INK;
    const slope = -0.4 + rnd() * 0.8;
    for (let y = -h; y < h * 2; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + w * slope);
      ctx.stroke();
    }
    // paper void
    ctx.fillStyle = PAPER;
    const vw = w * (0.28 + rnd() * 0.24);
    const vh = vw * (0.7 + rnd() * 0.5);
    ctx.fillRect(w * (0.15 + rnd() * 0.4), h * (0.15 + rnd() * 0.4), vw, vh);
  } else if (mode === 2) {
    // concentric arcs, hand-drawn feel
    ctx.strokeStyle = INK;
    const ox = w * (0.2 + rnd() * 0.6);
    const oy = h * (0.2 + rnd() * 0.6);
    const max = Math.hypot(w, h);
    for (let r = 8; r < max; r += 6 + Math.floor(rnd() * 8)) {
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      const a0 = rnd() * Math.PI * 2;
      ctx.arc(ox, oy, r, a0, a0 + Math.PI * (0.7 + rnd() * 1.3));
      ctx.stroke();
    }
  } else {
    // stacked type-bar rhythm (editorial blocks)
    let y = h * (0.1 + rnd() * 0.1);
    while (y < h * 0.9) {
      const bh = 4 + rnd() * 26;
      const bw = w * (0.2 + rnd() * 0.72);
      const x = w * rnd() * 0.15;
      ctx.globalAlpha = 0.85 + rnd() * 0.15;
      ctx.fillRect(x, y, bw, bh);
      y += bh + 6 + rnd() * 22;
    }
    ctx.globalAlpha = 1;
  }

  // corner registration marks (ink)
  ctx.fillStyle = INK;
  const m = 10;
  for (const [px, py] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    ctx.fillRect(px - 5, py, 11, 1);
    ctx.fillRect(px, py - 5, 1, 11);
  }
}

/** soft halftone bust — stands in until a real photo is uploaded */
export function drawPortraitHalftone(canvas: HTMLCanvasElement): void {
  const ctx = ctx2d(canvas);
  const { width: w, height: h } = canvas;
  const rnd = mulberry32(2026);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const headX = w * 0.5;
  const headY = h * 0.35;
  const headR = w * 0.22;

  const lum = (x: number, y: number): number => {
    const dh = Math.hypot((x - headX) / 1.0, (y - headY) / 1.28) / headR;
    let v = Math.max(0, 1 - dh * dh * 0.5);
    if (y > h * 0.62) {
      const sw = w * (0.14 + ((y - h * 0.62) / (h * 0.38)) * 0.36);
      const dx = Math.abs(x - w * 0.5) / sw;
      v = Math.max(
        v,
        Math.max(0, 1 - dx * dx) * Math.min(1, (y - h * 0.6) / (h * 0.2)) * 0.92,
      );
    }
    v *= 0.85 + rnd() * 0.15;
    return Math.min(1, v);
  };

  const step = 9;
  ctx.fillStyle = PAPER;
  for (let y = step; y < h; y += step) {
    for (let x = step / 2 + ((y / step) % 2) * (step / 2); x < w; x += step) {
      const v = lum(x, y);
      if (v < 0.05) continue;
      ctx.beginPath();
      ctx.arc(x, y, (v * step) / 2.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(139,137,127,0.6)';
  ctx.font = 'italic 13px "Fraunces Variable", serif';
  ctx.fillText('awaiting image', 14, h - 16);
}
