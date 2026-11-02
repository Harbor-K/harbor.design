import React, { useMemo } from 'react';
import { getGlyph, GLYPH_COLS, GLYPH_ROWS } from '../utils/dotFont';
import { hashString, mulberry32 } from '../utils/random';

/**
 * Big dot-matrix word in the Superlocal schedule style: each letter is drawn with one of three dot
 * types — solid round dots, hollow rings, or fat horizontal pills — mixed letter by letter.
 * Dots are heavy and nearly touching. Scales to the width it is given, never taller than `maxHeight`.
 */
type Kind = 'fill' | 'ring' | 'pill';
const KINDS: Kind[] = ['fill', 'fill', 'ring', 'pill', 'fill', 'pill'];

export function DotWord({
  text,
  color,
  maxHeight = 140,
  align = 'right',
  className = '',
}: {
  text: string;
  color: string;
  maxHeight?: number;
  align?: 'left' | 'right';
  className?: string;
}) {
  const pitch = 10;
  const dot = 9.4;
  const chars = useMemo(() => text.toUpperCase().split(''), [text]);
  const kinds = useMemo(() => {
    const rng = mulberry32(hashString(`dotword-${text}`));
    return chars.map(() => KINDS[Math.floor(rng() * KINDS.length)]);
  }, [chars, text]);

  const letterW = (GLYPH_COLS + 1) * pitch;
  const w = chars.length * letterW - pitch;
  const h = GLYPH_ROWS * pitch;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio={align === 'right' ? 'xMaxYMin meet' : 'xMinYMin meet'}
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', maxHeight, overflow: 'visible' }}
      role="img"
      aria-label={text}
    >
      {chars.map((ch, ci) => {
        const glyph = getGlyph(ch);
        const kind = kinds[ci];
        const ox = ci * letterW;
        return glyph.map((row, r) =>
          row.split('').map((bit, c) => {
            if (bit !== '1') return null;
            const cx = ox + c * pitch + pitch / 2;
            const cy = r * pitch + pitch / 2;
            const key = `${ci}-${r}-${c}`;
            if (kind === 'ring') {
              const sw = 2.2;
              return <ellipse key={key} cx={cx} cy={cy} rx={pitch * 0.5 - sw / 2 + 0.3} ry={dot * 0.36} fill="none" stroke={color} strokeWidth={sw} />;
            }
            if (kind === 'pill') {
              return <ellipse key={key} cx={cx} cy={cy} rx={pitch * 0.66} ry={dot * 0.42} fill={color} />;
            }
            return <circle key={key} cx={cx} cy={cy} r={dot / 2} fill={color} />;
          })
        );
      })}
    </svg>
  );
}
