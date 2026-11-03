export const ASSETS = {
  workshopPhoto: '/assets/main-v2/photo.jpg',
  avatar: '/assets/main-v2/avatar.png',
  portraitBw: '/assets/portrait/harbor-portrait-bw.webp',
  trustBank: '/assets/main-v2/trust-bank.webp',
  gamecove: '/assets/main-v2/gamecove.webp',
  utrada: '/assets/main-v2/utrada.webp',
  etoMarkets: '/assets/main-v2/eto-markets.webp',
  pinetree: '/assets/main-v2/pinetree.webp',
  // Smiling booth photo (Harbor at the laptop) with the animated glass UI cards behind her (8s silent loop).
  // 2:1 canvas: the photo's full height (room above her head for the nav, laptop on the bottom edge)
  // with slightly mirrored sides, so screens up to 2:1 never crop top/bottom — narrower screens only lose the sides.
  // Hosted on the add-glass-desk-video branch until merged to main.
  // Earlier versions on that branch: booth-wide-glass-silent.mp4, booth-photo-glass-silent.mp4, sofa-photo-glass-silent.mp4, desk-typing-glass-v3-silent.mp4
  video: '/assets/smile-wide-glass-silent.mp4',
  videoPoster: '/assets/smile-wide-glass-silent-poster.jpg',
};

export const BUBBLE_PHOTOS = [ASSETS.workshopPhoto, ASSETS.avatar, ASSETS.portraitBw, ASSETS.trustBank, ASSETS.gamecove, ASSETS.utrada, ASSETS.etoMarkets];

// Hero sphere: round everyday objects as "data" (12 originals + recoloured copies), plus Harbor's own face (one circle).
const OBJ = '/assets/objects/';
export const OBJECT_PHOTOS = [
  'button', 'button-red', 'button-yellow', 'button-cobalt',
  'eightball', 'ball-1', 'ball-2', 'ball-3', 'ball-4',
  'tennis', 'tennis-pink', 'tennis-orange',
  'kiwi', 'kiwi-gold',
  'eye', 'eye-green', 'eye-brown',
  'cd', 'disco', 'dartboard', 'clock', 'earth', 'lens', 'compass',
].map((n) => `${OBJ}${n}.webp`);
export const FACE_PHOTO = `${OBJ}face.webp`;

export const MANIFESTO_PHOTOS = [ASSETS.portraitBw, ASSETS.workshopPhoto, ASSETS.avatar];

// Pixel palette (craft-style): cobalt, yellow, red-orange, navy on white
export const ACCENTS = {
  orange: '#E0492A',
  sky: '#3B5BD9',
  yellow: '#F5C518',
  lilac: '#1C2541',
};

export const INK = '#0A0A0A';
export const MUTE = '#8B8B8B';
export const HAIRLINE = 'rgba(10,10,10,0.12)';

// Nav follows page order. Contact is left out of the nav — it's always at the bottom of the page.
export const NAV_ITEMS: { id: string; label: string; accent: string }[] = [
  { id: 'experience', label: 'Experience', accent: ACCENTS.sky },
  { id: 'work', label: 'Projects', accent: ACCENTS.orange },
  { id: 'about', label: 'About me', accent: ACCENTS.lilac },
];

/** Companies Harbor worked at — shown next to the portrait coin (Experience section). Lines are from her resume. */
export interface Company {
  name: string;
  category: string;
  image?: string;
  highlight: string; // one-line achievement shown under the coin
  years: string; // small grey line above the name
}

export const COMPANIES: Company[] = [
  {
    name: 'UTrada',
    years: '2024-2026',
    category: 'Trading platform',
    image: ASSETS.utrada,
    highlight: 'Built a 100+ component design system for a global trading platform — 40% faster dev cycles.',
  },
  {
    name: 'ETO Markets',
    years: '2022-2023',
    category: 'Trading UI/UX',
    image: ASSETS.etoMarkets,
    highlight: 'Revamped the trading platform with 9-language support — 30% more users from Asia and Europe.',
  },
  {
    name: 'Pinetree',
    years: '2021-2022',
    category: 'E-learning',
    image: ASSETS.pinetree,
    highlight: 'Redesigned the information architecture and landing pages for clearer navigation.',
  },
];

/** Projects / case studies — shown in the footer list. */
export interface Project {
  name: string;
  category: string;
  image: string;
}

export const PROJECTS: Project[] = [
  { name: 'Trust Bank', category: 'Rewards UX redesign', image: ASSETS.trustBank },
  { name: 'GameCove', category: 'AI analytics dashboard', image: ASSETS.gamecove },
];

export interface Skill {
  name: string;
  category: 'Method' | 'Tool';
}

export const SKILLS: Skill[] = [
  { name: 'UX research', category: 'Method' },
  { name: 'Usability testing', category: 'Method' },
  { name: 'Design systems', category: 'Tool' },
  { name: 'Prototyping', category: 'Tool' },
  { name: 'Data dashboards', category: 'Tool' },
  { name: 'Localization (11 languages)', category: 'Method' },
  { name: 'AI design tools', category: 'Tool' },
];

export const TOOLS = ['Figma', 'Figma Make', 'Magic Patterns', 'Spline', 'Rive', 'Midjourney', 'Flux', 'Kling'];
export const DOMAINS = ['Fintech', 'Digital banking', 'Crypto wallets', 'Trading platforms', 'E-learning', 'Data dashboards', 'Design systems', '11 languages'];

export interface ExperienceCard {
  label: string;
  title: string;
  sub?: string;
  location?: string;
  button?: string;
  /** where the button goes; case-study pages use hash routes like '#/trust-bank' */
  href?: string;
}

export interface ExperiencePanel {
  accent: string;
  dates: string;
  company: string; // big dot-text title of the panel (the project name)
  cards: ExperienceCard[];
}

/** Stacked panels in the Projects section — one per project. */
export const EXPERIENCE_PANELS: ExperiencePanel[] = [
  {
    accent: ACCENTS.sky,
    dates: '[YEAR]',
    company: 'TRUST BANK',
    cards: [
      {
        label: '[Case study]',
        title: 'Rewards UX redesign',
        sub: '2-person project: research, redesign and usability testing',
        button: 'View case',
        href: '#/trust-bank',
      },
    ],
  },
  {
    accent: ACCENTS.orange,
    dates: '[YEAR]',
    company: 'GAMECOVE',
    cards: [{ label: '[Case study]', title: 'AI analytics dashboard', sub: '2-person project: helps first-time game creators decide what to fix next', button: 'View case' }],
  },
  {
    accent: ACCENTS.yellow,
    dates: '[YEAR]',
    company: 'PROJECT 3',
    cards: [{ label: '[Case study]', title: '[Project title]', sub: '[One-line description]', button: 'View case' }],
  },
];

// Former "What I do" cards — no longer rendered (the section is now About me + Kim LLM); kept for reference.
export interface WhatIDoCard {
  number: string;
  color: string;
  title: string;
  description: string;
  bullets: string[];
}

export const WHAT_I_DO_CARDS: WhatIDoCard[] = [
  {
    number: '01',
    color: '#1C2541',
    title: 'Research → clear decisions',
    description: 'Interviews, usability tests and synthesis that turn raw data into insight.',
    bullets: ['User interviews & testing', 'Affinity mapping & journey maps'],
  },
  {
    number: '02',
    color: '#3B5BD9',
    title: 'Product UI & design systems',
    description: 'Fintech and trading interfaces built on a consistent system.',
    bullets: ['Design systems in Figma', 'Multilingual UI (up to 11 languages)'],
  },
  {
    number: '03',
    color: '#F5C518',
    title: 'Data & AI prototypes',
    description: 'Dashboards and interactive prototypes, made fast with AI tools.',
    bullets: ['Data dashboards', 'AI-assisted prototyping'],
  },
];

export const BOOK_CALL_URL = 'https://cal.com/harbor-kim-wqsmkt/30min';
export const INSTAGRAM_URL = 'https://instagram.com/harbor_0328';
export const EMAIL = 'harborkim0328@gmail.com';
