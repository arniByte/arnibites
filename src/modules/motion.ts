/**
 * Motion system — Lenis smooth scroll + GSAP choreography:
 * hero entrance, scroll reveals, marquees, parallax, progress bar.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { REDUCED_MOTION } from './utils';

gsap.registerPlugin(ScrollTrigger);

export function initLenis(): Lenis | null {
  if (REDUCED_MOTION) return null;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // hijack anchor links for buttery in-page travel
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('href');
      if (!target || target === '#') return;
      if (!document.querySelector(target)) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    });
  });

  return lenis;
}

/** set hero elements to their hidden state now; returns the play fn */
export function prepareHeroIntro(): () => void {
  if (REDUCED_MOTION) return () => undefined;

  const words = document.querySelectorAll('.hero__word');
  const accent = document.querySelector('.hero__accent');
  const over = document.getElementById('hero-over');
  const under = document.querySelector('.hero__under');
  const corners = document.querySelectorAll('.hero__corners .corner');
  const ticker = document.querySelector('.ticker');
  const hud = document.getElementById('hud');

  gsap.set(words, { yPercent: 115 });
  gsap.set(accent, { opacity: 0, scale: 0.85, rotate: -14 });
  gsap.set([over, under], { opacity: 0, y: 14 });
  gsap.set(corners, { opacity: 0 });
  gsap.set(ticker, { yPercent: 100 });
  gsap.set(hud, { opacity: 0 });

  return () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(words, { yPercent: 0, duration: 1.25, stagger: 0.14 })
      .to(accent, { opacity: 1, scale: 1, rotate: -6, duration: 0.9, ease: 'back.out(1.6)' }, '-=0.7')
      .to([over, under], { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, '-=0.8')
      .to(corners, { opacity: 1, duration: 0.5, stagger: 0.08 }, '-=0.5')
      .to(ticker, { yPercent: 0, duration: 0.6 }, '-=0.5')
      .to(hud, { opacity: 1, duration: 0.5 }, '-=0.4');
  };
}

export function initScrollFX(): void {
  initProgress();
  initHudInvert();
  initSectionRules();
  initManifesto();
  initBatchReveals();
  initHeroParallax();
  initMarquees();
}

/** flip HUD to black while it floats over the white works block */
function initHudInvert(): void {
  ScrollTrigger.create({
    trigger: '.works',
    start: 'top 58px',
    end: 'bottom 58px',
    toggleClass: { targets: 'body', className: 'hud-invert' },
  });
}

function initProgress(): void {
  gsap.to('#scroll-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
    },
  });
}

function initSectionRules(): void {
  document.querySelectorAll<HTMLElement>('.section__rule').forEach((rule) => {
    gsap.to(rule, {
      scaleX: 1,
      duration: REDUCED_MOTION ? 0 : 1.2,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: rule, start: 'top 88%' },
    });
  });
}

/** split the manifesto into words (keeping the pink serif <em>s intact) */
function initManifesto(): void {
  const el = document.getElementById('manifesto');
  if (!el) return;

  const nodes = [...el.childNodes];
  el.textContent = '';
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const word of (node.textContent ?? '').split(/\s+/)) {
        if (!word) continue;
        // glue lone punctuation onto the previous word (e.g. after an <em>)
        if (/^[.,!?;:—]+$/.test(word) && el.lastElementChild) {
          el.lastElementChild.textContent += word;
          continue;
        }
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        el.append(span, ' ');
      }
    } else if (node instanceof HTMLElement) {
      node.classList.add('word');
      el.append(node, ' ');
    }
  }

  if (REDUCED_MOTION) return;
  gsap.from(el.querySelectorAll('.word'), {
    y: '0.9em',
    opacity: 0,
    duration: 0.8,
    stagger: 0.024,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 78%' },
  });
}

function initBatchReveals(): void {
  if (REDUCED_MOTION) return;

  gsap.from('.work-row', {
    y: 48,
    opacity: 0,
    duration: 0.8,
    stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.works__list', start: 'top 82%' },
  });

  gsap.from('.caps__cell', {
    y: 36,
    opacity: 0,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.caps__grid', start: 'top 82%' },
  });

  gsap.from('.contact__cta-line span', {
    yPercent: 115,
    duration: 1.1,
    stagger: 0.12,
    ease: 'power4.out',
    scrollTrigger: { trigger: '.contact__cta', start: 'top 80%' },
  });

  gsap.from(['.about__side', '.works__note', '.contact__row', '.footer'], {
    opacity: 0,
    y: 24,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.about__side', start: 'top 85%' },
  });
}

function initHeroParallax(): void {
  if (REDUCED_MOTION) return;
  gsap.to('.hero__stack', {
    yPercent: 22,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

function initMarquees(): void {
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((inner) => {
    const first = inner.querySelector('span');
    if (!first) return;

    const w = first.offsetWidth;
    if (!w) return;

    const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / w) + 1);
    for (let i = 1; i < copies; i++) {
      inner.appendChild(first.cloneNode(true));
    }

    if (REDUCED_MOTION) return;

    const reverse = inner.hasAttribute('data-marquee-reverse');
    gsap.fromTo(
      inner,
      { x: reverse ? -w : 0 },
      { x: reverse ? 0 : -w, duration: w / 70, ease: 'none', repeat: -1 },
    );
  });
}
