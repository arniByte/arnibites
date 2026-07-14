/**
 * Play launcher (main bundle, tiny): wires play-tile clicks to the lazy
 * game shell. The shell chunk warms up on first hover/focus so the click
 * feels instant.
 */
import type Lenis from 'lenis';
import { REDUCED_MOTION } from '../utils';

type ShellModule = typeof import('./shell');

export function initPlayLaunch(lenis: Lenis | null): void {
  const groups = document.getElementById('dir-groups');
  if (!groups) return;

  let warm: Promise<ShellModule> | null = null;
  const load = (): Promise<ShellModule> =>
    (warm ??= import('./shell').catch((err: unknown) => {
      warm = null; // a flaky load must not cache the rejection forever
      throw err;
    }));

  const isPlayTile = (t: EventTarget | null): HTMLElement | null =>
    (t as HTMLElement).closest?.('.play-tile') ?? null;

  groups.addEventListener('pointerover', (e) => {
    if (isPlayTile(e.target)) void load();
  });
  groups.addEventListener('focusin', (e) => {
    if (isPlayTile(e.target)) void load();
  });

  groups.addEventListener('click', async (e) => {
    const tile = isPlayTile(e.target);
    if (!tile) return;
    const id = tile.dataset.game as 'register' | 'ream' | 'ligature' | undefined;
    if (!id) return;
    const shell = await load();
    shell.initShellControls();
    void shell.openGame(id, tile, lenis, REDUCED_MOTION);
  });
}
