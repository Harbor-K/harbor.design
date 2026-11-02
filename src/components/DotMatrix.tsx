import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { getGlyph, GLYPH_COLS, GLYPH_ROWS, randomGlyphChar } from '../utils/dotFont';
import { hashString, mulberry32 } from '../utils/random';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export type DotMatrixMode = 'static' | 'decode' | 'assemble' | 'pop';

export interface DotMatrixProps {
  text: string;
  dotPx?: number;
  pitchPx?: number;
  color?: string;
  mode?: DotMatrixMode;
  className?: string;
  alive?: boolean;
  active?: boolean;
  style?: React.CSSProperties;
  /** When true, the SVG scales to fill its container's width (height follows, preserving aspect ratio) instead of rendering at its intrinsic dot size. Use for headlines that must stay within a fixed-width column on every breakpoint. */
  fitContainer?: boolean;
}

const LETTER_COLS = GLYPH_COLS + 1;

/** Renders text as round dots that softly stretch (superlocal-style dot font). */
export function DotMatrix({ text, dotPx = 8, pitchPx, color = '#0A0A0A', mode = 'static', className = '', alive = true, active, style, fitContainer = false }: DotMatrixProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const inView = useInView(containerRef, { once: true, margin: '-10% 0px -10% 0px' });
  const effectiveActive = active !== undefined ? active : inView;
  const shouldAnimate = effectiveActive && !prefersReducedMotion;
  const showFinal = effectiveActive || prefersReducedMotion;

  const pitch = pitchPx ?? dotPx * 1.5;
  const chars = useMemo(() => text.toUpperCase().split(''), [text]);
  const glyphs = useMemo(() => chars.map((c) => getGlyph(c)), [chars]);

  const totalWidth = chars.length * LETTER_COLS * pitch - pitch;
  const totalHeight = GLYPH_ROWS * pitch;

  const seed = useMemo(() => hashString(text + mode), [text, mode]);
  const rng = useMemo(() => mulberry32(seed), [seed]);

  // Decode mode: letters lock in left-to-right, scrambling until locked.
  const [revealCount, setRevealCount] = useState(mode === 'decode' && !prefersReducedMotion ? 0 : chars.length);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (mode !== 'decode' || prefersReducedMotion) return;
    if (!effectiveActive) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTick((t) => t + 1);
      setRevealCount(Math.min(chars.length, i));
      if (i >= chars.length) clearInterval(interval);
    }, 55);
    return () => clearInterval(interval);
  }, [mode, effectiveActive, prefersReducedMotion, chars.length]);

  // After the assemble/pop transition window elapses, enable idle "alive" animation.
  const [settled, setSettled] = useState(mode === 'static' || mode === 'decode');
  useEffect(() => {
    if (mode !== 'assemble' && mode !== 'pop') return;
    if (!shouldAnimate) {
      if (showFinal) setSettled(true);
      return;
    }
    const t = setTimeout(() => setSettled(true), 1300);
    return () => clearTimeout(t);
  }, [mode, shouldAnimate, showFinal]);

  // Precompute per-dot random data (axis, duration, delay, scatter offset) once.
  const dotMeta = useMemo(() => {
    const map = new Map<string, { axis: 'x' | 'y'; dur: number; delay: number; sx: number; sy: number; popDelay: number }>();
    let idx = 0;
    chars.forEach((_, ci) => {
      for (let row = 0; row < GLYPH_ROWS; row++) {
        for (let col = 0; col < GLYPH_COLS; col++) {
          const key = `${ci}-${row}-${col}`;
          const r1 = rng();
          const r2 = rng();
          const r3 = rng();
          const r4 = rng();
          map.set(key, {
            axis: r1 > 0.5 ? 'x' : 'y',
            dur: 1.6 + r2 * 1.8,
            delay: r3 * 2.5,
            sx: (r3 - 0.5) * 240,
            sy: (r4 - 0.5) * 160,
            popDelay: idx * 5,
          });
          idx += 1;
        }
      }
    });
    return map;
  }, [chars.length, rng]);

  return (
    <svg
      ref={containerRef}
      width={fitContainer ? undefined : totalWidth}
      height={fitContainer ? undefined : totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="xMinYMid meet"
      className={className}
      style={{ overflow: 'visible', display: 'block', ...(fitContainer ? { width: '100%', height: 'auto' } : {}), ...style }}
      role="img"
      aria-label={text}
    >
      {glyphs.map((glyph, ci) => {
        const isRevealed = ci < revealCount;
        const displayGlyph = mode === 'decode' && !isRevealed && shouldAnimate ? getGlyph(randomGlyphChar(tick * 7 + ci * 13)) : glyph;
        const xOffset = ci * LETTER_COLS * pitch;
        return displayGlyph.map((rowStr, row) =>
          rowStr.split('').map((bit, col) => {
            if (bit !== '1') return null;
            const cx = xOffset + col * pitch + pitch / 2;
            const cy = row * pitch + pitch / 2;
            const key = `${ci}-${row}-${col}`;
            const meta = dotMeta.get(key)!;
            const rx = dotPx / 2;
            const ry = dotPx / 2;

            let groupTransform = '';
            let groupStyle: React.CSSProperties = {};

            if (mode === 'assemble') {
              const tx = showFinal ? 0 : meta.sx;
              const ty = showFinal ? 0 : meta.sy;
              groupTransform = `translate(${tx}px, ${ty}px)`;
              groupStyle = {
                opacity: showFinal ? 1 : 0,
                transition: prefersReducedMotion ? 'none' : `transform 0.75s cubic-bezier(0.23,1,0.32,1) ${meta.popDelay}ms, opacity 0.6s ${meta.popDelay}ms`,
              };
            } else if (mode === 'pop') {
              groupTransform = showFinal ? 'scale(1)' : 'scale(0)';
              groupStyle = {
                opacity: showFinal ? 1 : 0,
                transformOrigin: 'center',
                transformBox: 'fill-box',
                transition: prefersReducedMotion ? 'none' : `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${meta.popDelay}ms, opacity 0.3s ${meta.popDelay}ms`,
              } as React.CSSProperties;
            }

            const ellipseStyle: React.CSSProperties | undefined =
              alive && settled && !prefersReducedMotion
                ? {
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: `dot-stretch-${meta.axis} ${meta.dur}s ease-in-out ${meta.delay}s infinite`,
                  }
                : undefined;

            return (
              <g key={key} transform={groupTransform || undefined} style={groupStyle}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} style={ellipseStyle} />
              </g>
            );
          })
        );
      })}
    </svg>
  );
}
