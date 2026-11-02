# harbor.design

Portfolio site of Harbor (Jihyun) Kim — UI/UX & Product Designer.

Exported from the Magic Patterns design "Harbor Kim Portfolio" (React + Tailwind + framer-motion), set up as a Vite project.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Structure

- `src/` — app code (`App.tsx`, `components/`, `hooks/`, `data/`, `utils/`)
  - `components/case/` — case-study pages (Trust Bank, GameCove/UTrada placeholders) and their nav
- `public/assets/` — all images and videos the site uses (served from `/assets/...`)
  - `objects/` hero sphere photos · `main-v2/` home page images and videos · `trust-bank/` case-study images and motion · `portrait/`

## Placeholders to fill in

- `src/data/links.ts` — CV link, WhatsApp link
- LinkedIn URL in `src/components/sections/WhatIDo.tsx` and `src/components/sections/Contact.tsx`
- `[YEAR]` values in `src/components/sections/Experience.tsx`
