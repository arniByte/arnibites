/**
 * Game overlay shell (lazy chunk): opens the fixed play overlay with the
 * same wipe grammar as the item overlay, mounts/destroys games, owns the
 * HUD (score/best), pause-on-hide, focus trap and Esc.
 */
import gsap from 'gsap';
import type Lenis from 'lenis';
import { bestStore, clamp, Game } from './kit';

type GameId = 'register' | 'ream' | 'ligature';

const LOADERS: Record<GameId, () => Promise<{ create(): Game; meta: { id: string; title: string; howTo: string } }>> = {
  register: () => import('./register'),
  ream: () => import('./ream'),
  ligature: () => import('./ligature'),
};

let current: Game | null = null;
let open = false;
let opener: HTMLElement | null = null;
let lenisRef: Lenis | null = null;
let reduced = false;

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export async function openGame(id: GameId, from: HTMLElement | null, lenis: Lenis | null, reducedMotion: boolean): Promise<void> {
  const overlay = el<HTMLDivElement>('playov');
  const canvas = el<HTMLCanvasElement>('playov-canvas');
  if (!overlay || !canvas || open) return;

  lenisRef = lenis;
  reduced = reducedMotion;
  opener = from;
  open = true;

  let mod;
  try {
    mod = await LOADERS[id]();
  } catch {
    open = false; // a failed chunk load must not wedge the overlay shut
    return;
  }
  const best = bestStore(id);

  // fill chrome
  el('playov-kicker').textContent = `Play — ${mod.meta.title}`;
  el('playov-title').textContent = mod.meta.title;
  el('playov-howto').textContent = mod.meta.howTo;
  el('playov-score').textContent = '0';
  const bestEl = el('playov-best');
  const b0 = best.get();
  bestEl.textContent = b0 ? `best ${b0}` : '';
  el('playov-hint').textContent = 'Tap or Space to begin · Esc closes';
  el<HTMLButtonElement>('playov-again').hidden = true;

  document.body.classList.add('overlay-open', 'playov-open');
  overlay.setAttribute('aria-hidden', 'false');
  lenis?.stop();

  // wipe open from the clicked tile's band
  let originY = 100;
  if (from) {
    const r = from.getBoundingClientRect();
    originY = clamp(((r.top + r.height / 2) / (window.innerHeight || 1)) * 100, 0, 100);
  }
  gsap.fromTo(
    overlay,
    { clipPath: `inset(${originY}% 0 ${100 - originY}% 0)` },
    { clipPath: 'inset(0% 0 0% 0)', duration: reduced ? 0 : 0.7, ease: 'power4.inOut' },
  );

  // bind escape/pause plumbing before mount, so the overlay can always
  // be closed even if a game fails to start
  el<HTMLButtonElement>('playov-close').focus();
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('keydown', onKey, true);

  current = mod.create();
  try {
    mountGame(current, canvas, best);
  } catch (err) {
    console.error('[play] game failed to start', err);
    el('playov-hint').textContent = 'Could not start — Esc closes';
  }
}

function mountGame(game: Game, canvas: HTMLCanvasElement, best: ReturnType<typeof bestStore>): void {
  const bestEl = el('playov-best');
  game.mount(canvas, {
    reducedMotion: reduced,
    onScore(score) {
      const s = el('playov-score');
      s.textContent = String(score);
      if (!reduced) {
        gsap.fromTo(s, { yPercent: -30, color: '#8fae1f' }, { yPercent: 0, color: '#0b0b0b', duration: 0.3, ease: 'power2.out' });
      }
    },
    onState(state, payload) {
      const again = el<HTMLButtonElement>('playov-again');
      const hint = el('playov-hint');
      if (state === 'over') {
        const score = payload?.score ?? 0;
        if (score > best.get()) {
          best.set(score);
          bestEl.textContent = `best ${score} — new`;
        } else {
          bestEl.textContent = best.get() ? `best ${best.get()}` : '';
        }
        again.hidden = false;
        hint.textContent = 'Run over — Again restarts · Esc closes';
        again.focus();
      } else if (state === 'playing') {
        again.hidden = true;
        hint.textContent = 'Esc closes';
      }
    },
  });

}

function onVis(): void {
  if (!current) return;
  if (document.hidden) current.pause();
  else current.resume();
}

function onKey(e: KeyboardEvent): void {
  if (!open) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    closeGame();
    return;
  }
  if (e.key === 'Tab') {
    // trap focus across the visible controls
    const controls = [el('playov-close'), el<HTMLButtonElement>('playov-again')].filter(
      (c) => c && !(c as HTMLButtonElement).hidden,
    ) as HTMLElement[];
    if (!controls.length) return;
    const idx = controls.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    const next = e.shiftKey ? (idx <= 0 ? controls.length - 1 : idx - 1) : (idx + 1) % controls.length;
    controls[next].focus();
  }
}

export function closeGame(): void {
  const overlay = el<HTMLDivElement>('playov');
  if (!overlay || !open) return;
  open = false;
  current?.pause();
  gsap.to(overlay, {
    clipPath: 'inset(100% 0 0 0)',
    duration: reduced ? 0 : 0.55,
    ease: 'power4.inOut',
    onComplete: () => {
      current?.destroy();
      current = null;
      document.body.classList.remove('overlay-open', 'playov-open');
      overlay.setAttribute('aria-hidden', 'true');
      lenisRef?.start();
      opener?.focus();
      opener = null;
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('keydown', onKey, true);
    },
  });
}

let controlsBound = false;

export function initShellControls(): void {
  if (controlsBound) return;
  controlsBound = true;
  el<HTMLButtonElement>('playov-close')?.addEventListener('click', closeGame);
  el<HTMLButtonElement>('playov-again')?.addEventListener('click', () => current?.restart());
}
