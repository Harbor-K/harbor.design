import React from 'react';
import { motion } from 'framer-motion';
import { CornerUpLeftIcon } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useHideOnScroll, hideOnScrollStyle } from '../../hooks/useHideOnScroll';
import { PROJECT_ICONS } from './projectIcons';

/**
 * Top bar on case-study pages, from Harbor's Figma (Section 1 / node 1012:11376):
 * a dark tray floating at the top centre with  [↩ Back]  …  [icon  Next project].
 * Tray: #2B2B2B, 6px padding, 46px gap, 12px corners. Back: #0A0A0A, Helvetica Neue Bold 17.
 * Project button: white, 40px icon (4px corners), Helvetica Neue Medium 17.
 *
 * The project button always points at the next case in the loop:
 * Trust Bank → GameCove → UTrada → Trust Bank. The current case is read from the URL,
 * so every case page uses the same component (older `next` props are ignored).
 *
 * Scroll: scrolling down tucks the tray up out of view; scrolling up brings it back down.
 */
const EASE_DROP: [number, number, number, number] = [0.22, 1.2, 0.36, 1];

export const CASE_ORDER = [
  { route: '#/trust-bank', name: 'Trust Bank', icon: PROJECT_ICONS.trust },
  { route: '#/gamecove', name: 'GameCove', icon: PROJECT_ICONS.gamecove },
  { route: '#/utrada', name: 'UTrada', icon: PROJECT_ICONS.utrada },
];

function nextCase() {
  const here = typeof window === 'undefined' ? '' : window.location.hash;
  const i = CASE_ORDER.findIndex((c) => c.route === here);
  return CASE_ORDER[(Math.max(i, 0) + 1) % CASE_ORDER.length];
}

export function CaseNav({ onBack }: { onBack: () => void; next?: unknown }) {
  const reduced = usePrefersReducedMotion();
  const hidden = useHideOnScroll();
  const next = nextCase();
  const item = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: -14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay: 0.32 + i * 0.06, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="fixed top-5 left-1/2 z-50 max-w-[94vw]" style={hideOnScrollStyle(hidden)}>
      <motion.nav
        className="flex items-stretch gap-[46px] p-1.5 rounded-xl bg-[#2B2B2B] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        aria-label="Case study"
        initial={reduced ? false : { y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ y: { duration: 0.7, delay: 0.1, ease: EASE_DROP }, opacity: { duration: 0.3, delay: 0.1 } }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Back to projects"
          className="flex items-center gap-2 rounded-lg bg-[#0A0A0A] text-white px-5 py-3 font-semibold text-[17px] tracking-[-0.01em] hover:bg-[#1c1c1c] transition-colors"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          {...item(0)}
        >
          <CornerUpLeftIcon className="w-[18px] h-[18px]" strokeWidth={2.4} aria-hidden="true" />
          Back
        </motion.button>
        <motion.a
          href={next.route}
          aria-label={`Next project: ${next.name}`}
          className="flex items-center gap-2.5 rounded-lg bg-white text-[#0A0A0A] pl-2.5 pr-5 py-2 text-[17px] font-medium tracking-[-0.01em] hover:bg-[#F2F2F2] transition-colors whitespace-nowrap"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          {...item(1)}
        >
          <img src={next.icon} alt="" className="w-10 h-10 rounded-[4px] object-cover" />
          {next.name}
        </motion.a>
      </motion.nav>
    </div>
  );
}
