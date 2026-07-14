/**
 * Play-tile plates: each game's vignette drawn once as a static ink plate,
 * waking into a short animation while hovered/focused (fine pointers only).
 * Lives in the main bundle; the games themselves stay lazy.
 */
import { FINE_POINTER, REDUCED_MOTION } from '../utils';

const INK = '#0b0b0b';
const PAPER = '#f4f2ed';
const LIME = '#c6f24a';
const ASH = 'rgba(11, 11, 11, 0.34)';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

/** Register: halftone ring, gate marks, orbiting dot */
const drawRegister: Draw = (ctx, w, h, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = w * 0.32;

  ctx.fillStyle = ASH;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // gate crop-marks at the top
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (const off of [-0.3, 0.3]) {
    const a = -Math.PI / 2 + off;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12));
    ctx.lineTo(cx + Math.cos(a) * (R + 12), cy + Math.sin(a) * (R + 12));
    ctx.stroke();
  }
  // orbiter
  const oa = t * 1.6 - Math.PI / 2;
  ctx.fillStyle = LIME;
  ctx.strokeStyle = 'rgba(11,11,11,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(oa) * R, cy + Math.sin(oa) * R, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

/** Ream: a profile stack of paper sheets, top sheet sliding */
const drawReam: Draw = (ctx, w, h, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  const sheetH = h * 0.052;
  const baseW = w * 0.5;
  const n = 9;
  const x0 = w / 2;
  const y0 = h * 0.82;
  ctx.strokeStyle = ASH;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    const jitter = Math.sin(i * 3.7) * w * 0.02;
    const y = y0 - i * (sheetH + 3);
    ctx.fillStyle = i % 2 ? '#eceade' : PAPER;
    ctx.fillRect(x0 - baseW / 2 + jitter, y - sheetH, baseW, sheetH);
    ctx.strokeRect(x0 - baseW / 2 + jitter, y - sheetH, baseW, sheetH);
  }
  // sliding lime sheet
  const slide = Math.sin(t * 1.8) * w * 0.16;
  const y = y0 - n * (sheetH + 3);
  ctx.fillStyle = LIME;
  ctx.fillRect(x0 - baseW / 2 + slide, y - sheetH, baseW, sheetH);
  ctx.strokeStyle = INK;
  ctx.strokeRect(x0 - baseW / 2 + slide, y - sheetH, baseW, sheetH);
};

/** Ligature: a calligraphic S-stroke with lime drops */
const drawLigature: Draw = (ctx, w, h, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  // variable-width S-curve, progressively drawn while hovered
  const steps = 64;
  const progress = REDUCED_MOTION ? 1 : Math.min(1, 0.35 + (Math.sin(t * 0.9) * 0.5 + 0.5) * 0.65);
  ctx.fillStyle = INK;
  for (let i = 0; i < steps * progress; i++) {
    const u = i / steps;
    const x = w * (0.24 + 0.52 * u);
    const y = h * (0.28 + 0.44 * u) + Math.sin(u * Math.PI * 2.2) * h * 0.13;
    const width = 3 + Math.sin(u * Math.PI) * 8;
    ctx.beginPath();
    ctx.arc(x, y, width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // lime drops ahead of the stroke
  ctx.fillStyle = LIME;
  ctx.strokeStyle = 'rgba(11,11,11,0.3)';
  for (const [dx, dy] of [
    [0.68, 0.36],
    [0.42, 0.72],
  ]) {
    ctx.beginPath();
    ctx.arc(w * dx, h * dy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
};

const PLATES: Record<string, Draw> = {
  register: drawRegister,
  ream: drawReam,
  ligature: drawLigature,
};

export function initPlayThumbs(): void {
  document.querySelectorAll<HTMLElement>('.play-tile').forEach((tile) => {
    const canvas = tile.querySelector<HTMLCanvasElement>('.play-tile__canvas');
    const draw = PLATES[tile.dataset.game ?? ''];
    if (!canvas || !draw) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DPR-aware buffer (the plates must be as crisp as the games themselves);
    // CSS-pixel size for the draw calls, re-fit when the tile is laid out
    let cw = canvas.width;
    let ch = canvas.height;
    const fit = (): void => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2) return; // hidden by a filter — keep the old buffer
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, cw, ch, 0.9);
    };
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(canvas);
    fit();

    // static plate
    draw(ctx, cw, ch, 0.9);

    if (!FINE_POINTER || REDUCED_MOTION) return;

    // wake while hovered/focused — rAF runs only during intent
    let raf = 0;
    const start = performance.now();
    const loop = (now: number): void => {
      draw(ctx, cw, ch, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const wake = (): void => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const rest = (): void => {
      cancelAnimationFrame(raf);
      raf = 0;
      draw(ctx, cw, ch, 0.9);
    };
    tile.addEventListener('pointerenter', wake);
    tile.addEventListener('pointerleave', rest);
    tile.addEventListener('focusin', wake);
    tile.addEventListener('focusout', rest);
  });
}
