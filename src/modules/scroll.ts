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
  initProgressLine();
  initFactsSettle();
  initHeroExit();
}

/** the hero doesn't jump-cut away: the wordmark drifts down and dissolves
    as you leave, handing over to the ME curtain wipe */
function initHeroExit(): void {
  if (REDUCED_MOTION) return;
  const hero = document.querySelector<HTMLElement>('.hero');
  // the outer h1 — the inner span belongs to the intro tween
  const word = document.querySelector<HTMLElement>('.hero__word');
  if (!hero || !word) return;

  let last = -1;
  gsap.ticker.add(() => {
    const vh = window.innerHeight || 1;
    const p = clamp(-hero.getBoundingClientRect().top / (vh * 0.85), 0, 1);
    if (p === last) return;
    last = p;
    word.style.transform = `translateY(${(p * 12).toFixed(3)}vh)`;
    word.style.opacity = (1 - p * 0.9).toFixed(3);
  });
}

/** a 2px lime line along the top edge showing page progress */
function initProgressLine(): void {
  const line = document.createElement('div');
  line.className = 'progress-line';
  line.setAttribute('aria-hidden', 'true');
  document.body.appendChild(line);

  let last = -1;
  gsap.ticker.add(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (Math.abs(p - last) < 0.001) return;
    last = p;
    line.style.transform = `scaleX(${p.toFixed(4)})`;
  });
}

/** ME facts settle: values scramble into place the first time they're seen */
function initFactsSettle(): void {
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
  const facts = document.querySelector<HTMLElement>('.facts');
  if (!facts) return;

  const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789·—';
  const settle = (el: HTMLElement, delay: number): void => {
    const original = el.textContent ?? '';
    if (!original.trim()) return;
    const start = performance.now() + delay;
    const dur = 620;
    const tick = (now: number): void => {
      const t = clamp((now - start) / dur, 0, 1);
      if (t <= 0) {
        requestAnimationFrame(tick);
        return;
      }
      const lock = Math.floor(t * original.length);
      let out = '';
      for (let i = 0; i < original.length; i++) {
        out += i < lock || original[i] === ' ' ? original[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    ([entry], obs) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      facts.querySelectorAll<HTMLElement>('dd').forEach((dd, i) => settle(dd, i * 140));
    },
    { threshold: 0.4 },
  );
  io.observe(facts);
}

/** the gallery breathes: each tile drifts at its own pace while scrolling.
    Desktop-only — in the single-column mobile layout the drift would slide
    tiles over their neighbours' labels. */
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

  const narrow = window.matchMedia('(max-width: 899px)');
  let parked = false;

  gsap.ticker.add(() => {
    if (narrow.matches) {
      if (!parked) {
        parked = true;
        for (const m of movers) m.set(0);
      }
      return;
    }
    parked = false;
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
