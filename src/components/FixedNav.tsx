import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NAV_ITEMS } from '../data/content';
import { CV_URL, CV_LABEL } from '../data/links';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useHideOnScroll, hideOnScrollStyle } from '../hooks/useHideOnScroll';

/**
 * Boxed nav bar (Awwwards-style): a dark tray holding a logo block and square-ish buttons.
 * Buttons are white by default; the section you're in turns its button to that section's colour.
 * Last item: CV in electric yellow — it leaves the page (opens the CV in a new tab), so it looks
 * different from the in-page section buttons. No arrow, at Harbor's request.
 *
 * Opening: on first load the tray drops in from above the screen and settles with a soft overshoot,
 * then its buttons land one after another (left to right). It finishes before the circles start
 * popping in the hero, so the two openings don't compete.
 *
 * Scroll: scrolling down tucks the tray up out of view; scrolling up brings it back down.
 */
const EASE_DROP: [number, number, number, number] = [0.22, 1.2, 0.36, 1]; // slight overshoot, then settle
const TRAY_DELAY = 0.1;
const ITEM_DELAY = 0.32;
const ITEM_STAGGER = 0.06;

export function FixedNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const hidden = useHideOnScroll();

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // About me opens its own page (#/about)
    if (id === 'about') {
      window.location.hash = '#/about';
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

  // each button drops a little from above, in sequence
  const itemMotion = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: -14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay: ITEM_DELAY + i * ITEM_STAGGER, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    // outer wrapper: centring + hide-on-scroll slide; the inner nav owns the opening drop animation
    <div className="fixed top-5 left-1/2 z-50 max-w-[94vw]" style={hideOnScrollStyle(hidden)}>
      <motion.nav
        className="flex items-stretch gap-1.5 p-1.5 rounded-xl bg-[#2B2B2B] shadow-[0_8px_24px_rgba(0,0,0,0.18)] overflow-x-auto no-scrollbar"
        aria-label="Primary"
        initial={prefersReducedMotion ? false : { y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ y: { duration: 0.7, delay: TRAY_DELAY, ease: EASE_DROP }, opacity: { duration: 0.3, delay: TRAY_DELAY } }}
      >
        <motion.button
          type="button"
          onClick={scrollTop}
          aria-label="Back to top"
          className="flex items-center rounded-lg bg-[#0A0A0A] text-white px-4 md:px-5 font-inter-tight font-semibold text-[15px] md:text-[17px] tracking-tight select-none"
          {...itemMotion(0)}
        >
          harbor
        </motion.button>
        {NAV_ITEMS.map((item, i) => {
          const isActive = activeId === item.id;
          const lightAccent = item.accent === '#F5C518';
          return (
            <motion.a
              key={item.id}
              href={item.id === 'about' ? '#/about' : `#${item.id}`}
              onClick={handleClick(item.id)}
              className="flex items-center rounded-lg px-4 py-2.5 md:px-5 md:py-3 text-[15px] md:text-[17px] font-medium tracking-tight whitespace-nowrap transition-colors duration-200 ease-out"
              style={{
                backgroundColor: isActive ? item.accent : '#FFFFFF',
                color: isActive && !lightAccent ? '#FFFFFF' : '#0A0A0A',
              }}
              {...itemMotion(i + 1)}
            >
              {item.label}
            </motion.a>
          );
        })}
        {/* CV: opens in a new tab */}
        <motion.a
          href={CV_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open CV in a new tab"
          className="flex items-center rounded-lg px-4 py-2.5 md:px-5 md:py-3 text-[15px] md:text-[17px] font-semibold tracking-tight whitespace-nowrap bg-[#FFE600] text-[#0A0A0A] hover:bg-[#FFF06B] transition-colors duration-200 ease-out"
          {...itemMotion(NAV_ITEMS.length + 1)}
        >
          {CV_LABEL}
        </motion.a>
      </motion.nav>
    </div>
  );
}
