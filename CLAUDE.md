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
  favicon, strip non-latin font subsets, and inline `/projects/*.webp` + `/me.webp`
  + `/art/*.webp` as data URIs so the artifact is self-contained. NB: the Play games
  are lazy chunks — the single-file config must inline dynamic imports
  (`inlineDynamicImports`) or the games won't work in the artifact.
- Images are **WebP** (converted from PNG via headless-Chromium canvas — see
  scratchpad `img2webp.mjs` pattern; no sharp dependency). Gallery/project items
  carry a `ratio` field in `content.ts` → inline `aspect-ratio` so masonry doesn't
  jump while images decode (CLS-free).

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
    kept quiet at centre (wordmark) and edges (corner labels). Renders 1:1 with device
    pixels (DPR-capped at 2 on desktop, 3 on <700px — phones are DPR-3 and upscaling
    looks mushy) with anti-aliased, size-jittered dots — do not go back to downscaled
    rendering, it looks chunky. Cell is 9px, 6.5px on <700px. A paper gradient scrim
    (`.hero::before`) keeps the nav legible over the field.
  - `scroll.ts` also runs the gallery parallax: `.art-tile`s drift at column-varied
    speeds on scroll (their reveal is fade-only so the parallax owns transform).
    Desktop-only (≥900px) — in the single-column mobile layout the drift slid tiles
    over their neighbours' labels. It also drives the hero exit (wordmark drifts +
    dissolves as you leave, pairing with the ME curtain).
  - `cursor.ts` — lime dot + trailing ring (GSAP quickTo); hidden on touch.
  - `magnetic.ts` — `[data-magnetic]` elements lean toward the pointer.
  - `directions.ts` — filter chips, cursor-follow preview, detail overlay. `setMedia()`
    shows a real image over generative-art fallback and hides the canvas when the
    image loads.
  - `reveal.ts` — IntersectionObserver scroll-reveals (`[data-reveal]`). Robust by
    design: content is only hidden once `html.js` is set, so it can never be trapped.
    (We removed GSAP ScrollTrigger because its position math broke on layout shift.)
  - `motion.ts` — Lenis + hero intro (incl. one-time lime scanline) + marquee.
    In-page anchors glide (quint in-out, distance-aware duration, `force: true` so
    they work mid menu-close) — never a teleport.
    `chrome.ts` — menu + back-to-top. `magnetic.ts` — `[data-magnetic]` lean-to-cursor.
  - `scroll.ts` — scroll accents: lime tick on the centered section, and the ME
    inversion curtain (drives `--me-p`; a paper cover retracts up as ME centers so the
    paper→ink flip is a designed wipe, not a jump-cut).
  - `artgen.ts` — generative monochrome art (project fallback + portrait fallback).
  - `play/` — the **Play tab** (three canvas minigames, ink/paper/lime only):
    - `kit.ts` — shared plumbing: colours, `Game` interface
      (`mount/pause/resume/restart/destroy`), `setupStage()` (DPR-aware, games think
      in CSS px; NB it fires `onResize` synchronously during setup — guard callbacks
      that touch your local `stage`), `bestStore()` (localStorage in try/catch).
    - `register.ts` / `ream.ts` / `ligature.ts` — the games (orbit timing / sheet
      stacking / calligraphic line-drawing). Each starts in an attract self-demo;
      first tap begins the run.
    - `shell.ts` — game overlay (`#playov`): lazy `import()` of games, wipe-open from
      the clicked tile, HUD (score/best/Again), Esc + focus trap, pause on tab-hide.
      Esc/visibility listeners are bound *before* `mount()` so a failed game can
      never strand the overlay.
    - `launcher.ts` (main bundle) — warms the shell chunk on tile hover, opens on click.
    - `thumbs.ts` (main bundle) — static tile plates that wake to a live rAF preview
      only while hovered/focused (fine pointers, motion allowed).
- `src/styles/` — `base.css` (tokens, cursor, grain, reveals), `layout.css` (nav,
  menu, footer), `components.css` (hero, me, directions, overlay).
- `public/projects/*.webp`, `public/me.webp`, `public/art/*.webp` — real images,
  referenced by path from `content.ts` (with generative fallback if a file is
  missing). `public/og.jpg` — 1200×630 share card (hero screenshot).

## Adding a project / artwork / game
Add an item to a group in `directions.ts` inside `content.ts`: `{ title, meta, note,
seed, image, ratio, link }`. Drop the asset in `public/projects/` or `public/art/`.
- **Recent** uses `layout: 'list'` (editorial text rows; screenshots shown whole,
  `object-fit: contain`, on an ink backdrop, colour blooming on intent).
- **Art** uses `layout: 'gallery'` — a masonry of image tiles with museum labels,
  shown in full colour and **sorted by colour**. Clicking any tile opens the overlay.
- **Play** uses `layout: 'play'` — square tiles with live canvas previews; the item's
  `game` field ('register' | 'ream' | 'ligature') routes the click to the game shell
  instead of the item overlay. A new game needs: module in `src/modules/play/`
  exporting `{ meta, create }`, a loader entry in `shell.ts` `LOADERS`, a thumb
  drawer in `thumbs.ts`, and the content item.

## Current state (2026-07)
- Three real projects live in **Recent**: Weaver (sound-design studio), Reflect
  (image-effects console), Sokotoma (generative playground — uses `extra: []` to
  stack a second screenshot in the overlay). **Art** is a colour-sorted gallery of
  five real pieces (`public/art/*.webp`). **Play** holds the three minigames.
- The detail overlay has `data-lenis-prevent` so it scrolls natively (Lenis would
  otherwise hijack the wheel and the overlay wouldn't scroll). It also has Prev/Next
  + ArrowLeft/ArrowRight; game tiles are excluded from its cycle.
- Name shortened to **ARNI** / wordmark `arni`; hero letters lean (SOFT axis + tilt)
  on hover. Sections: **Recent** + **Art** + **Play**.
- Site-wide accents: 2px lime scroll-progress line (top edge, `scroll.ts`), ME facts
  scramble-settle on first view, hint line under the Directions filters, footer nav
  (Me / Directions / Play — the Play link also activates the play filter chip).
- Deploy: GitHub Actions → Pages (`.github/workflows/deploy-pages.yml`), triggers on
  this branch + `main`. Vercel import also works.

## Contact & socials
Only two destinations, by request: **Telegram** (t.me/fucketh — also the target of the
calligraphic "Connect with me" CTA) and **Instagram** (@arniatplay). No email anywhere.

## Next steps / TODO
- Replace the **bio** (`me.lead`) and **Art** placeholders with real content when Arni sends them.
- Portrait is currently a placeholder line-art image; swap for a real photo if desired.
