import React from 'react';
import { EMAIL, INSTAGRAM_URL, BOOK_CALL_URL, PROJECTS } from '../../data/content';
import { DotField } from '../DotField';

// footer project list: the case studies plus UTrada (the third project in the Projects section)
const FOOTER_PROJECTS = [...PROJECTS.map((p) => p.name), 'UTrada'];
const FIELD_H = 260; // the dot ground along the bottom
const LINKEDIN_URL = '[URL]'; // TODO: Harbor's LinkedIn profile URL

export function Contact() {
  return (
    <footer id="contact" className="relative overflow-hidden pt-24 bg-white">
      <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

      {/* the dot harbour fills the whole footer: still ground at the bottom, lighthouse beam sweeps the whole white area behind the text */}
      <DotField height={FIELD_H} className="absolute inset-0 z-0" />

      <div className="relative z-10 max-w-[1800px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-14">
          <div className="md:col-span-2 flex flex-col gap-10">
            <p className="font-inter-tight display-tight text-[32px] leading-[1.1] max-w-md">
              Hiring, building something, or just want to say hi? Let's talk.
            </p>
            <div>
              <p className="mono-label text-[#8B8B8B] mb-3">Contact</p>
              <a href={`mailto:${EMAIL}`} className="font-inter-tight display-tight text-2xl md:text-4xl hover:text-[#3B5BD9] transition-colors duration-150 break-all">
                {EMAIL}
              </a>
            </div>
            {/* English copyright convention: © year, then the name — Harbor first, legal first name in parentheses */}
            <p className="mono-label text-[#8B8B8B]">© 2026 Harbor (Jihyun) Kim</p>
          </div>

          <div>
            <p className="mono-label text-[#8B8B8B] mb-4">Projects</p>
            <ul className="space-y-2">
              {FOOTER_PROJECTS.map((name) => (
                <li key={name}>
                  <a href="#work" className="text-lg hover:text-[#3B5BD9] transition-colors duration-150">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mono-label text-[#8B8B8B] mb-4">Elsewhere</p>
            <ul className="space-y-2">
              <li>
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-lg hover:text-[#3B5BD9] transition-colors duration-150">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-lg hover:text-[#3B5BD9] transition-colors duration-150">
                  Instagram
                </a>
              </li>
              <li>
                <a href={BOOK_CALL_URL} target="_blank" rel="noopener noreferrer" className="text-lg hover:text-[#3B5BD9] transition-colors duration-150">
                  Book a call
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* keeps room for the dot ground under the text */}
      <div style={{ height: FIELD_H }} aria-hidden="true" />
    </footer>
  );
}
