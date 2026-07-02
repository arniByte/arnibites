/**
 * Custom cursor: full-viewport crosshair + trailing dot + context label.
 * Only active on fine pointers; the native cursor is left alone on touch.
 */
import { FINE_POINTER, lerp } from './utils';

export function initCursor(): void {
  if (!FINE_POINTER) return;

  const root = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  const label = document.getElementById('cursor-label');
  if (!root || !dot || !label) return;

  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let dx = tx;
  let dy = ty;
  let active = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        active = true;
        dx = tx;
        dy = ty;
        document.body.classList.add('has-cursor');
      }
    },
    { passive: true },
  );

  const frame = (): void => {
    if (active) {
      dx = lerp(dx, tx, 0.22);
      dy = lerp(dy, ty, 0.22);
      // crosshair snaps, dot trails
      root.style.setProperty('--cx', `${tx}px`);
      root.style.setProperty('--cy', `${ty}px`);
      dot.style.left = `${dx}px`;
      dot.style.top = `${dy}px`;
      label.style.left = `${dx}px`;
      label.style.top = `${dy}px`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // hover states via delegation
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      'a, button, [data-cursor]',
    );
    if (target) {
      document.body.classList.add('cursor-hover');
      label.textContent = target.dataset.cursor ?? '';
    } else {
      document.body.classList.remove('cursor-hover');
      label.textContent = '';
    }
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-hover');
  });
}
