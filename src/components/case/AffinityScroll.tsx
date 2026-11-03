import React, { useEffect, useRef, useState } from 'react';

/**
 * Define · affinity board → 3 patterns, driven by scroll.
 * Built from Figma "Whiteboard · Affinity (designed)" (1072:165) and the 3-pattern board (1068:16738).
 * Every sticky, heading and marker line is its own element (no flat image).
 * Scroll: the board pins, the 5 group headings and unrelated notes fade out,
 * 12 notes slide into the 3 circles, the circles are drawn, then the captions are written in.
 * Coordinates are Figma px inside the 1320px glass board, rounded to whole numbers.
 */

const FRAME_W = 1440;
const BOARD_W = 1320;
const BOARD_X = 72;
const HAND = '"Caveat", "Helvetica Neue", Helvetica, Arial, sans-serif';
const NOTE = '"Kalam", "Helvetica Neue", Helvetica, Arial, sans-serif';
const PEN = '#2a2a2e';

const C = { g: '#93dbc7', p: '#f6a9bc', v: '#a897ec' } as const;
const DOT = { b: '#2f80ed', g: '#27ae60' } as const;

type Dot = [number, number, keyof typeof DOT];
type Note = {
  t: string;
  c: keyof typeof C;
  a: [number, number, number]; // x, y, rotation on the affinity board
  b?: [number, number, number]; // x, y, rotation inside a pattern circle
  dots?: Dot[];
};

const NOTES: Note[] = [
  // Discoverability & Awareness
  { t: 'From a friend', c: 'g', a: [86, 220, -3], dots: [[73, 70, 'b']] },
  { t: 'No ads online', c: 'p', a: [186, 220, -1], b: [292, 330, -2], dots: [[75, 67, 'g']] },
  { t: 'FairPrice deal came late', c: 'v', a: [92, 314, 1], b: [180, 330, 2] },
  { t: 'eSIM? didn’t know', c: 'p', a: [192, 314, 3], dots: [[69, 63, 'g'], [80, 62, 'b']] },
  { t: 'Never saw live chat', c: 'g', a: [86, 408, -2], b: [292, 226, 2] },
  { t: 'No rewards page?', c: 'v', a: [186, 408, 0], b: [180, 226, -3], dots: [[76, 66, 'g']] },
  // Coupon Choice & Decisions
  { t: 'Referral cash = tempting', c: 'g', a: [328, 220, 1], b: [1012, 330, -2] },
  { t: '200 pts = 1 tea', c: 'v', a: [428, 220, 3], b: [900, 226, -3], dots: [[79, 62, 'b']] },
  { t: 'Saw a train ad', c: 'p', a: [334, 314, -2], dots: [[73, 69, 'g']] },
  { t: 'Hesitates at $50+ coupons', c: 'g', a: [434, 314, 0], b: [1012, 226, 2] },
  // Actual Usage Experience
  { t: 'Rewards = FairPrice app', c: 'g', a: [568, 220, -2], b: [540, 226, -3], dots: [[62, 68, 'g'], [73, 69, 'b']] },
  { t: 'PayNow taken by DBS', c: 'v', a: [668, 220, 0], b: [652, 226, 2] },
  { t: 'Weekly spending only', c: 'p', a: [574, 314, 2], dots: [[78, 63, 'g']] },
  { t: 'Shopee + bills only', c: 'v', a: [674, 314, -3] },
  { t: 'Interest rate first', c: 'p', a: [568, 408, -1], b: [900, 330, 2], dots: [[74, 67, 'b']] },
  // Pain Points & Improvements
  { t: 'Left after FairPrice change', c: 'p', a: [804, 220, 2], dots: [[79, 63, 'g']] },
  { t: 'No low-balance alert', c: 'v', a: [904, 220, -3] },
  { t: 'Icons hard to read', c: 'g', a: [810, 314, -1], dots: [[64, 67, 'g'], [75, 67, 'b']] },
  { t: 'App confusing at first', c: 'v', a: [910, 314, 1] },
  { t: 'Show budget per place?', c: 'g', a: [804, 408, 3], dots: [[80, 62, 'g']] },
  // SG Financial Habits
  { t: 'PayNow QR', c: 'g', a: [1045, 220, -1] },
  { t: 'DBS or OCBC', c: 'v', a: [1145, 220, 1], dots: [[77, 65, 'b']] },
  { t: 'Family uses DBS', c: 'g', a: [1051, 314, 3], b: [540, 330, 2], dots: [[79, 62, 'g']] },
  { t: 'FX on Google', c: 'p', a: [1151, 314, -2] },
  { t: 'Bank per role', c: 'p', a: [1045, 408, 0], b: [652, 330, -2], dots: [[65, 66, 'g'], [76, 66, 'b']] },
];

const PEOPLE: { t: string; c: keyof typeof C; x: number; r: number }[] = [
  { t: 'P1 · Student, Sri Lanka', c: 'g', x: 450, r: -2 },
  { t: 'P2 · Engineer, lapsed', c: 'p', x: 594, r: 2 },
  { t: 'P3 · Student, Philippines', c: 'v', x: 738, r: -1 },
];

const GROUPS: { t: string; x: number; r: number }[] = [
  { t: 'Discoverability\n& Awareness', x: 86, r: -2 },
  { t: 'Coupon Choice\n& Decisions', x: 328, r: 1 },
  { t: 'Actual Usage\nExperience', x: 568, r: -2 },
  { t: 'Pain Points &\nImprovements', x: 804, r: 1 },
  { t: 'SG Financial\nHabits', x: 1045, r: -2 },
];

const PATTERNS: { n: string; t: string; x: number; r: number; color: string; cap: string }[] = [
  { n: '1', t: 'Unseen', x: 168, r: -2, color: '#2f80ed', cap: 'Rewards were in Trust Bank,\nbut users didn’t see them.' },
  { n: '2', t: 'Elsewhere', x: 528, r: 1, color: '#e2574c', cap: 'Points were checked in the\nFairPrice app, not Trust.' },
  { n: '3', t: 'Not worth it', x: 888, r: -2, color: '#27ae60', cap: 'A 200-point reward felt\nworse than paying under $5.' },
];

const LASSO =
  'M142.25 2.20823C242.25 -1.79177 288.25 52.2082 284.25 132.208C280.25 222.208 222.25 276.208 132.25 274.208C42.2501 272.208 -1.74986 212.208 2.25014 132.208C6.25014 52.2082 62.2501 6.20823 154.25 8.20823';
const UNDERLINE = 'M1.10156 4.09961C39.1016 -0.900391 79.1016 7.09961 147.102 1.09961';
const SCRIBBLE = 'M1.10156 9.20048C191.102 -4.79952 411.102 21.2005 631.102 3.20048C751.102 -4.79952 831.102 13.2005 881.102 5.20048';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** text that appears as if written left to right */
function Written({ p, children, style }: { p: number; children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div style={{ ...style, clipPath: `inset(-20% ${(1 - p) * 100}% -20% -5%)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
  );
}

export function AffinityScroll() {
  const outer = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [scale, setScale] = useState(1);

  // scale the 1440 frame to the column, and to the viewport height while pinned
  useEffect(() => {
    const fit = () => {
      const w = box.current?.clientWidth ?? FRAME_W;
      const byWidth = w / FRAME_W;
      const byHeight = (window.innerHeight - 120) / 1000;
      setScale(Math.min(1, byWidth, Math.max(byHeight, 0.4)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  // scroll progress through the pinned stretch
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      setP(travel > 0 ? clamp(-r.top / travel) : 1);
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

  // timeline (0–1 of the pinned scroll)
  const fade = ease(seg(p, 0.1, 0.3)); // headings, other notes, dots out
  const move = (i: number) => ease(seg(p, 0.18 + (i % 4) * 0.03, 0.5 + (i % 4) * 0.03)); // notes into circles
  const grow = ease(seg(p, 0.2, 0.5)); // board grows to fit captions
  const titles = seg(p, 0.5, 0.6);
  const draw = (i: number) => ease(seg(p, 0.52 + i * 0.05, 0.66 + i * 0.05));
  const write = (i: number) => seg(p, 0.68 + i * 0.05, 0.78 + i * 0.05);
  const scribble = seg(p, 0.84, 0.9);
  const last = seg(p, 0.88, 0.97);

  const boardY = Math.round(mix(110, 143, grow));
  const boardH = Math.round(mix(604, 737, grow));
  const frameH = Math.round(mix(769, 943, grow));
  const done = p > 0.5;

  return (
    <div ref={outer} className="relative" style={{ height: `calc(${Math.round(943 * scale)}px + 300vh)` }}>
      <div className="sticky" style={{ top: `max(80px, calc(50vh - ${Math.round((943 * scale) / 2 + 20)}px))` }}>
        <div ref={box} className="relative w-full bg-white overflow-hidden rounded-[20px]" style={{ height: Math.round(frameH * scale) }}>
          <div
            className="absolute top-0 left-1/2"
            style={{ width: FRAME_W, height: frameH, marginLeft: -FRAME_W / 2, transform: `scale(${scale})`, transformOrigin: 'top center' }}
            role="img"
            aria-label="Affinity diagram: 42 notes from 3 interviews grouped into 5 topics, then into 3 patterns. 1 Unseen: rewards were in Trust Bank, but users didn’t see them. 2 Elsewhere: points were checked in the FairPrice app, not Trust. 3 Not worth it: a 200-point reward felt worse than paying under $5. So users never came back for rewards."
          >
            <p className="absolute left-[72px] top-[40px] text-[30px] leading-[38px]" style={{ fontFamily: HAND, color: PEN }}>
              Affinity diagram · 42 notes from 3 interviews
            </p>

            {/* glass board */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: BOARD_X,
                top: boardY,
                width: BOARD_W,
                height: boardH,
                borderRadius: 400,
                border: '5px solid #a9afb5',
                background: 'linear-gradient(90deg, #ffffff 0%, #eceff1 100%)',
                boxShadow: '0 24px 50px rgba(51,38,26,0.18)',
              }}
            >
              <div className="absolute inset-[-5px]">
                {/* glare */}
                <span className="absolute bg-white/55" style={{ left: 930, top: -300, width: 90, height: 1400, transform: 'rotate(-24deg)', transformOrigin: '0 0' }} />
                <span className="absolute bg-white/55" style={{ left: 1060, top: -300, width: 30, height: 1400, transform: 'rotate(-24deg)', transformOrigin: '0 0' }} />

                {PEOPLE.map((s) => (
                  <Sticky key={s.t} text={s.t} color={C[s.c]} x={s.x} y={30} w={130} h={70} r={s.r} />
                ))}

                {/* the 5 groups fade out */}
                {GROUPS.map((g) => (
                  <div key={g.t} className="absolute" style={{ left: g.x, top: 128, opacity: 1 - fade, transform: `translateY(${-fade * 10}px)` }}>
                    <p className="text-[25px] leading-[32px] whitespace-pre" style={{ fontFamily: HAND, color: PEN, transform: `rotate(${g.r}deg)` }}>
                      {g.t}
                    </p>
                    <svg className="absolute left-[-1px] top-[68px]" width="149" height="6" viewBox="0 0 149 6" fill="none" aria-hidden>
                      <path d={UNDERLINE} stroke={PEN} strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </div>
                ))}

                {/* the 3 patterns come in */}
                {PATTERNS.map((pt, i) => (
                  <React.Fragment key={pt.t}>
                    <p
                      className="absolute text-[40px] leading-[50px] whitespace-pre"
                      style={{ left: pt.x, top: 132, fontFamily: HAND, color: PEN, opacity: titles, transform: `rotate(${pt.r}deg) translateY(${(1 - titles) * 10}px)` }}
                    >
                      {pt.n}
                      {'  '}
                      {pt.t}
                    </p>
                    <svg className="absolute" style={{ left: 146 + i * 360, top: 206 }} width="287" height="277" viewBox="0 0 287 277" fill="none" aria-hidden>
                      <path d={LASSO} stroke={pt.color} strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw(i)} />
                    </svg>
                    <Written p={write(i)} style={{ position: 'absolute', left: 162 + i * 360, top: 500 }}>
                      <p className="text-[24px] leading-[25px] whitespace-pre" style={{ fontFamily: HAND, color: PEN }}>
                        {pt.cap}
                      </p>
                    </Written>
                  </React.Fragment>
                ))}

                {NOTES.map((n, i) => {
                  if (!n.b) {
                    return (
                      <Sticky
                        key={n.t}
                        text={n.t}
                        color={C[n.c]}
                        x={n.a[0]}
                        y={n.a[1]}
                        w={96}
                        h={88}
                        r={n.a[2]}
                        dots={n.dots}
                        dotOpacity={1}
                        style={{ opacity: 1 - fade, transform: `rotate(${n.a[2]}deg) scale(${1 - fade * 0.15})` }}
                      />
                    );
                  }
                  const t = move(i);
                  return (
                    <Sticky
                      key={n.t}
                      text={n.t}
                      color={C[n.c]}
                      x={Math.round(mix(n.a[0], n.b[0], t))}
                      y={Math.round(mix(n.a[1], n.b[1], t))}
                      w={Math.round(mix(96, 104, t))}
                      h={Math.round(mix(88, 92, t))}
                      r={mix(n.a[2], n.b[2], t)}
                      dots={n.dots}
                      dotOpacity={1 - fade}
                      lift={Math.sin(t * Math.PI)}
                    />
                  );
                })}

                <svg className="absolute" style={{ left: 220, top: 614 }} width="883" height="11" viewBox="0 0 883 11" fill="none" aria-hidden>
                  <path
                    d={SCRIBBLE}
                    stroke={PEN}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="2 9"
                    style={{ clipPath: `inset(0 ${(1 - scribble) * 100}% 0 0)` }}
                  />
                </svg>
                <Written p={last} style={{ position: 'absolute', left: 420, top: 636 }}>
                  <p className="text-[32px] leading-[40px] whitespace-pre" style={{ fontFamily: HAND, color: PEN, transform: 'rotate(-1deg)' }}>
                    → So users never came back for rewards
                  </p>
                </Written>
              </div>
            </div>
          </div>
        </div>

        {/* caption swaps when the patterns appear */}
        <div className="relative mt-[20px] h-[22px] text-center text-[16px] leading-[22px] text-[#8e8e95]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <p className="absolute inset-x-0 transition-opacity duration-300" style={{ opacity: done ? 0 : 1 }}>
            Colours = interviewees · Dots = said more than once
          </p>
          <p className="absolute inset-x-0 transition-opacity duration-300" style={{ opacity: done ? 1 : 0 }}>
            Each circle = a pattern seen in 2+ interviews
          </p>
        </div>
      </div>
    </div>
  );
}

function Sticky({
  text,
  color,
  x,
  y,
  w,
  h,
  r,
  dots,
  dotOpacity = 1,
  lift = 0,
  style,
}: {
  text: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  dots?: Dot[];
  dotOpacity?: number;
  lift?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        background: color,
        transform: `rotate(${r}deg) scale(${1 + lift * 0.06})`,
        boxShadow: `0 ${5 + lift * 10}px ${8 + lift * 16}px rgba(0,0,0,${0.16 + lift * 0.06})`,
        zIndex: lift > 0.01 ? 2 : 1,
        ...style,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-[10px] bg-black/5" />
      <p className="absolute left-[7px] right-[7px] top-[12px] text-[16px] leading-[18px] tracking-[-0.01em]" style={{ fontFamily: NOTE, color: PEN }}>
        {text}
      </p>
      {dots?.map(([dx, dy, c], k) => (
        <span key={k} className="absolute w-[13px] h-[13px] rounded-full" style={{ left: dx, top: dy, background: DOT[c], opacity: dotOpacity, border: '1px solid rgba(255,255,255,0.9)' }} />
      ))}
    </div>
  );
}
