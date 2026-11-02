import React from 'react';
import { motion } from 'framer-motion';
import { DotMatrix } from '../DotMatrix';

/**
 * "SYSTEMS THINKING" / "SIMPLIFY DATA" in the bottom corners of the hero, in the dot font
 * (crisp round dots packed close together, like Superlocal's display type — no stretching).
 * Second in the hierarchy after the "harbor" name in the middle.
 * Size from Harbor's markup: the longer word (SYSTEMS THINKING) spans about 34.5% of the screen width,
 * from the left edge to just under the sphere; SIMPLIFY DATA uses the same dot size, pushed to the right edge.
 * Desktop: one row, pushed to the two corners. Mobile: stacked, left then right.
 */
const LEFT = 'SYSTEMS THINKING';
const RIGHT = 'SIMPLIFY DATA';
const DOT_FILL = 0.84; // dot diameter as a share of the pitch
const WORD_SHARE = 0.345; // width of the longer word as a share of the screen (desktop)
const MIN_PITCH = 3;
const MAX_PITCH = 12;
const dotCols = (s: string) => s.length * 6 - 1; // 5 columns per glyph + 1 gap

export function HeroCornerWords({ vw, opacity, reducedMotion }: { vw: number; opacity: number; reducedMotion: boolean }) {
  const mobile = vw < 768;
  const pad = mobile ? 20 : 26;
  const pitch = mobile
    ? Math.min(3.6, (vw * 0.62) / dotCols(LEFT))
    : Math.max(MIN_PITCH, Math.min(MAX_PITCH, (vw * WORD_SHARE) / dotCols(LEFT)));
  const dot = pitch * DOT_FILL;
  const rise = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex pointer-events-none select-none ${
        mobile ? 'flex-col items-start gap-2' : 'items-end justify-between'
      }`}
      style={{ zIndex: 0, opacity, padding: `0 ${pad}px ${mobile ? 24 : 28}px` }}
      aria-hidden={opacity < 0.05 ? true : undefined}
    >
      <motion.div {...rise(1.35)}>
        <DotMatrix text={LEFT} dotPx={dot} pitchPx={pitch} color="#1A1A1A" mode="static" alive={false} />
      </motion.div>
      <motion.div {...rise(1.5)} className={mobile ? 'self-end' : undefined}>
        <DotMatrix text={RIGHT} dotPx={dot} pitchPx={pitch} color="#1A1A1A" mode="static" alive={false} />
      </motion.div>
    </div>
  );
}
