import React, { useCallback, useEffect, useState } from 'react';
import { FixedNav } from './components/FixedNav';
import { IntroHero } from './components/sections/IntroHero';
import { Work } from './components/sections/Work';
import { Experience } from './components/sections/Experience';
import { WhatIDo } from './components/sections/WhatIDo';
import { Contact } from './components/sections/Contact';
import { TrustBankCase } from './components/case/TrustBankCase';
import { PlaceholderCase } from './components/case/PlaceholderCase';
import { CaseReveal } from './components/case/CaseReveal';
import { ImageLightbox } from './components/case/ImageLightbox';
import { CursorTrail } from './components/CursorTrail';
import { AboutPage } from './components/about/AboutPage';

const CASE_ROUTES = ['#/trust-bank', '#/gamecove', '#/utrada', '#/about'];

function readRoute() {
  if (typeof window === 'undefined') return '';
  return CASE_ROUTES.includes(window.location.hash) ? window.location.hash : '';
}

// Not rendered: Manifesto, ToolsDomains and RolesHero (the role circles + video opening, replaced by IntroHero at Harbor's request).
export function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // closing a case study returns to the Projects section of the home page
  const closeCase = useCallback(() => {
    window.location.hash = '#work';
    setRoute('');
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView({ block: 'start' })));
  }, []);

  // closing About returns to the top of the home page
  const closeAbout = useCallback(() => {
    window.location.hash = '';
    setRoute('');
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  return (
    <>
      {/* dot-trail cursor on every page */}
      <CursorTrail />

      {route === '#/about' ? (
        <AboutPage onClose={closeAbout} />
      ) : route ? (
        // case-grid: same faint grid background as the home page; CaseReveal: gentle fade-up on scroll;
        // ImageLightbox: hover-zoom and click-to-enlarge for images. key=route so each case starts fresh.
        <div className="case-grid" key={route}>
          <ImageLightbox>
            <CaseReveal>
              {route === '#/trust-bank' && <TrustBankCase onClose={closeCase} />}
              {route === '#/gamecove' && <PlaceholderCase name="GameCove" accent="#2E4766" onClose={closeCase} />}
              {route === '#/utrada' && <PlaceholderCase name="UTrada" accent="#8301D5" onClose={closeCase} />}
            </CaseReveal>
          </ImageLightbox>
        </div>
      ) : (
        // home-min16: page content never goes below 16px (see index.css)
        <div className="home-min16 relative w-full min-h-screen bg-white text-[#0A0A0A] font-inter-tight overflow-x-clip">
          <div className="fixed inset-0 dot-grid-bg pointer-events-none z-0" />

          <FixedNav />

          <main className="relative z-10">
            <IntroHero />
            <Work />
            <Experience />
            <WhatIDo />
            <Contact />
          </main>
        </div>
      )}
    </>
  );
}
