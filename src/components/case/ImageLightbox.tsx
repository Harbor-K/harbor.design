import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

/**
 * Case-study image interactions (event delegation, so the case-study markup barely changes).
 * Only images marked data-zoom="true" get them (at Harbor's request: just the thematic-analysis board):
 *  - Hover: the image scales up inside its own frame and the zoom follows the cursor (magnifier).
 *  - Click: opens the image large in a lightbox; click / X / Esc closes it.
 * Every other image stays still and isn't clickable.
 */

// same mask box as the in-page one (Figma frame 1440 x 610) — kept in case the UT photo is ever opted in
const UT_MASK = { left: 1061 / 1440, top: 355 / 610, width: 182 / 1440, height: 243 / 610 };
const HOVER_SCALE = 1.8;

interface Shown {
  src: string;
  alt: string;
}

const isZoomable = (img: HTMLImageElement) => img.dataset.zoom === 'true';
const isHoverScalable = (img: HTMLImageElement) => isZoomable(img) && !img.src.includes('ut-session');

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
  const [shown, setShown] = useState<Shown | null>(null);
  const close = useCallback(() => setShown(null), []);
  const zoomsRef = useRef(new Map<HTMLImageElement, ZoomState>());
  const activeRef = useRef<HTMLImageElement | null>(null);

  // mark zoomable images as clickable and open on click
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<HTMLImageElement>('main img').forEach((img) => {
      if (isZoomable(img)) img.style.cursor = 'zoom-in';
    });
    const onClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement).closest('img') as HTMLImageElement | null;
      if (!img || !root.contains(img) || !img.closest('main') || !isZoomable(img)) return;
      const z = zoomsRef.current.get(img);
      if (z) z.ts = 1;
      activeRef.current = null;
      setShown({ src: img.currentSrc || img.src, alt: img.alt });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

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

  // while open: Esc closes the image only (not the whole case study), and the page doesn't scroll
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
    };
  }, [shown, close]);

  const isUt = shown?.src.includes('ut-session');

  return (
    <div ref={ref}>
      {children}

      <AnimatePresence>
        {shown && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-10 cursor-zoom-out"
            style={{ backgroundColor: 'rgba(0,13,16,0.82)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={shown.alt || 'Enlarged image'}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close image"
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
            >
              <XIcon className="w-4 h-4 text-[#000d10]" strokeWidth={2.4} />
            </button>

            <motion.div
              className="relative rounded-[14px] overflow-hidden bg-white shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 4 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={shown.src} alt={shown.alt} className="block max-w-[94vw] md:max-w-[90vw] max-h-[82vh] w-auto h-auto object-contain" />
              {isUt && (
                <div
                  className="absolute backdrop-blur-xl bg-white/10 rounded-[6px]"
                  style={{
                    left: `${UT_MASK.left * 100}%`,
                    top: `${UT_MASK.top * 100}%`,
                    width: `${UT_MASK.width * 100}%`,
                    height: `${UT_MASK.height * 100}%`,
                  }}
                  aria-hidden="true"
                />
              )}
            </motion.div>

            {shown.alt && (
              <p className="mt-4 max-w-[760px] text-center text-[16px] leading-[1.5] text-white/70" style={{ fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                {shown.alt}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
