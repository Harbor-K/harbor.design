import React, { useEffect, useRef, useState } from 'react';
import { DotMatrix } from '../DotMatrix';
import { ASSETS, MANIFESTO_PHOTOS, BUBBLE_PHOTOS } from '../../data/content';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useViewportSize } from '../../hooks/useViewportSize';
import { normalize, lerp } from '../../utils/random';

const PARAGRAPH_LINES = [
  'I observe objectively to design clearly.',
  '3+ years designing fintech and e-learning products —',
  'trading platforms, digital banking, crypto wallets and',
  'data dashboards — after living and working in Korea,',
  'Australia and the UK.',
];

const SIDE_CIRCLES = [
  { top: '22%', left: '14%', size: '16vw', photo: BUBBLE_PHOTOS[0] },
  { top: '68%', left: '78%', size: '14vw', photo: BUBBLE_PHOTOS[3] },
];

// The fullbleed video is a 2:1 canvas: room above Harbor's head for the nav, laptop on the bottom edge,
// centred ~55% across. Screens up to 2:1 show the full height (only the sides are trimmed);
// anything wider trims from the top, never the laptop. 57% keeps the laptop whole on portrait tablets.
const VIDEO_OBJECT_POSITION = '57% 100%';

export function Manifesto() {
  const outerRef = useRef<HTMLDivElement>(null);
  const { progress } = useScrollProgress(outerRef);
  const { width: vw, height: vh } = useViewportSize();

  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhotoIndex((i) => (i + 1) % MANIFESTO_PHOTOS.length), 1200);
    return () => clearInterval(id);
  }, []);

  const headlineOpacity = 1 - normalize(progress, 0.3, 0.38);
  const paragraphOpacity = normalize(progress, 0.34, 0.4) * (1 - normalize(progress, 0.58, 0.64));
  const videoHeadlineOpacity = normalize(progress, 0.76, 0.9);

  const m = normalize(progress, 0.62, 0.96);
  const centerSizePx = vw * 0.24;
  const circleRadius = centerSizePx / 2;
  const borderRadiusPx = m < 0.5 ? lerp(circleRadius, 120, m / 0.5) : lerp(120, 0, (m - 0.5) / 0.5);
  const widthPx = lerp(centerSizePx, vw, m);
  const heightPx = lerp(centerSizePx, vh, m);
  const topPct = lerp(46, 50, m);
  const videoOpacity = normalize(m, 0.25, 0.55);
  const sideOpacity = 1 - m;

  return (
    <div ref={outerRef} style={{ height: '400vh' }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white border-t border-[rgba(10,10,10,0.12)]">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

        {/* top-right accent circle */}
        <div
          className="absolute rounded-full pointer-events-none bg-[#F5C518]"
          style={{ top: '20%', left: '80%', width: '18vw', height: '18vw', transform: 'translate(-50%,-50%)', opacity: sideOpacity }}
        />

        {/* side photo circles */}
        {SIDE_CIRCLES.map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full overflow-hidden pointer-events-none"
            style={{ top: c.top, left: c.left, width: c.size, height: c.size, transform: 'translate(-50%,-50%)', opacity: sideOpacity }}
          >
            <img src={c.photo} alt="" className="w-full h-full object-cover" />
          </div>
        ))}

        {/* morphing center circle -> fullbleed video */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: `${topPct}%`,
            left: '50%',
            width: widthPx,
            height: heightPx,
            borderRadius: borderRadiusPx,
            transform: 'translate(-50%,-50%)',
            zIndex: 20,
          }}
        >
          {MANIFESTO_PHOTOS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: i === photoIndex ? 1 - videoOpacity : 0 }}
            />
          ))}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: videoOpacity, objectPosition: VIDEO_OBJECT_POSITION }}
            src={ASSETS.video}
            poster={ASSETS.videoPoster}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        {/* bottom-left label + headline / paragraph */}
        <div className="absolute left-6 bottom-6 w-[88%] sm:max-w-[60%] md:max-w-[50%] z-30">
          <p className="mono-label mb-4 text-[#0A0A0A]">UI/UX &amp; Product Designer · Geoje, KR</p>

          <div className="relative">
            <div style={{ opacity: headlineOpacity }} className="absolute bottom-0 left-0 w-full">
              <DotMatrix
                text="UNDERSTAND PEOPLE, CONNECT THE DOTS, SHAPE BETTER EXPERIENCES"
                dotPx={6}
                mode="decode"
                color="#0A0A0A"
                fitContainer
              />
            </div>
            <div style={{ opacity: paragraphOpacity }} className="relative">
              {PARAGRAPH_LINES.map((line, i) => {
                const lineProgress = normalize(progress, 0.38 + i * 0.03, 0.42 + i * 0.03);
                return (
                  <div key={i} className="overflow-hidden">
                    <p
                      className="font-inter-tight display-tight leading-[1.12]"
                      style={{
                        fontSize: 'clamp(18px, 2.2vw, 32px)',
                        transform: `translateY(${(1 - lineProgress) * 100}%)`,
                        opacity: lineProgress,
                      }}
                    >
                      {line}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="absolute right-6 bottom-6 z-30">
          <p className="mono-label">Portfolio 2026</p>
        </div>

        {/* reappears over fullbleed video */}
        <div className="absolute left-6 bottom-10 w-[88%] sm:max-w-[70%] md:max-w-[55%] z-30" style={{ opacity: videoHeadlineOpacity }}>
          <DotMatrix text="UNDERSTAND PEOPLE, CONNECT THE DOTS" dotPx={6} mode="static" color="#F5C518" fitContainer />
        </div>
      </div>
    </div>
  );
}
