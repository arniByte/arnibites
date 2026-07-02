/**
 * Text scramble — characters churn through a glyph set and lock in
 * left to right. Used on hover and for ambient "glitch ticks".
 */
import { REDUCED_MOTION } from './utils';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/\\_■□▪—+*<>';

const running = new WeakSet<HTMLElement>();

export function scrambleOnce(el: HTMLElement, duration = 600): void {
  if (REDUCED_MOTION || running.has(el)) return;
  if (el.firstElementChild) return; // would destroy child markup
  const original = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = original;
  if (!original.trim()) return;

  running.add(el);
  const start = performance.now();

  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / duration);
    const lock = Math.floor(t * original.length);
    let out = '';
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      if (i < lock || ch === ' ') {
        out += ch;
      } else {
        out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
    }
    el.textContent = out;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = original;
      running.delete(el);
    }
  };

  requestAnimationFrame(tick);
}

export function initScrambleHovers(): void {
  document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
    el.dataset.text = el.textContent ?? '';
    el.addEventListener('mouseenter', () => scrambleOnce(el, 420));
    el.addEventListener('focus', () => scrambleOnce(el, 420));
  });
}

/** ambient glitch: every few seconds one HUD label flickers */
export function initGlitchTicks(): void {
  if (REDUCED_MOTION) return;
  const pool = [...document.querySelectorAll<HTMLElement>('[data-scramble]')];
  if (!pool.length) return;
  const tick = (): void => {
    const el = pool[Math.floor(Math.random() * pool.length)];
    const rect = el.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
      scrambleOnce(el, 350);
    }
    window.setTimeout(tick, 5000 + Math.random() * 6000);
  };
  window.setTimeout(tick, 6000);
}
