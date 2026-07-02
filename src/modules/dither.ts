/**
 * Mouse-reactive Bayer-dithered noise field (WebGL) behind the hero.
 * Rendered at 1/3 resolution and upscaled with `image-rendering: pixelated`
 * for the chunky print-dither look.
 */
import { REDUCED_MOTION } from './utils';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_fade;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);
  vec2 p = uv * asp;
  vec2 m = (u_mouse / u_res) * asp;

  float field = fbm(p * 2.6 + vec2(u_time * 0.05, -u_time * 0.03)) * 0.34;

  // breathing diagonal band
  field += 0.06 * sin(p.x * 2.0 - p.y * 1.4 + u_time * 0.22);

  // cursor gravity well
  float d = distance(p, m);
  field += 0.42 * exp(-d * d * 9.0);

  // keep edges quiet so the type owns the frame
  field *= smoothstep(0.85, 0.15, distance(p, asp * 0.5));

  float t = bayer8(gl_FragCoord.xy);
  float on = step(t, field * u_fade);

  vec3 col = mix(vec3(0.039), vec3(0.62), on);

  // sparse pink pixels inside the cursor well
  float pinkMask = on
    * smoothstep(0.30, 0.02, d)
    * step(0.82, hash(floor(gl_FragCoord.xy * 0.5) + floor(u_time * 3.0)));
  col = mix(col, vec3(1.0, 0.18, 0.53), pinkMask);

  gl_FragColor = vec4(col, 1.0);
}
`;

const PIXEL_SIZE = 3;

export function initDither(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    depth: false,
    alpha: false,
  });

  if (!gl) {
    // graceful fallback: CSS halftone dots
    canvas.style.background =
      'radial-gradient(rgba(241,240,236,0.22) 1px, transparent 1.5px) 0 0 / 14px 14px';
    return;
  }

  const compile = (type: number, src: string): WebGLShader => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uFade = gl.getUniformLocation(prog, 'u_fade');

  let mx = -1000;
  let my = -1000;
  let smx = -1000;
  let smy = -1000;
  let fade = 0;
  let visible = true;
  let raf = 0;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.floor(rect.width / PIXEL_SIZE));
    canvas.height = Math.max(2, Math.floor(rect.height / PIXEL_SIZE));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener(
    'pointermove',
    (e) => {
      const rect = canvas.getBoundingClientRect();
      mx = (e.clientX - rect.left) / PIXEL_SIZE;
      my = (rect.height - (e.clientY - rect.top)) / PIXEL_SIZE;
    },
    { passive: true },
  );

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(canvas);

  const start = performance.now();

  function frame(now: number): void {
    raf = 0;
    if (!visible || document.hidden) return;

    fade = Math.min(1, fade + 0.016);
    smx += (mx - smx) * 0.08;
    smy += (my - smy) * 0.08;

    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uTime, REDUCED_MOTION ? 12 : (now - start) / 1000);
    gl!.uniform2f(uMouse, smx, smy);
    gl!.uniform1f(uFade, fade);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    if (!REDUCED_MOTION || fade < 1) {
      raf = requestAnimationFrame(frame);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame);
  });

  raf = requestAnimationFrame(frame);
}
