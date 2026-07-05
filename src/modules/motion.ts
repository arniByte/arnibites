/**
 * Motion — Lenis smooth scroll, the hero entrance, and the marquee.
 * Scroll-in reveals live in reveal.ts (IntersectionObserver); keeping
 * them out of here means no ScrollTrigger position math to go stale.
 */
import gsap from 'gsap';
import Lenis from 'lenis';
import { REDUCED_MOTION } from './utils';

export function initLenis(): Lenis | null {
  if (REDUCED_MOTION) return null;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  const raf = (time: number): void => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('href');
      if (!target || target === '#' || !document.querySelector(target)) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.3 });
    });
  });

  return lenis;
}

/** hide hero pieces immediately; return the play fn for after preload */
export function prepareHeroIntro(): () => void {
  if (REDUCED_MOTION) return () => undefined;

  const word = document.getElementById('hero-word');
  const eyebrow = document.getElementById('hero-eyebrow');
  const foot = document.querySelector('.hero__foot');
  const nav = document.getElementById('nav');

  gsap.set(word, { yPercent: 118 });
  gsap.set([eyebrow, foot], { opacity: 0, y: 16 });
  gsap.set(nav, { opacity: 0 });

  return () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(word, { yPercent: 0, duration: 1.3 })
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.7 }, '-=0.9')
      .to(foot, { opacity: 1, y: 0, duration: 0.7 }, '-=0.7')
      .to(nav, { opacity: 1, duration: 0.6 }, '-=0.6');
  };
}

export function initMarquee(): void {
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((inner) => {
    const first = inner.querySelector('span');
    if (!first) return;
    const w = first.offsetWidth;
    if (!w) return;

    const copies = Math.max(2, Math.ceil((window.innerWidth * 1.6) / w) + 1);
    for (let i = 1; i < copies; i++) inner.appendChild(first.cloneNode(true));

    if (REDUCED_MOTION) return;
    gsap.fromTo(inner, { x: 0 }, { x: -w, duration: w / 55, ease: 'none', repeat: -1 });
  });
}
