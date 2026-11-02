// Small deterministic PRNG utilities so layouts (bubble positions, row offsets,
// scatter offsets) stay stable across re-renders instead of reshuffling every render.

export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Evenly distributes `count` points on a unit sphere using the fibonacci-sphere method. */
export function fibonacciSphere(count: number): Vec3[] {
  const points: Vec3[] = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    points.push({ x, y, z });
  }
  return points;
}

/** Rotates a point around the Y axis by `deg` degrees. */
export function rotateY(p: Vec3, deg: number): Vec3 {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
}

/** Rotates a point around the X axis by `deg` degrees. */
export function rotateX(p: Vec3, deg: number): Vec3 {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Maps `v` from [inMin, inMax] to [0, 1], clamped. */
export function normalize(v: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0;
  return clamp01((v - inMin) / (inMax - inMin));
}
