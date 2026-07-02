/**
 * BOOT sequence — counter 000→100, flickering Ikeda bars, then a wipe.
 * Resolves once the curtain is gone. Repeat visits get the short cut.
 */
import gsap from 'gsap';
import { REDUCED_MOTION } from './utils';

const STATUSES = [
  'INITIALIZING',
  'LOADING GLYPHS',
  'NEGOTIATING PIXELS',
  'CALIBRATING GRID',
  'SIGNAL LOCKED',
];

export function runPreloader(): Promise<void> {
  const el = document.getElementById('preloader');
  if (!el) return Promise.resolve();

  const count = document.getElementById('preloader-count');
  const status = document.getElementById('preloader-status');
  const progress = document.getElementById('preloader-progress');
  const barsWrap = document.getElementById('preloader-bars');

  let seen = false;
  try {
    // sandboxed iframes / private mode can deny storage — boot long in that case
    seen = sessionStorage.getItem('arnibyte-boot') === '1';
    sessionStorage.setItem('arnibyte-boot', '1');
  } catch {
    /* no storage access */
  }

  if (REDUCED_MOTION) {
    el.remove();
    return Promise.resolve();
  }

  // flicker bars
  const bars: HTMLElement[] = [];
  if (barsWrap) {
    for (let i = 0; i < 56; i++) {
      const bar = document.createElement('i');
      barsWrap.appendChild(bar);
      bars.push(bar);
    }
  }
  const flicker = window.setInterval(() => {
    for (const bar of bars) {
      const on = Math.random() > 0.45;
      bar.style.height = on ? `${4 + Math.random() * 40}px` : '2px';
      bar.style.opacity = on ? '1' : '0.15';
      bar.style.background = Math.random() > 0.965 ? '#ff2e88' : '#f1f0ec';
    }
  }, 90);

  const duration = seen ? 0.55 : 1.9;
  const state = { v: 0 };

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        window.clearInterval(flicker);
        el.remove();
        resolve();
      },
    });

    tl.to(state, {
      v: 100,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        const v = Math.floor(state.v);
        if (count) count.textContent = String(v).padStart(3, '0');
        if (status) {
          status.textContent =
            STATUSES[Math.min(STATUSES.length - 1, Math.floor((v / 100) * STATUSES.length))];
        }
        if (progress) progress.style.transform = `scaleX(${state.v / 100})`;
      },
    });

    // wait for fonts so the hero reveal doesn't flash fallback glyphs
    tl.add(() => {
      tl.pause();
      Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1500)),
      ]).then(() => tl.resume());
    });

    tl.to(el, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.8,
      ease: 'power4.inOut',
      delay: 0.15,
    });
  });
}
