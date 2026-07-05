/**
 * A single quiet cursor ring. No crosshair, no label — it just trails
 * the pointer and swells over anything interactive.
 */
import { FINE_POINTER, lerp } from './utils';

export function initCursor(): void {
  if (!FINE_POINTER) return;

  const ring = document.getElementById('cursor');
  if (!ring) return;

  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let x = tx;
  let y = ty;
  let active = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        active = true;
        x = tx;
        y = ty;
        document.body.classList.add('has-cursor');
      }
    },
    { passive: true },
  );

  const frame = (): void => {
    if (active) {
      x = lerp(x, tx, 0.2);
      y = lerp(y, ty, 0.2);
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  document.addEventListener('mouseover', (e) => {
    const hit = (e.target as HTMLElement).closest('a, button, [data-cursor]');
    document.body.classList.toggle('cursor-hover', !!hit);
  });
  document.addEventListener('mouseleave', () =>
    document.body.classList.remove('cursor-hover'),
  );
}
