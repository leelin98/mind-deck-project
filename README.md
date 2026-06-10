# MIND·DECK — 腦補計畫 MVP

A gamified tech-literacy SPA built with **Astro + Vue 3 + GSAP + Tailwind CSS v4**.

## Tech Stack
- **Astro** — static site framework / file-based routing
- **Vue 3** — all reactive state and UI interactions (Composition API)
- **GSAP** — battle formula reveal animations + points bounce
- **Tailwind CSS v4** — utility classes via Vite plugin

## Project Structure
```
src/
  components/
    MindDeck.vue        — root app shell (nav, tabs, all screens)
    BattleFormula.vue   — GSAP-animated combat reveal
    AssetCard.vue       — full card in Arsenal grid
    MiniCard.vue        — compact card for slot selection
  composables/
    useGameStore.js     — singleton reactive game state + all actions
  data/
    cards.js            — card definitions + synthesis recipes
    combat.js           — news card + formula constants
    quizzes.js          — quiz definitions
  pages/
    index.astro         — entry point
  styles/
    global.css          — design tokens + all CSS
public/
  images/cards/         — drop PNG illustrations here (see README inside)
```

## Getting Started
```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # output → dist/
npm run preview   # preview built output
```

## Adding Card Images
Place transparent PNG files in `public/images/cards/` matching the filenames in
`public/images/cards/README.md`. The app shows SVG glyph fallbacks if images are absent.

## Game Flow
1. **Every Day Combat** — Read today's news card, pick 3 asset cards blind, start combat
2. **Battle Formula** — GSAP animates each formula step; matched tags trigger ×2.5 multiplier
3. **Win** → points rewarded; **Fail** → get antidote keyword from info station
4. **Arsenal** — view all cards; use synthesis to merge 3× standard wafers → epic wafer
5. **Encyclopedia** — view tech dictionary; click locked items to attempt quiz and unlock cards

## Player Defaults
- User ID: `#066`
- Starting Points: `100`
