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
  { cap: 'I started in Fine Art, drawing what I saw.', say: 'What makes people look twice?', img: '/assets/portrait/harbor-portrait-bw.webp', pos: '50% 30%', side: 'right' },
  { cap: 'Then I lived and worked in Korea, Australia and the UK.', say: 'Same app, three ways to read it.', img: '/assets/main-v2/about-photo.webp', pos: '50% 40%', side: 'left' },
  { cap: 'Now I design fintech products, end to end.', say: 'Is the v2 flow ready for handoff?', img: '/assets/trust-bank/workshop-1.jpg', pos: '50% 50%', side: 'right' },
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

function FilmPanel({ p, i }: { p: (typeof PANELS)[number]; i: number }) {
  const [ref, on] = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="relative"
      style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(40px)', transition: 'opacity 0.9s ease, transform 1.1s cubic-bezier(0.22,1,0.36,1)' }}
    >
      <div className="border-[2px] border-black bg-white px-[20px] py-[10px] text-[18px] md:text-[20px] leading-[1.35]">{p.cap}</div>
      <div className="relative mt-[10px] aspect-[4/3] overflow-hidden border-[2px] border-black bg-black">
        <img src={p.img} alt="" loading={i < 2 ? 'eager' : 'lazy'} className="h-full w-full object-cover grayscale" style={{ objectPosition: p.pos }} />
        <div
          className={`absolute top-[20px] max-w-[60%] rounded-[16px] border-[2px] border-black bg-white px-[14px] py-[10px] text-[16px] leading-[1.3] ${p.side === 'right' ? 'right-[20px]' : 'left-[20px]'}`}
          style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'scale(0.8)', transition: 'opacity 0.4s ease 0.6s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s' }}
        >
          {p.say}
        </div>
      </div>
    </div>
  );
}

/** the film reel: sprocket holes down both sides */
function FilmStrip() {
  const holes = Array.from({ length: 60 });
  return (
    <div className="relative mx-auto w-full max-w-[560px] bg-[#111] px-[40px] md:px-[50px] py-[40px]">
      {(['left', 'right'] as const).map((s) => (
        <div key={s} className={`absolute top-0 bottom-0 ${s === 'left' ? 'left-[10px] md:left-[14px]' : 'right-[10px] md:right-[14px]'} flex flex-col gap-[20px] overflow-hidden py-[20px]`} aria-hidden>
          {holes.map((_, k) => (
            <span key={k} className="block h-[14px] w-[20px] shrink-0 rounded-[3px] border border-[#555] bg-[#2a2a2a]" />
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-[60px]">
        {PANELS.map((p, i) => (
          <FilmPanel key={p.cap} p={p} i={i} />
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
        <div className="sticky top-[calc(50vh-210px)] flex flex-col gap-[10px]">
          {YEARS.map((row) => (
            <div key={row.y} className="flex items-center gap-[20px]">
              <span className="w-[50px] shrink-0 text-[16px] tabular-nums text-[#6b6b70]">{row.y}</span>
              <div className="flex gap-[6px]">
                {row.tiles.map((t, k) => {
                  const on = lit.includes(t.g);
                  const style: React.CSSProperties = {
                    filter: on ? 'none' : 'grayscale(1)',
                    opacity: active < 0 || on ? 1 : 0.35,
                    outline: on ? `3px solid ${YELLOW}` : '1px solid rgba(0,0,0,0.15)',
                    outlineOffset: on ? 2 : 0,
                    transform: on ? 'scale(1.06)' : 'none',
                  };
                  const cls = 'h-[60px] w-[60px] shrink-0 transition-all duration-500 ease-out';
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
  { label: 'Swimming', h: 5, bg: YELLOW, fg: INK },
  { label: 'Drawing', h: 6, bg: '#FFF27A', fg: INK },
  { label: 'Walks', h: 7, bg: '#FFF9C4', fg: INK },
];
const WEEK_TOTAL = WEEK.reduce((n, w) => n + w.h, 0);
const WORK_H = WEEK.slice(0, 3).reduce((n, w) => n + w.h, 0);
const OFF_H = WEEK_TOTAL - WORK_H;

function WeekChart() {
  const [ref, on] = useInView<HTMLDivElement>(0.4);
  const pct = (h: number) => (h / WEEK_TOTAL) * 100;
  return (
    <div ref={ref} className="mx-auto max-w-[800px] px-6">
      <h2 className="text-[26px] md:text-[30px] leading-[1.2] font-bold">How a week of mine adds up</h2>

      {/* labels above, bar, then brackets */}
      <div className="relative mt-[110px]">
        <div className="relative flex h-[56px] overflow-visible">
          {WEEK.map((w, i) => {
            return (
              <div
                key={w.label}
                className="relative flex items-center justify-center text-[18px] font-bold"
                style={{
                  width: `${pct(w.h)}%`,
                  background: w.bg,
                  color: w.fg,
                  transformOrigin: 'left',
                  transform: on ? 'scaleX(1)' : 'scaleX(0)',
                  transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
                }}
              >
                {w.h}
                <span
                  className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#d9d9d6] px-[8px] py-[3px] text-[16px] font-normal text-[#333] ${i % 2 ? '-top-[66px]' : '-top-[36px]'}`}
                  style={{ opacity: on ? 1 : 0, transition: `opacity 0.4s ease ${0.4 + i * 0.12}s` }}
                >
                  {w.label}
                </span>
                {i % 2 === 1 && <span className="absolute left-1/2 -top-[34px] h-[34px] w-px bg-[#999]" style={{ opacity: on ? 1 : 0 }} aria-hidden />}
              </div>
            );
          })}
        </div>

        {/* brackets: at work / off the clock */}
        <div className="mt-[14px] flex" style={{ opacity: on ? 1 : 0, transition: 'opacity 0.5s ease 1.2s' }}>
          {[
            { w: pct(WORK_H), big: `${Math.round(pct(WORK_H))}%`, small: 'at the desk: designing, testing and learning', right: false },
            { w: pct(OFF_H), big: `${Math.round(pct(OFF_H))}%`, small: 'off the clock: in the water, on paper, on foot', right: true },
          ].map((b) => (
            <div key={b.small} style={{ width: `${b.w}%` }} className={`px-[4px] ${b.right ? 'flex flex-col items-end text-right' : ''}`}>
              <div className="h-[12px] w-full border-x-[2px] border-b-[2px] border-[#8e8e95]" />
              <div className="mt-[10px] flex flex-col gap-[6px]">
                <span className="text-[36px] leading-none">{b.big}</span>
                <span className="w-[220px] text-[16px] leading-[1.3] text-[#555]">{b.small}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-[30px] text-[16px] text-[#6b6b70]">Hours in a typical week. My own rough estimate, not tracked data.</p>

      <p className="mt-[60px] text-[18px] md:text-[20px] leading-[1.6]">
        When I’m not designing, I swim and I draw. Drawing is where I started. Here are my drawings on{'\u00a0'}Instagram.
      </p>
    </div>
  );
}

/** Instagram profile, embedded open on the page */
function InstagramEmbed() {
  return (
    <div className="mx-auto mt-[40px] max-w-[800px] px-6">
      <div className="overflow-hidden rounded-[20px] border border-[#d9d9d6] bg-white">
        <iframe title="Harbor's drawings on Instagram (@harbor_0328)" src="https://www.instagram.com/harbor_0328/embed" className="block h-[720px] w-full" loading="lazy" />
      </div>
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-[20px] inline-block text-[16px] underline underline-offset-4">
        Open @harbor_0328 on Instagram
      </a>
    </div>
  );
}

/** Cal.com booking, embedded open on the page */
function CalEmbed() {
  return (
    <div className="mx-auto max-w-[1000px] px-6">
      <h2 className="text-[26px] md:text-[30px] leading-[1.2] font-bold">Want to talk? Book a call with me</h2>
      <p className="mt-[16px] text-[18px] leading-[1.6] text-[#333]">Pick a time for a 30-minute chat.</p>
      {/* Cal's page has ~100px of empty space above the booker and its branding below:
          on desktop the frame is cropped to just the booker (top -100px, 480px tall) */}
      <div className="mt-[30px] overflow-hidden rounded-[20px] border border-[#d9d9d6] bg-white md:h-[480px]">
        <iframe
          title="Book a 30-minute call with Harbor"
          src={`${BOOK_CALL_URL}?embed=true&layout=month_view&theme=light`}
          className="block h-[760px] w-full md:-mt-[101px]"
          loading="lazy"
        />
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
