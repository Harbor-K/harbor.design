import React, { useEffect, useRef, useState } from 'react';

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

const CO = {
  pinetree: { name: 'Pinetree', img: '/assets/main-v2/pinetree.webp' },
  eto: { name: 'ETO Markets', img: '/assets/main-v2/eto-markets-logo.jpg' },
  utrada: { name: 'UTrada', img: '/assets/main-v2/utrada-logo.jpg' },
  trust: { name: 'Trust Bank', img: '/assets/main-v2/trust-bank.webp' },
  gamecove: { name: 'GameCove', img: '/assets/main-v2/gamecove.webp' },
} as const;
type Co = keyof typeof CO;

// one tile per company per year it was part of
const YEARS: { y: string; tiles: Co[] }[] = [
  { y: '2021', tiles: ['pinetree'] },
  { y: '2022', tiles: ['pinetree', 'eto'] },
  { y: '2023', tiles: ['eto'] },
  { y: '2024', tiles: ['utrada'] },
  { y: '2025', tiles: ['utrada'] },
  { y: '2026', tiles: ['utrada', 'trust', 'gamecove'] },
];

const STEPS: { years: string; title: string; text: string; lit: Co[] }[] = [
  { years: '2021–2022', title: 'Pinetree', text: 'Redesigned the information architecture and landing pages for an e-learning platform.', lit: ['pinetree'] },
  { years: '2022–2023', title: 'ETO Markets', text: 'Took a trading platform to 9 languages. 30% more users from Asia and Europe.', lit: ['eto'] },
  { years: '2024–2026', title: 'UTrada', text: 'Built a 100+ component design system. Dev cycles got 40% faster.', lit: ['utrada'] },
  { years: '2026', title: 'Trust Bank · GameCove', text: 'Rewards UX revamp and an AI analytics dashboard, each with one teammate.', lit: ['trust', 'gamecove'] },
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

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const lit = active >= 0 ? STEPS[active].lit : [];

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 md:grid-cols-[400px_1fr] gap-[40px] px-6">
      {/* step boxes that scroll past */}
      <div className="relative z-10 order-2 md:order-1">
        <div className="h-[30vh]" />
        {STEPS.map((s, i) => (
          <div key={s.title} ref={(el) => (stepRefs.current[i] = el)} data-i={i} className="flex min-h-[80vh] items-center">
            <div
              className="w-full border-[2px] border-black px-[24px] py-[20px] transition-colors duration-300"
              style={{ background: active === i ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
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
        <div className="h-[30vh]" />
      </div>

      {/* pinned year chart */}
      <div className="order-1 md:order-2">
        <div className="sticky top-[20vh] flex flex-col gap-[10px] py-[20px]">
          {YEARS.map((row) => (
            <div key={row.y} className="flex items-center gap-[20px]">
              <span className="w-[50px] shrink-0 text-[16px] tabular-nums text-[#6b6b70]">{row.y}</span>
              <div className="flex gap-[6px]">
                {row.tiles.map((c) => {
                  const on = lit.includes(c);
                  return (
                    <img
                      key={c}
                      src={CO[c].img}
                      alt={CO[c].name}
                      title={CO[c].name}
                      className="h-[60px] w-[60px] object-cover transition-all duration-300"
                      style={{
                        filter: on ? 'none' : 'grayscale(1)',
                        opacity: active < 0 || on ? 1 : 0.35,
                        outline: on ? `3px solid ${YELLOW}` : '1px solid rgba(0,0,0,0.15)',
                        outlineOffset: on ? 2 : 0,
                        transform: on ? 'scale(1.06)' : 'none',
                      }}
                    />
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

export function AboutPage({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ fontFamily: HELV, color: INK }}>
      {/* back tray, same look as the case pages */}
      <div className="fixed left-1/2 top-[14px] z-50 -translate-x-1/2 rounded-[14px] bg-[#1a1a1a] p-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <button type="button" onClick={onClose} className="flex items-center gap-[8px] rounded-[10px] bg-black px-[20px] py-[12px] text-[17px] font-medium text-white">
          <span aria-hidden>↰</span> Back
        </button>
      </div>

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
      <section style={{ background: PAPER }} className="pb-[120px]">
        <Timeline />
      </section>
    </div>
  );
}
