import React, { useEffect } from 'react';
import { CaseNav } from './CaseNav';

/**
 * Placeholder case study — same layout as the Trust Bank page (1440 column, same sections and spacing),
 * with lorem ipsum text and grey "Image" boxes until Harbor's real content is ready.
 * Used for GameCove and UTrada.
 */

const INK = '#000d10';
const ASH = '#8e8e95';
const TINT = '#F4F4F2';
const HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const L1 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const L2 = 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.';
const L3 = 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative mx-auto w-full max-w-[1440px] px-6 min-[1488px]:px-0 ${className}`}>{children}</div>;
}

function Eyebrow({ label, light = false }: { label: string; light?: boolean }) {
  const c = light ? '#ffffff' : ASH;
  return (
    <div className="flex items-center gap-[10px]" style={{ fontFamily: HELV }}>
      <span className="block w-4 h-4" style={{ backgroundColor: c }} />
      <span className="text-[17px] leading-[1.4]" style={{ color: c }}>
        {label}
      </span>
    </div>
  );
}

function H2({ children, color = INK, className = '' }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <h2 className={`text-[30px] md:text-[37px] leading-[1.1] tracking-[-0.01em] font-bold ${className}`} style={{ fontFamily: HELV, color }}>
      {children}
    </h2>
  );
}

function Body({ children, className = '', color = INK }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <p className={`text-[17px] md:text-[18px] leading-[29px] ${className}`} style={{ fontFamily: HELV, color }}>
      {children}
    </p>
  );
}

/** grey box standing in for an image */
function ImageBox({ ratio = '16 / 9', className = '', dark = false }: { ratio?: string; className?: string; dark?: boolean }) {
  return (
    <div
      className={`w-full flex items-center justify-center ${className}`}
      style={{ aspectRatio: ratio, background: dark ? 'rgba(255,255,255,0.12)' : '#E2E2E0' }}
    >
      <span className="text-[18px] font-medium" style={{ fontFamily: HELV, color: dark ? 'rgba(255,255,255,0.6)' : ASH }}>
        Image
      </span>
    </div>
  );
}

function TwoCol({ left, right, className = '' }: { left: React.ReactNode; right: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-start ${className}`}>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

function OverviewRow({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-[370px_1fr] gap-4 md:gap-0 ${className}`}>
      <p className="text-[23px] leading-[1.2] tracking-[-0.01em] font-bold" style={{ fontFamily: HELV, color: INK }}>
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Stat({ accent }: { accent: string }) {
  return (
    <div style={{ fontFamily: HELV }}>
      <p className="text-[44px] md:text-[52px] leading-[63px]" style={{ color: accent }}>
        00%
      </p>
      <p className="text-[16px] leading-[1.43] text-[#767676]">Lorem ipsum dolor</p>
    </div>
  );
}

export function PlaceholderCase({ name, accent, onClose }: { name: string; accent: string; onClose: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="relative w-full min-h-screen bg-white overflow-x-clip" style={{ color: INK }}>
      <CaseNav onBack={onClose} />
      <main>
        {/* hero */}
        <section className="bg-white pt-28 md:pt-[120px] pb-20">
          <Container>
            <p className="text-[29px] leading-none font-bold tracking-[-0.02em]" style={{ fontFamily: HELV, color: accent }}>
              {name}
            </p>
            <h1 className="mt-10 md:mt-[38px] text-[40px] md:text-[63px] leading-none tracking-[-0.02em] font-bold max-w-[760px]" style={{ fontFamily: HELV }}>
              Lorem ipsum dolor
              <br />
              sit amet consectetur
            </h1>
            <Body className="mt-8 md:mt-[31px] max-w-[760px]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit
              <br />
              {name} · UX case study
            </Body>
            <ImageBox ratio="1440 / 700" className="mt-10 md:mt-[30px]" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8" style={{ fontFamily: HELV }}>
              {['TIMELINE', 'TEAM & ROLE', 'INDUSTRY'].map((k) => (
                <div key={k}>
                  <p className="text-[17px] leading-[1.4]">{k}</p>
                  <p className="mt-2 text-[18px] leading-[29px]">Lorem ipsum dolor sit amet</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* overview */}
        <section className="bg-white py-[120px]">
          <Container>
            <Eyebrow label="OVERVIEW" />
            <OverviewRow label="The problem" className="mt-[72px]">
              <Body className="max-w-[944px]">
                {L1} {L2}
              </Body>
            </OverviewRow>
            <OverviewRow label="How it works" className="mt-[80px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1070px]">
                {[0, 1, 2, 3].map((i) => (
                  <ImageBox key={i} ratio="1 / 0.8" />
                ))}
              </div>
            </OverviewRow>
            <OverviewRow label="Solution" className="mt-[80px]">
              <Body className="max-w-[928px]">
                {L2} {L3}
              </Body>
            </OverviewRow>
            <OverviewRow label="Impact" className="mt-[80px] md:items-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 max-w-[1041px]">
                <div className="py-5 sm:pr-7">
                  <Stat accent={accent} />
                </div>
                <div className="py-5 sm:pl-7 sm:border-l border-[rgba(0,13,16,0.12)]">
                  <Stat accent={accent} />
                </div>
                <div className="py-5 sm:pl-7 sm:border-l border-[rgba(0,13,16,0.12)]">
                  <Stat accent={accent} />
                </div>
              </div>
            </OverviewRow>
          </Container>
        </section>

        {/* process */}
        <section className="py-[120px]" style={{ backgroundColor: TINT }}>
          <Container>
            <Eyebrow label="PROCESS" />
            <H2 className="mt-4">Lorem ipsum dolor sit amet</H2>
            <ImageBox ratio="1440 / 560" className="mt-[30px]" />
          </Container>
        </section>

        {/* discover */}
        <section className="bg-white py-[120px]">
          <Container>
            <TwoCol
              left={
                <>
                  <Eyebrow label="DISCOVER" />
                  <H2 className="mt-4">
                    Lorem ipsum dolor
                    <br />
                    sit amet consectetur
                  </H2>
                  <Body className="mt-4">{L1}</Body>
                </>
              }
              right={<ImageBox ratio="4 / 3" className="md:mt-[47px]" />}
            />
            <TwoCol
              className="mt-[160px]"
              left={
                <>
                  <H2>
                    Lorem ipsum dolor
                    <br />
                    sit amet consectetur
                  </H2>
                  <Body className="mt-4">{L2}</Body>
                  <ImageBox ratio="700 / 260" className="mt-[30px]" />
                </>
              }
              right={<ImageBox ratio="4 / 3" className="md:mt-[120px]" />}
            />
            <ImageBox ratio="1440 / 640" className="mt-[120px]" />
          </Container>
        </section>

        {/* define */}
        <section style={{ backgroundColor: TINT }}>
          <Container className="py-[120px]">
            <Eyebrow label="DEFINE" />
            <H2 className="mt-4">Lorem ipsum dolor sit amet</H2>
            <Body className="mt-4 max-w-[700px]">{L1}</Body>
            <ImageBox ratio="1440 / 720" className="mt-[30px]" />
          </Container>
          <div className="py-[22px]" style={{ background: '#E6E6E3' }}>
            <Container>
              <div className="bg-white px-6 py-12 md:py-[50px] text-center" style={{ fontFamily: HELV }}>
                <p className="text-[17px] leading-[1.4]">PROBLEM STATEMENT</p>
                <p className="mt-5 text-[28px] md:text-[50px] leading-[1.25] font-bold tracking-[-0.01em]">
                  Lorem ipsum dolor sit amet consectetur.
                  <br />
                  Sed do eiusmod <span style={{ color: accent }}>tempor incididunt</span>.
                </p>
              </div>
            </Container>
          </div>
          <Container className="py-[120px]">
            <H2>Lorem ipsum dolor sit amet</H2>
            <Body className="mt-4 max-w-[700px]">{L2}</Body>
            <ImageBox ratio="1440 / 700" className="mt-[70px]" />
          </Container>
        </section>

        {/* develop */}
        <section className="bg-white py-[120px]">
          <Container>
            <Eyebrow label="DEVELOP" />
            <H2 className="mt-4">Lorem ipsum dolor sit amet</H2>
            <Body className="mt-4 max-w-[700px]">{L1}</Body>
            <ImageBox ratio="1440 / 720" className="mt-[30px]" />
            <div className="mt-[30px] grid grid-cols-1 md:grid-cols-3 gap-10">
              {[0, 1, 2].map((i) => (
                <ImageBox key={i} ratio="4 / 3" />
              ))}
            </div>
          </Container>
        </section>

        {/* deliver */}
        <section className="py-[120px]" style={{ backgroundColor: TINT }}>
          <Container>
            <Eyebrow label="DELIVER" />
            <H2 className="mt-4">Lorem ipsum dolor sit amet</H2>
            <Body className="mt-4 max-w-[700px]">{L2}</Body>
            <ImageBox ratio="1440 / 900" className="mt-[30px]" />
          </Container>
        </section>

        {/* test */}
        <section className="bg-white py-[120px]">
          <Container>
            <Eyebrow label="TEST" />
            <H2 className="mt-4">Lorem ipsum dolor sit amet</H2>
            <Body className="mt-4 max-w-[700px]">{L1}</Body>
            <div className="mt-[30px] grid grid-cols-1 sm:grid-cols-3 gap-8">
              <Stat accent={accent} />
              <Stat accent={accent} />
              <Stat accent={accent} />
            </div>
            <ImageBox ratio="1440 / 610" className="mt-[40px]" />
            <H2 className="mt-[120px]">Lorem ipsum dolor sit amet</H2>
            <Body className="mt-5 max-w-[700px]">{L3}</Body>
            <TwoCol className="mt-[60px]" left={<ImageBox ratio="4 / 3" />} right={<ImageBox ratio="4 / 3" />} />
          </Container>
        </section>

        {/* reflection */}
        <section className="pt-[120px] pb-[120px]" style={{ background: '#1A1A1A', fontFamily: HELV }}>
          <Container>
            <Eyebrow label="REFLECTION" light />
            <div className="mt-4 flex flex-col md:flex-row gap-12 md:gap-[120px] items-start">
              <div className="flex-1 min-w-0">
                <h2 className="text-[30px] md:text-[37px] leading-[1.1] tracking-[-0.01em] font-bold text-white">Takeaways</h2>
                <div className="mt-[30px] flex flex-col gap-4 text-[17px] md:text-[18px] leading-[29px] text-white/80">
                  <p>{L1}</p>
                  <p>{L2}</p>
                  <p>{L3}</p>
                </div>
              </div>
              <div className="w-full md:w-[460px] shrink-0">
                <ImageBox ratio="4 / 3" dark />
              </div>
            </div>
            <div className="mt-[80px]">
              <p className="pb-4 text-[16px] leading-[20px] font-medium tracking-[0.04em] text-white/50">Next Steps</p>
              {['01', '02'].map((n) => (
                <div key={n} className="flex gap-6 py-3">
                  <span className="w-10 shrink-0 text-[20px] md:text-[22px] leading-[30px] font-medium text-white/45">{n}</span>
                  <p className="text-[20px] md:text-[22px] leading-[30px] font-medium text-white">{L3}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
