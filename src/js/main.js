import '../styles/main.css';

import { ScrollTrigger } from './lib/gsap.js';
import { initSmoothScroll } from './core/scroll.js';
import { enter } from './core/pageTransition.js';
import { initNavigation } from './core/navigation.js';
import { initHeader } from './components/header.js';
import { initMenu } from './components/menu.js';
import { initContactForm } from './components/contactForm.js';
import { initTitles } from './animations/titles.js';
import { initFloating } from './animations/floating.js';
import { initPixelImages } from './animations/pixelImage.js';
import { initPixelTransitions } from './animations/pixelTransition.js';
import { initSynthesis } from './animations/synthesis.js';
import { initLiquidBackground } from './webgl/liquidBackground.js';
import { initToolkit } from './animations/toolkit.js';

initLiquidBackground();
initSmoothScroll();
initHeader();
initMenu();
initNavigation();
// Avant les autres animations au scroll : la section épinglée décale tout ce qui suit
initToolkit();
initContactForm();
initFloating();
initPixelImages();
initPixelTransitions();
initSynthesis();

// Un accordéon qui s'ouvre change la hauteur de la page : on recalcule les déclencheurs
document.querySelectorAll('.collapse > input').forEach((input) => {
  input.addEventListener('change', () => setTimeout(() => ScrollTrigger.refresh(), 450));
});

// La découpe en lettres dépend des polices : on attend qu'elles soient chargées
document.fonts.ready.then(() => {
  initTitles({ delay: 0.4 });
  enter();
  ScrollTrigger.refresh();
});
