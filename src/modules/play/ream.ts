/**
 * REAM — one-tap stacking.
 * A paper sheet slides above the stack; tap to lay it. Overhang slices off
 * and flutters away; three flush drops in a row regrow the sheet a little.
 */
import { ASH, clamp, damp, Game, GameOpts, INK, LIME, LIME_DEEP, PAPER, setupStage, Stage } from './kit';

const SHEET_H = 26;
const GAP = 2;

interface Sheet { x: number; w: number; }
interface Scrap { x: number; y: number; w: number; vy: number; vx: number; rot: number; vr: number; life: number; }
interface Seam { x: number; y: number; w: number; a: number; }

export const meta = { id: 'ream', title: 'Ream', howTo: 'Tap to lay each sheet flush.' };

export function create(): Game {
  let stage: Stage | null = null;
  let opts: GameOpts;
  let raf = 0;
  let last = 0;
  let running = false;

  let mode: 'attract' | 'playing' | 'over' = 'attract';
  let sheets: Sheet[] = [];
  let active = { x: 0, w: 0, dir: 1, speed: 160 };
  let score = 0;
  let streak = 0;
  let cameraY = 0;
  let camTarget = 0;
  let zoom = 1;
  let zoomTarget = 1;
  let squash = 0;
  let dip = 0;
  let overAt = 0; // cooldown so the losing tap can't instantly restart
  let armAt = 0; // short arm delay absorbs reflexive double-taps
  let demoT = 0;
  const scraps: Scrap[] = [];
  const seams: Seam[] = [];

  const baseW = (): number => Math.min(stage!.w * 0.52, 300);
  const topY = (): number => stage!.h * 0.82 - sheets.length * (SHEET_H + GAP);

  /** new sheets enter from alternating sides */
  const spawnSheet = (w: number): void => {
    const margin = stage!.w * 0.08;
    const fromLeft = sheets.length % 2 === 1;
    active = {
      x: fromLeft ? margin : stage!.w - margin - w,
      w,
      dir: fromLeft ? 1 : -1,
      speed: Math.min(160 + sheets.length * 4, 420),
    };
    armAt = performance.now() + 350;
  };

  const reset = (demo: boolean): void => {
    sheets = [{ x: stage!.w / 2 - baseW() / 2, w: baseW() }];
    if (demo) {
      // attract: a pre-built, slightly imperfect tower
      for (let i = 0; i < 10; i++) {
        const prev = sheets[sheets.length - 1];
        const off = Math.sin(i * 2.9) * 7;
        sheets.push({ x: prev.x + off, w: prev.w - Math.abs(off) * 0.4 });
      }
    }
    spawnSheet(sheets[sheets.length - 1].w);
    active.speed = 160;
    score = 0;
    streak = 0;
    cameraY = 0;
    camTarget = 0;
    zoom = 1;
    zoomTarget = 1;
    scraps.length = 0;
    seams.length = 0;
  };

  const tolerance = (): number => Math.max(3, 6 - sheets.length * 0.1);

  const drop = (): void => {
    const below = sheets[sheets.length - 1];
    const left = Math.max(active.x, below.x);
    const right = Math.min(active.x + active.w, below.x + below.w);
    const overlap = right - left;

    if (overlap <= 8) {
      // total miss — the sheet flutters away, run over
      scraps.push({ x: active.x, y: topY() - SHEET_H, w: active.w, vx: active.dir * 40, vy: -30, rot: 0, vr: active.dir * 1.6, life: 1.4 });
      gameOver();
      return;
    }

    const offset = active.x - below.x;
    if (Math.abs(offset) <= tolerance()) {
      // flush
      streak++;
      score += 2;
      seams.push({ x: below.x, y: topY() - SHEET_H, w: below.w, a: 1 });
      let w = below.w;
      if (streak >= 3) w = Math.min(w + 8, baseW()); // regrowth
      sheets.push({ x: below.x, w });
    } else {
      streak = 0;
      score += 1;
      // slice the overhang into a scrap
      const y = topY() - SHEET_H;
      if (active.x < below.x) {
        scraps.push({ x: active.x, y, w: below.x - active.x, vx: -50, vy: -20, rot: 0, vr: -1.8, life: 1.4 });
      } else if (active.x + active.w > below.x + below.w) {
        scraps.push({ x: below.x + below.w, y, w: active.x + active.w - (below.x + below.w), vx: 50, vy: -20, rot: 0, vr: 1.8, life: 1.4 });
      }
      sheets.push({ x: left, w: overlap });
    }

    opts.onScore(score);
    squash = 1;
    dip = 1;

    const next = sheets[sheets.length - 1];
    if (next.w < 8) {
      gameOver();
      return;
    }
    spawnSheet(next.w);
    camTarget = Math.max(0, sheets.length * (SHEET_H + GAP) - stage!.h * 0.42);
  };

  const gameOver = (): void => {
    mode = 'over';
    overAt = performance.now();
    // zoom out to reveal the whole tower
    const towerH = sheets.length * (SHEET_H + GAP);
    zoomTarget = clamp(stage!.h * 0.7 / Math.max(towerH, 1), 0.25, 1);
    camTarget = Math.max(0, towerH - stage!.h * 0.8);
    opts.onState('over', { score });
  };

  const update = (dt: number): void => {
    // triangle-wave slide
    if (mode !== 'over') {
      const margin = stage!.w * 0.08;
      active.x += active.dir * active.speed * dt * (mode === 'attract' ? 0.6 : 1);
      const min = margin;
      const max = stage!.w - margin - active.w;
      if (active.x < min) { active.x = min; active.dir = 1; }
      if (active.x > max) { active.x = max; active.dir = -1; }
    }

    if (mode === 'attract') {
      // demo drop whenever the slide lines up (rate-limited), so the
      // core lay-a-sheet moment is actually demonstrated
      demoT += dt;
      const below = sheets[sheets.length - 1];
      if (demoT > 1.1 && Math.abs(active.x - below.x) < 6) {
        demoT = 0;
        if (sheets.length > 14) reset(true);
        else drop0Demo();
      }
    }

    cameraY += (camTarget - cameraY) * damp(opts.reducedMotion ? 24 : 6, dt);
    zoom += (zoomTarget - zoom) * damp(4, dt);
    squash = Math.max(0, squash - dt * 5);
    dip = Math.max(0, dip - dt * 6);

    for (let i = scraps.length - 1; i >= 0; i--) {
      const s = scraps[i];
      s.vy += 420 * dt;
      s.x += s.vx * dt + (opts.reducedMotion ? 0 : Math.sin(s.life * 9) * 30 * dt);
      s.y += s.vy * dt;
      s.rot += s.vr * dt;
      s.life -= dt * 0.8;
      if (s.life <= 0) scraps.splice(i, 1);
    }
    for (let i = seams.length - 1; i >= 0; i--) {
      seams[i].a -= dt * 2.4;
      if (seams[i].a <= 0) seams.splice(i, 1);
    }
  };

  const drop0Demo = (): void => {
    const below = sheets[sheets.length - 1];
    sheets.push({ x: below.x, w: below.w });
    active.w = below.w;
    active.dir *= -1;
  };

  const render = (): void => {
    const { ctx, w, h } = stage!;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // zoom around the tower base for the game-over reveal
    if (zoom < 0.999) {
      ctx.translate(w / 2, h * 0.86);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h * 0.86);
    }
    ctx.translate(0, cameraY + (dip ? dip * 2 : 0));

    // margin ruler: a tick + numeral every 10 sheets, hugging the stack
    // (ink/ash only — lime stays reserved for the flush seams)
    ctx.font = '12px "Fraunces Variable", serif';
    ctx.textAlign = 'right';
    for (let i = 10; i <= sheets.length; i += 10) {
      const y = h * 0.82 - i * (SHEET_H + GAP);
      const sx = sheets[i - 1].x;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - 26, y);
      ctx.lineTo(sx - 14, y);
      ctx.stroke();
      ctx.fillStyle = ASH;
      ctx.fillText(String(i), sx - 32, y + 4);
    }
    ctx.textAlign = 'left';

    // sheets (only rows near the viewport)
    const first = Math.max(0, sheets.length - Math.ceil(h / (SHEET_H + GAP)) - 4);
    for (let i = first; i < sheets.length; i++) {
      const s = sheets[i];
      const y = h * 0.82 - (i + 1) * (SHEET_H + GAP);
      ctx.fillStyle = i % 2 ? '#eceade' : '#f8f6f1';
      ctx.strokeStyle = ASH;
      ctx.lineWidth = 1;
      ctx.fillRect(s.x, y, s.w, SHEET_H);
      ctx.strokeRect(s.x, y, s.w, SHEET_H);
    }

    // flush seams
    for (const seam of seams) {
      ctx.globalAlpha = Math.max(0, seam.a);
      ctx.strokeStyle = LIME;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(seam.x, seam.y);
      ctx.lineTo(seam.x + seam.w, seam.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // active sheet
    if (mode !== 'over') {
      const y = topY() - SHEET_H;
      const sq = opts.reducedMotion ? 0 : squash;
      const sh = SHEET_H * (1 - sq * 0.15);
      ctx.fillStyle = streak >= 3 ? LIME : '#fff';
      ctx.strokeStyle = streak >= 3 ? LIME_DEEP : INK;
      ctx.lineWidth = 1.5;
      ctx.fillRect(active.x, y + (SHEET_H - sh), active.w, sh);
      ctx.strokeRect(active.x, y + (SHEET_H - sh), active.w, sh);
    }

    // scraps
    for (const s of scraps) {
      ctx.save();
      ctx.globalAlpha = clamp(s.life, 0, 1);
      ctx.translate(s.x + s.w / 2, s.y + SHEET_H / 2);
      ctx.rotate(opts.reducedMotion ? 0 : s.rot);
      ctx.fillStyle = '#f8f6f1';
      ctx.strokeStyle = ASH;
      ctx.fillRect(-s.w / 2, -SHEET_H / 2, s.w, SHEET_H);
      ctx.strokeRect(-s.w / 2, -SHEET_H / 2, s.w, SHEET_H);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
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
    reset(false);
    opts.onScore(0);
    opts.onState('playing');
  };

  const tap = (): void => {
    if (mode === 'attract') {
      startRun();
      return;
    }
    if (mode === 'over') {
      // the canvas restarts too — after a beat, so the losing tap is absorbed
      if (performance.now() - overAt > 700) startRun();
      return;
    }
    if (mode === 'playing' && performance.now() >= armAt) drop();
  };

  const onPointer = (e: PointerEvent): void => { e.preventDefault(); tap(); };
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); }
  };

  let canvasEl: HTMLCanvasElement | null = null;

  return {
    mount(canvas, o) {
      opts = o;
      canvasEl = canvas;
      // note: setupStage fires onResize synchronously, before `stage` is
      // assigned — the guard keeps the demo rebuild off that first call
      stage = setupStage(canvas, () => { if (stage && mode === 'attract') reset(true); });
      mode = 'attract';
      reset(true);
      opts.onState('attract');
      canvas.addEventListener('pointerdown', onPointer);
      window.addEventListener('keydown', onKey);
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
      canvasEl?.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      stage?.destroy();
    },
  };
}
