/**
 * HUD chrome: live clock, hex ticker feed, fullscreen menu,
 * blueprint grid toggle (G), back-to-top.
 */
import gsap from 'gsap';
import { identity } from '../content';
import { REDUCED_MOTION } from './utils';
import type Lenis from 'lenis';

export function initClock(): void {
  const clock = document.getElementById('hud-clock');
  if (!clock) return;
  const tick = (): void => {
    const now = new Date();
    const pad = (n: number): string => String(n).padStart(2, '0');
    clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };
  tick();
  window.setInterval(tick, 1000);
}

export function fillTicker(): void {
  const ticker = document.getElementById('hero-ticker');
  if (!ticker) return;

  const bytes = [...`${identity.name}.WORK`]
    .map((c) => `0x${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`)
    .join(' ');
  const segment = ` ${bytes} /// ${identity.name}.WORK /// SIGNAL OVER NOISE /// ${identity.role} ///`;

  const span = document.createElement('span');
  span.textContent = segment;
  ticker.appendChild(span);
  ticker.setAttribute('data-marquee', '');
}

export function initGridToggle(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    document.body.classList.toggle('grid-on');
  });
}

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
    btn.textContent = open ? 'CLOSE' : 'MENU';
    document.body.classList.toggle('menu-open', open);

    if (open) {
      lenis?.stop();
      gsap.fromTo(
        menu,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: REDUCED_MOTION ? 0 : 0.7, ease: 'power4.inOut' },
      );
      gsap.fromTo(
        links,
        { yPercent: 120 },
        {
          yPercent: 0,
          duration: REDUCED_MOTION ? 0 : 0.7,
          stagger: 0.06,
          delay: 0.25,
          ease: 'power4.out',
        },
      );
    } else {
      lenis?.start();
      gsap.to(menu, {
        clipPath: 'inset(0 0 100% 0)',
        duration: REDUCED_MOTION ? 0 : 0.55,
        ease: 'power4.inOut',
      });
    }
  };

  btn.addEventListener('click', () => setOpen(!open));
  links.forEach((link) => link.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
}

export function initBackToTop(lenis: Lenis | null): void {
  document.getElementById('back-to-top')?.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
