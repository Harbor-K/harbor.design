// Procreate-style charcoal / dry-pencil strokes, rendered once to canvases and reused.
import { mulberry32 } from './random';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/**
 * A tile of grainy pigment to use as a canvas strokeStyle pattern.
 * Mostly solid with small gaps and uneven darkness, so a stroke reads as bold charcoal with paper tooth showing.
 */
export function makeGrainTile(color: string, seed = 7, size = 128, density = 0.74) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const { r, g, b } = hexToRgb(color);
  const rng = mulberry32(seed);
  const fill = Math.min(0.93, density + 0.14);
  for (let i = 0; i < size * size; i++) {
    if (rng() < fill) {
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = Math.round(160 + rng() * 95);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * A hand-drawn charcoal ring as a PNG data URL (square, transparent).
 * The ring sits at ~92% of the image, so place the image with a ~6% outset around the circle.
 * strokePx is the stroke width you want on screen at displayDiameter.
 */
export function charcoalRingUrl(seed: number, displayDiameter: number, strokePx: number, color: string) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(seed);
  const { r, g, b } = hexToRgb(color);

  const outset = 1.12;
  const w = Math.max(2.2, (strokePx * S) / (displayDiameter * outset));
  const R = S * 0.445;
  const start = rng() * Math.PI * 2;
  const sweep = Math.PI * 2 + 0.12 + rng() * 0.3; // overshoots the start a little, like a quick pen loop
  const squash = 0.97 + rng() * 0.06;
  const p1 = rng() * 6;
  const p2 = rng() * 6;
  const len = sweep * R;
  const steps = Math.ceil(len / 0.6);

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const a = start + sweep * t;
    const rr = R * (1 + Math.sin(a * 2 + p1) * 0.012 + Math.sin(a * 3 + p2) * 0.008) + t * 1.5;
    const cx = S / 2 + Math.cos(a) * rr;
    const cy = S / 2 + Math.sin(a) * rr * squash;
    // pressure: thinner where the stroke starts and lifts off
    const pressure = Math.max(0.35, Math.min(1, t / 0.05, (1 - t) / 0.07));
    const lw = w * pressure;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    const dabs = Math.ceil(lw * 1.8);
    for (let k = 0; k < dabs; k++) {
      const off = (rng() - 0.5) * lw;
      const along = (rng() - 0.5) * 0.8;
      const x = cx + nx * off - ny * along;
      const y = cy + ny * off + nx * along;
      ctx.fillStyle = `rgba(${r},${g},${b},${(0.25 + rng() * 0.6).toFixed(2)})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }
  return c.toDataURL('image/png');
}
