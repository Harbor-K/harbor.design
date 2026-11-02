import React, { useEffect, useRef } from 'react';

/**
 * Harbour lights that follow the cursor (after the "Eyes Follow Cursor" reference).
 * Two lamp "eyes" sit on the footer's dot skyline. Inside each, a glowing electric-yellow light
 * (the harbour light) turns toward wherever the cursor is on the page, like eyes watching it.
 * They blink now and then. The dot landscape underneath is untouched.
 */
const EYE_W = 30;
const EYE_H = 42;
const LIGHT = 14; // glowing light (pupil) diameter
const LIGHT_COLOR = '#FFE600';

export function HarbourLights({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const eyes = useRef<(HTMLDivElement | null)[]>([]);
  const lights = useRef<(HTMLSpanElement | null)[]>([]);
  const lids = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    const cur = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    let raf = 0;

    const onMove = (e: PointerEvent | MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const tick = () => {
      eyes.current.forEach((eye, i) => {
        const light = lights.current[i];
        if (!eye || !light) return;
        const r = eye.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy) || 1;
        // how far the light can travel inside the lamp (an ellipse), easing in as the cursor gets close
        const rx = (EYE_W - LIGHT) / 2 - 2;
        const ry = (EYE_H - LIGHT) / 2 - 2;
        const pull = Math.min(1, dist / 120);
        const tx = (dx / dist) * rx * pull;
        const ty = (dy / dist) * ry * pull;
        const k = reduce ? 1 : 0.2;
        cur[i].x += (tx - cur[i].x) * k;
        cur[i].y += (ty - cur[i].y) * k;
        light.style.transform = `translate(${cur[i].x.toFixed(2)}px, ${cur[i].y.toFixed(2)}px)`;
      });
      raf = requestAnimationFrame(tick);
    };

    // blink every few seconds
    let blinkTimer = 0;
    const blink = () => {
      lids.current.forEach((lid) => {
        if (!lid) return;
        lid.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], {
          duration: 220,
          easing: 'ease-in-out',
        });
      });
      blinkTimer = window.setTimeout(blink, 2800 + Math.random() * 3200);
    };

    window.addEventListener('pointermove', onMove, { passive: true, capture: true });
    window.addEventListener('mousemove', onMove, { passive: true, capture: true });
    raf = requestAnimationFrame(tick);
    if (!reduce) blinkTimer = window.setTimeout(blink, 2000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.removeEventListener('pointermove', onMove, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', onMove, { capture: true } as EventListenerOptions);
    };
  }, []);

  return (
    <div className={`flex items-end gap-2 pointer-events-none select-none ${className}`} style={style} aria-hidden="true">
      {[0, 1].map((i) => (
        <div
          key={i}
          ref={(el) => (eyes.current[i] = el)}
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: EYE_W,
            height: EYE_H,
            borderRadius: '50%',
            background: '#1C2541',
            boxShadow: '0 0 0 2px #1C2541, 0 6px 18px rgba(28,37,65,0.25)',
          }}
        >
          <span
            ref={(el) => (lights.current[i] = el)}
            className="block rounded-full"
            style={{
              width: LIGHT,
              height: LIGHT,
              background: `radial-gradient(circle at 35% 35%, #FFFDE0 0%, ${LIGHT_COLOR} 45%, #F5C518 100%)`,
              boxShadow: `0 0 10px 3px ${LIGHT_COLOR}, 0 0 22px 6px rgba(255,230,0,0.45)`,
              willChange: 'transform',
            }}
          />
          {/* eyelid for the blink */}
          <span
            ref={(el) => (lids.current[i] = el)}
            className="absolute inset-0 origin-top"
            style={{ background: '#1C2541', transform: 'scaleY(0)' }}
          />
        </div>
      ))}
    </div>
  );
}
