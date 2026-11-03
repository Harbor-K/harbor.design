import React, { useEffect, useRef } from 'react';

/**
 * Calm scroll-reveal for case-study pages.
 * Every block inside a section's content column (eyebrow, heading, paragraph, image, card…)
 * fades up a little as it enters the screen, one after another with a short stagger,
 * so each section settles in piece by piece without anything flying around.
 * Respects "reduce motion": everything is simply shown.
 */
export function CaseReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the content column of each section is the 1440px container; reveal its direct children
    const columns = Array.from(root.querySelectorAll<HTMLElement>('main .max-w-\\[1440px\\]'));
    const items: HTMLElement[] = [];
    columns.forEach((col) => {
      Array.from(col.children).forEach((child, i) => {
        const el = child as HTMLElement;
        el.classList.add('reveal');
        el.style.setProperty('--reveal-delay', `${Math.min(i, 4) * 120}ms`);
        items.push(el);
      });
    });

    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    // things already on screen when the page opens come in right away
    const vh = window.innerHeight;
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) el.classList.add('is-in');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    items.filter((el) => !el.classList.contains('is-in')).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
