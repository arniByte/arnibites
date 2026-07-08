/**
 * A quiet preloader: the wordmark settles, a hairline fills, the paper
 * lifts. No counter, no terminal — just a held breath before the page.
 */
import gsap from 'gsap';
import { REDUCED_MOTION } from './utils';

export function runPreloader(): Promise<void> {
  const el = document.getElementById('preloader');
  if (!el) return Promise.resolve();

  const mark = document.getElementById('preloader-mark');
  const fill = document.getElementById('preloader-fill');
  const count = document.getElementById('preloader-count');

  if (REDUCED_MOTION) {
    el.remove();
    return Promise.resolve();
  }

  let seen = false;
  try {
    seen = sessionStorage.getItem('arnibyte-boot') === '1';
    sessionStorage.setItem('arnibyte-boot', '1');
  } catch {
    /* storage blocked */
  }

  const dur = seen ? 0.5 : 1.15;

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        el.remove();
        resolve();
      },
    });

    gsap.set(mark, { opacity: 0, y: 12 });

    // the lime hairline fills while a percent counter ticks 00 -> 100
    const state = { v: 0 };

    tl.to(mark, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .to(
        state,
        {
          v: 100,
          duration: dur,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (fill) fill.style.transform = `scaleX(${state.v / 100})`;
            if (count) count.textContent = String(Math.round(state.v)).padStart(2, '0');
          },
        },
        '-=0.35',
      )
      .add(() => {
        tl.pause();
        Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 1500)),
        ]).then(() => tl.resume());
      })
      .to([mark, count], { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' }, '+=0.1')
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'power4.inOut' }, '-=0.15');
  });
}
