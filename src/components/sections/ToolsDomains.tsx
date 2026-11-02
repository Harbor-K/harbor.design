import React from 'react';
import { TOOLS, DOMAINS } from '../../data/content';
import { DotMatrix } from '../DotMatrix';
import { useViewportSize } from '../../hooks/useViewportSize';

function Badge({ label }: { label: string }) {
  return (
    <div className="shrink-0 mx-4 flex items-center justify-center rounded-full border border-[rgba(10,10,10,0.25)] bg-white" style={{ width: 280, height: 280 }}>
      <div className="flex items-center justify-center rounded-full border border-[rgba(10,10,10,0.12)] text-center px-8" style={{ width: 248, height: 248 }}>
        <span className="font-inter-tight display-tight text-lg">{label}</span>
      </div>
    </div>
  );
}

export function ToolsDomains() {
  const { width: vw } = useViewportSize();
  const headingPitch = (vw * 0.045) / 7;

  return (
    <section className="relative py-24 overflow-hidden bg-white border-t border-[rgba(10,10,10,0.12)]">
      <div className="absolute inset-0 dot-grid-bg pointer-events-none" />

      <div className="relative px-6 mb-16">
        <DotMatrix text="Tools & domains" dotPx={Math.max(5, headingPitch * 0.7)} mode="assemble" color="#0A0A0A" />
      </div>

      <div className="relative flex flex-col gap-10">
        <div className="marquee-row overflow-hidden">
          <div className="flex w-max animate-marquee-left">
            {[...TOOLS, ...TOOLS].map((label, i) => (
              <Badge key={`t-${i}`} label={label} />
            ))}
          </div>
        </div>
        <div className="marquee-row overflow-hidden">
          <div className="flex w-max animate-marquee-right">
            {[...DOMAINS, ...DOMAINS].map((label, i) => (
              <Badge key={`d-${i}`} label={label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
