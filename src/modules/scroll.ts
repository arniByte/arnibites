/**
 * Scroll-linked accents:
 *  - section markers: a lime tick on whichever section is centered in view
 *  - ME inversion curtain: the paper cover retracts up as ME centers, turning
 *    the paper→ink flip into a designed wipe (drives the --me-p CSS variable)
 */
import type Lenis from 'lenis';
import { clamp, REDUCED_MOTION } from './utils';

export function initScrollAccents(lenis: Lenis | null): void {
  initSectionMarkers();
  initMeCurtain(lenis);
}

function initSectionMarkers(): void {
  const sections = document.querySelectorAll<HTMLElement>('.section');
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => en.target.classList.toggle('is-current', en.isIntersecting));
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );
  sections.forEach((s) => io.observe(s));
}

function initMeCurtain(lenis: Lenis | null): void {
  const me = document.querySelector<HTMLElement>('.me');
  if (!me || REDUCED_MOTION) return;

  const update = (): void => {
    const rect = me.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 while ME is entering from the bottom, 1 once its top nears viewport centre
    const p = clamp((vh - rect.top) / (vh * 0.65), 0, 1);
    me.style.setProperty('--me-p', p.toFixed(3));
  };

  update();
  lenis?.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
