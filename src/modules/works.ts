/**
 * Works interactions: cursor-following dithered preview on hover,
 * full-screen case overlay on click.
 */
import gsap from 'gsap';
import type Lenis from 'lenis';
import { works } from '../content';
import { drawProjectArt } from './artgen';
import { clamp, FINE_POINTER, REDUCED_MOTION } from './utils';

export function initWorks(lenis: Lenis | null): void {
  initPreview();
  initOverlay(lenis);
}

/* --- floating preview ------------------------------------------------ */

function initPreview(): void {
  if (!FINE_POINTER) return;

  const list = document.getElementById('works-list');
  const panel = document.getElementById('works-preview');
  const canvas = document.getElementById('works-preview-canvas') as HTMLCanvasElement | null;
  const tag = document.getElementById('works-preview-tag');
  if (!list || !panel || !canvas || !tag) return;

  let shown = false;

  gsap.set(panel, { autoAlpha: 0, scale: 0.9 });
  // gsap owns the whole transform: x/y trail the cursor, scale pops in/out
  const xTo = gsap.quickTo(panel, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(panel, 'y', { duration: 0.45, ease: 'power3' });

  const move = (e: PointerEvent): void => {
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    let x = e.clientX + 28;
    if (x + w > window.innerWidth - 16) x = e.clientX - w - 28;
    const y = clamp(e.clientY - h / 2, 72, window.innerHeight - h - 16);
    xTo(x);
    yTo(y);
  };

  list.addEventListener('pointermove', move, { passive: true });

  list.addEventListener('pointerover', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.work-row');
    if (!row) return;
    const work = works[Number(row.dataset.work)];
    if (!work) return;
    drawProjectArt(canvas, work.seed);
    tag.textContent = `${work.index} — ${work.category}`;
    if (!shown) {
      shown = true;
      gsap.to(panel, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    }
  });

  list.addEventListener('pointerleave', () => {
    shown = false;
    gsap.to(panel, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power3.in' });
  });
}

/* --- case overlay ------------------------------------------------------ */

function initOverlay(lenis: Lenis | null): void {
  const overlay = document.getElementById('work-overlay');
  const canvas = document.getElementById('work-overlay-canvas') as HTMLCanvasElement | null;
  const titleEl = document.getElementById('work-overlay-title');
  const indexEl = document.getElementById('work-overlay-index');
  const roleEl = document.getElementById('work-overlay-role');
  const yearEl = document.getElementById('work-overlay-year');
  const stackEl = document.getElementById('work-overlay-stack');
  const descEl = document.getElementById('work-overlay-desc');
  const closeBtn = document.getElementById('work-overlay-close');
  const nextBtn = document.getElementById('work-overlay-next');
  if (!overlay || !canvas || !titleEl || !closeBtn || !nextBtn) return;

  let current = -1;
  let open = false;
  let opener: HTMLElement | null = null;

  const fill = (i: number): void => {
    const w = works[i];
    current = i;
    titleEl.textContent = w.title;
    if (indexEl) indexEl.textContent = `${w.index} / ${String(works.length).padStart(3, '0')}`;
    if (roleEl) roleEl.textContent = w.role;
    if (yearEl) yearEl.textContent = w.year;
    if (stackEl) stackEl.textContent = w.stack;
    if (descEl) descEl.textContent = w.description;
    drawProjectArt(canvas, w.seed);
  };

  const show = (i: number, from?: HTMLElement): void => {
    fill(i);
    opener = from ?? opener;
    if (!open) {
      open = true;
      document.body.classList.add('overlay-open');
      overlay.setAttribute('aria-hidden', 'false');
      lenis?.stop();
      gsap.fromTo(
        overlay,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', duration: REDUCED_MOTION ? 0 : 0.75, ease: 'power4.inOut' },
      );
    }
    gsap.fromTo(
      [titleEl, canvas],
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: REDUCED_MOTION ? 0 : 0.6, stagger: 0.08, delay: 0.2, ease: 'power3.out' },
    );
    overlay.scrollTop = 0;
    closeBtn.focus();
  };

  const hide = (): void => {
    if (!open) return;
    open = false;
    gsap.to(overlay, {
      clipPath: 'inset(100% 0 0 0)',
      duration: REDUCED_MOTION ? 0 : 0.6,
      ease: 'power4.inOut',
      onComplete: () => {
        document.body.classList.remove('overlay-open');
        overlay.setAttribute('aria-hidden', 'true');
        lenis?.start();
        opener?.focus();
        opener = null;
      },
    });
  };

  document.getElementById('works-list')?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.work-row');
    if (!row) return;
    show(Number(row.dataset.work), row);
  });

  closeBtn.addEventListener('click', hide);
  nextBtn.addEventListener('click', () => show((current + 1) % works.length));

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') {
      // tiny focus trap between the two controls
      const focusables = [closeBtn, nextBtn];
      const idx = focusables.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      const next = e.shiftKey ? (idx <= 0 ? focusables.length - 1 : idx - 1) : (idx + 1) % focusables.length;
      focusables[next].focus();
    }
  });
}
