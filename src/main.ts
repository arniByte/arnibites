/* fonts — self-hosted, no external requests */
import '@fontsource/anton';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

/* styles */
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { identity } from './content';
import { drawBarcode, drawPortraitHalftone } from './modules/artgen';
import { initCursor } from './modules/cursor';
import { initDither } from './modules/dither';
import {
  fillTicker,
  initBackToTop,
  initClock,
  initGridToggle,
  initMenu,
} from './modules/hud';
import { initLenis, initScrollFX, prepareHeroIntro } from './modules/motion';
import { runPreloader } from './modules/preloader';
import { renderCapsGrid, renderWorksList } from './modules/render';
import { initGlitchTicks, initScrambleHovers } from './modules/scramble';
import { initWorks } from './modules/works';

// content into the DOM first, so every system below sees the full page
renderWorksList();
renderCapsGrid();
fillTicker();

// generative artwork (zero image assets)
const portrait = document.getElementById('portrait') as HTMLCanvasElement | null;
if (portrait) drawPortraitHalftone(portrait);
const barcode = document.getElementById('barcode') as HTMLCanvasElement | null;
if (barcode) {
  drawBarcode(barcode, identity.name);
  let barcodeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(barcodeTimer);
    barcodeTimer = window.setTimeout(() => drawBarcode(barcode, identity.name), 200);
  });
}

// systems
const lenis = initLenis();
initCursor();
initClock();
initGridToggle();
initMenu(lenis);
initBackToTop(lenis);
initScrambleHovers();
initGlitchTicks();
initWorks(lenis);

const dither = document.getElementById('dither') as HTMLCanvasElement | null;
if (dither) initDither(dither);

// choreography: hide hero now, boot, then play the entrance
const playHero = prepareHeroIntro();
initScrollFX();
runPreloader().then(playHero);
