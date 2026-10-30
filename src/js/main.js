import '../styles/main.css';

import { ScrollTrigger } from './lib/gsap.js';
import { initSmoothScroll } from './core/scroll.js';
import { enter } from './core/pageTransition.js';
import { initNavigation } from './core/navigation.js';
import { initHeader } from './components/header.js';
import { initMenu } from './components/menu.js';
import { initContactForm } from './components/contactForm.js';
import { playIntro } from './components/intro.js';
import { initTitles } from './animations/titles.js';
import { initFloating } from './animations/floating.js';
import { initPixelImages } from './animations/pixelImage.js';
import { initPixelTransitions } from './animations/pixelTransition.js';
import { initSynthesis } from './animations/synthesis.js';
import { initLiquidBackground } from './webgl/liquidBackground.js';
import { initLens } from './components/lens.js';
import { initToolkit } from './animations/toolkit.js';
import { initPile } from './animations/pile.js';
import { initStair } from './animations/stair.js';
import { initProgramme } from './animations/programme.js';
import { initAbout } from './animations/about.js';
import { initExperiences } from './animations/experiences.js';
import { initContact } from './animations/contact.js';

initLiquidBackground();
initLens();
initSmoothScroll();
initHeader();
initMenu();
initNavigation();
// Avant les autres animations au scroll : la section épinglée décale tout ce qui suit
initToolkit();
initPile();
initStair();
initProgramme();
initAbout();
initExperiences();
initContact();
initContactForm();
initFloating();
initPixelImages();
initPixelTransitions();
initSynthesis();

// Un accordéon qui s'ouvre change la hauteur de la page : on recalcule les déclencheurs
document.querySelectorAll('.collapse > input').forEach((input) => {
  input.addEventListener('change', () => setTimeout(() => ScrollTrigger.refresh(), 450));
});

// La découpe en lettres dépend des polices : on attend qu'elles soient chargées,
// puis l'intro (première visite et actualisation) avant de révéler la page
document.fonts.ready
  .then(() => playIntro())
  .then((played) => {
    initTitles({ delay: played ? 0.3 : 0.4 });
    // Avec l'intro, la dissolution révèle déjà la page ; sinon, la grille de pixels s'en charge
    if (!played) enter();
    document.dispatchEvent(new Event('page:enter'));
    ScrollTrigger.refresh();
  });
