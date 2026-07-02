/**
 * Single source of truth for everything editable on the site.
 * Swap placeholders here — the design never needs to be touched.
 */

export interface Work {
  index: string;
  title: string;
  category: string;
  year: string;
  role: string;
  stack: string;
  description: string;
  /** seed for the generative preview artwork */
  seed: number;
}

export const identity = {
  name: 'ARNIBYTE',
  role: 'DIGITAL DESIGNER — CREATIVE DEVELOPER',
  email: 'hello@arnibyte.work',
  location: 'PLANET EARTH',
};

export const works: Work[] = [
  {
    index: '001',
    title: 'SIGNAL / MAP',
    category: 'INTERACTIVE INSTALLATION',
    year: '2026',
    role: 'ART DIRECTION, CREATIVE CODE',
    stack: 'WEBGL — GLSL — TOUCHDESIGNER',
    description:
      'A room-scale data field that converts visitor movement into shifting monochrome topographies. Placeholder case study — real documentation will replace this text.',
    seed: 11,
  },
  {
    index: '002',
    title: 'NULL OBJECT',
    category: 'IDENTITY / MOTION',
    year: '2025',
    role: 'BRAND SYSTEM, MOTION DESIGN',
    stack: 'FIGMA — AFTER EFFECTS — LOTTIE',
    description:
      'An anti-logo identity built from negative space and strict grids. Placeholder case study — real documentation will replace this text.',
    seed: 27,
  },
  {
    index: '003',
    title: 'SOFT MACHINE',
    category: 'WEB EXPERIENCE',
    year: '2025',
    role: 'DESIGN, FRONT-END DEVELOPMENT',
    stack: 'TYPESCRIPT — GSAP — SHADERS',
    description:
      'A long-scroll narrative site where typography deforms under a simulated magnetic field. Placeholder case study — real documentation will replace this text.',
    seed: 43,
  },
  {
    index: '004',
    title: 'DATA GARDEN',
    category: 'GENERATIVE ART',
    year: '2024',
    role: 'CONCEPT, GENERATIVE SYSTEMS',
    stack: 'CANVAS — P5 — CUSTOM PRNG',
    description:
      'Ten thousand unique halftone organisms grown from a single seed function. Placeholder case study — real documentation will replace this text.',
    seed: 58,
  },
  {
    index: '005',
    title: 'WHITE NOISE',
    category: 'SOUND / VISUAL',
    year: '2024',
    role: 'AUDIOVISUAL DIRECTION',
    stack: 'MAX/MSP — GLSL — DMX',
    description:
      'A stroboscopic study of silence rendered as pure black-and-white frequency bars. Placeholder case study — real documentation will replace this text.',
    seed: 74,
  },
  {
    index: '006',
    title: 'MONOLITH',
    category: 'E-COMMERCE / DEV',
    year: '2023',
    role: 'FULL-STACK DEVELOPMENT',
    stack: 'NEXT.JS — HEADLESS CMS — STRIPE',
    description:
      'A single-product store reduced to one page, one button, one decision. Placeholder case study — real documentation will replace this text.',
    seed: 90,
  },
];

export const capabilities: { num: string; name: string; detail: string }[] = [
  { num: '01', name: 'ART DIRECTION', detail: 'CONCEPT / SYSTEMS / TASTE' },
  { num: '02', name: 'INTERACTION DESIGN', detail: 'UX / UI / PROTOTYPING' },
  { num: '03', name: 'CREATIVE DEVELOPMENT', detail: 'TS / WEBGL / GSAP' },
  { num: '04', name: 'MOTION & 3D', detail: 'ANIMATION / BLENDER / AE' },
  { num: '05', name: 'BRAND SYSTEMS', detail: 'IDENTITY / TYPE / GRIDS' },
  { num: '06', name: 'GENERATIVE ART', detail: 'SHADERS / PRNG / PLOTTERS' },
];
