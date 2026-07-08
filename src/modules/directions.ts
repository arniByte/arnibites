/**
 * DIRECTIONS interactions:
 *  - filter chips (All / Tools / Art / Recent) show/hide groups
 *  - cursor-trailing preview on row hover (real image, else generative art)
 *  - full-screen detail overlay with parallax media, Visit link, Next cycling
 */
import gsap from 'gsap';
import type Lenis from 'lenis';
import { directions } from '../content';
import { drawItemArt } from './artgen';
import { clamp, FINE_POINTER, REDUCED_MOTION } from './utils';

interface FlatItem {
  group: string;
  title: string;
  meta: string;
  note: string;
  seed: number;
  image?: string;
  link?: string;
}

const flat: FlatItem[] = directions.flatMap((d) =>
  d.items.map((it) => ({ group: d.label, ...it })),
);

/**
 * Paint a media slot. Generative art is the fallback; a real image (shown
 * whole, `object-fit: contain`) covers it once loaded, and the art canvas is
 * hidden so it can't peek through the letterbox. Handles the cached case
 * where re-setting the same `src` fires no `load` event.
 */
function setMedia(canvas: HTMLCanvasElement, img: HTMLImageElement, item: FlatItem): void {
  img.onload = null;
  img.onerror = null;

  const showArt = (): void => {
    canvas.style.display = '';
    drawItemArt(canvas, item.seed);
  };

  if (!item.image) {
    img.classList.remove('is-loaded');
    img.removeAttribute('src');
    showArt();
    return;
  }

  const reveal = (): void => {
    img.classList.add('is-loaded');
    canvas.style.display = 'none';
  };
  const fail = (): void => {
    img.removeAttribute('src');
    img.classList.remove('is-loaded');
    showArt();
  };

  img.alt = item.title;
  img.onload = reveal;
  img.onerror = fail;

  if (img.getAttribute('src') !== item.image) {
    img.classList.remove('is-loaded');
    showArt(); // fallback while the new image decodes
    img.src = item.image;
  }
  // cached image emits no load event — reveal immediately
  if (img.complete && img.naturalWidth > 0) reveal();
}

export function initDirections(lenis: Lenis | null): void {
  initFilters();
  initPreview();
  initOverlay(lenis);
}

/* --- filters --------------------------------------------------------- */

function initFilters(): void {
  const bar = document.getElementById('dir-filters');
  const groups = [...document.querySelectorAll<HTMLElement>('.dir__group')];
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.dir__filter');
    if (!btn) return;
    const filter = btn.dataset.filter ?? 'all';

    bar.querySelectorAll('.dir__filter').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    groups.forEach((g) => {
      const show = filter === 'all' || g.dataset.group === filter;
      g.classList.toggle('is-hidden', !show);
    });

    if (!REDUCED_MOTION) {
      const shown = groups.filter((g) => !g.classList.contains('is-hidden'));
      gsap.fromTo(
        shown,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' },
      );
    }
  });
}

/* --- floating preview ------------------------------------------------ */

function initPreview(): void {
  if (!FINE_POINTER) return;

  const groups = document.getElementById('dir-groups');
  const panel = document.getElementById('item-preview');
  const canvas = document.getElementById('item-preview-canvas') as HTMLCanvasElement | null;
  const img = document.getElementById('item-preview-img') as HTMLImageElement | null;
  if (!groups || !panel || !canvas || !img) return;

  gsap.set(panel, { autoAlpha: 0, scale: 0.94 });
  const xTo = gsap.quickTo(panel, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(panel, 'y', { duration: 0.45, ease: 'power3' });
  let shown = false;

  groups.addEventListener(
    'pointermove',
    (e) => {
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      let x = e.clientX + 26;
      if (x + w > window.innerWidth - 16) x = e.clientX - w - 26;
      const y = clamp(e.clientY - h / 2, 84, window.innerHeight - h - 16);
      xTo(x);
      yTo(y);
    },
    { passive: true },
  );

  groups.addEventListener('pointerover', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.item-row');
    if (!row) return;
    const item = flat.find((f) => f.seed === Number(row.dataset.seed));
    if (!item) return;
    setMedia(canvas, img, item);
    if (!shown) {
      shown = true;
      gsap.to(panel, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    }
  });

  groups.addEventListener('pointerleave', () => {
    shown = false;
    gsap.to(panel, { autoAlpha: 0, scale: 0.94, duration: 0.3, ease: 'power3.in' });
  });
}

/* --- overlay --------------------------------------------------------- */

function initOverlay(lenis: Lenis | null): void {
  const overlay = document.getElementById('overlay');
  const media = document.getElementById('overlay-media');
  const canvas = document.getElementById('overlay-canvas') as HTMLCanvasElement | null;
  const img = document.getElementById('overlay-img') as HTMLImageElement | null;
  const titleEl = document.getElementById('overlay-title');
  const kickerEl = document.getElementById('overlay-kicker');
  const metaEl = document.getElementById('overlay-meta');
  const noteEl = document.getElementById('overlay-note');
  const visitEl = document.getElementById('overlay-visit') as HTMLAnchorElement | null;
  const closeBtn = document.getElementById('overlay-close');
  const nextBtn = document.getElementById('overlay-next');
  if (!overlay || !media || !canvas || !img || !titleEl || !closeBtn || !nextBtn) return;

  let current = -1;
  let open = false;
  let opener: HTMLElement | null = null;

  const fill = (i: number): void => {
    const it = flat[i];
    current = i;
    titleEl.textContent = it.title;
    if (kickerEl) kickerEl.textContent = `${it.group} — ${String(i + 1).padStart(2, '0')} / ${String(flat.length).padStart(2, '0')}`;
    if (metaEl) metaEl.textContent = it.meta;
    if (noteEl) noteEl.textContent = it.note;
    if (visitEl) {
      if (it.link) {
        visitEl.href = it.link;
        visitEl.hidden = false;
      } else {
        visitEl.hidden = true;
      }
    }
    setMedia(canvas, img, it);
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
        { clipPath: 'inset(0% 0 0 0)', duration: REDUCED_MOTION ? 0 : 0.7, ease: 'power4.inOut' },
      );
    }
    gsap.fromTo(
      [titleEl, media],
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: REDUCED_MOTION ? 0 : 0.55, stagger: 0.08, delay: 0.18, ease: 'power3.out' },
    );
    overlay.scrollTop = 0;
    closeBtn.focus();
  };

  const hide = (): void => {
    if (!open) return;
    open = false;
    gsap.to(overlay, {
      clipPath: 'inset(100% 0 0 0)',
      duration: REDUCED_MOTION ? 0 : 0.55,
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

  // subtle parallax on the media as the pointer moves across it
  if (FINE_POINTER && !REDUCED_MOTION) {
    const px = gsap.quickTo([canvas, img], 'xPercent', { duration: 0.6, ease: 'power3' });
    const py = gsap.quickTo([canvas, img], 'yPercent', { duration: 0.6, ease: 'power3' });
    gsap.set([canvas, img], { scale: 1.06 });
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      px(((e.clientX - r.left) / r.width - 0.5) * -6);
      py(((e.clientY - r.top) / r.height - 0.5) * -6);
    });
    media.addEventListener('pointerleave', () => {
      px(0);
      py(0);
    });
  }

  document.getElementById('dir-groups')?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.item-row');
    if (!row) return;
    const i = flat.findIndex((f) => f.seed === Number(row.dataset.seed));
    if (i >= 0) show(i, row);
  });

  closeBtn.addEventListener('click', hide);
  nextBtn.addEventListener('click', () => show((current + 1) % flat.length));

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') {
      // trap focus across the visible controls (Visit only when shown)
      const focusables = [
        closeBtn,
        visitEl && !visitEl.hidden ? visitEl : null,
        nextBtn,
      ].filter(Boolean) as HTMLElement[];
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = e.shiftKey
        ? idx <= 0 ? focusables.length - 1 : idx - 1
        : (idx + 1) % focusables.length;
      focusables[next].focus();
    }
  });
}
