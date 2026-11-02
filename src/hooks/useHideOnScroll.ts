import { useEffect, useState } from 'react';

/**
 * Header hide/show on scroll: scrolling down tucks the header up out of view,
 * scrolling up brings it back down. Near the very top it always shows.
 * A small threshold ignores tiny trackpad jitters.
 *
 * Hover strip: while the mouse is in the top strip of the window (the header's band, HOVER_ZONE px),
 * the header shows even if it was tucked away; it tucks away again once the mouse leaves that strip.
 */
const HOVER_ZONE = 100;

export function useHideOnScroll({ topZone = 80, threshold = 6 } = {}) {
  const [scrolledAway, setScrolledAway] = useState(false);
  const [hoverTop, setHoverTop] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const dy = y - lastY;
      if (y <= topZone) {
        setScrolledAway(false);
        lastY = y;
        return;
      }
      if (Math.abs(dy) < threshold) return; // keep lastY so slow scrolls still add up
      setScrolledAway(dy > 0);
      lastY = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    // mouse in the top strip -> show; leaving the window or the strip -> back to scroll state
    const onMove = (e: PointerEvent | MouseEvent) => setHoverTop(e.clientY <= HOVER_ZONE);
    const onLeave = () => setHoverTop(false);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true, capture: true });
    window.addEventListener('mousemove', onMove, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', onMove, { capture: true } as EventListenerOptions);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [topZone, threshold]);

  return scrolledAway && !hoverTop;
}

/** style for a top-centred fixed header wrapper: slides up out of view when hidden */
export function hideOnScrollStyle(hidden: boolean): React.CSSProperties {
  return {
    transform: `translate(-50%, ${hidden ? 'calc(-100% - 28px)' : '0'})`,
    transition: 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
  };
}
