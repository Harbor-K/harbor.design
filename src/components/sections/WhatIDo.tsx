import React from 'react';
import { motion } from 'framer-motion';
import { KimLLM } from '../KimLLM';
import { SOFT_GREY } from './Experience';
import { EMAIL } from '../../data/content';
import { CV_URL, CV_LABEL } from '../../data/links';

/**
 * About me section (file name kept for history; was "What I do").
 * Sits on the same soft grey the UTrada page fades into, so Projects flows straight into it —
 * no divider lines above or below. The Kim LLM box stays white on the grey.
 * Layout from Harbor's sketch: a wide photo across the whole left column with the text right under it,
 * same width, and a short gutter before the Kim LLM box on the right.
 * Under the bio (two lines): LinkedIn, Email and CV buttons (no arrows).
 */
// Harbor at a sticky-note wall (3:2, colour)
const ABOUT_PHOTO = '/assets/main-v2/about-photo.webp';
// two-line bio, shortened from the earlier four-line version (same facts)
const BIO = 'I observe objectively to design clearly. 3+ years in fintech and e‑learning across Korea, Australia and the UK.';
const LINKEDIN_URL = '[URL]'; // TODO: Harbor's LinkedIn profile URL

const BTN =
  'inline-flex items-center gap-2 rounded-lg px-5 py-3 text-[17px] font-medium tracking-tight transition-colors duration-150';

export function WhatIDo() {
  return (
    <section id="about" className="relative px-6 py-24" style={{ background: SOFT_GREY }}>
      <div className="relative max-w-[1800px] mx-auto">
        <h2 className="font-inter-tight display-tight uppercase text-3xl md:text-5xl mb-10">About me</h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* left: wide photo across the column, text right under it at the same width */}
          <motion.div
            className="md:col-span-4 flex flex-col"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[24px] bg-[#DCDBD7]">
              <img
                src={ABOUT_PHOTO}
                alt="Harbor Kim sorting sticky notes on a research wall"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: '38% 40%' }}
              />
            </div>
            <p className="font-inter-tight display-tight text-[24px] md:text-[28px] leading-tight mt-6">Harbor Kim</p>
            <p className="text-[18px] text-[#0A0A0A]/60 mt-1">I Design Magic.</p>
            <p className="text-[18px] leading-relaxed text-[#0A0A0A]/80 mt-4" style={{ textWrap: 'balance' } as React.CSSProperties}>
              {BIO}
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-[#0A0A0A] text-white hover:bg-[#2B2B2B]`}>
                LinkedIn
              </a>
              <a href={`mailto:${EMAIL}`} className={`${BTN} bg-white text-[#0A0A0A] hover:bg-[#F2F2F2]`}>
                Email
              </a>
              <a
                href={CV_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open CV in a new tab"
                className={`${BTN} bg-[#FFE600] text-[#0A0A0A] font-semibold hover:bg-[#FFF06B]`}
              >
                {CV_LABEL}
              </a>
            </div>
          </motion.div>

          {/* right: Kim LLM (white box on the grey) */}
          <motion.div
            className="md:col-span-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <KimLLM />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
