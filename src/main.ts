/* fonts — self-hosted, no external requests. One voice: Fraunces. */
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';

/* styles */
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { drawPortraitHalftone } from './modules/artgen';
import { initBackToTop, initMenu } from './modules/chrome';
import { initCursor } from './modules/cursor';
import { initDirections } from './modules/directions';
import { initHalftone } from './modules/halftone';
import { initLenis, initMarquee, prepareHeroIntro } from './modules/motion';
import { runPreloader } from './modules/preloader';
import { renderDirections, renderMe, renderSocials } from './modules/render';
import { initReveals } from './modules/reveal';

// content first, so every system below sees the full page
renderMe();
renderDirections();
renderSocials();

// generative portrait placeholder (no image assets)
const portrait = document.getElementById('portrait') as HTMLCanvasElement | null;
if (portrait) drawPortraitHalftone(portrait);

// systems
const lenis = initLenis();
initCursor();
initMenu(lenis);
initBackToTop(lenis);
initDirections(lenis);

const halftone = document.getElementById('halftone') as HTMLCanvasElement | null;
if (halftone) initHalftone(halftone);

// scroll-in reveals (IntersectionObserver) + marquee
initReveals();
initMarquee();

// choreography: hide hero, preload, then play the entrance
const playHero = prepareHeroIntro();
runPreloader().then(playHero);
