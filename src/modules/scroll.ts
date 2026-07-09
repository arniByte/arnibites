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
  initGalleryParallax();
}

/** the gallery breathes: each tile drifts at its own pace while scrolling */
function initGalleryParallax(): void {
  if (REDUCED_MOTION) return;
  const tiles = [...document.querySelectorAll<HTMLElement>('.art-tile')];
  if (!tiles.length) return;

  const movers = tiles.map((tile, i) => ({
    tile,
    set: gsap.quickSetter(tile, 'y', 'px') as (v: number) => void,
    // column-varied speeds so neighbours part as you scroll
    factor: 0.03 + (i % 3) * 0.03,
  }));

  gsap.ticker.add(() => {
    const vh = window.innerHeight || 1;
    for (const m of movers) {
      const r = m.tile.getBoundingClientRect();
      if (r.width === 0 || r.bottom < -80 || r.top > vh + 80) continue;
      const fromCentre = r.top + r.height / 2 - vh / 2;
      m.set(-fromCentre * m.factor);
    }
  });
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
