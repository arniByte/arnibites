/**
 * REGISTER — one-tap timing.
 * A lime dot orbits a halftone ring; tap when it's inside the registration
 * gate. Misses misregister the print (double-image ghost). 3 lives.
 */
import { ASH, clamp, Game, GameOpts, INK, LIME, LIME_DEEP, PAPER, setupStage, Stage } from './kit';

const TAU = Math.PI * 2;
const RING_DOTS = 72;

interface Ripple { r: number; a: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; }

export const meta = { id: 'register', title: 'Register', howTo: 'Tap when the dot meets the mark — let it pass and you lose a life.' };

export function create(): Game {
  let stage: Stage | null = null;
  let opts: GameOpts;
  let raf = 0;
  let last = 0;
  let running = false;

  // world
  let mode: 'attract' | 'playing' | 'over' = 'attract';
  let angle = -Math.PI / 2;
  let speed = TAU / 2.6; // rad/s
  let dir = 1;
  let gate = Math.PI / 2;
  let gateHalf = 0.36; // rad
  let score = 0;
  let lives = 3;
  let ghost = 0; // misregistration timer
  let shake = 0;
  let flash = 0;
  let sweep = -1; // level-up arc sweep progress
  let overAt = 0; // cooldown so the losing tap can't instantly restart
  let demoGate = 0; // attract: every 4th gate is deliberately missed
  const ripples: Ripple[] = [];
  const particles: Particle[] = [];
  const trail: number[] = [];

  const R = (): number => Math.min(stage!.w, stage!.h) * 0.34;

  const reset = (): void => {
    angle = -Math.PI / 2;
    speed = TAU / 2.6;
    dir = 1;
    gate = Math.PI / 2;
    gateHalf = 0.36;
    score = 0;
    lives = 3;
    ghost = 0;
    shake = 0;
    ripples.length = 0;
    particles.length = 0;
    trail.length = 0;
  };

  const angDist = (a: number, b: number): number => {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return Math.abs(d);
  };

  const relocateGate = (): void => {
    // keep the new gate at least a quarter-turn away so it's always a journey
    const off = Math.PI / 2 + Math.random() * Math.PI;
    gate = (gate + off * dir) % TAU;
  };

  const burst = (x: number, y: number, n: number, lime: boolean): void => {
    if (opts.reducedMotion) return;
    for (let i = 0; i < n && particles.length < 32; i++) {
      const a = Math.random() * TAU;
      const v = 60 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: lime ? 1 : 0.7 });
    }
  };

  const hit = (): void => {
    const d = angDist(angle, gate);
    if (d <= gateHalf) {
      const perfect = d <= gateHalf * 0.4;
      score += perfect ? 2 : 1;
      opts.onScore(score);
      ripples.push({ r: 0, a: 1 });
      const px = stage!.w / 2 + Math.cos(gate) * R();
      const py = stage!.h / 2 + Math.sin(gate) * R();
      burst(px, py, perfect ? 14 : 7, true);
      if (perfect) flash = 0.35;
      speed = Math.min(speed * 1.045, TAU / 0.9);
      gateHalf = Math.max(gateHalf - 0.012, 0.12);
      if (score % 6 === 0) {
        dir *= -1;
        sweep = 0;
      }
      relocateGate();
    } else {
      miss();
    }
  };

  const miss = (): void => {
    lives--;
    ghost = 0.24;
    shake = opts.reducedMotion ? 0 : 1;
    if (lives <= 0) {
      mode = 'over';
      overAt = performance.now();
      opts.onState('over', { score });
    }
  };

  const update = (dt: number): void => {
    const prev = angle;
    angle = (angle + speed * dir * dt + TAU) % TAU;

    if (mode === 'playing') {
      // passing through the gate without tapping is a miss
      const before = angDist(prev, gate);
      const after = angDist(angle, gate);
      const crossedOut = before <= gateHalf && after > gateHalf && angDist(prev, angle) < Math.PI / 2;
      if (crossedOut) miss();
    } else if (mode === 'attract') {
      // self-demo: auto-hit when centred — but let every 4th gate pass,
      // so the miss (ghost + a life dimming) is demonstrated too
      if (demoGate % 4 === 3) {
        const before = angDist(prev, gate);
        const after = angDist(angle, gate);
        if (before <= gateHalf && after > gateHalf && angDist(prev, angle) < Math.PI / 2) {
          ghost = 0.24;
          lives = lives > 1 ? lives - 1 : 3;
          demoGate++;
          relocateGate();
        }
      } else if (angDist(angle, gate) < 0.03) {
        ripples.push({ r: 0, a: 1 });
        demoGate++;
        relocateGate();
      }
    }

    trail.unshift(angle);
    if (trail.length > 6) trail.pop();

    ghost = Math.max(0, ghost - dt);
    shake = Math.max(0, shake - dt * 4);
    flash = Math.max(0, flash - dt * 2);
    if (sweep >= 0) sweep = sweep > 1 ? -1 : sweep + dt * 1.6;

    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += dt * 260;
      ripples[i].a -= dt * 1.4;
      if (ripples[i].a <= 0) ripples.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt * 1.6;
      if (p.life <= 0) particles.splice(i, 1);
    }
  };

  const drawRing = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, offset: number, color: string, alpha: number): void => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let i = 0; i < RING_DOTS; i++) {
      const a = (i / RING_DOTS) * TAU;
      let size = 2.1;
      // ripple wavefronts swell nearby dots
      for (const rp of ripples) {
        const dotDist = Math.abs(radius - rp.r);
        size += Math.max(0, 3.4 - dotDist * 0.12) * rp.a;
      }
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * radius + offset, cy + Math.sin(a) * radius, size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const render = (): void => {
    const { ctx, w, h } = stage!;
    const cx = w / 2 + (shake ? (Math.random() - 0.5) * 4 * shake : 0);
    const cy = h / 2 + (shake ? (Math.random() - 0.5) * 4 * shake : 0);
    const radius = R();

    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);

    if (flash > 0) {
      ctx.globalAlpha = flash;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ring (misregistered double-image while ghosting)
    if (ghost > 0) {
      drawRing(ctx, cx, cy, radius, 3.5, LIME_DEEP, 0.4);
      drawRing(ctx, cx, cy, radius, -3.5, INK, 0.8);
    } else {
      drawRing(ctx, cx, cy, radius, 0, ASH, 1);
    }

    // level sweep
    if (sweep >= 0 && sweep <= 1) {
      ctx.strokeStyle = LIME;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 12, -Math.PI / 2, -Math.PI / 2 + sweep * TAU * dir);
      ctx.stroke();
    }

    // gate crop marks
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    const breathe = mode === 'playing' || opts.reducedMotion ? 1 : 1 + Math.sin(performance.now() / 570) * 0.06;
    for (const s of [-1, 1]) {
      const a = gate + gateHalf * s * breathe;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (radius - 12), cy + Math.sin(a) * (radius - 12));
      ctx.lineTo(cx + Math.cos(a) * (radius + 12), cy + Math.sin(a) * (radius + 12));
      ctx.stroke();
    }

    // orbiter trail + dot
    if (!opts.reducedMotion) {
      for (let i = trail.length - 1; i >= 1; i--) {
        const a = trail[i];
        ctx.globalAlpha = 0.14 * (1 - i / trail.length);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 4, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = mode === 'over' ? LIME_DEEP : LIME;
    ctx.strokeStyle = 'rgba(11,11,11,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 8, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // ripples
    for (const rp of ripples) {
      ctx.globalAlpha = Math.max(0, rp.a) * 0.5;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, rp.r, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // particles
    ctx.fillStyle = LIME_DEEP;
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // lives as crop-mark crosses (bottom-left, clear of the plate ornaments)
    for (let i = 0; i < 3; i++) {
      const lx = 24 + i * 22;
      const ly = h - 24;
      ctx.strokeStyle = i < lives ? INK : 'rgba(11,11,11,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx - 6, ly);
      ctx.lineTo(lx + 6, ly);
      ctx.moveTo(lx, ly - 6);
      ctx.lineTo(lx, ly + 6);
      ctx.stroke();
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
    if (mode === 'playing') hit();
  };

  const onPointer = (e: PointerEvent): void => {
    e.preventDefault();
    tap();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      tap();
    }
  };

  let canvasEl: HTMLCanvasElement | null = null;

  return {
    mount(canvas, o) {
      opts = o;
      canvasEl = canvas;
      stage = setupStage(canvas);
      mode = 'attract';
      reset();
      opts.onState('attract');
      canvas.addEventListener('pointerdown', onPointer);
      window.addEventListener('keydown', onKey);
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    },
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
