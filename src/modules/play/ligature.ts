/**
 * LIGATURE — draw one line through the drops before they dry.
 * The nib follows the pointer on a spring, laying a variable-width ink
 * stroke. Crossing your own live stroke severs it. Sixty-second sitting.
 * Dried ink is stamped once onto an offscreen layer — frame cost stays flat.
 */
import { ASH, clamp, Game, GameOpts, INK, LIME, LIME_DEEP, PAPER, setupStage, Stage } from './kit';

const TAU = Math.PI * 2;
const SITTING = 60; // seconds
const LIVE_POINTS = 40;

interface Pt { x: number; y: number; w: number; }
interface Drop { x: number; y: number; life: number; max: number; }
interface Splash { x: number; y: number; vx: number; vy: number; life: number; }

export const meta = { id: 'ligature', title: 'Ligature', howTo: 'Draw one line through the drops before they dry.' };

export function create(): Game {
  let stage: Stage | null = null;
  let opts: GameOpts;
  let raf = 0;
  let last = 0;
  let running = false;

  let mode: 'attract' | 'playing' | 'over' = 'attract';
  let dried: HTMLCanvasElement | null = null;
  let dctx: CanvasRenderingContext2D | null = null;

  // nib spring
  let nx = 0; let ny = 0; let nvx = 0; let nvy = 0;
  let target = { x: 0, y: 0 };
  let penDown = false;
  let pointerHeld = false;
  // keyboard steering
  let heading = 0;
  const keys = new Set<string>();

  let live: Pt[] = [];
  let drops: Drop[] = [];
  const splashes: Splash[] = [];
  let score = 0;
  let mult = 1;
  let chainT = 0;
  let timeLeft = SITTING;
  let spawnT = 0;
  let attractT = 0;
  let overAt = 0; // cooldown so lingering input can't instantly restart

  const resetDried = (preserve = false): void => {
    if (!stage) return;
    const old = preserve ? dried : null;
    dried = document.createElement('canvas');
    dried.width = stage.ctx.canvas.width;
    dried.height = stage.ctx.canvas.height;
    dctx = dried.getContext('2d')!;
    const dpr = stage.ctx.canvas.width / stage.w;
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // a mid-run resize (rotation, URL bar) must not erase the artwork
    if (old && old.width > 0 && old.height > 0) {
      dctx.drawImage(old, 0, 0, stage.w, stage.h);
    }
  };

  const reset = (): void => {
    live = [];
    drops = [];
    splashes.length = 0;
    score = 0;
    mult = 1;
    chainT = 0;
    timeLeft = SITTING;
    spawnT = 0;
    nx = stage!.w / 2;
    ny = stage!.h / 2;
    nvx = 0; nvy = 0;
    target = { x: nx, y: ny };
    penDown = false;
    resetDried();
  };

  const spawnDrop = (): void => {
    if (drops.length >= 6) return;
    const m = 50;
    const max = clamp(5 - (SITTING - timeLeft) * 0.033, 3, 5);
    drops.push({
      x: m + Math.random() * (stage!.w - m * 2),
      y: m + Math.random() * (stage!.h - m * 2),
      life: max,
      max,
    });
    // risky double drop later in the sitting
    if (timeLeft < 40 && Math.random() < 0.3 && drops.length < 6) {
      const d = drops[drops.length - 1];
      drops.push({ x: clamp(d.x + 60, m, stage!.w - m), y: clamp(d.y + 24, m, stage!.h - m), life: max, max });
    }
  };

  /** stamp the oldest live point onto the dried layer, then drop it */
  const dryOldest = (): void => {
    if (live.length <= LIVE_POINTS) return;
    const p = live[0];
    const q = live[1];
    if (dctx && q) {
      dctx.strokeStyle = INK;
      dctx.lineCap = 'round';
      dctx.lineWidth = p.w;
      dctx.beginPath();
      dctx.moveTo(p.x, p.y);
      dctx.lineTo(q.x, q.y);
      dctx.stroke();
    }
    live.shift();
  };

  const sever = (x: number, y: number): void => {
    // ink blot at the crossing, live trail soaks into the dried layer
    if (dctx) {
      dctx.fillStyle = INK;
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU;
        const r = 4 + Math.random() * 9;
        dctx.beginPath();
        dctx.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 8, r, 0, TAU);
        dctx.fill();
      }
      dctx.globalAlpha = 0.35;
      dctx.strokeStyle = INK;
      dctx.lineCap = 'round';
      for (let i = 1; i < live.length; i++) {
        dctx.lineWidth = live[i].w;
        dctx.beginPath();
        dctx.moveTo(live[i - 1].x, live[i - 1].y);
        dctx.lineTo(live[i].x, live[i].y);
        dctx.stroke();
      }
      dctx.globalAlpha = 1;
    }
    live = [];
    mult = 1;
    chainT = 0;
  };

  const segsIntersect = (a: Pt, b: Pt, c: Pt, d: Pt): boolean => {
    const o = (p: Pt, q: Pt, r: Pt): number => Math.sign((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
    return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
  };

  const update = (dt: number): void => {
    if (mode === 'attract') {
      // the game draws itself: a noise-driven looping nib
      attractT += dt;
      target.x = stage!.w / 2 + Math.cos(attractT * 0.7) * stage!.w * 0.26 + Math.sin(attractT * 1.7) * 30;
      target.y = stage!.h / 2 + Math.sin(attractT * 1.1) * stage!.h * 0.24;
      penDown = true;
    } else if (mode === 'playing') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endSitting();
        return;
      }
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnDrop();
        spawnT = clamp(2.2 - (SITTING - timeLeft) * 0.025, 1.1, 2.2);
      }
      // keyboard steering
      if (keys.size) {
        const speed = 220;
        if (keys.has('ArrowLeft') || keys.has('KeyA')) heading -= 4.2 * dt;
        if (keys.has('ArrowRight') || keys.has('KeyD')) heading += 4.2 * dt;
        target.x = clamp(target.x + Math.cos(heading) * speed * dt, 8, stage!.w - 8);
        target.y = clamp(target.y + Math.sin(heading) * speed * dt, 8, stage!.h - 8);
        penDown = true;
      }
    }

    // critically-damped-ish nib spring — the lag IS the calligraphy
    const k = opts.reducedMotion ? 900 : 180;
    const dmp = opts.reducedMotion ? 60 : 22;
    nvx += ((target.x - nx) * k - nvx * dmp) * dt;
    nvy += ((target.y - ny) * k - nvy * dmp) * dt;
    const px = nx; const py = ny;
    nx += nvx * dt;
    ny += nvy * dt;

    if (penDown && (mode === 'playing' || mode === 'attract')) {
      const speed = Math.hypot(nx - px, ny - py) / Math.max(dt, 0.001);
      const width = clamp(14 - speed * 0.02, 2.5, 14);
      const lastPt = live[live.length - 1];
      if (!lastPt || Math.hypot(nx - lastPt.x, ny - lastPt.y) > 3) {
        const pt = { x: nx, y: ny, w: lastPt ? lastPt.w * 0.7 + width * 0.3 : width };
        // self-cross check: newest segment vs non-adjacent live segments
        if (mode === 'playing' && live.length > 3 && lastPt) {
          for (let i = 0; i < live.length - 3; i++) {
            if (segsIntersect(live[i], live[i + 1], lastPt, pt)) {
              sever(nx, ny);
              break;
            }
          }
        }
        if (live.length || mode === 'attract' || penDown) live.push(pt);
        dryOldest();
        if (mode === 'attract') dryOldest(); // attract dries faster, self-erasing
      }
    }

    // drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life -= dt;
      if (d.life <= 0) {
        // dried into stipple
        if (dctx) {
          dctx.fillStyle = ASH;
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * TAU;
            dctx.beginPath();
            dctx.arc(d.x + Math.cos(a) * 8, d.y + Math.sin(a) * 8, 1.4, 0, TAU);
            dctx.fill();
          }
        }
        drops.splice(i, 1);
        continue;
      }
      if (mode === 'playing' && penDown && Math.hypot(nx - d.x, ny - d.y) < 16) {
        drops.splice(i, 1);
        score += 10 * mult;
        opts.onScore(score);
        mult = Math.min(mult + 1, 8);
        chainT = 2.5;
        if (!opts.reducedMotion) {
          for (let j = 0; j < 7 && splashes.length < 24; j++) {
            const a = Math.random() * TAU;
            const v = 40 + Math.random() * 120;
            splashes.push({ x: d.x, y: d.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 });
          }
        }
      }
    }

    if (chainT > 0) {
      chainT -= dt;
      if (chainT <= 0) mult = 1;
    }

    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy *= 0.9;
      s.life -= dt * 1.8;
      if (s.life <= 0) {
        // settle as a permanent lime-deep speck
        if (dctx) {
          dctx.fillStyle = LIME_DEEP;
          dctx.beginPath();
          dctx.arc(s.x, s.y, 1.6, 0, TAU);
          dctx.fill();
        }
        splashes.splice(i, 1);
      }
    }
  };

  const endSitting = (): void => {
    // the whole drawing dries; the score card rises over your own artwork
    if (dctx) {
      dctx.globalAlpha = 0.6;
      dctx.strokeStyle = INK;
      dctx.lineCap = 'round';
      for (let i = 1; i < live.length; i++) {
        dctx.lineWidth = live[i].w;
        dctx.beginPath();
        dctx.moveTo(live[i - 1].x, live[i - 1].y);
        dctx.lineTo(live[i].x, live[i].y);
        dctx.stroke();
      }
      dctx.globalAlpha = 1;
    }
    live = [];
    mode = 'over';
    overAt = performance.now();
    opts.onState('over', { score });
  };

  const render = (): void => {
    const { ctx, w, h } = stage!;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);

    if (dried) ctx.drawImage(dried, 0, 0, w, h);

    // live stroke — quadratic-smoothed variable ribbon
    if (live.length > 1) {
      ctx.strokeStyle = INK;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < live.length; i++) {
        ctx.lineWidth = live[i].w;
        ctx.globalAlpha = 0.55 + 0.45 * (i / live.length); // wet core toward the nib
        const mx = (live[i - 1].x + live[i].x) / 2;
        const my = (live[i - 1].y + live[i].y) / 2;
        ctx.beginPath();
        ctx.moveTo(live[i - 1].x, live[i - 1].y);
        ctx.quadraticCurveTo(live[i - 1].x, live[i - 1].y, mx, my);
        ctx.lineTo(live[i].x, live[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // drops drying into halftone rings
    for (const d of drops) {
      const u = d.life / d.max;
      const pulse = !opts.reducedMotion && u < 0.25 ? 1 + Math.sin(performance.now() / 90) * 0.12 : 1;
      if (u > 0.55) {
        ctx.fillStyle = LIME;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 9 * pulse, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(11,11,11,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // dissolving into an ordered ring of shrinking dots
        ctx.fillStyle = u > 0.3 ? LIME : LIME_DEEP;
        const n = 8;
        for (let j = 0; j < n; j++) {
          const a = (j / n) * TAU;
          const rr = 4 + (1 - u) * 10;
          ctx.beginPath();
          ctx.arc(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr, clamp(3.4 * u * 2, 0.8, 3.4) * pulse, 0, TAU);
          ctx.fill();
        }
      }
    }

    // splashes
    ctx.fillStyle = LIME;
    for (const s of splashes) {
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // nib + multiplier halo
    if (mode !== 'over') {
      ctx.fillStyle = LIME;
      ctx.strokeStyle = 'rgba(11,11,11,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 5.5, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (mult >= 2) {
        ctx.strokeStyle = mult >= 4 ? LIME_DEEP : ASH;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 14 - mult * 0.8, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = LIME_DEEP;
        ctx.font = 'italic 14px "Fraunces Variable", serif';
        ctx.fillText(`×${mult}`, nx + 14, ny - 12);
      }
    }

    // timer as an eroding printed rule
    if (mode === 'playing') {
      const u = timeLeft / SITTING;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, h - 16);
      ctx.lineTo(20 + (w - 40) * u, h - 16);
      ctx.stroke();
      if (timeLeft < 10) {
        ctx.fillStyle = LIME_DEEP;
        for (let i = 1; i <= Math.ceil(timeLeft); i++) {
          ctx.fillRect(20 + (w - 40) * (i / SITTING) - 1, h - 22, 2, 12);
        }
      }
    }
  };

  const frame = (now: number): void => {
    raf = 0;
    if (!running) return;
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(frame);
  };

  const startRun = (): void => {
    mode = 'playing';
    reset();
    opts.onScore(0);
    opts.onState('playing');
  };

  const begin = (): void => {
    if (mode === 'over') {
      // the canvas restarts too — after a beat, so the final stroke's
      // lingering input can't skip the score card
      if (performance.now() - overAt > 700) startRun();
      return;
    }
    if (mode !== 'attract') return;
    startRun();
  };

  const toCanvas = (e: PointerEvent): { x: number; y: number } => {
    const r = canvasEl!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: PointerEvent): void => {
    e.preventDefault();
    canvasEl!.setPointerCapture(e.pointerId);
    begin();
    const p = toCanvas(e);
    // touch: nib leads ahead of the finger so it's never occluded
    target = p;
    pointerHeld = true;
    penDown = true;
  };
  const onMove = (e: PointerEvent): void => {
    if (!pointerHeld) return;
    const p = toCanvas(e);
    if (e.pointerType === 'touch') {
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      const len = Math.hypot(dx, dy) || 1;
      target = { x: p.x + (dx / len) * 24, y: p.y + (dy / len) * 24 };
    } else {
      target = p;
    }
  };
  const onUp = (): void => {
    pointerHeld = false;
    if (!keys.size) penDown = false;
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      begin();
      keys.add(e.code);
      penDown = true;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      begin();
      penDown = !penDown;
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    keys.delete(e.code);
  };

  let canvasEl: HTMLCanvasElement | null = null;

  return {
    mount(canvas, o) {
      opts = o;
      canvasEl = canvas;
      stage = setupStage(canvas, () => resetDried(true));
      mode = 'attract';
      reset();
      opts.onState('attract');
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() { running = false; cancelAnimationFrame(raf); raf = 0; },
    resume() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    restart() {
      startRun();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      canvasEl?.removeEventListener('pointerdown', onDown);
      canvasEl?.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      stage?.destroy();
    },
  };
}
