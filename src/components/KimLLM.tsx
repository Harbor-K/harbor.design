import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon, BrainIcon, BriefcaseIcon, CompassIcon, SparklesIcon, XIcon } from 'lucide-react';
import { DotMatrix } from './DotMatrix';
import { BOOK_CALL_URL, EMAIL } from '../data/content';
import { WHATSAPP_URL } from '../data/links';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Kim LLM — "ask me anything" box in the About me section (after poulo.site's Ask me anything).
 *
 * Honest scope: there is no model or server behind it yet. Each question is matched by keywords
 * (English and Korean) to a short answer written only from what is already on this site,
 * then typed out. The footnote says so. Swap `answer()` for an API call when a backend exists.
 *
 * Header: a brain icon next to the KIM LLM dot-type name (replaced the blinking dot),
 * sized so its drawing is as tall as the dot letters (7 rows x 3.9px).
 *
 * Interaction (after poulo.site): the icon chips under the input — Your work, How you design, Fun fact —
 * fill the input with a question instead of sending it. The send button turns black once there is text.
 * On send, a yellow light runs around the input card and the send button spins while Kim LLM "thinks",
 * then the answer is typed out. Footnote: Book a call or WhatsApp for anything else.
 */

const AVATAR = '/assets/objects/face-color.webp';

type Msg = { role: 'you' | 'kim'; text: string };

interface Intent {
  keys: RegExp;
  en: string;
  ko: string;
}

// Every fact below is already stated elsewhere on the site. Order matters: the first match wins.
const INTENTS: Intent[] = [
  {
    keys: /fun fact|tmi|random fact|caffeine|coffee|milk tea|food|drink|eat|snack|favou?rite|재밌|재미있|커피|카페인|밀크티|음식|먹|음료|좋아하/i,
    en: 'Fun fact: my go-to caffeine is milk tea. It is hiding in the circles at the top of this page — hover the biggest one.',
    ko: 'TMI 하나: 제 최애 카페인은 밀크티예요. 페이지 맨 위 동그라미들 사이에 숨어 있어요. 제일 큰 동그라미에 마우스를 올려 보세요.',
  },
  {
    keys: /work with you|hire|hiring|contact|email|book a call|call you|available|freelance|collab|whatsapp|연락|채용|협업|함께 일|메일|미팅|왓츠앱/i,
    en: `I'd love to hear about it. The quickest way is a 30-minute call (link below or in the footer), or email me at ${EMAIL}.`,
    ko: `언제든 환영이에요. 30분 통화를 예약하시거나(아래 링크나 푸터) ${EMAIL} 로 메일 주세요.`,
  },
  {
    keys: /trust ?bank|트러스트/i,
    en: 'Trust Bank is a rewards UX redesign — a 2-person project covering research, the redesign and usability testing. You can open the full case study from the Projects section.',
    ko: 'Trust Bank는 리워드 UX 리디자인 프로젝트예요. 2인 프로젝트로 리서치, 리디자인, 사용성 테스트까지 진행했고, Projects 섹션에서 케이스 스터디를 볼 수 있어요.',
  },
  {
    keys: /game ?cove|게임/i,
    en: 'GameCove is an AI analytics dashboard — a 2-person project that helps first-time game creators decide what to fix next.',
    ko: 'GameCove는 AI 분석 대시보드예요. 처음 게임을 만드는 사람이 다음에 무엇을 고칠지 정하도록 돕는 2인 프로젝트예요.',
  },
  {
    keys: /career|experience|company|companies|utrada|\beto\b|pinetree|years|background|journey|worked at|경력|회사|이력|경험|일했/i,
    en: '3+ years designing fintech and e-learning products. At UTrada I built a 100+ component design system for a global trading platform (40% faster dev cycles). At ETO Markets I revamped the trading platform with 9-language support (30% more users from Asia and Europe). At Pinetree I redesigned the information architecture and landing pages.',
    ko: '핀테크와 이러닝 프로덕트를 3년 넘게 디자인했어요. UTrada에서는 글로벌 트레이딩 플랫폼의 100개 이상 컴포넌트 디자인 시스템을 만들었고(개발 사이클 40% 단축), ETO Markets에서는 9개 언어를 지원하도록 플랫폼을 개편했어요(아시아·유럽 사용자 30% 증가). Pinetree에서는 정보 구조와 랜딩 페이지를 리디자인했어요.',
  },
  {
    keys: /your work|project|case|portfolio|worked on|프로젝트|작업|포트폴리오|케이스/i,
    en: 'Two case studies are up so far: Trust Bank (rewards UX redesign, with research and usability testing) and GameCove (an AI analytics dashboard for first-time game creators). Ask me about either one.',
    ko: '지금은 케이스 스터디 두 개가 있어요. Trust Bank(리워드 UX 리디자인, 리서치와 사용성 테스트 포함)와 GameCove(처음 게임을 만드는 사람을 위한 AI 분석 대시보드)예요.',
  },
  {
    keys: /tool|figma|midjourney|spline|rive|kling|flux|magic patterns|툴|도구|피그마/i,
    en: 'Figma and Figma Make day to day, plus Magic Patterns, Spline, Rive, and AI tools like Midjourney, Flux and Kling for fast prototypes and visuals.',
    ko: '평소에는 Figma와 Figma Make를 쓰고, Magic Patterns, Spline, Rive, 그리고 Midjourney·Flux·Kling 같은 AI 도구로 빠르게 프로토타입과 비주얼을 만들어요.',
  },
  {
    keys: /language|locali|multilingual|translat|언어|다국어|번역/i,
    en: 'I design multilingual UI — up to 11 languages. At ETO Markets that meant taking the trading platform to 9 languages.',
    ko: '다국어 UI를 디자인해요. 최대 11개 언어까지 다뤘고, ETO Markets에서는 트레이딩 플랫폼을 9개 언어로 확장했어요.',
  },
  {
    keys: /how (do )?you design|design process|your process|approach|skill|good at|strength|research|usability|design system|prototyp|dashboard|what (do|can) you do|디자인 (방식|과정)|스킬|잘하|강점|리서치|디자인 시스템|뭐 해/i,
    en: 'Three things, mostly: research that turns raw data into clear decisions (interviews, usability tests, synthesis); product UI and design systems for fintech and trading; and data dashboards and AI-assisted prototypes, made fast.',
    ko: '크게 세 가지예요. 인터뷰·사용성 테스트·분석으로 데이터를 명확한 결정으로 바꾸는 리서치, 핀테크·트레이딩 프로덕트 UI와 디자인 시스템, 그리고 데이터 대시보드와 AI로 빠르게 만드는 프로토타입이에요.',
  },
  {
    keys: /where|based|live|location|korea|australia|\buk\b|geoje|어디|사는|살아|거주|호주|영국/i,
    en: "I'm based in Geoje, South Korea, and I've lived and worked in Korea, Australia and the UK.",
    ko: '지금은 거제에 있고, 한국·호주·영국에서 살며 일해왔어요.',
  },
  {
    keys: /who|about|yourself|introduce|hello|\bhi\b|\bhey\b|누구|소개|안녕/i,
    en: "Hi, I'm Harbor (Jihyun Kim), a UI/UX & product designer. I observe objectively to design clearly — 3+ years on fintech and e-learning products: trading platforms, digital banking, crypto wallets and data dashboards.",
    ko: '안녕하세요, UI/UX·프로덕트 디자이너 Harbor(김지현)예요. 객관적으로 관찰해서 명확하게 디자인해요. 트레이딩 플랫폼, 디지털 뱅킹, 크립토 지갑, 데이터 대시보드 등 핀테크·이러닝 프로덕트를 3년 넘게 만들었어요.',
  },
];

const FALLBACK = {
  en: "I can only answer from what's on this site so far — try asking about my work, my career, my skills and tools, or how to work with me.",
  ko: '아직은 이 사이트에 있는 내용으로만 답할 수 있어요. 작업, 경력, 스킬·툴, 함께 일하는 방법을 물어봐 주세요.',
};

function answer(q: string): string {
  const korean = /[가-힣]/.test(q);
  const hit = INTENTS.find((it) => it.keys.test(q));
  if (!hit) return korean ? FALLBACK.ko : FALLBACK.en;
  return korean ? hit.ko : hit.en;
}

// chips fill the input with a question (they don't send it)
const CHIPS = [
  { icon: BriefcaseIcon, label: 'Your work', ask: 'What have you worked on?' },
  { icon: CompassIcon, label: 'How you design', ask: 'How do you design?' },
  { icon: SparklesIcon, label: 'Fun fact', ask: 'Tell me a fun fact about you.' },
];

const THINK_MS = 1100; // how long the light runs before the answer starts typing

export function KimLLM() {
  const reducedMotion = usePrefersReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState<string | null>(null); // the answer being typed out
  const [shown, setShown] = useState(0);
  const [draft, setDraft] = useState('');
  const [tip, setTip] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = typing !== null || thinking;

  // type the answer out a few characters at a time
  useEffect(() => {
    if (typing === null) return;
    if (reducedMotion || shown >= typing.length) {
      setMsgs((m) => [...m, { role: 'kim', text: typing }]);
      setTyping(null);
      setShown(0);
      return;
    }
    const t = setTimeout(() => setShown((s) => Math.min(typing.length, s + 3)), 16);
    return () => clearTimeout(t);
  }, [typing, shown, reducedMotion]);

  // keep the newest line in view inside the chat box (never scrolls the page)
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, shown]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, { role: 'you', text }]);
      setDraft('');
      setShown(0);
      setTyping(answer(text));
    }, reducedMotion ? 0 : THINK_MS);
  };

  // chip -> put its question in the input, ready to send
  const fill = (q: string) => {
    if (busy) return;
    setDraft(q);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const clear = () => {
    setMsgs([]);
    setTyping(null);
    setThinking(false);
    setShown(0);
    setDraft('');
  };

  const empty = msgs.length === 0 && typing === null;

  return (
    <div className="relative flex flex-col rounded-[28px] border border-[rgba(10,10,10,0.1)] bg-white p-6 md:p-8">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-inter-tight display-tight text-[30px] md:text-[40px] leading-tight">Ask me anything...</h3>
        <div className="flex items-center gap-2.5 pt-2 shrink-0" aria-label="Kim LLM">
          <BrainIcon className="w-[31px] h-[31px] shrink-0 text-[#3B5BD9]" strokeWidth={1.8} aria-hidden="true" />
          <DotMatrix text="KIM LLM" dotPx={3} pitchPx={3.9} color="#1C2541" mode="static" alive={false} />
        </div>
      </div>

      {/* conversation (or a one-line prompt while empty) */}
      <div ref={listRef} className="overflow-y-auto no-scrollbar mt-5 mb-5 space-y-4 min-h-[150px] max-h-[300px]" aria-live="polite">
        {empty && <p className="text-[18px] text-[#6B6B6B] leading-relaxed">Ask about my work, career, skills or how to work with me.</p>}
        {msgs.map((m, i) =>
          m.role === 'you' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-br-md bg-[#0A0A0A] text-white px-4 py-2.5 text-[17px] leading-relaxed">{m.text}</p>
            </div>
          ) : (
            <KimLine key={i} text={m.text} />
          )
        )}
        {typing !== null && <KimLine text={typing.slice(0, shown)} cursor />}
      </div>

      {/* input card. Behind it, a yellow light: soft and still at rest, running around the card while Kim LLM thinks */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute -inset-[3px] rounded-[18px] overflow-hidden pointer-events-none transition-opacity duration-300"
          style={{ opacity: thinking ? 1 : 0.35, filter: 'blur(8px)' }}
        >
          <div
            className={`absolute left-1/2 top-1/2 w-[160%] aspect-square -translate-x-1/2 -translate-y-1/2 ${thinking && !reducedMotion ? 'kim-llm-spin' : ''}`}
            style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,230,0,0.95) 60deg, rgba(255,240,120,0.6) 110deg, transparent 170deg, transparent 360deg)' }}
          />
        </div>

        <form
          className="relative rounded-2xl border border-[rgba(10,10,10,0.1)] bg-white shadow-[0_6px_24px_rgba(10,10,10,0.06)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <label htmlFor="kim-llm-input" className="sr-only">
            Ask Kim LLM
          </label>
          <input
            id="kim-llm-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about my work or experience..."
            autoComplete="off"
            className="w-full bg-transparent px-2 pt-1 pb-3 text-[18px] text-[#0A0A0A] placeholder:text-[#9A9A9A] outline-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-full bg-[#F2F2F2] p-1">
              <ChipButton label="Clear" onClick={clear} tip={tip} setTip={setTip}>
                <XIcon className="w-[18px] h-[18px]" aria-hidden="true" />
              </ChipButton>
              {CHIPS.map(({ icon: Icon, label, ask: q }) => (
                <ChipButton key={label} label={label} onClick={() => fill(q)} tip={tip} setTip={setTip} disabled={busy}>
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </ChipButton>
              ))}
            </div>
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              aria-label={busy ? 'Thinking' : 'Send'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150 ${
                busy
                  ? 'bg-white'
                  : draft.trim()
                  ? 'bg-[#0A0A0A] text-white hover:bg-[#2B2B2B]'
                  : 'border border-[rgba(10,10,10,0.15)] bg-white text-[#0A0A0A] opacity-40'
              }`}
            >
              {busy ? (
                <span className="block w-6 h-6 rounded-full border-2 border-[#E5E5E5] border-t-[#0A0A0A] animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUpIcon className="w-[18px] h-[18px]" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 text-center text-[16px] text-[#8B8B8B]">
        Kim LLM answers only from what is on this site.{' '}
        <a href={BOOK_CALL_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#3B5BD9]">
          Book a call
        </a>{' '}
        or{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#3B5BD9]">
          WhatsApp
        </a>{' '}
        for anything else.
      </p>
    </div>
  );
}

function KimLine({ text, cursor = false }: { text: string; cursor?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <img src={AVATAR} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      <p className="max-w-[85%] text-[17px] leading-relaxed text-[#0A0A0A] pt-1">
        {text}
        {cursor && <span className="inline-block w-[8px] h-[17px] ml-0.5 align-[-3px] bg-[#3B5BD9] animate-pulse" />}
      </p>
    </div>
  );
}

function ChipButton({
  label,
  onClick,
  children,
  tip,
  setTip,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tip: string | null;
  setTip: (v: string | null) => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        onMouseEnter={() => setTip(label)}
        onMouseLeave={() => setTip(null)}
        onFocus={() => setTip(label)}
        onBlur={() => setTip(null)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-white disabled:opacity-40 ${
          active ? 'bg-white text-[#008069]' : 'text-[#3A3A3C]'
        }`}
      >
        {children}
      </button>
      <AnimatePresence>
        {tip === label && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-[#0A0A0A] text-white text-[16px] px-2.5 py-1 pointer-events-none"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
