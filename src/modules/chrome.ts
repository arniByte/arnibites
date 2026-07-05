/**
 * Page chrome: fullscreen menu, back-to-top, and the calligraphic band
 * marquee. (No clock, ticker, grid or barcode — kept deliberately quiet.)
 */
import gsap from 'gsap';
import { REDUCED_MOTION } from './utils';
import type Lenis from 'lenis';

export function initMenu(lenis: Lenis | null): void {
  const menu = document.getElementById('menu');
  const btn = document.getElementById('menu-btn');
  if (!menu || !btn) return;

  const links = menu.querySelectorAll<HTMLElement>('.menu__link');
  let open = false;

  const setOpen = (next: boolean): void => {
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    btn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);

    if (open) {
      lenis?.stop();
      gsap.fromTo(
        menu,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: REDUCED_MOTION ? 0 : 0.65, ease: 'power4.inOut' },
      );
      gsap.fromTo(
        links,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: REDUCED_MOTION ? 0 : 0.65,
          stagger: 0.07,
          delay: 0.2,
          ease: 'power4.out',
        },
      );
    } else {
      lenis?.start();
      gsap.to(menu, {
        clipPath: 'inset(0 0 100% 0)',
        duration: REDUCED_MOTION ? 0 : 0.5,
        ease: 'power4.inOut',
      });
    }
  };

  btn.addEventListener('click', () => setOpen(!open));
  links.forEach((l) => l.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
}

export function initBackToTop(lenis: Lenis | null): void {
  document.getElementById('back-to-top')?.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.5 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
