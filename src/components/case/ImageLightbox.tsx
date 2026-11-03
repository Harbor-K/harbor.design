import React, { useEffect, useRef } from 'react';

/**
 * Case-study image hover magnifier (event delegation, so the case-study markup barely changes).
 * Only images marked data-zoom="true" get it (at Harbor's request: just the thematic-analysis board):
 * hovering scales the image up inside its own frame and the zoom follows the cursor.
 * Click-to-enlarge (the lightbox) was removed at Harbor's request; nothing happens on click.
 * (Component name kept so App.tsx doesn't change.)
 */

const HOVER_SCALE = 1.8;

const isHoverScalable = (img: HTMLImageElement) => img.dataset.zoom === 'true';

interface ZoomState {
  s: number;
  ts: number;
  ox: number;
  oy: number;
  tox: number;
  toy: number;
  radius: number;
}

export function ImageLightbox({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const zoomsRef = useRef(new Map<HTMLImageElement, ZoomState>());
  const activeRef = useRef<HTMLImageElement | null>(null);

  // cursor-following scale hover
  useEffect(() => {
    const root = ref.current;
    if (!root || !window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const zooms = zoomsRef.current;
    let raf = 0;

    /** cursor position in the image's own (unscaled) pixels */
    const localPoint = (img: HTMLImageElement, z: ZoomState | undefined, cx: number, cy: number) => {
      const rect = img.getBoundingClientRect();
      const s = z?.s ?? 1;
      const ox = z?.ox ?? 0;
      const oy = z?.oy ?? 0;
      const baseLeft = rect.left - ox * (1 - s);
      const baseTop = rect.top - oy * (1 - s);
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      return { x: Math.max(0, Math.min(w, cx - baseLeft)), y: Math.max(0, Math.min(h, cy - baseTop)) };
    };

    const release = () => {
      if (activeRef.current) {
        const z = zooms.get(activeRef.current);
        if (z) z.ts = 1;
      }
      activeRef.current = null;
    };

    const onMove = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      const img = el?.closest?.('img') as HTMLImageElement | null;
      const inMain = !!img && !!img.closest('main') && root.contains(img);
      if (inMain && isHoverScalable(img!)) {
        if (activeRef.current !== img) {
          release();
          activeRef.current = img!;
        }
        let z = zooms.get(img!);
        const p = localPoint(img!, z, e.clientX, e.clientY);
        if (!z) {
          const r = parseFloat(getComputedStyle(img!).borderTopLeftRadius) || 0;
          z = { s: 1, ts: HOVER_SCALE, ox: p.x, oy: p.y, tox: p.x, toy: p.y, radius: r };
          zooms.set(img!, z);
          img!.style.transition = 'none';
          img!.style.willChange = 'transform, clip-path';
        }
        z.ts = HOVER_SCALE;
        z.tox = p.x;
        z.toy = p.y;
      } else {
        release();
      }
    };

    const tick = () => {
      zooms.forEach((z, img) => {
        z.s += (z.ts - z.s) * 0.14;
        z.ox += (z.tox - z.ox) * 0.2;
        z.oy += (z.toy - z.oy) * 0.2;
        if (z.ts === 1 && z.s < 1.002) {
          img.style.transform = '';
          img.style.transformOrigin = '';
          img.style.clipPath = '';
          img.style.transition = '';
          img.style.willChange = '';
          zooms.delete(img);
          return;
        }
        const w = img.offsetWidth;
        const h = img.offsetHeight;
        const k = 1 - 1 / z.s; // crop the scaled image back to its original frame
        const r = z.radius / z.s;
        img.style.transformOrigin = `${z.ox}px ${z.oy}px`;
        img.style.transform = `scale(${z.s})`;
        img.style.clipPath = `inset(${z.oy * k}px ${(w - z.ox) * k}px ${(h - z.oy) * k}px ${z.ox * k}px round ${r}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', release);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', release);
      zooms.forEach((_, img) => {
        img.style.transform = '';
        img.style.transformOrigin = '';
        img.style.clipPath = '';
        img.style.transition = '';
        img.style.willChange = '';
      });
      zooms.clear();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
