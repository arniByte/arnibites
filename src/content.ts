/**
 * Single source of truth for everything editable on the site.
 * Two destinations: ME and DIRECTIONS (recent / art).
 * Swap copy and image paths here — the design never needs touching.
 */

export const identity = {
  name: 'ARNI',
  wordmark: 'arni',
  role: 'Designer & maker',
  email: 'hello@arni.work',
  available: 'Open for work — 2026',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'Behance', href: '#' },
    { label: 'Are.na', href: '#' },
  ],
};

/** the ME section — a short bio + a pull-quote + portrait */
export const me = {
  lead: "I'll let my agent introduce me — it knows the work better than I'd admit: Arni is a designer and developer who turns the browser into an instrument. He built Weaver, a sound-design studio, and Reflect, an image-effects console — work that's hands-on, monochrome by instinct, and fond of the details most people scroll past.",
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
  /** optional live link — adds a "Visit ↗" action in the overlay */
  link?: string;
}

export interface Direction {
  key: 'recent' | 'art';
  label: string;
  caption: string;
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
    ],
  },
  {
    key: 'art',
    label: 'Art',
    caption: 'Personal and commissioned pieces.',
    items: [
      { title: 'Study No. 1', meta: 'Print', note: 'A quiet composition. Placeholder — replace with a real piece.', seed: 63 },
      { title: 'Untitled', meta: 'Drawing', note: 'Line and negative space. Placeholder — replace with a real piece.', seed: 78 },
      { title: 'Field', meta: 'Generative', note: 'Grown from a single seed. Placeholder — replace with a real piece.', seed: 90 },
    ],
  },
];
