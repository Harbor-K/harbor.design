import React, { useEffect, useRef, useState } from 'react';
import { INSTAGRAM_URL, BOOK_CALL_URL } from '../../data/content';
import { FixedNav } from '../FixedNav';
import { Contact } from '../sections/Contact';

/**
 * About page (#/about), built after The Pudding's "How accurately are Asian Americans cast in Hollywood?":
 *   1. a film-strip intro — five panels slide down a film reel, each with a caption and a speech bubble
 *   2. big title + credit
 *   3. body text with a drop cap
 *   4. a scrollytelling timeline: year rows of company tiles stay pinned while step boxes scroll past;
 *      each step lights its tiles with a yellow frame
 * Black-and-white like the rest of the site, with the site's electric yellow for highlights.
 * Panel photos are Harbor's own photos (no drawn comics).
 */

const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const INK = '#0A0A0A';
const PAPER = '#ECEBE8';
const YELLOW = '#FFE600';

const PANELS = [
  { cap: 'I started in Fine Art, drawing what I saw.', say: 'What makes people look twice?', img: '/assets/about/film-fineart.jpg', pos: '50% 45%', side: 'right' },
  { cap: 'Then I lived and worked in Korea, Australia and the UK.', say: 'Same app, three ways to read it.', img: '/assets/about/film-places.jpg', pos: '50% 50%', side: 'left' },
  { cap: 'Now I design fintech products, end to end.', say: 'Is the v2 flow ready for handoff?', img: '/assets/about/film-fintech.jpg', pos: '50% 40%', side: 'right' },
  { cap: 'I test everything with real people.', say: 'Where do I check my points?', img: '/assets/trust-bank/ut-session.png', pos: '50% 50%', side: 'left' },
  { cap: 'And I take long walks to think.', say: 'Butter helps me focus. I swear.', img: '/assets/trust-bank/takeaway.jpg', pos: '55% 40%', side: 'right' },
] as const;

/**
 * Career timeline, from Harbor's LinkedIn experience.
 * In each row, the year someone started is shown with the company logo (or a name tile when there is no logo yet);
 * the later years show project images. Grey "Image" tiles are temporary placeholders until real project images arrive.
 */
type Group = 'pinetree' | 'eto' | 'upwork' | 'utrada' | 'study';
type Tile = { g: Group; kind: 'logo' | 'img' | 'ph' | 'name'; src?: string; label: string };

const T = {
  pinetreeLogo: { g: 'pinetree', kind: 'logo', src: '/assets/main-v2/pinetree.webp', label: 'Pinetree' } as Tile,
  pinetreeSite: { g: 'pinetree', kind: 'ph', label: 'Pinetree Company website' } as Tile,
  etoLogo: { g: 'eto', kind: 'logo', src: '/assets/main-v2/eto-markets-logo.jpg', label: 'ETO Markets' } as Tile,
  etoCrm: { g: 'eto', kind: 'img', src: '/assets/main-v2/eto-markets-v2.jpg', label: 'ETO Markets CRM' } as Tile,
  upworkName: { g: 'upwork', kind: 'name', label: 'Upwork' } as Tile,
  upworkPh: { g: 'upwork', kind: 'ph', label: 'Freelance project' } as Tile,
  utradaLogo: { g: 'utrada', kind: 'logo', src: '/assets/main-v2/utrada-logo.jpg', label: 'UTrada' } as Tile,
  utradaSite: { g: 'utrada', kind: 'img', src: '/assets/main-v2/utrada-v2.jpg', label: 'UTrada website' } as Tile,
  trust: { g: 'study', kind: 'img', src: '/assets/main-v2/trust-bank.webp', label: 'Trust Bank' } as Tile,
  gamecove: { g: 'study', kind: 'img', src: '/assets/main-v2/gamecove.webp', label: 'GameCove' } as Tile,
};

const YEARS: { y: string; tiles: Tile[] }[] = [
  { y: '2021', tiles: [T.pinetreeLogo] },
  { y: '2022', tiles: [T.pinetreeSite, T.etoLogo] },
  { y: '2023', tiles: [T.etoCrm, T.upworkName] },
  { y: '2024', tiles: [T.upworkPh, T.utradaLogo] },
  { y: '2025', tiles: [T.upworkPh, T.utradaSite] },
  { y: '2026', tiles: [T.utradaSite, T.trust, T.gamecove] },
];

const STEPS: { years: string; title: string; text: string; lit: Group[] }[] = [
  { years: '2021–2022', title: 'Pinetree', text: 'Redesigned the website and its information architecture, and optimised the landing page.', lit: ['pinetree'] },
  { years: '2022–2023', title: 'ETO Markets', text: 'Redesigned the CRM, website and apps in Sydney, and added support for 9 languages.', lit: ['eto'] },
  { years: '2023–2025', title: 'Freelance on Upwork', text: 'Designed a website for an education agency and looked after a design system.', lit: ['upwork'] },
  { years: '2024–2026', title: 'UTrada', text: 'Designed the website and apps for a global trading platform, from research to UI.', lit: ['utrada'] },
  { years: '2026', title: 'Trust Bank · GameCove', text: 'A UX and AI product design programme: a rewards UX revamp and an AI analytics dashboard.', lit: ['study'] },
];

/** fades + slides a panel in when it enters the screen */
function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on] as const;
}

function FilmPanel({ p, i, active, arrow }: { p: (typeof PANELS)[number]; i: number; active: boolean; arrow?: boolean }) {
  const [ref, on] = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      data-film-panel={i}
      className="relative"
      style={{
        // the panel in focus is in colour; the rest go black-and-white and dim, like The Pudding's reel
        // the next panel always peeks in, dimmed, so you can see there is more below
        opacity: active ? 1 : 0.35,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="border-[2px] border-black bg-white px-[20px] py-[10px] text-[18px] md:text-[22px] leading-[1.35]">{p.cap}</div>
      <div className="relative mt-[10px] overflow-hidden border-[2px] border-black bg-black" style={{ height: 'min(480px, 52vh)' }}>
        <img
          src={p.img}
          alt=""
          loading={i < 2 ? 'eager' : 'lazy'}
          className="h-full w-full object-cover"
          style={{ objectPosition: p.pos, filter: active ? 'none' : 'grayscale(1)', transition: 'filter 0.6s ease' }}
        />
        <div
          className={`absolute top-[20px] max-w-[60%] rounded-[16px] border-[2px] border-black bg-white px-[14px] py-[10px] text-[16px] leading-[1.3] ${p.side === 'right' ? 'right-[20px]' : 'left-[20px]'}`}
          style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.8)', transition: 'opacity 0.4s ease 0.6s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s' }}
        >
          {p.say}
        </div>
        {/* "scroll down" arrow on the first panel; it goes once you start scrolling */}
        {arrow !== undefined && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[20px] left-1/2 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-black shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            style={{ animation: 'film-nudge 1.4s ease-in-out infinite', opacity: arrow ? 1 : 0, transition: 'opacity 0.4s ease' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v15M5 12l7 7 7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/** the film reel: sprocket holes down both sides. The panel nearest the middle of the screen is the one in focus. */
function FilmStrip() {
  const holes = Array.from({ length: 80 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const els = wrapRef.current?.querySelectorAll<HTMLElement>('[data-film-panel]');
      if (!els) return;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestD = Infinity;
      els.forEach((el, k) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      setActive(window.scrollY < 40 ? 0 : best);
      setScrolled(window.scrollY > 40);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[760px] bg-[#111] px-[40px] md:px-[60px] py-[40px]">
      <style>{`@keyframes film-nudge { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 10px); } }`}</style>
      {(['left', 'right'] as const).map((s) => (
        <div key={s} className={`absolute top-0 bottom-0 ${s === 'left' ? 'left-[10px] md:left-[18px]' : 'right-[10px] md:right-[18px]'} flex flex-col gap-[20px] overflow-hidden py-[20px]`} aria-hidden>
          {holes.map((_, k) => (
            <span key={k} className="block h-[14px] w-[20px] shrink-0 rounded-[3px] border border-[#555] bg-[#2a2a2a]" />
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-[60px]">
        {PANELS.map((p, i) => (
          <FilmPanel key={p.cap} p={p} i={i} active={i === active} arrow={i === 0 ? !scrolled : undefined} />
        ))}
      </div>
    </div>
  );
}

function Timeline() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);

  // the step box closest to the middle of the screen is the active one, so text and tiles always match
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let best = -1;
      let bestD = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const box = el.firstElementChild as HTMLElement | null;
        const r = (box ?? el).getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const lit = active >= 0 ? STEPS[active].lit : [];

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 md:grid-cols-[400px_1fr] gap-[40px] px-6">
      {/* step boxes that scroll past */}
      <div className="relative z-10 order-2 md:order-1">
        <div className="h-[20vh]" />
        {STEPS.map((s, i) => (
          <div key={s.title} ref={(el) => (stepRefs.current[i] = el)} data-i={i} className="flex min-h-[100vh] items-center">
            <div
              className="w-full border-[2px] border-black px-[24px] py-[20px] transition-[background-color,transform,opacity] duration-500 ease-out"
              style={{ background: active === i ? '#FFFFFF' : 'rgba(255,255,255,0.6)', opacity: active === i ? 1 : 0.45, transform: active === i ? 'none' : 'scale(0.97)' }}
            >
              <p className="text-[16px] leading-[20px] text-[#6b6b70]">{s.years}</p>
              <p className="mt-[10px] text-[22px] leading-[1.25] font-bold">
                <mark className="px-[4px]" style={{ background: active === i ? YELLOW : 'transparent', transition: 'background 0.3s ease' }}>
                  {s.title}
                </mark>
              </p>
              <p className="mt-[10px] text-[18px] leading-[1.5]">{s.text}</p>
            </div>
          </div>
        ))}
        <div className="h-[20vh]" />
      </div>

      {/* pinned year chart */}
      <div className="order-1 md:order-2">
        <div className="sticky top-[calc(50vh-240px)] flex flex-col gap-[10px]">
          {YEARS.map((row) => (
            <div key={row.y} className="flex items-center gap-[20px]">
              <span className="w-[50px] shrink-0 text-[16px] tabular-nums text-[#6b6b70]">{row.y}</span>
              <div className="flex gap-[10px]">
                {row.tiles.map((t, k) => {
                  const on = lit.includes(t.g);
                  const style: React.CSSProperties = {
                    filter: on ? 'none' : 'grayscale(1)',
                    opacity: active < 0 || on ? 1 : 0.35,
                    outline: on ? `3px solid ${YELLOW}` : '1px solid rgba(0,0,0,0.15)',
                    outlineOffset: on ? 2 : 0,
                    transform: on ? 'scale(1.04)' : 'none',
                  };
                  const cls = 'h-[70px] w-[120px] shrink-0 transition-all duration-500 ease-out';
                  if (t.kind === 'logo' || t.kind === 'img')
                    return <img key={k} src={t.src} alt={t.label} title={t.label} className={`${cls} object-cover`} style={style} />;
                  return (
                    <span
                      key={k}
                      title={t.label}
                      className={`${cls} flex items-center justify-center text-center text-[16px] leading-none ${t.kind === 'name' ? 'bg-black font-medium tracking-[-0.02em] text-white' : 'bg-[#cfcfcf] text-[#6b6b70]'}`}
                      style={style}
                    >
                      {t.kind === 'name' ? t.label : 'Image'}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Closing chart, after the reference's labelled stacked bar.
 * Hours are Harbor's rough estimate of a typical week (illustrative, not tracked data).
 */
const WEEK = [
  { label: 'Designing', h: 38, bg: INK, fg: '#FFFFFF' },
  { label: 'Research & testing', h: 8, bg: '#3d3d40', fg: '#FFFFFF' },
  { label: 'Learning AI tools', h: 10, bg: '#6b6b70', fg: '#FFFFFF' },
  { label: 'Movies & dramas', h: 5, bg: YELLOW, fg: INK },
  { label: 'Drawing', h: 6, bg: '#FFF27A', fg: INK },
  { label: 'Walks', h: 7, bg: '#FFF9C4', fg: INK },
];
const WEEK_TOTAL = WEEK.reduce((n, w) => n + w.h, 0);
const WORK_H = WEEK.slice(0, 3).reduce((n, w) => n + w.h, 0);
const OFF_H = WEEK_TOTAL - WORK_H;

function WeekChart() {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  // hierarchy: title + what the numbers are -> the two groups (big %) -> the bar -> what each colour is
  const groups = [
    { name: 'At the desk', items: WEEK.slice(0, 3), h: WORK_H },
    { name: 'Off the clock', items: WEEK.slice(3), h: OFF_H },
  ];
  const share = (h: number) => Math.round((h / WEEK_TOTAL) * 100);
  return (
    <div ref={ref} className="mx-auto max-w-[800px] px-6">
      <h2 className="text-[26px] md:text-[30px] leading-[1.2] font-bold" style={{ textWrap: 'balance' } as React.CSSProperties}>How a week of mine adds up</h2>
      <p className="mt-[10px] text-[16px] text-[#6b6b70]">Hours in a typical week. My own rough estimate, not tracked data.</p>

      {/* the two groups sit side by side; each owns its share of the bar, its headline number and its legend */}
      <div className="mt-[50px] flex flex-col gap-[40px] md:flex-row md:gap-[10px]">
        {groups.map((g, gi) => (
          <div key={g.name} className="min-w-0" style={{ flexGrow: g.h, flexBasis: 0 }}>
            {/* group headline */}
            <div style={{ opacity: on ? 1 : 0, transition: `opacity 0.5s ease ${0.3 + gi * 0.5}s` }}>
              <p className="text-[40px] md:text-[48px] leading-none font-bold tracking-[-0.02em]">{share(g.h)}%</p>
              <p className="mt-[6px] text-[16px] md:text-[18px] leading-[1.3]">
                {g.name} <span className="text-[#6b6b70]">· {g.h}h</span>
              </p>
            </div>

            {/* this group's part of the bar */}
            <div
              className="mt-[20px] flex h-[56px] gap-[2px] overflow-hidden rounded-[10px] md:!w-full"
              // stacked on phones: each bar keeps its true share of the week, so 24% still looks like 24%
              style={{ width: `${share(g.h)}%` }}
            >
              {g.items.map((w, i) => (
                <div
                  key={w.label}
                  className="flex items-center justify-center text-[16px] md:text-[18px] font-bold"
                  title={`${w.label}: ${w.h} hours`}
                  style={{
                    flexGrow: w.h,
                    flexBasis: 0,
                    background: w.bg,
                    color: w.fg,
                    transformOrigin: 'left',
                    transform: on ? 'scaleX(1)' : 'scaleX(0)',
                    transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${(gi * 3 + i) * 0.12}s`,
                  }}
                >
                  {w.h}
                </div>
              ))}
            </div>

            {/* legend: colour, name, hours */}
            <ul
              className="mt-[20px] flex flex-col gap-[10px]"
              style={{ opacity: on ? 1 : 0, transition: `opacity 0.5s ease ${0.8 + gi * 0.5}s` }}
            >
              {g.items.map((w) => (
                <li key={w.label} className="flex items-center gap-[10px] text-[16px] leading-[1.3]">
                  <span className="h-[14px] w-[14px] shrink-0 rounded-[3px] border border-black/15" style={{ background: w.bg }} aria-hidden />
                  <span>{w.label}</span>
                  <span className="text-[#6b6b70]">{w.h}h</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-[80px] text-[18px] md:text-[20px] leading-[1.6]">
        When I’m not designing, I watch movies and dramas, and I draw. Drawing is where I started. Here are my drawings on{'\u00a0'}Instagram.
      </p>
    </div>
  );
}

/**
 * Harbor's drawings from her Instagram, scrolling sideways on their own.
 * Hover pauses it; you can also drag or swipe (and trackpad-scroll) it sideways yourself.
 * Both ends fade out. Red pandas: only her two most-liked posts (132 and 66 likes when added).
 */
const DRAWINGS = [
  { file: 8, post: 'CkFb7jIJK1b' }, // red panda, "Are you uncomfortable? No, just hold me."
  { file: 1, post: 'DL8Xf9CIVmL' },
  { file: 2, post: 'DEvWIXFoz0f' },
  { file: 9, post: 'CkCiPopJu_l' }, // red panda, "Keep in touch"
  { file: 3, post: 'C7-O3sXosWj' },
  { file: 10, post: 'Cg9RKoFphgr' },
].map((d) => ({ src: `/assets/about/drawing-${d.file}.jpg`, href: `https://www.instagram.com/p/${d.post}/` }));

const STRIP_SPEED = 40; // px per second

function InstagramEmbed() {
  const loop = [...DRAWINGS, ...DRAWINGS, ...DRAWINGS]; // three copies so it can loop either way without a seam
  const ref = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // start on the middle copy
    const third = () => el.scrollWidth / 3;
    el.scrollLeft = third();
    let raf = 0;
    let last = performance.now();
    let pos = el.scrollLeft;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!hover.current && !drag.current && !reduce) {
        pos += (STRIP_SPEED * dt) / 1000;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
      }
      // keep it on the middle copy so it never runs out
      const t = third();
      if (el.scrollLeft >= t * 2) {
        el.scrollLeft -= t;
        pos = el.scrollLeft;
      } else if (el.scrollLeft < t * 0.5) {
        el.scrollLeft += t;
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return; // touch swipes scroll natively
    const el = ref.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    window.setTimeout(() => (drag.current = null), 0);
  };

  return (
    <div className="mt-[40px]">
      <style>{`.ig-strip::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={ref}
        className="ig-strip w-full overflow-x-auto select-none cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: 'none',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)',
          maskImage: 'linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)',
        }}
        onMouseEnter={() => (hover.current = true)}
        onMouseLeave={() => {
          hover.current = false;
          endDrag();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onTouchStart={() => (hover.current = true)}
        onTouchEnd={() => window.setTimeout(() => (hover.current = false), 1500)}
      >
        <div className="flex w-max gap-[20px] py-[10px]">
          {loop.map((d, i) => {
            const copy = i < DRAWINGS.length || i >= DRAWINGS.length * 2;
            return (
              <a
                key={i}
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-hidden={copy ? true : undefined}
                tabIndex={copy ? -1 : undefined}
                onClick={(e) => {
                  if (drag.current?.moved) e.preventDefault(); // a drag isn't a click
                }}
                className="block shrink-0 overflow-hidden rounded-[20px] bg-white transition-transform duration-300 hover:-translate-y-[6px]"
              >
                <img
                  src={d.src}
                  alt={copy ? '' : `Drawing ${(i % DRAWINGS.length) + 1} on Harbor's Instagram`}
                  draggable={false}
                  className="pointer-events-none block h-[300px] w-[300px] object-cover"
                />
              </a>
            );
          })}
        </div>
      </div>
      <div className="mx-auto flex max-w-[800px] justify-end px-6">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-[30px] inline-flex rounded-lg bg-black px-[20px] py-[12px] text-[17px] font-medium text-white transition-opacity hover:opacity-85">
          See more @harbor_0328
        </a>
      </div>
    </div>
  );
}

/** Cal.com booking, embedded open on the page with Cal's own inline embed (sizes itself to the calendar, no empty bands) */
declare global {
  interface Window {
    Cal?: any;
  }
}

function loadCal() {
  const w = window as any;
  if (w.Cal) return;
  // Cal.com's official inline-embed loader
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal =
      C.Cal ||
      function (...args: any[]) {
        const cal = C.Cal;
        const ar = args;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function (...a2: any[]) {
            p(api, a2);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
}

function CalEmbed() {
  useEffect(() => {
    loadCal();
    const Cal = (window as any).Cal;
    Cal('init', '30min', { origin: 'https://cal.com' });
    Cal.ns['30min']('inline', {
      elementOrSelector: '#harbor-cal-inline',
      config: { layout: 'month_view', theme: 'light' },
      calLink: BOOK_CALL_URL.replace('https://cal.com/', ''),
    });
    Cal.ns['30min']('ui', { hideEventTypeDetails: false, layout: 'month_view', theme: 'light' });
  }, []);

  return (
    <div className="mx-auto max-w-[1000px] px-6">
      <h2 className="text-[26px] md:text-[30px] leading-[1.2] font-bold">Want to talk? Book a call with me</h2>
      <p className="mt-[16px] text-[18px] leading-[1.6] text-[#333]">Pick a time for a 30-minute chat.</p>
      <div id="harbor-cal-inline" className="mt-[30px] w-full overflow-hidden rounded-[20px]" style={{ minHeight: 480 }} />
      <div className="mt-[20px] flex justify-end">
        <a href={BOOK_CALL_URL} target="_blank" rel="noopener noreferrer" className="inline-block text-[16px] underline underline-offset-4">
          Open the booking page
        </a>
      </div>
    </div>
  );
}

export function AboutPage(_props: { onClose?: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ fontFamily: HELV, color: INK }}>
      {/* main site header (same as the home page) */}
      <FixedNav />

      {/* 1 · film-strip intro on black */}
      <section className="bg-black pt-[120px] pb-[80px]">
        <FilmStrip />
        <p className="mt-[40px] text-center text-[24px] text-white" aria-hidden>
          ↓
        </p>
      </section>

      {/* 2 · title */}
      <section className="bg-black pb-[120px] text-center text-white">
        <h1 className="mx-auto max-w-[900px] px-6 text-[44px] md:text-[72px] leading-[1.05] font-bold tracking-[-0.02em]">WHO IS HARBOR?</h1>
        <p className="mt-[20px] text-[16px] md:text-[18px] tracking-[0.06em] uppercase text-white/70">
          Words and design by <span style={{ color: YELLOW }}>Harbor (Jihyun) Kim</span>
        </p>
      </section>

      {/* 3 · body with a drop cap */}
      <section style={{ background: PAPER }} className="pt-[100px] pb-[40px]">
        <p className="mx-auto max-w-[680px] px-6 text-[18px] md:text-[20px] leading-[1.6]">
          <span className="float-left mr-[10px] mt-[6px] text-[64px] leading-[0.8] font-bold">I</span>
          ’m an AI-native product designer who owns the work end to end, from finding the problem to shipping the fix. I’ve spent 3+ years on fintech and
          e-learning: trading platforms, digital banking, crypto wallets and data{' '}dashboards.
        </p>
      </section>

      {/* 4 · scrollytelling timeline */}
      <section style={{ background: PAPER }} className="pb-[60px]">
        <Timeline />
      </section>

      {/* 5 · a week in hours + Instagram */}
      <section style={{ background: PAPER }} className="pb-[120px]">
        <WeekChart />
        <InstagramEmbed />
      </section>

      {/* 6 · book a call */}
      <section className="bg-white pt-[120px] pb-[120px]">
        <CalEmbed />
      </section>

      {/* 7 · main site footer */}
      <Contact />
    </div>
  );
}
