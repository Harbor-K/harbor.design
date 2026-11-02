import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPANIES, SKILLS } from '../../data/content';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useViewportSize } from '../../hooks/useViewportSize';
import { hashString, mulberry32 } from '../../utils/random';
import { useInView } from 'framer-motion';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { DotMatrix } from '../DotMatrix';

/**
 * Experience section (file name kept for history).
 * Skills on the left, a portrait coin in the middle, companies on the right.
 * The coin's first face is a looping video of Harbor at her laptop (square crop, framed on her face, no text on it);
 * scrolling flips it -> UTrada -> ETO Markets -> Pinetree; hovering a company flips to it too.
 * Under the coin: one line of what Harbor did there.
 */

// 1080x1080 crop of the desk clip (x 440..1520 of 1920x1080), scaled to 800px, silent 8s loop
const PORTRAIT_VIDEO = '/assets/main-v2/desk-coin.mp4';
const PORTRAIT_POSTER = '/assets/main-v2/desk-coin-poster.jpg';

const HOVER = '#3B5BD9';
const INK = '#0A0A0A';
const PORTRAIT = -1; // face id for the portrait; 0..n are company indexes

// scroll stages inside this section
const PORTRAIT_UNTIL = 0.12;
const STAGE_LEN = 0.27;

function useRowOffsets(names: string[], seedKey: string) {
  return useMemo(() => {
    const rng = mulberry32(hashString(seedKey));
    return names.map(() => Math.round((rng() - 0.5) * 120));
  }, [names, seedKey]);
}

function CoinFace({ id, diameter }: { id: number; diameter: number }) {
  if (id === PORTRAIT) {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={PORTRAIT_VIDEO}
        poster={PORTRAIT_POSTER}
        autoPlay
        loop
        muted
        playsInline
        aria-label="Harbor Kim working at her laptop"
      />
    );
  }
  const company = COMPANIES[id];
  if (company.image) {
    return <img src={company.image} alt={company.name} className="absolute inset-0 w-full h-full object-cover" />;
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#3B5BD9]">
      <DotMatrix text={company.name.charAt(0)} dotPx={Math.max(10, diameter * 0.09)} mode="static" color="#FFFFFF" alive={false} />
    </div>
  );
}

export function Work() {
  const outerRef = useRef<HTMLDivElement>(null);
  const coinWrapRef = useRef<HTMLDivElement>(null);
  const { progress } = useScrollProgress(outerRef);
  const { width: vw, height: vh } = useViewportSize();
  const prefersReducedMotion = usePrefersReducedMotion();
  const inView = useInView(coinWrapRef, { once: true, margin: '-20% 0px -20% 0px' });

  const [hoveredCompany, setHoveredCompany] = useState<number | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const companyOffsets = useRowOffsets(COMPANIES.map((c) => c.name), 'experience-companies');
  const skillOffsets = useRowOffsets(SKILLS.map((s) => s.name), 'work-skills');

  const diameter = Math.max(240, Math.min(vw * 0.3, vh * 0.55));
  const thickness = diameter * 0.09;

  // which face the scroll position asks for
  const scrollStage = progress < PORTRAIT_UNTIL ? PORTRAIT : Math.min(COMPANIES.length - 1, Math.floor((progress - PORTRAIT_UNTIL) / STAGE_LEN));
  const target = hoveredCompany ?? scrollStage;

  // two-sided coin: each change flips 180° and paints the new content on the side that turns to face us
  const [faces, setFaces] = useState<[number, number]>([PORTRAIT, PORTRAIT]);
  const [flips, setFlips] = useState(0);
  const shownRef = useRef(PORTRAIT);
  const flipsRef = useRef(0);
  useEffect(() => {
    if (target === shownRef.current) return;
    shownRef.current = target;
    const next = flipsRef.current + 1;
    flipsRef.current = next;
    const side = next % 2; // 0 = front, 1 = back
    setFaces((prev) => (side === 0 ? [target, prev[1]] : [prev[0], target]));
    setFlips(next);
  }, [target]);

  const activeCompany = target >= 0 ? COMPANIES[target] : null;

  return (
    <section id="experience" ref={outerRef} className="relative bg-white border-t border-[rgba(10,10,10,0.12)]" style={{ minHeight: '400vh' }}>
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

        <div className="relative w-full max-w-[1800px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 items-center h-full gap-6 overflow-y-auto md:overflow-visible py-10 md:py-0">
          {/* left column - skills */}
          <motion.div
            className="flex flex-col items-center md:items-end gap-2 md:pr-6 order-3 md:order-1"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {SKILLS.map((s, i) => (
              <motion.button
                key={s.name}
                type="button"
                onMouseEnter={() => setHoveredSkill(s.name)}
                onMouseLeave={() => setHoveredSkill(null)}
                variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
                className="font-inter-tight display-tight leading-[1.1] text-center md:text-right transition-colors duration-150"
                style={{
                  fontSize: 'clamp(18px, 2vw, 32px)',
                  marginRight: skillOffsets[i],
                  color: hoveredSkill === s.name ? HOVER : INK,
                }}
              >
                {s.name}
              </motion.button>
            ))}
          </motion.div>

          {/* center - portrait coin that flips to each company */}
          <div ref={coinWrapRef} className="relative flex items-center justify-center h-full order-2">
            <div style={{ perspective: 1800 }}>
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${inView || prefersReducedMotion ? 0 : 90}deg)`,
                  transition: 'transform 1s cubic-bezier(0.23,1,0.32,1)',
                }}
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${flips * 180}deg)`,
                    transition: prefersReducedMotion ? 'none' : 'transform 0.7s cubic-bezier(0.23,1,0.32,1)',
                    width: diameter,
                    height: diameter,
                    position: 'relative',
                  }}
                >
                  {/* front face */}
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden bg-[#0A0A0A]"
                    style={{ backfaceVisibility: 'hidden', transform: `translateZ(${thickness / 2}px)` }}
                  >
                    <CoinFace id={faces[0]} diameter={diameter} />
                  </div>
                  {/* back face */}
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden bg-[#0A0A0A]"
                    style={{ backfaceVisibility: 'hidden', transform: `rotateY(180deg) translateZ(${thickness / 2}px)` }}
                  >
                    <CoinFace id={faces[1]} diameter={diameter} />
                  </div>
                </div>
              </div>
            </div>

            {/* one line of what Harbor did at the company on the coin */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[min(520px,90vw)] text-center pointer-events-none"
              style={{ top: `calc(50% + ${diameter / 2 + 28}px)` }}
            >
              <AnimatePresence mode="wait">
                {activeCompany && (
                  <motion.p
                    key={activeCompany.name}
                    className="font-inter-tight display-tight text-base md:text-lg leading-snug text-[#0A0A0A]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {activeCompany.highlight}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* right column - companies */}
          <motion.div
            className="flex flex-col items-center md:items-start gap-2 md:pl-6 order-1 md:order-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {COMPANIES.map((c, i) => (
              <motion.button
                key={c.name}
                type="button"
                onMouseEnter={() => setHoveredCompany(i)}
                onMouseLeave={() => setHoveredCompany(null)}
                variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}
                className="font-inter-tight display-tight uppercase leading-[0.95] text-center md:text-left transition-colors duration-150"
                style={{
                  fontSize: 'clamp(22px, 2.8vw, 48px)',
                  marginLeft: companyOffsets[i],
                  color: target === i ? HOVER : INK,
                }}
              >
                {c.name}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
