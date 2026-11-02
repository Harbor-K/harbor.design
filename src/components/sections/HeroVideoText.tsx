import React from 'react';
import { DotMatrix } from '../DotMatrix';

/**
 * Text over the full-screen video at the end of the hero.
 * Headline in electric-yellow dots (wide, so it reads big), intro paragraph on the right at 18–20px.
 * The paragraph uses balanced line breaks and keeps "3+ years" and "the UK." together,
 * so nothing is split awkwardly or left alone on the last line.
 */
const ELECTRIC = '#FFE600';
const ABOUT_TEXT =
  'I observe objectively to design clearly. 3+ years designing fintech and e-learning products: trading platforms, digital banking, crypto wallets and data dashboards. I’ve lived and worked in Korea, Australia and the UK.';

export function HeroVideoText({ opacity }: { opacity: number }) {
  return (
    <div
      className="absolute inset-x-6 md:inset-x-10 bottom-8 md:bottom-10 z-[160] flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 pointer-events-none"
      style={{ opacity }}
    >
      <div className="w-full md:max-w-[66%]">
        <DotMatrix text="UNDERSTAND PEOPLE, CONNECT THE DOTS" dotPx={6} mode="static" color={ELECTRIC} fitContainer />
      </div>
      <p
        className="text-[18px] md:text-[20px] leading-relaxed text-white md:max-w-[440px] md:text-right"
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.35)', textWrap: 'balance' } as React.CSSProperties}
      >
        {ABOUT_TEXT}
      </p>
    </div>
  );
}
