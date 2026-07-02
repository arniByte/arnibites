/**
 * Generative black/white artwork with a single pink element.
 * Used for project previews, the portrait placeholder and the barcode —
 * no image assets anywhere on the site.
 */
import { mulberry32 } from './utils';

const BLACK = '#0a0a0a';
const WHITE = '#f1f0ec';
const PINK = '#ff2e88';

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  return ctx;
}

/** Ikeda-style data pattern, deterministic per seed */
export function drawProjectArt(canvas: HTMLCanvasElement, seed: number): void {
  const ctx = ctx2d(canvas);
  const { width: w, height: h } = canvas;
  const rnd = mulberry32(seed * 7919 + 13);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = WHITE;

  const mode = Math.floor(rnd() * 5);

  if (mode === 0) {
    // vertical frequency bars
    let x = 0;
    while (x < w) {
      const bw = 1 + Math.floor(rnd() * 10);
      if (rnd() > 0.42) {
        const bh = h * (0.15 + rnd() * 0.85);
        ctx.fillRect(x, (h - bh) / 2, bw, bh);
      }
      x += bw + 1 + Math.floor(rnd() * 6);
    }
  } else if (mode === 1) {
    // data matrix
    const cell = 8 + Math.floor(rnd() * 8);
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        if (rnd() > 0.72) ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
  } else if (mode === 2) {
    // concentric dithered rings
    const cx = w * (0.3 + rnd() * 0.4);
    const cy = h * (0.3 + rnd() * 0.4);
    for (let r = 4; r < Math.max(w, h); r += 5 + Math.floor(rnd() * 9)) {
      const steps = Math.floor(r * 0.7);
      for (let i = 0; i < steps; i++) {
        if (rnd() > 0.5) continue;
        const a = (i / steps) * Math.PI * 2;
        ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2);
      }
    }
  } else if (mode === 3) {
    // displaced scanlines
    const phase = rnd() * Math.PI * 2;
    const freq = 0.008 + rnd() * 0.02;
    const amp = 6 + rnd() * 26;
    for (let y = 4; y < h; y += 5) {
      for (let x = 0; x < w; x += 3) {
        const dy = Math.sin(x * freq + phase + y * 0.05) * amp;
        if (rnd() > 0.18) ctx.fillRect(x, y + dy, 2, 1);
      }
    }
  } else {
    // noise blocks + void
    for (let i = 0; i < 260; i++) {
      const bw = 2 + rnd() * 34;
      const bh = 1 + rnd() * 5;
      ctx.globalAlpha = 0.4 + rnd() * 0.6;
      ctx.fillRect(rnd() * w, rnd() * h, bw, bh);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = BLACK;
    const vw = w * (0.2 + rnd() * 0.3);
    ctx.fillRect(w * rnd() * 0.5, h * (0.2 + rnd() * 0.3), vw, vw * 0.6);
  }

  // the single pink element
  ctx.fillStyle = PINK;
  const kind = rnd();
  if (kind < 0.33) {
    ctx.fillRect(rnd() * w * 0.8, 0, 2 + rnd() * 6, h);
  } else if (kind < 0.66) {
    ctx.fillRect(0, rnd() * h * 0.8, w, 2 + rnd() * 4);
  } else {
    const s = 8 + rnd() * 22;
    ctx.fillRect(rnd() * (w - s), rnd() * (h - s), s, s);
  }

  // corner registration marks
  ctx.fillStyle = WHITE;
  const m = 6;
  for (const [cx, cy] of [
    [m, m],
    [w - m, m],
    [m, h - m],
    [w - m, h - m],
  ]) {
    ctx.fillRect(cx - 4, cy, 9, 1);
    ctx.fillRect(cx, cy - 4, 1, 9);
  }
}

/** halftone "bust" silhouette — stands in until a real photo is uploaded */
export function drawPortraitHalftone(canvas: HTMLCanvasElement): void {
  const ctx = ctx2d(canvas);
  const { width: w, height: h } = canvas;
  const rnd = mulberry32(4242);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, w, h);

  const headX = w * 0.5;
  const headY = h * 0.34;
  const headR = w * 0.21;

  const lum = (x: number, y: number): number => {
    // head
    const dh = Math.hypot((x - headX) / 1.0, (y - headY) / 1.25) / headR;
    let v = Math.max(0, 1 - dh * dh * 0.55);
    // shoulders
    const sy = h * 0.78;
    if (y > h * 0.62) {
      const sw = w * (0.14 + ((y - h * 0.62) / (h * 0.38)) * 0.34);
      const dx = Math.abs(x - w * 0.5) / sw;
      v = Math.max(v, Math.max(0, 1 - dx * dx) * Math.min(1, (y - h * 0.6) / (sy - h * 0.6)) * 0.9);
    }
    // gentle noise so it feels printed, not rendered
    v *= 0.82 + rnd() * 0.18;
    return Math.min(1, v);
  };

  const step = 9;
  ctx.fillStyle = WHITE;
  for (let y = step; y < h; y += step) {
    for (let x = step / 2 + ((y / step) % 2) * (step / 2); x < w; x += step) {
      const v = lum(x, y);
      if (v < 0.06) continue;
      const r = (v * step) / 2.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // pink scan strip across the eyes
  ctx.fillStyle = PINK;
  const stripY = headY - headR * 0.15;
  for (let x = w * 0.2; x < w * 0.8; x += 7) {
    ctx.fillRect(x, stripY, 4, 2);
  }

  ctx.fillStyle = WHITE;
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.fillText('NO_SIGNAL // AWAITING_IMAGE', 12, h - 14);
}

/** decorative code39-flavoured barcode of the identity string */
export function drawBarcode(canvas: HTMLCanvasElement, text: string): void {
  // match the stretched layout width so the bars stay razor sharp
  if (canvas.clientWidth) canvas.width = canvas.clientWidth;
  const ctx = ctx2d(canvas);
  const { width: w, height: h } = canvas;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = WHITE;

  const rnd = mulberry32(
    [...text].reduce((a, c) => a + c.charCodeAt(0), 0),
  );
  const barsTop = 0;
  const barsH = h - 16;
  let x = 0;
  const pinkAt = Math.floor(rnd() * text.length * 4);
  let i = 0;
  while (x < w - 4) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.35) {
      ctx.fillStyle = i === pinkAt ? PINK : WHITE;
      ctx.fillRect(x, barsTop, bw, barsH);
    }
    x += bw + 1 + Math.floor(rnd() * 3);
    i++;
  }

  ctx.fillStyle = WHITE;
  ctx.font = '10px "IBM Plex Mono", monospace';
  ctx.fillText(`${text} — MMXXVI`, 0, h - 3);
}
