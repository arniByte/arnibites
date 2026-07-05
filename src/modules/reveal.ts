/**
 * Scroll reveals via IntersectionObserver — robust by construction:
 * elements are only hidden once `html.js` is set, and IO fires on real
 * visibility, so a layout shift (preloader, web fonts) can never strand
 * content off-screen. Reduced-motion shows everything immediately (CSS).
 */
import { REDUCED_MOTION } from './utils';

export function initReveals(): void {
  document.documentElement.classList.add('js');

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
  );

  targets.forEach((el) => io.observe(el));

  // failsafe: anything still hidden after load (e.g. already above the
  // fold on a very tall screen) is shown on the next frame.
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    });
  });
}
