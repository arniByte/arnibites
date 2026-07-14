/**
 * Calm halftone atmosphere behind the hero (WebGL).
 * A slow monochrome dot field that breathes and drifts — ink on paper,
 * not a data readout. Faint cursor influence, no crosshair, no colour.
 * Rendered at native device resolution with anti-aliased, size-jittered
 * dots, so the print texture stays crisp on any screen.
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
uniform float u_grid;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 asp = vec2(u_res.x/u_res.y, 1.0);
  vec2 p = uv * asp;
  vec2 m = (u_mouse / u_res) * asp;

  // two flowing octaves drifting in different directions — visibly alive
  float flow = fbm(p*2.4 + vec2(u_time*0.06, u_time*0.045));
  flow += 0.5 * fbm(p*4.3 - vec2(u_time*0.035, u_time*0.05));
  float d = 0.28 + flow*0.42;

  // slow breathing wave across the field
  d += 0.06 * sin(p.x*3.0 - p.y*2.0 + u_time*0.5);

  // --- cursor interaction ---
  float md = distance(p, m);
  // ripples radiating out from the pointer
  d += 0.20 * sin(md*34.0 - u_time*3.4) * exp(-md*4.2);
  // local swell of ink right under the pointer
  d += 0.34 * exp(-md*md*11.0);

  // keep it quiet at the centre (wordmark) AND the far edges (corner labels)
  float rc = distance(p, asp*0.5);
  float band = smoothstep(0.05, 0.28, rc) * (1.0 - smoothstep(0.72, 1.18, rc));
  d *= band;

  d = clamp(d, 0.0, 1.0) * u_fade;

  // halftone dots on a fixed grid, anti-aliased at device resolution
  vec2 id = floor(gl_FragCoord.xy / u_grid);
  vec2 cell = fract(gl_FragCoord.xy / u_grid) - 0.5;
  float dot = length(cell);
  // slight per-dot size jitter so the print feels organic, not mechanical
  float jitter = 0.86 + 0.28 * hash(id);
  float radius = d * 0.62 * jitter;
  // AA width = one device pixel, expressed in cell space
  float aa = 1.0 / u_grid;
  float ink = smoothstep(radius, radius - aa * 1.6, dot);

  // paper #f4f2ed -> ink #0b0b0b; ink kept moderate so text stays legible
  vec3 paper = vec3(0.957,0.949,0.929);
  vec3 col = mix(paper, vec3(0.043), ink*0.46);

  gl_FragColor = vec4(col, 1.0);
}
`;

// render 1:1 with device pixels — crisp dots, no chunky upscale. Phones
// commonly sit at DPR 3 and the canvas is small there, so allow it; large
// desktop canvases stay capped at 2.
const DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 3 : 2);
/** dot-cell size in CSS pixels — finer on small viewports so the field
    recedes to paper texture instead of competing with the wordmark */
const CELL = window.innerWidth < 700 ? 6.5 : 9;

export function initHalftone(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', { antialias: false, depth: false, alpha: false });

  if (!gl) {
    canvas.style.background =
      'radial-gradient(rgba(11,11,11,0.14) 1px, transparent 1.4px) 0 0 / 6px 6px';
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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uFade = gl.getUniformLocation(prog, 'u_fade');
  const uGrid = gl.getUniformLocation(prog, 'u_grid');

  let mx = -9999;
  let my = -9999;
  let smx = mx;
  let smy = my;
  let fade = 0;
  let visible = true;
  let raf = 0;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.floor(rect.width * DPR));
    canvas.height = Math.max(2, Math.floor(rect.height * DPR));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const setFromClient = (cx: number, cy: number): void => {
    const rect = canvas.getBoundingClientRect();
    mx = (cx - rect.left) * DPR;
    my = (rect.height - (cy - rect.top)) * DPR;
  };

  // pointer + touch: ripples follow the cursor on desktop and the finger on mobile
  window.addEventListener('pointermove', (e) => setFromClient(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => setFromClient(e.clientX, e.clientY), { passive: true });

  // device tilt nudges the field on phones with no pointer (best-effort, no prompt)
  if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener(
      'deviceorientation',
      (e) => {
        if (e.gamma == null || e.beta == null) return;
        const rect = canvas.getBoundingClientRect();
        mx = (0.5 + Math.max(-1, Math.min(1, e.gamma / 45)) * 0.5) * rect.width * DPR;
        my = (0.5 + Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * 0.5) * rect.height * DPR;
      },
      { passive: true },
    );
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(canvas);

  const start = performance.now();

  function frame(now: number): void {
    raf = 0;
    if (!visible || document.hidden) return;
    fade = Math.min(1, fade + 0.02);
    smx += (mx - smx) * 0.14;
    smy += (my - smy) * 0.14;

    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uTime, REDUCED_MOTION ? 8 : (now - start) / 1000);
    gl!.uniform2f(uMouse, smx, smy);
    gl!.uniform1f(uFade, fade);
    gl!.uniform1f(uGrid, CELL * DPR);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    if (!REDUCED_MOTION || fade < 1) raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame);
  });

  raf = requestAnimationFrame(frame);
}
