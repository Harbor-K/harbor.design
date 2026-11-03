import React, { useEffect, useRef, useState } from 'react';
import { DotWord } from '../DotWord';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useViewportSize } from '../../hooks/useViewportSize';

/**
 * Projects section (file name kept for history), after Superlocal's schedule — moving like a book.
 *
 * As the section arrives, the three project pages sit stacked like the edges of a closed book
 * (each one showing its top strip). Scrolling opens the first page; then each next page slides up
 * from the bottom and lays straight over the one before it. Pages are full-bleed and square-cornered:
 * no rounding, no shrinking, no gaps — every page always fills the full width, like the reference.
 * The page after the current one peeks in at the bottom, like the next page of a book.
 *
 * Each page: project name in mixed dots on the left; on the right, the project title in big bold type
 * with the year and one line of detail (all right-aligned). The whole page links to its case study;
 * hovering shows a round "View case study" button that follows the cursor.
 * Colours from each project's brand: Trust Bank blue -> GameCove navy -> UTrada purple. The UTrada page
 * fades into the site's soft grey (SOFT_GREY), and About me keeps that same grey, so they read as one.
 *
 * Seam fix: pages that are fully covered are hidden, and the pinned frame behind them is the same grey,
 * so the anti-aliased bottom edges of the stacked pages can't add up into a thin line above About me.
 */

export const SOFT_GREY = '#ECEBE8';

interface Page {
  name: string;
  year: string;
  title: string;
  sub: string;
  href?: string;
  bg: string;
  ink: string;
}

const PAGES: Page[] = [
  {
    name: 'TRUST BANK',
    year: '2026',
    title: 'Rewards\nUX revamp', // two lines on purpose
    sub: '2-person project: research, revamp and usability testing',
    href: '#/trust-bank',
    // Trust Bank blue (#2E9ADA), lighter at the top
    bg: 'linear-gradient(180deg, #A9DDF8 0%, #6BBDEA 50%, #2E9ADA 100%)',
    ink: '#0A0A0A',
  },
  {
    name: 'GAMECOVE',
    year: '2026',
    title: 'AI analytics dashboard',
    sub: '2-person project: helps first-time game creators decide what to fix next',
    href: '#/gamecove', // placeholder case page (lorem ipsum) for now
    // GameCove's dark dashboard navy with its blue glow
    bg: 'linear-gradient(180deg, #2E4766 0%, #1C2533 50%, #121214 100%)',
    ink: '#FFFFFF',
  },
  {
    name: 'UTRADA',
    year: '2025',
    title: 'Trading platform design system',
    sub: '100+ components for a global trading platform, 40% faster dev cycles',
    href: '#/utrada', // placeholder case page (lorem ipsum) for now
    // UTrada purple (#8301D5) at the top, fading into the site's soft grey (continues into About me)
    bg: `linear-gradient(180deg, #8301D5 0%, #9A3FDD 30%, #A866DE 50%, #D7CCE4 72%, ${SOFT_GREY} 88%, ${SOFT_GREY} 100%)`,
    ink: '#FFFFFF',
  },
];

const N = PAGES.length;
const OPEN_END = 0.14; // scroll share spent opening the closed stack
const TURN_END = 0.94; // the rest (minus a short hold) turns the pages

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

export function Experience() {
  const outerRef = useRef<HTMLDivElement>(null);
  const { progress: p } = useScrollProgress(outerRef);
  const { height: H } = useViewportSize();

  const strip = H * 0.24; // how much of each page shows while the book is closed
  const peek = H * 0.17; // how much of the next page peeks in at the bottom
  const opening = ease(clamp01(p / OPEN_END));
  const q = clamp01((p - OPEN_END) / (TURN_END - OPEN_END)) * (N - 1); // 0..N-1 pages turned

  const pageY = (i: number) => {
    // where each page sits once the book is open, given how many pages have turned (q)
    let open: number;
    if (i === 0) open = 0;
    else {
      const turning = clamp01(q - (i - 1)); // this page laying over the previous one
      const arriving = i === 1 ? 1 : clamp01(q - (i - 2)); // rising from below to peek
      open = turning > 0 ? lerp(H - peek, 0, ease(turning)) : lerp(H, H - peek, ease(arriving));
    }
    // closed book: pages stacked as strips
    return Math.round(p < OPEN_END ? lerp(i * strip, open, opening) : open);
  };

  const [hover, setHover] = useState(false);
  const [dark, setDark] = useState(false); // dark project page → white label
  const [pos, setPos] = useState({ x: -200, y: -200 });
  // scrolling the section away (without moving the mouse) hides the label
  useEffect(() => {
    const off = () => setHover(false);
    window.addEventListener('scroll', off, { passive: true });
    return () => window.removeEventListener('scroll', off);
  }, []);

  return (
    <section id="work" ref={outerRef} className="relative" style={{ height: `${(N + 1.6) * 100}vh`, background: SOFT_GREY }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: SOFT_GREY }}>
        {PAGES.map((pg, i) => {
          // a page the next one has fully covered is hidden (no stacked edges)
          const fullyCovered = i < N - 1 && q - i >= 0.999;
          return (
            <a
              key={pg.name}
              href={pg.href}
              aria-label={pg.href ? `View case study: ${pg.name.replace('\n', ' ')}` : undefined}
              onMouseEnter={() => pg.href && setHover(true)}
              onMouseLeave={() => setHover(false)}
              onMouseMove={(e) => {
                setPos({ x: e.clientX, y: e.clientY });
                if (pg.href) setHover(true);
                setDark(pg.ink === '#FFFFFF');
              }}
              className="absolute inset-x-0 top-0 h-screen will-change-transform block"
              style={{
                cursor: pg.href ? 'none' : 'default',
                transform: `translate3d(0, ${pageY(i)}px, 0)`,
                background: pg.bg,
                color: pg.ink,
                zIndex: 10 + i,
                visibility: fullyCovered ? 'hidden' : 'visible',
              }}
            >
              <div className="max-w-[1800px] mx-auto px-6 md:px-8 pt-24 md:pt-28">
                {/* section title (first page only) */}
                {i === 0 && (
                  <h2 className="font-inter-tight font-bold tracking-[-0.03em] text-[28px] md:text-[36px] leading-none mb-6 md:mb-8">Projects</h2>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
                  {/* left: project name in dots */}
                  <DotWord text={pg.name} color={pg.ink} maxHeight={118} align="left" />

                  {/* right: title, then year / detail */}
                  <div className="flex flex-col md:items-end md:text-right">
                    <h3
                      className="font-inter-tight font-bold tracking-[-0.04em] leading-[0.95] whitespace-pre-line"
                      style={{ fontSize: 'clamp(40px, 5vw, 92px)', textWrap: 'balance' } as React.CSSProperties}
                    >
                      {pg.title}
                    </h3>
                    <p className="font-inter-tight font-bold text-[18px] mt-8 md:mt-10">{pg.year}</p>
                    <p className="text-[18px] md:text-[20px] leading-snug mt-2 opacity-90 max-w-[520px]" style={{ textWrap: 'balance' } as React.CSSProperties}>
                      {pg.sub}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* round "View case study" button that follows the cursor over a project */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] flex h-[120px] w-[120px] items-center justify-center rounded-full text-center text-[16px] leading-[20px] font-medium tracking-tight shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        style={{
          background: dark ? '#FFFFFF' : '#0A0A0A',
          color: dark ? '#0A0A0A' : '#FFFFFF',
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${hover ? 1 : 0.6})`,
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.2s ease, transform 0.2s ease-out',
        }}
      >
        View case
        <br />
        study
      </div>
    </section>
  );
}
