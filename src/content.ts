/**
 * Single source of truth for everything editable on the site.
 * Two destinations: ME and DIRECTIONS (tools / art / recent).
 * All copy below is intentional placeholder — swap it here, the
 * design never needs to be touched.
 */

export const identity = {
  name: 'ARNIBYTE',
  wordmark: 'arnibyte',
  role: 'Designer & maker',
  email: 'hello@arnibyte.work',
  available: 'Open for work — 2026',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'Behance', href: '#' },
    { label: 'Are.na', href: '#' },
  ],
};

/** the ME section — a short bio + a pull-quote, all placeholder */
export const me = {
  lead: 'A short paragraph about you goes here — who you are, what you make, and how you think about the work. Two or three sentences, no more. Replace this when you send me your bio.',
  quote: 'Everything unnecessary, removed.',
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
}

export interface Direction {
  key: 'tools' | 'art' | 'recent';
  label: string;
  caption: string;
  items: DirectionItem[];
}

export const directions: Direction[] = [
  {
    key: 'tools',
    label: 'Tools',
    caption: 'The instruments and systems I build with.',
    items: [
      { title: 'The Grid', meta: 'System', note: 'A layout language I return to. Placeholder — replace with a real tool.', seed: 12 },
      { title: 'Type Set', meta: 'Method', note: 'How I pair and scale faces. Placeholder — replace with a real tool.', seed: 31 },
      { title: 'Ink & Paper', meta: 'Material', note: 'Working strictly in monochrome. Placeholder — replace with a real tool.', seed: 47 },
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
  {
    key: 'recent',
    label: 'Recent',
    caption: 'The latest things, freshly made.',
    items: [
      { title: 'Latest Work', meta: '2026', note: 'The newest thing. Placeholder — replace with real recent work.', seed: 21 },
      { title: 'In Progress', meta: '2026', note: 'Still on the table. Placeholder — replace with real recent work.', seed: 55 },
    ],
  },
];
