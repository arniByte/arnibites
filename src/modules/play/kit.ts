/**
 * Shared plumbing for the minigames (lazy chunk).
 * Games draw in CSS pixels; the kit handles DPR, resize, best-score storage.
 */

export const INK = '#0b0b0b';
export const PAPER = '#f4f2ed';
export const LIME = '#c6f24a';
export const LIME_DEEP = '#8fae1f';
export const ASH = 'rgba(11, 11, 11, 0.34)';

export interface GameOpts {
  reducedMotion: boolean;
  onScore(score: number): void;
  onState(state: 'attract' | 'playing' | 'over', payload?: { score: number }): void;
}

export interface Game {
  mount(canvas: HTMLCanvasElement, opts: GameOpts): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}

export interface Stage {
  ctx: CanvasRenderingContext2D;
  /** CSS-pixel size (already DPR-compensated) */
  w: number;
  h: number;
  destroy(): void;
}

/** DPR-aware canvas setup; games think in CSS pixels */
export function setupStage(canvas: HTMLCanvasElement, onResize?: () => void): Stage {
  const ctx = canvas.getContext('2d')!;
  const stage: Stage = { ctx, w: 0, h: 0, destroy: () => ro.disconnect() };

  const fit = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    stage.w = Math.max(1, rect.width);
    stage.h = Math.max(1, rect.height);
    canvas.width = Math.round(stage.w * dpr);
    canvas.height = Math.round(stage.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize?.();
  };

  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  fit();
  return stage;
}

/** best-score persistence, safe against blocked storage */
export function bestStore(id: string): { get(): number; set(v: number): void } {
  const key = `arni:play:${id}:best`;
  return {
    get() {
      try {
        return Math.max(0, parseInt(localStorage.getItem(key) ?? '0', 10) || 0);
      } catch {
        return 0;
      }
    },
    set(v: number) {
      try {
        localStorage.setItem(key, String(v));
      } catch {
        /* private mode */
      }
    },
  };
}

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** frame-rate corrected smoothing factor */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
