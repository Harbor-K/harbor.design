import { useEffect, useRef, useState, RefObject } from 'react';

/**
 * Tracks scroll progress (0-1) of a pinned/tall container using a continuous
 * requestAnimationFrame loop.
 *
 * - `progressRef.current` updates every frame (read this for direct DOM
 *   manipulation of many elements without triggering React re-renders).
 * - `progress` is React state, only updated when the value changes
 *   meaningfully, for gating JSX/phase transitions.
 */
export function useScrollProgress(ref: RefObject<HTMLElement>) {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = -1;

    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        progressRef.current = p;
        if (Math.abs(p - last) > 0.0015) {
          last = p;
          setProgress(p);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref]);

  return { progress, progressRef };
}
