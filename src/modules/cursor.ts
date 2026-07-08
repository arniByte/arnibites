/**
 * Lime cursor: a leading dot that tracks the pointer almost 1:1 and a
 * ring that eases behind it. Solid colour (no blend mode) with a dark
 * rim, so it stays visible on both the paper and the ink sections.
 */
import gsap from 'gsap';
import { FINE_POINTER } from './utils';

export function initCursor(): void {
  if (!FINE_POINTER) return;

  const ring = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  if (!ring || !dot) return;

  // GPU-friendly quickTo setters — the dot is snappy, the ring lags for feel
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3' });

  let started = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      if (!started) {
        started = true;
        // jump the ring to the pointer so it doesn't fly in from 0,0
        gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
        document.body.classList.add('has-cursor');
      }
    },
    { passive: true },
  );

  // hide while the pointer is off the window, show on return
  window.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  window.addEventListener('pointerenter', () => {
    if (started) document.body.classList.add('has-cursor');
  });

  window.addEventListener('pointerdown', () => document.body.classList.add('cursor-down'));
  window.addEventListener('pointerup', () => document.body.classList.remove('cursor-down'));

  // grow over anything interactive (event delegation, survives re-renders)
  document.addEventListener('mouseover', (e) => {
    const hit = (e.target as HTMLElement).closest('a, button, [data-cursor]');
    document.body.classList.toggle('cursor-hover', !!hit);
  });
}
