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
  { word: 'Artist', cap: 'I started in Fine Art, drawing what I saw.', img: '/assets/about/film-fineart.jpg', pos: '50% 45%' },
  { word: 'Places', cap: 'Then I lived and worked in Korea, Australia and the UK.', img: '/assets/about/film-places.jpg', pos: '50% 50%' },
  { word: 'Work', cap: 'Now I design fintech products, end to end.', img: '/assets/about/film-fintech.jpg', pos: '50% 40%' },
  { word: 'Testing', cap: 'I test everything with real people.', img: '/assets/trust-bank/ut-session.png', pos: '50% 50%' },
  { word: 'Walks', cap: 'And I take long walks to think.', img: '/assets/trust-bank/takeaway.jpg', pos: '55% 40%' },
] as const;

/** smaller photos scattered around the cards; each drifts at its own speed (x/w in % of the screen, y in px along the track) */
const SCATTER = [
  { src: '/assets/main-v2/about-photo.webp', x: 27.5, y: 120, w: 9, speed: 0.75 },
  { src: '/assets/main-v2/desk-coin-poster.jpg', x: 68, y: 40, w: 10, speed: 1.25 },
  { src: '/assets/about/drawing-8.jpg', x: 71, y: 620, w: 9, speed: 0.9 },
  { src: '/assets/trust-bank/workshop-2.jpg', x: 27, y: 760, w: 9.5, speed: 1.15 },
  { src: '/assets/trust-bank/define-photo.jpg', x: 69, y: 1180, w: 12, speed: 0.8 },
  { src: '/assets/portrait/harbor-portrait-bw.webp', x: 28.5, y: 1420, w: 7, speed: 1.3 },
  { src: '/assets/trust-bank/sketch-photo.png', x: 70, y: 1820, w: 11, speed: 1.05 },
  { src: '/assets/about/drawing-9.jpg', x: 27.5, y: 2050, w: 8, speed: 0.85 },
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

/**
 * About intro, after Melius's "Who we are" (via Mobbin): the headline stays pinned on the left while a column of
 * captioned photo cards ("The Artist", "The Places"...) scrolls up the middle, and smaller photos drift past
 * around it at different speeds. Hovering a card lifts it and zooms its photo. Phones get a plain stacked list.
 */
function AboutCollage() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [vh, setVh] = useState(800);
  const [trackH, setTrackH] = useState(2400);
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = outerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        setP(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0);
      }
      raf = requestAnimationFrame(tick);
    };
    const size = () => {
      setVh(window.innerHeight);
      setDesktop(window.innerWidth >= 900);
      if (trackRef.current) setTrackH(trackRef.current.offsetHeight);
    };
    size();
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(tick);
    const t = window.setTimeout(size, 600); // after images settle
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      window.clearTimeout(t);
    };
  }, [desktop]);

  const card = (pnl: (typeof PANELS)[number], i: number) => (
    <article key={pnl.word} className="about-card group rounded-[20px] bg-[#ECEBE8] p-[8px] text-[#0A0A0A]">
      <div className="overflow-hidden rounded-[14px]">
        <img
          src={pnl.img}
          alt=""
          loading={i < 2 ? 'eager' : 'lazy'}
          className="block aspect-[4/3.4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          style={{ objectPosition: pnl.pos }}
        />
      </div>
      <div className="px-[10px] pb-[10px] pt-[16px]">
        <h3 className="text-[36px] md:text-[40px] leading-[1] tracking-[-0.02em]">
          The <em className="font-light">{pnl.word}</em>
        </h3>
        <p className="mt-[10px] text-[16px] leading-[1.4] text-[#444]">{pnl.cap}</p>
      </div>
    </article>
  );

  const intro = (
    <>
      <p className="text-[16px] tracking-[0.12em] text-white/60 uppercase">About me</p>
      <h1 className="mt-[20px] text-[48px] lg:text-[64px] leading-[1] font-bold tracking-[-0.02em] text-white">WHO IS HARBOR?</h1>
      <p className="mt-[20px] text-[16px] md:text-[18px] leading-[1.4] text-white/70">
        Words and design by <span className="whitespace-nowrap" style={{ color: YELLOW }}>Harbor (Jihyun) Kim</span>
      </p>
    </>
  );

  if (!desktop) {
    return (
      <section className="bg-black px-6 pt-[120px] pb-[80px]">
        {intro}
        <div className="mt-[40px] flex flex-col gap-[20px]">{PANELS.map(card)}</div>
      </section>
    );
  }

  // the card column moves from just under the top of the screen until its end has passed the middle
  const travel = Math.max(0, trackH - vh * 0.55);
  const colY = vh * 0.12 - p * travel;

  return (
    <div ref={outerRef} className="relative bg-black" style={{ height: `${Math.max(260, (travel / vh) * 100 + 100)}vh` }}>
      <style>{`.about-card { transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease; }
        .about-card:hover { transform: translateY(-8px) rotate(-0.6deg); box-shadow: 0 24px 50px rgba(0,0,0,.45); }`}</style>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* faint dot field on the right, like the reference */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-[40%]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            maskImage: 'linear-gradient(90deg, transparent, #000 60%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 60%)',
          }}
        />

        {/* pinned headline */}
        <div className="absolute left-[4%] top-[18%] z-10 w-[22%]">{intro}</div>

        {/* scattered photos, each at its own speed */}
        {SCATTER.map((ph, i) => (
          <div
            key={i}
            className="absolute overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.06]"
            style={{ left: `${ph.x}%`, width: `${ph.w}%`, top: 0, transform: `translate3d(0, ${ph.y + vh * 0.2 - p * travel * ph.speed}px, 0)`, zIndex: 1 }}
          >
            <img src={ph.src} alt="" loading="lazy" className="block aspect-[4/3] w-full object-cover" />
          </div>
        ))}

        {/* the card column */}
        <div
          ref={trackRef}
          className="absolute left-1/2 top-0 z-[2] flex w-[min(400px,26vw)] -translate-x-1/2 flex-col gap-[20px] will-change-transform"
          style={{ transform: `translate3d(-50%, ${colY}px, 0)` }}
        >
          {PANELS.map(card)}
        </div>

        {/* scroll hint until you start */}
        <div className="absolute bottom-[30px] left-[4%] z-10 flex items-center gap-[10px] text-[16px] text-white/60" style={{ opacity: p < 0.02 ? 1 : 0, transition: 'opacity .4s ease' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Scroll
        </div>
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

      {/* 1 · pinned headline + scrolling photo cards */}
      <AboutCollage />

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
