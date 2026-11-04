import React, { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useViewportSize } from '../../hooks/useViewportSize';

/**
 * Opening of the home page, after zoah.com's intro, in the site's own colours
 * (ink #0A0A0A, white, soft grey, electric yellow #FFE600, blue #3B5BD9).
 *
 *   1. Dark intro: a big centred headline that rises in word by word, the last words in a slow
 *      white-to-yellow sheen, one line of detail and two pill buttons.
 *   2. A rounded card sits under it. Scrolling pins it and opens it to the full screen; then it walks
 *      through four steps of how Harbor works (Discover, Define, Develop, Deliver). The heading on the left
 *      blurs from one step to the next, four bars along the bottom fill up, and a liquid "chrome" sphere
 *      on the right keeps flowing and changes colour with each step. The sphere also leans towards the cursor.
 *
 * All copy reuses lines already on the site. Everything respects prefers-reduced-motion.
 */

const INK = '#0A0A0A';
const YELLOW = '#FFE600';

const STEPS = [
  { label: 'Discover', title: 'Understand\npeople.' },
  { label: 'Define', title: 'Connect\nthe dots.' },
  { label: 'Develop', title: 'Design\nclearly.' },
  { label: 'Deliver', title: 'Test everything\nwith real people.' },
];

// colours of the sphere for each step: deep, mid, accent (the highlight is always near-white)
const PALETTES: [string, string, string][] = [
  ['#0A0A0A', '#5C5C5C', '#BDBDBD'], // chrome
  ['#0A0A0A', '#6B6B70', '#ECEBE8'], // soft grey
  ['#0A0A0A', '#8A7A00', '#FFE600'], // yellow
  ['#0B1033', '#3B5BD9', '#FFE600'], // blue + yellow
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, []);
  return r;
}

/* ------------------------------------------------------------------ */
/* liquid sphere (WebGL)                                                */
/* ------------------------------------------------------------------ */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;      // -1..1, where the cursor is relative to the sphere
uniform vec3 uC0, uC1, uC2;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= .5; }
  return v;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5*uRes) / (.5*min(uRes.x, uRes.y));
  float d = length(uv);
  float edge = 1. - smoothstep(.985, 1., d);
  if (edge <= 0.) { gl_FragColor = vec4(0.); return; }

  // fake 3D: bulge the surface so the pattern wraps around the ball
  float z = sqrt(max(0., 1. - d*d));
  vec2 q = uv / (z + .35);
  q += uMouse * .35 * z;

  float t = uTime * .12;
  vec2 w = vec2(fbm(q*1.1 + t), fbm(q*1.1 - t + 3.7));
  float f = fbm(q*1.4 + 2.2*w + vec2(t*.6, -t*.4));

  // chrome bands
  float b = .5 + .5*sin(f*14. + w.x*4.);
  float hi = smoothstep(.82, .98, b);
  vec3 col = mix(uC0, uC1, smoothstep(.0, .55, b));
  col = mix(col, uC2, smoothstep(.45, .9, b));
  col = mix(col, vec3(.97), hi*.85);

  // rim light + soft shading
  float rim = pow(1. - z, 3.);
  col += rim * .55;
  col *= .55 + .45*z + .25*uv.y*z;

  gl_FragColor = vec4(col * edge, edge);
}`;

function LiquidSphere({ palette, mouse, speed }: { palette: [number, number, number][]; mouse: React.MutableRefObject<[number, number]>; speed: React.MutableRefObject<number> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pal = useRef(palette);
  pal.current = palette;
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!gl) {
      setFailed(true);
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uC0 = u('uC0'), uC1 = u('uC1'), uC2 = u('uC2');

    let raf = 0;
    let time = 3;
    let last = performance.now();
    const m = [0, 0];
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) time += dt * (1 + speed.current);
      speed.current *= 0.92;
      // ease the lean towards the cursor
      m[0] += (mouse.current[0] - m[0]) * 0.06;
      m[1] += (mouse.current[1] - m[1]) * 0.06;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, m[0], m[1]);
      const [a, b, cc] = pal.current;
      gl.uniform3f(uC0, a[0], a[1], a[2]);
      gl.uniform3f(uC1, b[0], b[1], b[2]);
      gl.uniform3f(uC2, cc[0], cc[1], cc[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduce, mouse, speed]);

  if (failed) {
    // no WebGL: a still, shaded ball in the same colours
    const [a, b, cc] = palette.map((x) => `rgb(${x.map((v) => Math.round(v * 255)).join(',')})`);
    return <div className="h-full w-full rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${cc} 18%, ${b} 45%, ${a} 80%)` }} />;
  }
  return <canvas ref={canvas} className="block h-full w-full" aria-hidden />;
}

/* ------------------------------------------------------------------ */

function HeadlineWords({ text, delay = 0, sheen = false }: { text: string; delay?: number; sheen?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span
          key={i}
          className={`inline-block ${sheen ? 'intro-sheen' : ''}`}
          style={{
            opacity: on ? 1 : 0,
            transform: on ? 'none' : 'translateY(0.35em)',
            filter: on ? 'none' : 'blur(8px)',
            transition: `opacity 0.9s ease ${delay + i * 0.08}s, transform 1s cubic-bezier(0.22,1,0.36,1) ${delay + i * 0.08}s, filter 0.9s ease ${delay + i * 0.08}s`,
            marginRight: '0.24em',
          }}
        >
          {w}
        </span>
      ))}
    </>
  );
}

export function IntroHero() {
  const outerRef = useRef<HTMLDivElement>(null);
  const { progress: p } = useScrollProgress(outerRef);
  const { width: vw, height: vh } = useViewportSize();
  const mouse = useRef<[number, number]>([0, 0]);
  const speed = useRef(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLoaded(true), 50);
    return () => window.clearTimeout(id);
  }, []);

  // scrolling stirs the liquid a little
  useEffect(() => {
    let lastY = window.scrollY;
    const on = () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      speed.current = Math.min(4, speed.current + dy / 120);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // timeline inside the pinned part
  const open = ease(seg(p, 0, 0.14)); // card opens to full screen
  const stepsP = seg(p, 0.16, 0.94) * STEPS.length; // 0..4
  const active = Math.min(STEPS.length - 1, Math.floor(stepsP));

  // sphere colour: blend between the current and next palette near the change
  const blend = clamp01((stepsP - active - 0.8) / 0.2);
  const from = PALETTES[active].map(hex);
  const to = PALETTES[Math.min(PALETTES.length - 1, active + 1)].map(hex);
  const palette = from.map((c, i) => c.map((v, k) => lerp(v, to[i][k], blend))) as [number, number, number][];

  const mobile = vw < 768;
  const insetX = lerp(mobile ? 16 : Math.max(24, vw * 0.12), 0, open);
  const insetY = lerp(mobile ? 16 : 40, 0, open);
  const radius = lerp(20, 0, open);
  const sphere = mobile ? vw * 1.1 : Math.min(vh * 1.05, vw * 0.62);

  return (
    <div style={{ background: '#111111', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <style>{`
        .intro-sheen {
          background: linear-gradient(100deg, #FFFFFF 0%, #FFFFFF 35%, ${YELLOW} 50%, #FFFFFF 65%, #FFFFFF 100%);
          background-size: 250% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          /* room for g / y descenders, otherwise the clipped background cuts them off */
          padding-bottom: 0.14em; margin-bottom: -0.14em;
          animation: intro-sheen 6s ease-in-out 1.2s infinite;
        }
        @keyframes intro-sheen { 0% { background-position: 100% 0; } 60%, 100% { background-position: 0% 0; } }
        .intro-pill-arrow { transition: transform .25s ease; }
        a:hover > .intro-pill-arrow { transform: translateX(3px); }
        .intro-pill-arrow { display: block; flex-shrink: 0; }
        @media (prefers-reduced-motion: reduce) { .intro-sheen { animation: none; } }
      `}</style>

      {/* 1 · intro */}
      <section className="relative flex flex-col items-center px-6 pt-[160px] md:pt-[200px] pb-[80px] text-center text-white">
        <h1 className="max-w-[1100px] text-[44px] sm:text-[60px] md:text-[80px] leading-[1.1] font-medium tracking-[-0.015em]" style={{ textWrap: 'balance' } as React.CSSProperties}>
          <HeadlineWords text="I observe objectively to" delay={0.1} />
          <HeadlineWords text="design clearly." delay={0.45} sheen />
        </h1>
        <p
          className="mt-[30px] max-w-[640px] text-[18px] md:text-[20px] leading-[1.5] text-[#9A9AA0]"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(12px)', transition: 'opacity 0.9s ease 0.8s, transform 1s cubic-bezier(0.22,1,0.36,1) 0.8s', textWrap: 'balance' } as React.CSSProperties}
        >
          3+ years designing fintech and e-learning products: trading platforms, digital banking, crypto wallets and data{' '}dashboards.
        </p>
        <div
          className="mt-[40px] flex flex-wrap items-center justify-center gap-[10px]"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(12px)', transition: 'opacity 0.9s ease 1s, transform 1s cubic-bezier(0.22,1,0.36,1) 1s' }}
        >
          <a href="#work" className="inline-flex items-center gap-[8px] rounded-full bg-white px-[22px] py-[12px] text-[17px] font-medium text-black transition-colors duration-200 hover:bg-[#FFE600]">
            View projects <svg className="intro-pill-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <a href="#/about" className="inline-flex items-center gap-[8px] rounded-full border border-white/30 px-[22px] py-[12px] text-[17px] font-medium text-white transition-colors duration-200 hover:border-white hover:bg-white/10">
            About me <svg className="intro-pill-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </section>

      {/* 2 · pinned card: opens to full screen, then walks through four steps */}
      <div ref={outerRef} className="relative" style={{ height: '420vh' }}>
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          onPointerMove={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            mouse.current = [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
          }}
          onPointerLeave={() => (mouse.current = [0, 0])}
        >
          <div className="absolute overflow-hidden" style={{ left: insetX, right: insetX, top: insetY, bottom: insetY, borderRadius: radius, background: INK }}>
            {/* sphere, cropped by the right/bottom edge like the reference */}
            <div
              className="pointer-events-none absolute"
              style={{
                width: sphere,
                height: sphere,
                left: mobile ? '15%' : '52%',
                top: mobile ? '38%' : '14%',
                opacity: mobile ? 0.75 : 1,
                transform: `translate3d(0, ${lerp(60, 0, open)}px, 0) scale(${lerp(0.92, 1, open)})`,
              }}
            >
              <LiquidSphere palette={palette} mouse={mouse} speed={speed} />
            </div>

            {/* step text */}
            <div className="absolute left-0 right-0 top-[22%] px-6 md:px-[60px]">
              <div className="relative h-[24px]">
                {STEPS.map((s, i) => (
                  <p
                    key={s.label}
                    className="absolute left-0 top-0 text-[16px] md:text-[18px] text-[#9A9AA0]"
                    style={{ opacity: i === active ? 1 : 0, filter: i === active ? 'none' : 'blur(6px)', transition: 'opacity .6s ease, filter .6s ease' }}
                  >
                    {String(i + 1).padStart(2, '0')} · {s.label}
                  </p>
                ))}
              </div>
              <div className="relative mt-[16px]" style={{ height: '2.3em', fontSize: 'clamp(40px, 5.2vw, 80px)' }}>
                {STEPS.map((s, i) => (
                  <h2
                    key={s.label}
                    className="absolute left-0 top-0 whitespace-pre-line font-bold leading-[1.04] tracking-[-0.03em] text-white"
                    style={{
                      opacity: i === active ? 1 : 0,
                      filter: i === active ? 'none' : 'blur(10px)',
                      transform: i === active ? 'none' : `translateY(${i < active ? -16 : 16}px)`,
                      transition: 'opacity .7s ease, filter .7s ease, transform .8s cubic-bezier(0.22,1,0.36,1)',
                    }}
                    aria-hidden={i !== active}
                  >
                    {s.title}
                  </h2>
                ))}
              </div>
            </div>

            {/* four progress bars */}
            <div className="absolute bottom-[40px] left-6 right-6 md:left-[60px] md:right-[60px] grid grid-cols-4 gap-[10px]">
              {STEPS.map((s, i) => {
                const fill = clamp01(stepsP - i);
                return (
                  <div key={s.label}>
                    <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/20">
                      <div className="h-full origin-left" style={{ transform: `scaleX(${fill})`, background: i === active ? YELLOW : '#FFFFFF' }} />
                    </div>
                    <p className="mt-[10px] hidden text-[16px] md:block" style={{ color: i === active ? '#FFFFFF' : 'rgba(255,255,255,0.45)', transition: 'color .4s ease' }}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
