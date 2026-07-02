import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths — works on Vercel, GitHub Pages subpaths, anywhere
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
