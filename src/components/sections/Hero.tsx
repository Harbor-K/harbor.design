import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DotMatrix } from '../DotMatrix';
import { HeroCornerWords } from './HeroCornerWords';
import { HeroVideoText } from './HeroVideoText';
import { ASSETS, OBJECT_PHOTOS, FACE_PHOTO } from '../../data/content';
import { fibonacciSphere, hashString, mulberry32, rotateX, rotateY, normalize, lerp } from '../../utils/random';
import { charcoalRingUrl, makeGrainTile } from '../../utils/charcoal';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useViewportSize } from '../../hooks/useViewportSize';

/**
 * Hero story, told with the data circles as you scroll
 * (after gapingvoid's data -> information -> knowledge -> insight -> wisdom -> impact):
 *   1. data       circles pop in one by one (on load). Hierarchy: the sphere + "harbor" (big, bold dots) first,
 *                 "SYSTEMS THINKING" / "SIMPLIFY DATA" small in the bottom corners second.
 *                 Backdrop: white -> soft grey -> yellow.
 *   2. knowledge  charcoal lines connect neighbouring circles; the backdrop washes to plain white
 *   3. insight    three circles connect in three scroll steps — ding, ding, ding: the first lights up, then an
 *                 electric-yellow bolt jumps to the second, then to the third. Everything else greys out.
 *   4. impact     the sphere shakes and the yellow bolts crackle and flicker like an electric shock, then it bursts
 *   5. a video circle opens to full screen with the headline (HeroVideoText)
 * Desktop uses a hand-picked set of 28 circles (DESKTOP_SET); mobile deals 20 from the object deck.
 * Circle images get a saturation boost so they stay rich against the backdrop.
 * While the name is showing, circles that would cross it fade away.
 * Hovering a circle shows what the object means (frosted-glass tag on the sphere's outer side).
 */

const OBJ_BASE = FACE_PHOTO.replace('face.webp', '');
const TEA_PHOTO = `${OBJ_BASE}tea.webp`;
const SHADES_PHOTO = `${OBJ_BASE}shades.webp`;
// new file name so browsers/CDN don't keep showing the old black & white portrait
const FACE_IMG = `${OBJ_BASE}face-color.webp`;
const obj = (n: string) => `${OBJ_BASE}${n}.webp`;

// recolours that read too neon next to the rest
const LOUD = ['tennis-pink', 'eye-green'];
const DECK = OBJECT_PHOTOS.filter((p) => !LOUD.some((n) => p.endsWith(`/${n}.webp`)));
// richer colour on every circle image (was saturate(0.78))
const TONE = 'saturate(1.3) contrast(1.04)';

// hero backdrop: white at the top, a soft warm grey through the middle, yellow at the bottom
const BACKDROP =
  'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 30%, #F4F4F2 46%, #E9E8E4 60%, #EEE8CF 72%, #F8E68A 86%, #FFE14D 100%)';

/**
 * Desktop set (everything except the face, which has its own spot): 27 images.
 * 'eightball' marks the spot the sunglasses portrait takes; 'tea' moves onto the biggest circle.
 */
const DESKTOP_SET = [
  'button-yellow', 'button-yellow', 'button', 'button-red', 'button-cobalt',
  'ball-1', 'ball-1', 'ball-2', 'ball-3', 'ball-4', 'eightball',
  'eye', 'eye-brown',
  'kiwi', 'kiwi-gold',
  'tennis', 'tennis-orange',
  'earth', 'earth', 'compass', 'compass',
  'clock', 'disco', 'cd', 'dartboard', 'lens',
  'tea',
].map((n) => (n === 'tea' ? TEA_PHOTO : obj(n)));

/** What each object stands for, keyed by the image's base file name (colour copies share their original's). */
const OBJECT_MEANING: Record<string, string> = {
  eye: 'Observation & User Understanding',
  eightball: 'Quantitative Data & Measurement',
  ball: 'Quantitative Data & Measurement',
  disco: 'Diverse Perspectives & Complexity',
  button: 'Interaction & User Behaviour',
  clock: 'Time & User Journey',
  cd: 'Digital Technology & Innovation',
  kiwi: 'Hidden Patterns & Structure',
  earth: 'Systems Thinking & Big Picture',
  tennis: 'Iteration & Feedback',
  lens: 'User Research & Deep Observation',
  dartboard: 'Goals & Impact',
  compass: 'Direction & Decision Making',
  tea: 'My go-to caffeine',
  face: 'Your Dream Designer',
  shades: 'Dream Designer ;)',
};
const baseName = (url: string) => (url.split('/').pop() || '').replace(/\.webp$/, '').split('-')[0];
const meaningFor = (url: string): string | undefined => OBJECT_MEANING[baseName(url)];
/** kind of object, ignoring colour (pink 8-ball and numbered balls are all "ball") */
const kindOf = (url: string) => {
  const k = baseName(url);
  return k === 'eightball' ? 'ball' : k;
};
const NEIGHBOURS = 5; // how many nearest circles must not share a kind

interface Bubble {
  x: number;
  y: number;
  z: number;
  size: number;
  photo: string;
  meaning?: string;
  appearAt: number;
}

// electric yellow for the lit circles and the bolts between them
const ELECTRIC = '#FFE600';
const ELECTRIC_RGB = '255,230,0';
const CHARCOAL = '#141414';

const BUBBLE_COUNT_DESKTOP = DESKTOP_SET.length + 1; // + face = 28
const BUBBLE_COUNT_MOBILE = 20;
const POP_START_MS = 500;
const POP_STEP_MS = 70;
const POP_DURATION_MS = 380;
const REF_RADIUS = 245;
const CENTER_Y = 0.53;
const INSIGHT_COUNT = 3;
const LINE_GAP = 5; // lines stop this far short of a circle, like the reference drawings
const SIZE_MIN = 36; // small ones a touch smaller (was 44)
const SIZE_MAX = 114;
const FACE_SIZE = 106;
// perspective scale: back of the sphere -> front (back was 0.62)
const DEPTH_SCALE_MIN = 0.54;
const DEPTH_SCALE_RANGE = 0.62;
const HOVER_SPIN = 0.1; // spin speed multiplier while a tag is open
// the name: the boldest thing on the first screen — bigger, denser dots (pitch as a share of the sphere radius)
const NAME_PITCH_K = 1 / 21;
const NAME_DOT_FILL = 1 / 1.3; // dot diameter / pitch (leaves room for the soft stretch animation)
// clear space around the name (as a fraction of the sphere radius, plus px padding)
const CLEAR_RX = 0.86;
const CLEAR_RY = 0.36;
const CLEAR_PAD = 30;

// Scroll timeline (0–1 across the whole hero)
const NAME_OUT = [0.02, 0.1] as const;
const LINK = [0.04, 0.16] as const;
// the gradient backdrop washes to plain white as the lines start, finishing before the first ding
const WHITE_IN = [0.05, 0.16] as const;
// three connection steps: each fires (ding) once the scroll passes its point, and plays on its own clock
const STEP_AT = [0.18, 0.25, 0.32] as const;
const STEP_MS = 420;
const SHAKE = [0.36, 0.47] as const;
const FLY = [0.47, 0.56] as const;
const GROW = [0.5, 0.62] as const;
const EXPAND = [0.62, 0.84] as const;
const TEXT_IN = [0.84, 0.93] as const;

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** One bold charcoal stroke between two circles, stopping short of both; nearly straight with a faint hand wobble. */
function charcoalLine(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
  seed: number,
  frac: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const sx = ax + ux * (ar + LINE_GAP);
  const sy = ay + uy * (ar + LINE_GAP);
  const ex = bx - ux * (br + LINE_GAP);
  const ey = by - uy * (br + LINE_GAP);
  const len = Math.hypot(ex - sx, ey - sy);
  if (len < 6 || (ex - sx) * ux + (ey - sy) * uy <= 0) return;
  const nx = -uy;
  const ny = ux;
  const bow = (seed - 0.5) * 0.06 * len;
  const steps = Math.max(4, Math.min(14, Math.round(len / 14)));
  const last = Math.max(1, Math.round(steps * frac));
  ctx.beginPath();
  for (let s = 0; s <= last; s++) {
    const t = s / steps;
    const off = 4 * t * (1 - t) * bow + Math.sin(t * Math.PI * 2 + seed * 17) * 0.5;
    const x = sx + (ex - sx) * t + nx * off;
    const y = sy + (ey - sy) * t + ny * off;
    if (s === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/**
 * Electric bolt between two circles: a jagged line re-randomised every frame (so it buzzes),
 * a wide yellow glow and a thin white-hot core. `amp` is how wild the zigzag is; `frac` how far it has travelled.
 */
function electricBolt(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
  frac: number,
  amp: number,
  alpha: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const sx = ax + ux * (ar + LINE_GAP);
  const sy = ay + uy * (ar + LINE_GAP);
  const ex = bx - ux * (br + LINE_GAP);
  const ey = by - uy * (br + LINE_GAP);
  const len = Math.hypot(ex - sx, ey - sy);
  if (len < 4 || frac <= 0) return;
  const nx = -uy;
  const ny = ux;
  const n = Math.max(6, Math.round(len / 12));
  const pts: [number, number][] = [];
  for (let s = 0; s <= n; s++) {
    const t = s / n;
    if (t > frac) break;
    const edge = s === 0 || s === n ? 0 : 1;
    const off = edge * (Math.random() * 2 - 1) * amp;
    pts.push([sx + (ex - sx) * t + nx * off, sy + (ey - sy) * t + ny * off]);
  }
  if (frac < 1) pts.push([sx + (ex - sx) * frac, sy + (ey - sy) * frac]);
  if (pts.length < 2) return;

  const path = () => {
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  // glow
  ctx.shadowColor = `rgba(${ELECTRIC_RGB},0.95)`;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = ELECTRIC;
  ctx.lineWidth = 4.5;
  path();
  ctx.stroke();
  // white-hot core
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#FFFBD6';
  ctx.lineWidth = 1.6;
  path();
  ctx.stroke();
  // spark at the travelling tip
  if (frac < 1) {
    const [hx, hy] = pts[pts.length - 1];
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const insightIndices = (n: number) => Array.from({ length: INSIGHT_COUNT }, (_, k) => Math.floor(((k + 0.5) * n) / INSIGHT_COUNT));

/** Network of nearest neighbours (grey charcoal lines) + the three lit circles, linked straight to each other in order. */
function buildGraph(bubbles: Bubble[]) {
  const n = bubbles.length;
  const rng = mulberry32(hashString('hero-graph'));
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const edgeMap = new Map<string, { a: number; b: number; reveal: number; seed: number }>();
  for (let i = 0; i < n; i++) {
    const d = bubbles
      .map((o, j) => ({ j, d: (o.x - bubbles[i].x) ** 2 + (o.y - bubbles[i].y) ** 2 + (o.z - bubbles[i].z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    d.forEach(({ j }) => {
      const k = key(i, j);
      if (!edgeMap.has(k)) edgeMap.set(k, { a: i, b: j, reveal: rng(), seed: rng() });
    });
  }
  const lit = insightIndices(n);
  const bolts: [number, number][] = [];
  for (let k = 0; k < lit.length - 1; k++) bolts.push([lit[k], lit[k + 1]]);
  return { edges: Array.from(edgeMap.values()), lit, litSet: new Set(lit), bolts };
}

/**
 * Re-deals the object images so no circle shares a kind with its nearest neighbours.
 * The face, the sunglasses portrait and the tea keep their spots; sizes stay with their spots.
 */
function spreadKinds(list: Bubble[]) {
  const n = list.length;
  const near = list.map((a, i) =>
    list
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, NEIGHBOURS)
      .map((o) => o.j)
  );
  const fixed = new Set<number>();
  list.forEach((b, i) => {
    if (b.photo === FACE_IMG || b.photo === TEA_PHOTO || b.photo === SHADES_PHOTO) fixed.add(i);
  });
  const pool = list.filter((_, i) => !fixed.has(i)).map((b) => b.photo);
  const placed = new Set(fixed);
  const rng = mulberry32(hashString('hero-mix'));

  for (let i = 0; i < n; i++) {
    if (fixed.has(i)) continue;
    const banned = new Set(near[i].filter((j) => placed.has(j)).map((j) => kindOf(list[j].photo)));
    const left: Record<string, number> = {};
    pool.forEach((p) => (left[kindOf(p)] = (left[kindOf(p)] || 0) + 1));
    let best = 0;
    let bestScore = -Infinity;
    pool.forEach((p, k) => {
      const score = (banned.has(kindOf(p)) ? -1000 : 0) + left[kindOf(p)] + rng() * 0.9;
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    });
    list[i].photo = pool.splice(best, 1)[0];
    placed.add(i);
  }

  const clash = (i: number) => near[i].reduce((c, j) => c + (kindOf(list[j].photo) === kindOf(list[i].photo) ? 1 : 0), 0);
  for (let pass = 0; pass < 20; pass++) {
    let improved = false;
    for (let i = 0; i < n; i++) {
      if (fixed.has(i) || clash(i) === 0) continue;
      for (let j = 0; j < n; j++) {
        if (j === i || fixed.has(j)) continue;
        const before = clash(i) + clash(j);
        [list[i].photo, list[j].photo] = [list[j].photo, list[i].photo];
        if (clash(i) + clash(j) < before) {
          improved = true;
          break;
        }
        [list[i].photo, list[j].photo] = [list[j].photo, list[i].photo];
      }
    }
    if (!improved) break;
  }
  list.forEach((b) => (b.meaning = meaningFor(b.photo)));
}

export function Hero() {
  const outerRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const inkPattern = useRef<CanvasPattern | null>(null);
  // hover tag
  const hoverRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, progressRef } = useScrollProgress(outerRef);
  const { width: vw, height: vh } = useViewportSize();

  const sphereRadius = Math.max(120, Math.min(vw * 0.17, vh * 0.3));
  const sizeK = sphereRadius / REF_RADIUS;

  const bubbles = useMemo<Bubble[]>(() => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = mobile ? BUBBLE_COUNT_MOBILE : BUBBLE_COUNT_DESKTOP;
    const points = fibonacciSphere(count);
    const rng = mulberry32(hashString('hero-bubbles'));
    const order = points.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const rank = new Array(points.length);
    order.forEach((idx, r) => (rank[idx] = r));

    // desktop: the exact hand-picked set; mobile: deal from the deck in a shuffled cycle
    const deck = (mobile ? DECK : DESKTOP_SET).map((p) => p);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    let dealt = 0;
    const lit = insightIndices(points.length);
    const faceIdx = lit[1]; // the face is the middle of the three connected circles

    const list: Bubble[] = points.map((p, i) => {
      const isFace = i === faceIdx;
      const size = isFace ? FACE_SIZE : SIZE_MIN + rng() * (SIZE_MAX - SIZE_MIN);
      const photo = isFace ? FACE_IMG : deck[dealt++ % deck.length];
      return { ...p, size, photo, meaning: meaningFor(photo), appearAt: POP_START_MS + rank[i] * POP_STEP_MS };
    });

    // the milk tea sits on the biggest circle (not the face, not a lit one) so it reads clearly
    let big = -1;
    list.forEach((b, i) => {
      if (i === faceIdx || lit.includes(i)) return;
      if (big < 0 || b.size > list[big].size) big = i;
    });
    if (big >= 0) {
      const teaAt = list.findIndex((b) => b.photo === TEA_PHOTO);
      if (teaAt >= 0) [list[teaAt].photo, list[big].photo] = [list[big].photo, list[teaAt].photo];
      else list[big].photo = TEA_PHOTO;
    }

    // the sunglasses portrait replaces the smallest pool ball (pink 8-ball first)
    const pickSmallest = (test: (b: Bubble) => boolean) => {
      let s = -1;
      list.forEach((b, i) => {
        if (!test(b)) return;
        if (s < 0 || b.size < list[s].size) s = i;
      });
      return s;
    };
    let small = pickSmallest((b) => b.photo.endsWith('/eightball.webp'));
    if (small < 0) small = pickSmallest((b) => kindOf(b.photo) === 'ball');
    if (small >= 0) list[small].photo = SHADES_PHOTO;

    // keep look-alikes apart
    spreadKinds(list);
    return list;
  }, []);

  const graph = useMemo(() => buildGraph(bubbles), [bubbles]);

  // electric-yellow charcoal ring images for the lit circles (needs the DOM, so after mount)
  const sizeBucket = Math.round(sizeK * 20) / 20;
  const [litRings, setLitRings] = useState<(string | undefined)[]>([]);
  useEffect(() => {
    setLitRings(
      bubbles.map((b, i) => (graph.litSet.has(i) ? charcoalRingUrl(hashString(`lit-${i}`), b.size * sizeBucket * 1.12, 4.6, ELECTRIC) : undefined))
    );
  }, [bubbles, graph, sizeBucket]);

  // tilt / drag / spin state
  const tiltTarget = useRef({ x: 0, y: 0 });
  const tiltCurrent = useRef({ x: 0, y: 0 });
  const dragRot = useRef({ x: 0, y: 0 });
  const dragVel = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      tiltTarget.current = { x: ny * 10, y: nx * 10 };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      const vy = dx * 0.35;
      const vx = -dy * 0.35;
      dragRot.current.y += vy;
      dragRot.current.x = Math.max(-80, Math.min(80, dragRot.current.x + vx));
      dragVel.current = { x: vx, y: vy };
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    setIsDragging(true);
    hoverRef.current = null;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragVel.current = { x: 0, y: 0 };
  };

  const onBubbleEnter = (i: number) => {
    if (dragging.current || !bubbles[i].meaning) return;
    hoverRef.current = i;
    setHovered(i);
  };
  const onBubbleLeave = (i: number) => {
    if (hoverRef.current === i) hoverRef.current = null;
  };

  // size both line canvases to the screen and prepare the grainy charcoal "ink"
  useEffect(() => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    [baseCanvasRef.current, glowCanvasRef.current].forEach((c) => {
      if (!c) return;
      c.width = Math.round(vw * dpr);
      c.height = Math.round(vh * dpr);
      c.style.width = `${vw}px`;
      c.style.height = `${vh}px`;
      c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    const base = baseCanvasRef.current?.getContext('2d');
    if (base) inkPattern.current = base.createPattern(makeGrainTile(CHARCOAL, 7, 128, 0.72), 'repeat');
  }, [vw, vh]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let last = start;
    let spin = 0;
    let spinMul = 1;
    const pos = bubbles.map(() => ({ x: 0, y: 0, r: 0, depth: 0, pop: 0, clear: 1 }));
    const clearRx = sphereRadius * CLEAR_RX + CLEAR_PAD;
    const clearRy = sphereRadius * CLEAR_RY + CLEAR_PAD;
    const steps = [0, 0, 0]; // 0..1 per connection step, each on its own clock
    let flicker = 1;
    let nextFlicker = 0;

    const tick = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      const p = progressRef.current;
      const nameShown = 1 - normalize(p, NAME_OUT[0], NAME_OUT[1]);
      const linkT = normalize(p, LINK[0], LINK[1]);
      const shakeT = prefersReducedMotion ? 0 : normalize(p, SHAKE[0], SHAKE[1]);
      const fly = easeOutCubic(normalize(p, FLY[0], FLY[1]));
      const elapsed = t - start;
      const hov = hoverRef.current;

      // ding, ding, ding: each step runs forward/back on time once the scroll crosses its point
      for (let k = 0; k < 3; k++) {
        const target = p >= STEP_AT[k] ? 1 : 0;
        const d = prefersReducedMotion ? 1 : dt / STEP_MS;
        steps[k] = target > steps[k] ? Math.min(1, steps[k] + d) : Math.max(0, steps[k] - d * 1.6);
      }
      const connectT = (steps[0] + steps[1] + steps[2]) / 3;
      // circle k lights when its bolt arrives (circle 0 lights on step 0)
      const litGlow = [easeOutCubic(steps[0]), smooth(0.7, 1, steps[1]), smooth(0.7, 1, steps[2])];
      const boltFrac = [clamp01(steps[1] / 0.75), clamp01(steps[2] / 0.75)];

      // electric-shock flicker while shaking (and a faint buzz once connected)
      if (t >= nextFlicker) {
        const wild = shakeT > 0.01;
        flicker = wild ? (Math.random() < 0.18 ? 0.25 + Math.random() * 0.3 : 0.8 + Math.random() * 0.2) : 0.9 + Math.random() * 0.1;
        nextFlicker = t + (wild ? 40 + Math.random() * 50 : 90);
      }

      tiltCurrent.current.x = lerp(tiltCurrent.current.x, tiltTarget.current.x, 0.06);
      tiltCurrent.current.y = lerp(tiltCurrent.current.y, tiltTarget.current.y, 0.06);
      if (!dragging.current) {
        dragRot.current.y += dragVel.current.y;
        dragRot.current.x = Math.max(-80, Math.min(80, dragRot.current.x + dragVel.current.x));
        dragVel.current.x *= 0.94;
        dragVel.current.y *= 0.94;
      }
      spinMul = lerp(spinMul, hov !== null ? HOVER_SPIN : 1, 0.08);
      if (!prefersReducedMotion) spin = (spin + dt * 0.012 * (1 - 0.75 * linkT) * spinMul) % 360;

      const cx = vw / 2;
      const cy = vh * CENTER_Y;
      const shakeAmp = shakeT * shakeT * 9;

      bubbles.forEach((b, i) => {
        const el = bubbleRefs.current[i];
        if (!el) return;
        let rp = rotateY(b, spin + dragRot.current.y);
        rp = rotateX(rp, tiltCurrent.current.x + dragRot.current.x);
        rp = rotateY(rp, tiltCurrent.current.y * 0.3);

        const popT = prefersReducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - b.appearAt) / POP_DURATION_MS));
        const pop = popT === 0 ? 0 : easeOutBack(popT);

        const depth = (rp.z + 1) / 2;
        const outwardMul = 1 + fly * 7;
        const jx = shakeAmp ? Math.sin(t * 0.09 + i * 1.7) * shakeAmp : 0;
        const jy = shakeAmp ? Math.cos(t * 0.11 + i * 2.3) * shakeAmp : 0;
        const sx = rp.x * sphereRadius * outwardMul + jx;
        const sy = rp.y * sphereRadius * outwardMul + jy;

        const litK = graph.lit.indexOf(i);
        const isLit = litK >= 0;
        const glow = isLit ? litGlow[litK] * (1 - fly) : 0;
        const isHov = hov === i;
        const dim = isLit ? 1 : 1 - 0.5 * connectT;
        // as the three connect, everything else drains to black & white
        const gray = isLit || isHov ? 0 : connectT * (1 - fly);

        // clear space around the name: circles whose edge would cross the name area fade and shrink away
        const baseScale = DEPTH_SCALE_MIN + depth * DEPTH_SCALE_RANGE;
        const rr = (b.size * sizeK * baseScale) / 2;
        const e = Math.hypot(sx / (clearRx + rr), sy / (clearRy + rr));
        const clear = 1 - nameShown * (1 - smooth(0.82, 1.05, e));

        // a lit circle pops a little as it lights (ding)
        const ding = isLit ? Math.sin(Math.PI * clamp01(litGlow[litK])) * 0.12 : 0;
        const scale = baseScale * (1 + fly * 1.6) * pop * (1 + glow * 0.22 + ding) * (isHov ? 1.08 : 1) * (0.55 + 0.45 * clear);
        const opacity = (0.55 + depth * 0.45) * dim * (1 - Math.min(1, fly * 1.3)) * Math.min(1, popT * 2) * clear;
        const g = glow * flicker;

        el.style.transform = `translate3d(calc(-50% + ${sx}px), calc(-50% + ${sy}px), 0) scale(${scale})`;
        el.style.opacity = String(Math.max(0, isHov ? 1 : isLit ? Math.max(opacity, glow) : opacity));
        el.style.zIndex = String(isHov ? 120 : isLit && glow > 0.05 ? 105 : 1 + Math.round(depth * 100));
        el.style.boxShadow = g > 0.01 ? `0 0 ${30 * g}px ${10 * g}px rgba(${ELECTRIC_RGB},${0.75 * g}), 0 0 ${8 * g}px ${2 * g}px rgba(255,255,230,${0.8 * g})` : 'none';
        el.style.filter = gray > 0.01 ? `${TONE} grayscale(${gray.toFixed(3)})` : TONE;
        el.style.pointerEvents = clear < 0.35 ? 'none' : '';
        const ring = ringRefs.current[i];
        if (ring) ring.style.opacity = String(g);

        pos[i].x = cx + sx;
        pos[i].y = cy + sy;
        pos[i].r = (b.size * sizeK * scale) / 2;
        pos[i].depth = depth;
        pos[i].pop = popT;
        pos[i].clear = clear;
      });

      // --- hover tag follows the hovered circle; opens on the sphere's outer side ---
      const tip = tipRef.current;
      if (tip) {
        const show = hov !== null && fly < 0.05 && !dragging.current;
        if (show && hov !== null) {
          const q = pos[hov];
          tip.style.transform = `translate3d(${q.x}px, ${q.y}px, 0)`;
          const d = `${Math.round(q.r * 2 + 20)}px`;
          if (reticleRef.current) {
            reticleRef.current.style.width = d;
            reticleRef.current.style.height = d;
          }
          const lab = labelRef.current;
          if (lab) {
            const right = q.x >= cx; // left half of the sphere -> label on the left
            const off = `${Math.round(q.r + 14)}px`;
            lab.style.left = right ? off : 'auto';
            lab.style.right = right ? 'auto' : off;
            lab.style.flexDirection = right ? 'row' : 'row-reverse';
          }
        }
        const o = show ? '1' : '0';
        if (tip.style.opacity !== o) tip.style.opacity = o;
      }

      // --- grey charcoal network ---
      const fade = Math.max(0, 1 - fly * 2);
      const base = baseCanvasRef.current?.getContext('2d');
      const glowCtx = glowCanvasRef.current?.getContext('2d');
      if (base) {
        base.clearRect(0, 0, vw, vh);
        if (linkT > 0 && fade > 0) {
          base.lineCap = 'round';
          base.lineJoin = 'round';
          base.lineWidth = 2.4;
          base.strokeStyle = inkPattern.current ?? CHARCOAL;
          graph.edges.forEach((e) => {
            const a = pos[e.a];
            const b = pos[e.b];
            const reveal = Math.max(0, Math.min(1, (linkT - e.reveal * 0.7) / 0.3));
            if (reveal <= 0) return;
            const keep = 1 - 0.75 * connectT;
            const alpha =
              0.8 * reveal * keep * fade * Math.min(a.pop, b.pop) * Math.min(a.clear, b.clear) * (0.35 + 0.65 * (a.depth + b.depth) / 2);
            if (alpha < 0.02) return;
            base.globalAlpha = alpha;
            charcoalLine(base, a.x, a.y, a.r, b.x, b.y, b.r, e.seed, reveal);
          });
          base.globalAlpha = 1;
        }
      }

      // --- electric bolts between the three lit circles ---
      if (glowCtx) {
        glowCtx.clearRect(0, 0, vw, vh);
        if (fade > 0) {
          const amp = 1.6 + shakeT * 11; // buzzes gently once connected, crackles hard while shaking
          graph.bolts.forEach(([ia, ib], k) => {
            const frac = boltFrac[k];
            if (frac <= 0) return;
            const a = pos[ia];
            const b = pos[ib];
            electricBolt(glowCtx, a.x, a.y, a.r, b.x, b.y, b.r, frac, amp, fade * flicker);
            // extra side-crackle while shaking
            if (shakeT > 0.2 && Math.random() < shakeT * 0.6) {
              electricBolt(glowCtx, a.x, a.y, a.r, b.x, b.y, b.r, frac, amp * 1.6, fade * flicker * 0.45);
            }
          });
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bubbles, graph, sphereRadius, sizeK, vw, vh, prefersReducedMotion, progressRef]);

  const nameOpacity = 1 - normalize(progress, NAME_OUT[0], NAME_OUT[1]);
  const namePitch = sphereRadius * NAME_PITCH_K;
  const nameDotPx = namePitch * NAME_DOT_FILL;
  const whiteWash = smooth(WHITE_IN[0], WHITE_IN[1], progress);

  const grow = normalize(progress, GROW[0], GROW[1]);
  const m = normalize(progress, EXPAND[0], EXPAND[1]);
  const circlePx = vw * 0.24 * grow;
  const widthPx = lerp(circlePx, vw, m);
  const heightPx = lerp(circlePx, vh, m);
  const borderRadiusPx = m < 0.5 ? lerp(circlePx / 2, 120, m / 0.5) : lerp(120, 0, (m - 0.5) / 0.5);
  const topPct = lerp(CENTER_Y * 100, 50, m);
  const textOpacity = normalize(progress, TEXT_IN[0], TEXT_IN[1]);
  const centerTop = `${CENTER_Y * 100}%`;
  const tag = hovered !== null ? bubbles[hovered].meaning : undefined;

  return (
    <div ref={outerRef} style={{ height: '800vh' }} className="relative">
      <style>{`
        @keyframes tag-lock { from { transform: translate(-50%,-50%) scale(1.25); opacity: 0 } to { transform: translate(-50%,-50%) scale(1); opacity: 1 } }
        @keyframes tag-in { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: BACKDROP }}>
        {/* the gradient washes to plain white once the electric connection stage begins */}
        {whiteWash > 0 && <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: whiteWash, zIndex: 0 }} aria-hidden="true" />}

        {/* bottom-corner words in the dot font (second in the hierarchy) */}
        <HeroCornerWords vw={vw} opacity={nameOpacity} reducedMotion={prefersReducedMotion} />

        {/* sphere of data circles — drag to spin */}
        <motion.div
          className="absolute inset-0 select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
          onPointerDown={onPointerDown}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0" style={{ perspective: 1400 }}>
            {/* connection lines sit behind the circles */}
            <canvas ref={baseCanvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />

            {bubbles.map((b, i) => (
              <div
                key={i}
                ref={(el) => (bubbleRefs.current[i] = el)}
                className="absolute rounded-full will-change-transform"
                onPointerEnter={() => onBubbleEnter(i)}
                onPointerLeave={() => onBubbleLeave(i)}
                style={{
                  top: centerTop,
                  left: '50%',
                  width: b.size * sizeK,
                  height: b.size * sizeK,
                  transform: 'translate3d(-50%,-50%,0) scale(0)',
                  opacity: 0,
                  cursor: b.meaning && !isDragging ? 'crosshair' : undefined,
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img src={b.photo} alt={b.meaning ?? ''} draggable={false} className="w-full h-full object-cover pointer-events-none" />
                </div>

                {/* electric-yellow ring for the three lit circles */}
                {litRings[i] && (
                  <div
                    ref={(el) => (ringRefs.current[i] = el)}
                    className="absolute pointer-events-none"
                    style={{ inset: '-13%', backgroundImage: `url(${litRings[i]})`, backgroundSize: '100% 100%', opacity: 0 }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}

            {/* name in the middle of the sphere — first in the hierarchy, with clear space around it */}
            <motion.div
              className="absolute left-1/2 pointer-events-none"
              style={{ top: centerTop, x: '-50%', y: '-50%', zIndex: 110, opacity: nameOpacity }}
              initial={prefersReducedMotion ? false : { scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: prefersReducedMotion ? 0 : 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <DotMatrix text="harbor" dotPx={nameDotPx} pitchPx={namePitch} color="#0A0A0A" mode="static" />
            </motion.div>

            {/* electric bolts sit on top of the circles */}
            <canvas ref={glowCanvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 130 }} />

            {/* hover tag — anchored to the hovered circle's centre each frame */}
            <div
              ref={tipRef}
              className="absolute left-0 top-0 pointer-events-none"
              style={{ zIndex: 140, opacity: 0, transition: 'opacity 180ms ease-out' }}
              role="tooltip"
              aria-hidden={tag ? undefined : true}
            >
              {tag && (
                <React.Fragment key={hovered ?? -1}>
                  {/* corner brackets lock onto the circle */}
                  <div
                    ref={reticleRef}
                    className="absolute left-0 top-0"
                    style={{ transform: 'translate(-50%,-50%)', animation: prefersReducedMotion ? undefined : 'tag-lock 220ms cubic-bezier(.2,.9,.3,1)' }}
                  >
                    <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#F5C518]" />
                    <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#F5C518]" />
                    <span className="absolute left-0 bottom-0 h-3 w-3 border-l-2 border-b-2 border-[#F5C518]" />
                    <span className="absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#F5C518]" />
                  </div>

                  {/* leader line + frosted-glass label */}
                  <div ref={labelRef} className="absolute top-0 flex items-center" style={{ transform: 'translateY(-50%)' }}>
                    <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5C518]" />
                    <span className="block h-px w-8 shrink-0 bg-[#F5C518]" />
                    <div
                      className="whitespace-nowrap rounded-2xl px-4 py-3 text-[19px] font-normal leading-tight tracking-[-0.015em] text-[#3A3A3C]"
                      style={{
                        background: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(22px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 32px rgba(10,10,10,0.14), 0 0 0 0.5px rgba(10,10,10,0.08)',
                        animation: prefersReducedMotion ? undefined : 'tag-in 220ms cubic-bezier(.2,.9,.3,1)',
                      }}
                    >
                      {tag}
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </motion.div>

        {/* centre video circle that opens to full-bleed */}
        {grow > 0 && (
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{
              top: `${topPct}%`,
              left: '50%',
              width: widthPx,
              height: heightPx,
              borderRadius: borderRadiusPx,
              transform: 'translate(-50%,-50%)',
              zIndex: 150,
            }}
          >
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={ASSETS.video}
              poster={ASSETS.videoPoster}
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" style={{ opacity: textOpacity }} />
          </div>
        )}

        {/* text over the full-screen video */}
        <HeroVideoText opacity={textOpacity} />
      </div>
    </div>
  );
}
