import React, { useEffect, useRef } from 'react';

/**
 * Site-wide cursor dot trail (after Helder Vilela's "Cursor Dot Trail").
 * A small dot springs after the mouse and leaves a short tapered tail that fades.
 * The layer uses mix-blend-mode: difference, so the dot reads dark on white pages and light over
 * dark areas (the hero video, the case-study lightbox, dark sections) without extra logic.
 * Over anything clickable (links, buttons, clickable images, hero circles) it turns orange and grows a little.
 *
 * Always on: it picks up the pointer from any mouse event (move, over, down, wheel/scroll), listened to in
 * the capture phase so nothing on the page can swallow it, so it shows right away — no click needed,
 * even if you only scroll with the trackpad. It hides only when the pointer really leaves the window
 * and only for touch input. The normal cursor stays visible. Reduced motion = dot without spring or tail.
 */

// drawn colours are the inverse of what shows on white (difference blend): white -> near-black, cyan -> orange
const BASE = '#ffffff'; // shows as black on white, white on black
const ACCENT = '#1fb6d5'; // shows as #E0492A orange on white
const TRAIL_MS = 260;
const SPRING = 0.14;
const DAMPING = 0.7;

const isInteractive = (el: Element | null) => {
  if (!el || !(el instanceof Element)) return false;
  if (el.closest('a, button, [role="button"], label, summary')) return true;
  const c = getComputedStyle(el).cursor;
  return c === 'pointer' || c === 'crosshair' || c === 'zoom-in';
};

export function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const mouse = { x: -100, y: -100 };
    const dot = { x: -100, y: -100, vx: 0, vy: 0 };
    const tail: { x: number; y: number; t: number }[] = [];
    let visible = 0;
    let present = false;
    let first = true;
    let accent = false;
    let grow = 0;
    let raf = 0;

    // any mouse event tells us where the pointer is
    const onPoint = (e: MouseEvent) => {
      if ((e as PointerEvent).pointerType === 'touch') {
        present = false;
        return;
      }
      if (!Number.isFinite(e.clientX) || (e.clientX === 0 && e.clientY === 0 && e.type === 'wheel')) {
        present = true;
        return;
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      present = true;
      if (first) {
        dot.x = mouse.x;
        dot.y = mouse.y;
        first = false;
      }
      accent = isInteractive(e.target as Element);
    };
    // after a scroll the element under a still pointer changes — refresh the accent colour
    const onScroll = () => {
      if (!present || first) return;
      accent = isInteractive(document.elementFromPoint(mouse.x, mouse.y));
    };
    // hide only when the pointer actually leaves the window
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) present = false;
    };

    const tick = (now: number) => {
      if (reduce) {
        dot.x = mouse.x;
        dot.y = mouse.y;
      } else {
        dot.vx = (dot.vx + (mouse.x - dot.x) * SPRING) * DAMPING;
        dot.vy = (dot.vy + (mouse.y - dot.y) * SPRING) * DAMPING;
        dot.x += dot.vx;
        dot.y += dot.vy;
      }
      visible += ((present ? 1 : 0) - visible) * 0.15;
      grow += ((accent ? 1 : 0) - grow) * 0.2;
      tail.push({ x: dot.x, y: dot.y, t: now });
      while (tail.length && now - tail[0].t > TRAIL_MS) tail.shift();

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (visible > 0.01) {
        const color = accent ? ACCENT : BASE;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineCap = 'round';
        if (!reduce) {
          for (let i = 1; i < tail.length; i++) {
            const a = tail[i - 1];
            const b = tail[i];
            if (Math.hypot(b.x - a.x, b.y - a.y) < 0.2) continue;
            const k = i / tail.length;
            ctx.globalAlpha = visible * k * 0.9;
            ctx.lineWidth = 0.4 + k * 2.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = visible;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 3.5 + grow * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const opts = { passive: true, capture: true } as AddEventListenerOptions;
    const pointerEvents = ['pointermove', 'mousemove', 'pointerover', 'pointerdown', 'mousedown', 'wheel'];
    pointerEvents.forEach((t) => window.addEventListener(t, onPoint as EventListener, opts));
    window.addEventListener('scroll', onScroll, opts);
    document.addEventListener('mouseout', onOut, opts);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      pointerEvents.forEach((t) => window.removeEventListener(t, onPoint as EventListener, opts));
      window.removeEventListener('scroll', onScroll, opts);
      document.removeEventListener('mouseout', onOut, opts);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483000, mixBlendMode: 'difference' }} aria-hidden="true" />;
}
