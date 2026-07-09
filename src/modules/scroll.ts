/**
 * Scroll-linked accents:
 *  - section markers: a lime tick on whichever section is centered in view
 *  - ME inversion curtain: the paper cover retracts up as ME centers, turning
 *    the paper→ink flip into a designed wipe (drives the --me-p CSS variable)
 */
import gsap from 'gsap';
import { clamp, REDUCED_MOTION } from './utils';

export function initScrollAccents(): void {
  initSectionMarkers();
  initMeCurtain();
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

function initMeCurtain(): void {
  const me = document.querySelector<HTMLElement>('.me');
  if (!me || REDUCED_MOTION) return;

  let last = -1;
  // driven on GSAP's ticker — the same clock as Lenis — so the wipe tracks
  // the rendered scroll position exactly, with no event-lag
  gsap.ticker.add(() => {
    const rect = me.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 while ME enters from the bottom, 1 once its top nears the viewport top
    const p = clamp((vh - rect.top) / (vh * 0.72), 0, 1);
    if (p === last) return; // skip idle frames
    last = p;
    me.style.setProperty('--me-p', p.toFixed(4));
    me.style.setProperty('--me-edge-op', Math.sin(p * Math.PI).toFixed(4));
  });
}
