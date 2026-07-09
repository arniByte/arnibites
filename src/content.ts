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
  portrait: '/me.png',
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
}

export interface Direction {
  key: 'recent' | 'art';
  label: string;
  caption: string;
  /** 'list' = editorial text rows (default); 'gallery' = image grid */
  layout?: 'list' | 'gallery';
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
        image: '/projects/weaver.png',
        link: 'https://weaver-vert.vercel.app/',
      },
      {
        title: 'Reflect',
        meta: 'Web · Image tool · 2026',
        note: 'A browser-based image-effects console — run any photo through dithering, halftone, ASCII, glitch and more to make something striking, then export. Real-time, 100% in the browser.',
        seed: 55,
        image: '/projects/reflect.png',
        link: 'https://reflect-gamma-one.vercel.app/',
      },
      {
        title: 'Sokotoma',
        meta: 'Web · Generative · 2026',
        note: 'A browser playground of small instruments — turn any word into a deterministic signal, watch sound become light, test your reflexes. A life, rendered as data.',
        seed: 33,
        image: '/projects/sokotoma-cipher.png',
        extra: ['/projects/sokotoma-signal.png'],
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
      { title: 'Revenant', meta: 'Digital · 2024', note: 'A figure dissolving into grain and light. Placeholder note — edit in content.ts.', seed: 101, image: '/art/revenant.webp' },
      { title: 'Effigy', meta: 'Painting · 2023', note: 'A totem of blues and ash against a bare wall. Placeholder note — edit in content.ts.', seed: 102, image: '/art/effigy.webp' },
      { title: 'Ascension', meta: 'Digital · 2024', note: 'A body turning toward the light. Placeholder note — edit in content.ts.', seed: 103, image: '/art/ascension.webp' },
      { title: 'Threshold', meta: 'Digital · 2025', note: 'Chrome, touch, and the moment before waking. Placeholder note — edit in content.ts.', seed: 104, image: '/art/threshold.webp' },
      { title: 'Thornbloom', meta: '3D · 2025', note: 'A chrome rose grown on a spine of thorns. Placeholder note — edit in content.ts.', seed: 105, image: '/art/thornbloom.webp' },
    ],
  },
];
