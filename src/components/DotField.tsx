import React, { useEffect, useRef } from 'react';
import { hashString, mulberry32 } from '../utils/random';

/**
 * Dot harbour for the footer.
 * The ground is a still, colourful landscape of round dots (navy -> cobalt -> yellow -> red -> lime,
 * with a few lighter tints and loose dots above) along the bottom `height` px. It doesn't move.
 * In the middle, a lighthouse made of the same dots stands on a low pier. Only its light moves:
 * - Beam: the lamp throws a wide beam of yellow dots (on the same dot grid) that turns a full 360°
 *   to follow the cursor across the whole footer, behind the text.
 * - Facing you: when the cursor comes near the lighthouse, the light turns towards the viewer —
 *   the beam fades and a round glow opens around the lamp, white-hot in the middle and spreading
 *   out in rings of yellow dots. Moving away turns it back into a beam.
 *   The lighthouse itself stays drawn on top, so it never washes out.
 * Dots grow and brighten towards the centre of the light, so the edges feather off naturally.
 * With no cursor around, the beam slowly sweeps like a real lighthouse.
 */

const SPACING = 13;
const DOT_R = 4.6;
const BOTTOM_PAD = 10;
const LAYERS = ['#1C2541', '#1C2541', '#3B5BD9', '#3B5BD9', '#F5C518', '#F5C518', '#E0492A', '#D8FF00'];

// lighthouse (in dot rows from the bottom)
const NAVY = '#1C2541';
const RED = '#E0492A';
const LAMP = '#FFE600';
const ZONE = 8; // columns either side of the centre kept as a low pier around the lighthouse
const PIER_H = 2.6; // pier height in rows
const BEAM_HALF = 0.36; // half-angle of the beam (radians, ~21°) — wider
const FOLLOW = 0.075; // how quickly the beam turns towards the cursor (lower = smoother)
// "facing you" glow
const FACE_NEAR = 90; // cursor this close to the lamp (px) = fully facing
const FACE_FAR = 230; // beyond this it's a normal beam
const GLOW_R = 240; // radius of the round glow (px)

/** colour of the lighthouse dot at column offset dc and row r, or null if empty */
function lighthouseDot(dc: number, r: number, rows: number): string | null {
  const a = Math.abs(dc);
  const top = Math.min(rows - 1, 18);
  const lampRow = top - 4; // lamp room: two rows
  if (r >= 3 && r < lampRow - 1) {
    // tower: wider at the base, red / navy stripes every two rows
    const hw = r < 7 ? 2 : 1;
    if (a > hw) return null;
    return Math.floor((r - 3) / 2) % 2 === 0 ? RED : NAVY;
  }
  if (r === lampRow - 1) return a <= 2 ? NAVY : null; // gallery / railing
  if (r === lampRow || r === lampRow + 1) return a <= 1 ? LAMP : null; // lamp room
  if (r === lampRow + 2) return a <= 1 ? RED : null; // roof
  if (r === lampRow + 3) return a === 0 ? RED : null; // roof tip
  if (r === lampRow + 4) return a === 0 ? NAVY : null; // vane
  return null;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// warm white at the centre -> pale yellow -> lamp yellow -> deeper yellow at the rim (t = 0 centre, 1 rim)
const GLOW_STOPS: [number, number[]][] = [
  [0, [255, 251, 222]],
  [0.25, [255, 242, 130]],
  [0.6, [255, 230, 0]],
  [1, [255, 212, 0]],
];
function glowColor(t: number) {
  for (let i = 1; i < GLOW_STOPS.length; i++) {
    if (t <= GLOW_STOPS[i][0]) {
      const [t0, c0] = GLOW_STOPS[i - 1];
      const [t1, c1] = GLOW_STOPS[i];
      const u = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * u));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return LAMP;
}

export function DotField({ height = 260, className = '', style }: { height?: number; className?: string; style?: React.CSSProperties }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let total = height; // full canvas height (the parent's height)
    let cols = 0;
    let allRows = 0;
    let cc = 0; // centre column (lighthouse)
    const rows = Math.floor((height - BOTTOM_PAD) / SPACING); // ground rows
    const lampRow = Math.min(rows - 1, 18) - 4 + 0.5; // middle of the two lamp rows
    let base: number[] = [];
    let noise: number[][] = [];
    let sparkles: { c: number; r: number; color: string }[] = [];
    let mx: number | null = null; // cursor in viewport coords (converted each frame, so scrolling stays right)
    let my = 0;
    let beamAngle = -Math.PI / 2;
    let facing = 0; // 0 = beam, 1 = round glow facing the viewer (eased)
    let raf = 0;
    let visible = true;
    const t0 = performance.now();

    const xOf = (c: number) => c * SPACING + SPACING / 2;
    const yOf = (r: number) => total - BOTTOM_PAD - (r * SPACING + SPACING / 2);

    // ratio 0 = bottom of the column, 1 = its top
    const layerColor = (ratio: number, n: number) => {
      const jitter = n < 0.14 ? 1 : n > 0.9 ? -1 : 0;
      const idx = Math.max(0, Math.min(LAYERS.length - 1, Math.floor(ratio * LAYERS.length) + jitter));
      return LAYERS[idx];
    };

    const setup = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth;
      total = Math.max(height, wrap.clientHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(total * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${total}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / SPACING) + 1;
      allRows = Math.floor((total - BOTTOM_PAD) / SPACING) + 1;
      cc = Math.round((width / 2 - SPACING / 2) / SPACING);
      const rng = mulberry32(hashString('footer-dots-v3'));
      const p1 = rng() * 10;
      const p2 = rng() * 10;
      // rolling hills of dots, roughly 30–90% of the ground tall; low pier around the lighthouse
      base = Array.from({ length: cols }, (_, c) => {
        const hills = (0.5 + 0.5 * Math.sin(c * 0.085 + p1)) * (0.6 + 0.4 * Math.sin(c * 0.027 + p2));
        const h = Math.max(2, rows * (0.3 + 0.6 * hills) + (rng() - 0.5) * 2.4);
        const a = Math.abs(c - cc);
        if (a <= ZONE) return PIER_H;
        if (a <= ZONE + 5) return Math.min(h, PIER_H + (a - ZONE) * 1.6); // slope down to the pier
        return h;
      });
      noise = Array.from({ length: cols }, () => Array.from({ length: rows }, () => rng()));
      // loose dots floating just above the landscape (none over the harbour)
      sparkles = [];
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.3 && Math.abs(c - cc) > ZONE + 5) {
          const r = Math.min(rows - 1, Math.floor(base[c] + 1 + rng() * 3));
          sparkles.push({ c, r, color: LAYERS[4 + Math.floor(rng() * 4)] });
        }
      }
    };

    const dot = (x: number, y: number, color: string, alpha: number, radius = DOT_R) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const angleDiff = (a: number, b: number) => {
      let d = a - b;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, total);

      // still ground
      for (let c = 0; c < cols; c++) {
        const x = xOf(c);
        const h = base[c];
        const full = Math.floor(h);
        for (let r = 0; r < Math.min(rows, Math.ceil(h)); r++) {
          const edge = r < full ? 1 : h - full;
          if (edge < 0.05) continue;
          const n = noise[c][r];
          const tint = n > 0.84 ? 0.45 : 1; // a few lighter tints scattered through
          dot(x, yOf(r), layerColor(r / Math.max(h, 1), n), edge * tint);
        }
      }
      sparkles.forEach((s) => dot(xOf(s.c), yOf(s.r), s.color, 0.9));

      // where is the cursor? -> beam direction, and how much the light faces the viewer
      const lx = xOf(cc);
      const ly = yOf(lampRow);
      let goal: number;
      let faceGoal = 0;
      if (mx !== null) {
        const rect = wrap.getBoundingClientRect();
        const dx = mx - rect.left - lx;
        const dy = my - rect.top - ly;
        goal = Math.atan2(dy, dx);
        faceGoal = 1 - smooth(clamp01((Math.hypot(dx, dy) - FACE_NEAR) / (FACE_FAR - FACE_NEAR)));
      } else {
        goal = reduce ? -Math.PI / 2 : -Math.PI / 2 + Math.sin((now - t0) / 1800) * 1.3;
      }
      beamAngle += angleDiff(goal, beamAngle) * (reduce ? 1 : FOLLOW);
      facing += (faceGoal - facing) * (reduce ? 1 : 0.1);
      const beamK = 1 - facing;

      const maxLen = Math.hypot(Math.max(lx, width - lx), total) * 1.02;
      // a gentle pulse for the facing glow
      const pulse = reduce ? 1 : 1 + 0.05 * Math.sin((now - t0) / 380);
      const glowR = GLOW_R * (0.5 + 0.5 * facing) * pulse;

      // light (drawn before the lighthouse, so the tower stays crisp on top)
      for (let c = 0; c < cols; c++) {
        const x = xOf(c);
        for (let r = 0; r < allRows; r++) {
          const y = yOf(r);
          if (y < -SPACING) continue;
          const dx = x - lx;
          const dy = y - ly;
          const d = Math.hypot(dx, dy);
          if (d < SPACING * 1.2) continue; // the lamp itself

          // beam (fades out as the light turns to face you)
          let kb = 0;
          if (beamK > 0.01 && d <= maxLen && d > SPACING * 2.2) {
            const off = Math.abs(angleDiff(Math.atan2(dy, dx), beamAngle));
            const half = BEAM_HALF + 0.08 * (d / maxLen); // widens a little with distance
            if (off < half) kb = smooth(1 - off / half) * Math.pow(1 - d / maxLen, 0.6) * beamK;
          }

          // round glow facing the viewer: warm white in the middle, rings of yellow spreading out,
          // full strength across most of the disc and feathering off over the outer fifth
          let kg = 0;
          let gt = 1;
          if (facing > 0.01 && d < glowR) {
            gt = d / glowR;
            const rim = gt < 0.8 ? 1 : smooth((1 - gt) / 0.2);
            const ring = reduce ? 1 : 0.78 + 0.22 * Math.cos(d / 10 - (now - t0) / 240); // soft rings moving outward
            kg = facing * rim * ring;
          }

          if (kb < 0.02 && kg < 0.02) continue;
          if (kg >= kb) {
            dot(x, y, glowColor(gt), Math.min(1, 0.3 + 0.7 * kg), DOT_R * (0.5 + 0.5 * kg) * (1.1 - 0.25 * gt));
          } else {
            dot(x, y, LAMP, Math.min(0.92, 0.1 + 0.85 * kb), DOT_R * (0.45 + 0.55 * Math.sqrt(kb)));
          }
        }
      }

      // lighthouse on top
      for (let dc = -2; dc <= 2; dc++) {
        for (let r = 3; r < rows; r++) {
          const col = lighthouseDot(dc, r, rows);
          if (col) dot(xOf(cc + dc), yOf(r), col, 1);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    };

    // the light follows the cursor anywhere on the page
    const onMove = (e: PointerEvent | MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      mx = null;
    };

    setup();
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onMove, { passive: true, capture: true });
    window.addEventListener('mousemove', onMove, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    const ro = new ResizeObserver(() => setup());
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', onMove, { capture: true } as EventListenerOptions);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
      io.disconnect();
    };
  }, [height]);

  return (
    <div ref={wrapRef} className={`select-none pointer-events-none ${className}`} style={style} aria-hidden="true">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
