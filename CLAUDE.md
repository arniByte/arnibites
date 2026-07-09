# ARNI — portfolio site (project memory)

Single-page portfolio for **Arni**, a designer/developer who builds browser-native
tools. Kept as "a piece of art": quiet, monochrome, calligraphic.

## Stack & commands
- **Vite + vanilla TypeScript** (no framework), **GSAP** (+ nothing else from it —
  ScrollTrigger was removed on purpose), **Lenis** smooth scroll, self-hosted
  **Fraunces Variable** font (`@fontsource-variable/fraunces`).
- `npm run dev` — dev server · `npm run build` — `tsc --noEmit` + vite build ·
  `npm run preview` — serve `dist/`.
- Single-file build (for the claude.ai artifact preview) uses
  `vite.config.single.ts` → `dist-single/` (gitignored). Post-build we inline the
  favicon, strip non-latin font subsets, and inline `/projects/*.png` + `/me.png`
  as data URIs so the artifact is self-contained.

## Design rules (keep these)
- **Palette is strictly monochrome**: `--ink #0b0b0b`, `--paper #f4f2ed`, warm greys
  (`--ash`, `--ash-d`). The **only** accent is `--lime` (#c6f24a, plus `--lime-deep`
  #8fae1f for readability on paper). Lime is the **interaction colour**: it carries
  state (active filter pill), reward (project colour-bloom, hover underline), and the
  first-visit signal (preloader fill, hero scanline) — always resolving back to neutral,
  so monochrome stays the resting state. Do not add other hues to the chrome. Real
  project screenshots default to a grayscale duotone and bloom to true colour on intent.
- **One type voice**: Fraunces Variable, leaning on its italic + SOFT/WONK axes
  (`--wonk` token). The only exception is **Ephesis**, a calligraphic script used
  for the single contact CTA ("Connect me"), which writes itself in and links to
  Telegram. No other display faces.
- Figure/ground inversion for rhythm: paper hero → ink ME plate → paper Directions.
- Motion is restrained + smooth. Everything must degrade under
  `prefers-reduced-motion` (all reveals become visible; no animation).

## Architecture
- `index.html` — structure. Sections: hero (`#top`), `#me`, `#directions`, `#contact`.
- `src/content.ts` — **single source of truth** for all copy, projects, socials,
  portrait. Edit content here; never touch the design to change content.
- `src/main.ts` — wires everything up.
- `src/modules/`:
  - `halftone.ts` — WebGL living halftone hero (flowing field + cursor ripple/swell),
    kept quiet at centre (wordmark) and edges (corner labels).
  - `cursor.ts` — lime dot + trailing ring (GSAP quickTo); hidden on touch.
  - `magnetic.ts` — `[data-magnetic]` elements lean toward the pointer.
  - `directions.ts` — filter chips, cursor-follow preview, detail overlay. `setMedia()`
    shows a real image over generative-art fallback and hides the canvas when the
    image loads.
  - `reveal.ts` — IntersectionObserver scroll-reveals (`[data-reveal]`). Robust by
    design: content is only hidden once `html.js` is set, so it can never be trapped.
    (We removed GSAP ScrollTrigger because its position math broke on layout shift.)
  - `motion.ts` — Lenis + hero intro (incl. one-time lime scanline) + marquee.
    `chrome.ts` — menu + back-to-top. `magnetic.ts` — `[data-magnetic]` lean-to-cursor.
  - `scroll.ts` — scroll accents: lime tick on the centered section, and the ME
    inversion curtain (drives `--me-p`; a paper cover retracts up as ME centers so the
    paper→ink flip is a designed wipe, not a jump-cut).
  - `artgen.ts` — generative monochrome art (project fallback + portrait fallback).
- `src/styles/` — `base.css` (tokens, cursor, grain, reveals), `layout.css` (nav,
  menu, footer), `components.css` (hero, me, directions, overlay).
- `public/projects/*.png`, `public/me.png` — real images, referenced by path from
  `content.ts` (with generative fallback if a file is missing).

## Adding a project / artwork
Add an item to a group in `directions.ts` inside `content.ts`: `{ title, meta, note,
seed, image, link }`. Drop the asset in `public/projects/` or `public/art/`.
- **Recent** uses `layout: 'list'` (editorial text rows; screenshots shown whole,
  `object-fit: contain`, on an ink backdrop, colour blooming on intent).
- **Art** uses `layout: 'gallery'` — a masonry of image tiles with museum labels,
  shown in full colour and **sorted by colour**. Clicking any tile opens the overlay.

## Current state (2026-07)
- Three real projects live in **Recent**: Weaver (sound-design studio), Reflect
  (image-effects console), Sokotoma (generative playground — uses `extra: []` to
  stack a second screenshot in the overlay). **Art** is a colour-sorted gallery of
  five real pieces (`public/art/*.webp`).
- The detail overlay has `data-lenis-prevent` so it scrolls natively (Lenis would
  otherwise hijack the wheel and the overlay wouldn't scroll).
- Name shortened to **ARNI** / wordmark `arni`. Sections: **Recent** + **Art** only.
- Deploy: GitHub Actions → Pages (`.github/workflows/deploy-pages.yml`), triggers on
  this branch + `main`. Vercel import also works.

## Next steps / TODO
- Replace the **bio** (`me.lead`) and **Art** placeholders with real content when Arni sends them.
- Portrait is currently a placeholder line-art image; swap for a real photo if desired.
- Confirm the real contact email (currently `hello@arni.work`).
