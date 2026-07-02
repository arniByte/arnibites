import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Single-file build: everything (JS, CSS, fonts) inlined into one HTML.
 * Used for URL-based deployment imports; the regular build stays in
 * vite.config.ts.
 */
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
  },
});
