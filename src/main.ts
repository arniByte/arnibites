/* fonts — self-hosted, no external requests. Fraunces is the voice;
   Ephesis is a single calligraphic accent, used only for the contact CTA. */
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource/ephesis/400.css';

/* styles */
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { me } from './content';
import { drawPortraitHalftone } from './modules/artgen';
import { initBackToTop, initMenu } from './modules/chrome';
import { initCursor } from './modules/cursor';
import { initDirections } from './modules/directions';
import { initHalftone } from './modules/halftone';
import { initMagnetic } from './modules/magnetic';
import { initLenis, initMarquee, prepareHeroIntro } from './modules/motion';
import { runPreloader } from './modules/preloader';
import { renderDirections, renderMe, renderSocials } from './modules/render';
import { initReveals } from './modules/reveal';
import { initScrollAccents } from './modules/scroll';

// content first, so every system below sees the full page
renderMe();
renderDirections();
renderSocials();

// portrait: real photo over a generative halftone fallback
const portrait = document.getElementById('portrait') as HTMLCanvasElement | null;
if (portrait) drawPortraitHalftone(portrait);
const portraitImg = document.getElementById('portrait-img') as HTMLImageElement | null;
if (portraitImg && me.portrait) {
  portraitImg.onload = () => {
    portraitImg.classList.add('is-loaded');
    if (portrait) portrait.style.display = 'none'; // drop the fallback halftone
  };
  portraitImg.onerror = () => portraitImg.removeAttribute('src');
  portraitImg.src = me.portrait;
}

// systems
const lenis = initLenis();
initCursor();
initMenu(lenis);
initBackToTop(lenis);
initDirections(lenis);
initMagnetic();

const halftone = document.getElementById('halftone') as HTMLCanvasElement | null;
if (halftone) initHalftone(halftone);

// scroll-in reveals (IntersectionObserver) + marquee + scroll accents
initReveals();
initMarquee();
initScrollAccents();

// choreography: hide hero, preload, then play the entrance
const playHero = prepareHeroIntro();
runPreloader().then(playHero);
