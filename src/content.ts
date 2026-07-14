/**
 * Single source of truth for everything editable on the site.
 * Two destinations: ME and DIRECTIONS (recent / art).
 * Swap copy and image paths here — the design never needs touching.
 */

export const identity = {
  name: 'ARNI',
  wordmark: 'arni',
  role: 'Designer & maker',
  available: 'Open for work — 2026',
  telegram: 'https://t.me/fucketh',
  socials: [
    { label: 'Telegram', href: 'https://t.me/fucketh' },
    { label: 'Instagram', href: 'https://www.instagram.com/arniatplay?igsh=MTM3eDBscGNoaXJocA==' },
  ],
};

/** the ME section — a short bio + a pull-quote + portrait */
export const me = {
  lead: "In my agent's words — Arni is a web wonderer who builds and crafts playful, interactive web experiences, purely for the fun of it and for the people who use them.",
  quote: 'Everything unnecessary, removed.',
  portrait: '/me.webp',
  facts: [
    { k: 'Based in', v: 'Somewhere' },
    { k: 'Working since', v: '20—' },
    { k: 'Focus', v: 'Design · Art · Craft' },
    { k: 'Reply within', v: 'A day' },
  ],
};

export interface DirectionItem {
  title: string;
  meta: string;
  note: string;
  seed: number;
  /** real screenshot in /public/projects; falls back to generative art */
  image?: string;
  /** extra screenshots shown stacked in the overlay (scroll to see) */
  extra?: string[];
  /** optional live link — adds a "Visit ↗" action in the overlay */
  link?: string;
  /** width/height of `image` — reserves space so the layout never shifts */
  ratio?: number;
  /** minigame id — the item opens the game overlay instead of the item one */
  game?: 'register' | 'ream' | 'ligature';
}

export interface Direction {
  key: 'recent' | 'art' | 'play';
  label: string;
  caption: string;
  /** 'list' = editorial text rows (default); 'gallery' = image grid; 'play' = game tiles */
  layout?: 'list' | 'gallery' | 'play';
  items: DirectionItem[];
}

export const directions: Direction[] = [
  {
    key: 'recent',
    label: 'Recent',
    caption: 'The latest things, freshly made.',
    items: [
      {
        title: 'Weaver',
        meta: 'Web · Audio tool · 2026',
        note: 'A browser-based sound-design studio — sequence beats, design and mix your own sounds, and let it auto-mix between tracks. No installs; it all runs in the browser.',
        seed: 21,
        image: '/projects/weaver.webp',
        link: 'https://weaver-vert.vercel.app/',
      },
      {
        title: 'Reflect',
        meta: 'Web · Image tool · 2026',
        note: 'A browser-based image-effects console — run any photo through dithering, halftone, ASCII, glitch and more to make something striking, then export. Real-time, 100% in the browser.',
        seed: 55,
        image: '/projects/reflect.webp',
        link: 'https://reflect-gamma-one.vercel.app/',
      },
      {
        title: 'Sokotoma',
        meta: 'Web · Generative · 2026',
        note: 'A browser playground of small instruments — turn any word into a deterministic signal, watch sound become light, test your reflexes. A life, rendered as data.',
        seed: 33,
        image: '/projects/sokotoma-cipher.webp',
        extra: ['/projects/sokotoma-signal.webp'],
        link: 'https://sokotoma.vercel.app/',
      },
    ],
  },
  {
    key: 'art',
    label: 'Art',
    caption: 'Personal pieces — arranged by colour.',
    layout: 'gallery',
    items: [
      { title: 'Revenant', meta: 'Digital · 2024', note: 'A figure dissolving into grain and light. Placeholder note — edit in content.ts.', seed: 101, image: '/art/revenant.webp', ratio: 1 },
      { title: 'Effigy', meta: 'Painting · 2023', note: 'A totem of blues and ash against a bare wall. Placeholder note — edit in content.ts.', seed: 102, image: '/art/effigy.webp', ratio: 0.56 },
      { title: 'Ascension', meta: 'Digital · 2024', note: 'A body turning toward the light. Placeholder note — edit in content.ts.', seed: 103, image: '/art/ascension.webp', ratio: 1 },
      { title: 'Threshold', meta: 'Digital · 2025', note: 'Chrome, touch, and the moment before waking. Placeholder note — edit in content.ts.', seed: 104, image: '/art/threshold.webp', ratio: 1 },
      { title: 'Thornbloom', meta: '3D · 2025', note: 'A chrome rose grown on a spine of thorns. Placeholder note — edit in content.ts.', seed: 105, image: '/art/thornbloom.webp', ratio: 0.8 },
    ],
  },
  {
    key: 'play',
    label: 'Play',
    caption: 'Small games, set in ink. A minute each.',
    layout: 'play',
    items: [
      { title: 'Register', meta: 'One tap · Timing', note: 'Tap when the dot meets the mark.', seed: 201, game: 'register' },
      { title: 'Ream', meta: 'One tap · Stacking', note: 'Tap to lay each sheet flush.', seed: 202, game: 'ream' },
      { title: 'Ligature', meta: 'Draw · Sixty seconds', note: 'Draw one line through the drops before they dry.', seed: 203, game: 'ligature' },
    ],
  },
];
