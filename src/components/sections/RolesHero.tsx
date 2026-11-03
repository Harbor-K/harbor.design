import React, { useRef } from 'react';
import { HeroVideoText } from './HeroVideoText';
import { ASSETS } from '../../data/content';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useViewportSize } from '../../hooks/useViewportSize';

/**
 * Opening hero, in black and white (reference: overlapping "role" circles).
 * Six patterned circles — researcher, marketer, designer, developer, PM, UX writer — sit overlapping
 * like a Venn diagram. Scrolling pulls them together until they become one circle, labelled HARBOR:
 * one person who covers all six. Then that circle opens into the full-screen video with the headline.
 * Circles blend with "screen", so where they overlap they get lighter, and the merged circle glows white.
 */

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

type Pattern = 'bars' | 'dots';
const ROLES: { label: string; tone: string; pattern: Pattern; col: -1 | 1; row: -1 | 0 | 1 }[] = [
  { label: 'RESEARCHER', tone: '#BDBDBD', pattern: 'bars', col: -1, row: -1 },
  { label: 'MARKETER', tone: '#FFFFFF', pattern: 'dots', col: 1, row: -1 },
  { label: 'DESIGNER', tone: '#8A8A8A', pattern: 'bars', col: -1, row: 0 },
  { label: 'DEVELOPER', tone: '#D6D6D6', pattern: 'bars', col: 1, row: 0 },
  { label: 'PM', tone: '#F2F2F2', pattern: 'bars', col: -1, row: 1 },
  { label: 'UX WRITER', tone: '#5C5C5C', pattern: 'bars', col: 1, row: 1 },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** one patterned circle drawn in a 200×200 box */
function RoleCircle({ tone, pattern, id }: { tone: string; pattern: Pattern; id: string }) {
  const R = 100;
  const shapes: React.ReactNode[] = [];
  if (pattern === 'bars') {
    const n = 15;
    const step = 200 / n;
    const w = step * 0.42;
    for (let i = 0; i < n; i++) {
      const cx = step * (i + 0.5);
      const dx = cx - R;
      const half = Math.sqrt(Math.max(0, R * R - dx * dx));
      const h = Math.max(w, half * 2 - w * 0.6);
      shapes.push(<rect key={i} x={cx - w / 2} y={R - h / 2} width={w} height={h} rx={w / 2} fill={tone} />);
    }
  } else {
    const n = 14;
    const step = 200 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const cx = step * (i + 0.5);
        const cy = step * (j + 0.5);
        if ((cx - R) ** 2 + (cy - R) ** 2 <= (R - step * 0.3) ** 2) shapes.push(<circle key={`${i}-${j}`} cx={cx} cy={cy} r={step * 0.32} fill={tone} />);
      }
  }
  return (
    <svg viewBox="0 0 200 200" className="block w-full h-full" aria-hidden data-id={id}>
      {shapes}
    </svg>
  );
}

export function RolesHero() {
  const outerRef = useRef<HTMLDivElement>(null);
  const { progress: p } = useScrollProgress(outerRef);
  const { width: vw, height: vh } = useViewportSize();

  // circle size and the Venn spacing (2 columns × 3 rows, overlapping like the reference)
  const D = Math.max(180, Math.min(vw * 0.28, vh * 0.34));
  const gapX = D * 0.36;
  const gapY = D * 0.3;

  // timeline
  const merge = ease(seg(p, 0.06, 0.5)); // circles slide together
  const labelsOut = seg(p, 0.34, 0.46);
  const oneIn = ease(seg(p, 0.48, 0.56)); // HARBOR label on the merged circle
  const spin = lerp(0, 90, merge); // bars turn a quarter as they merge
  const grow = seg(p, 0.6, 0.66); // video circle appears over the merged one
  const m = ease(seg(p, 0.66, 0.86)); // ...and opens to full screen
  const textOpacity = seg(p, 0.88, 0.96);

  const circlePx = D * grow;
  const widthPx = lerp(circlePx, vw, m);
  const heightPx = lerp(circlePx, vh, m);
  const radiusPx = m < 0.5 ? lerp(circlePx / 2, 120, m / 0.5) : lerp(120, 0, (m - 0.5) / 0.5);

  return (
    <div ref={outerRef} style={{ height: '600vh' }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black" style={{ fontFamily: HELV }}>
        {/* the six roles */}
        <div className="absolute left-1/2 top-[53%]" style={{ width: 0, height: 0 }}>
          {ROLES.map((r, i) => {
            const x = r.col * gapX * (1 - merge);
            const y = r.row * gapY * 2 * (1 - merge);
            return (
              <div
                key={r.label}
                className="absolute"
                style={{
                  width: D,
                  height: D,
                  left: -D / 2,
                  top: -D / 2,
                  transform: `translate3d(${x}px, ${y}px, 0) rotate(${(i % 2 ? 1 : -1) * spin}deg)`,
                  mixBlendMode: 'screen',
                  opacity: lerp(0.92, 0.75, merge),
                }}
              >
                <RoleCircle tone={r.tone} pattern={r.pattern} id={r.label} />
              </div>
            );
          })}

          {/* role labels */}
          {ROLES.map((r) => {
            const x = r.col * gapX * (1 - merge);
            const y = r.row * gapY * 2 * (1 - merge) - D * 0.06;
            const dark = r.tone === '#5C5C5C' || r.tone === '#8A8A8A';
            return (
              <span
                key={`${r.label}-tag`}
                className="absolute whitespace-nowrap rounded-full px-[16px] py-[6px] text-[16px] md:text-[18px] font-medium tracking-[0.06em]"
                style={{
                  left: 0,
                  top: 0,
                  transform: `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`,
                  background: dark ? '#0A0A0A' : '#FFFFFF',
                  color: dark ? '#FFFFFF' : '#0A0A0A',
                  border: dark ? '1px solid rgba(255,255,255,0.6)' : 'none',
                  opacity: 1 - labelsOut,
                  zIndex: 5,
                }}
              >
                {r.label}
              </span>
            );
          })}

          {/* one circle: HARBOR */}
          <span
            className="absolute whitespace-nowrap rounded-full bg-white px-[24px] py-[10px] text-[20px] md:text-[24px] font-bold tracking-[0.08em] text-black"
            style={{ left: 0, top: 0, transform: `translate(-50%, -50%) scale(${lerp(0.8, 1, oneIn)})`, opacity: oneIn * (1 - grow), zIndex: 6 }}
          >
            HARBOR
          </span>
        </div>

        {/* the merged circle opens into the full-screen video */}
        {grow > 0 && (
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{ top: '50%', left: '50%', width: widthPx, height: heightPx, borderRadius: radiusPx, transform: 'translate(-50%,-50%)', zIndex: 20 }}
          >
            <video className="absolute inset-0 w-full h-full object-cover" src={ASSETS.video} poster={ASSETS.videoPoster} autoPlay loop muted playsInline />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" style={{ opacity: textOpacity }} />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
          <HeroVideoText opacity={textOpacity} />
        </div>

        <h1 className="sr-only">Harbor Kim: one product designer covering research, marketing, design, development, product and UX writing</h1>
      </div>
    </div>
  );
}
