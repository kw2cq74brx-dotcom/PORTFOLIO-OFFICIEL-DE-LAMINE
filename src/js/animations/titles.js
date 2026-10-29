import { gsap } from '../lib/gsap.js';
import { splitChars } from './split.js';

export function initTitles({ delay = 0 } = {}) {
  scaleTitles(delay);
  outlineTitles();
  rollTitles();
  riseTitles();
}

const textOf = (title) => title.querySelector('.text-wrapper') ?? title;

// Titre principal : les lettres se déplient depuis le bas, dans un ordre aléatoire
function scaleTitles(delay) {
  document.querySelectorAll('.js-title-scale').forEach((title) => {
    const chars = splitChars(textOf(title));
    gsap.set(chars, { scaleY: 0, transformOrigin: 'bottom center' });
    gsap.to(chars, {
      scaleY: 1,
      duration: 1.2,
      ease: 'power4.out',
      delay,
      stagger: { each: 0.05, from: 'random' },
    });
  });
}

// Titre en contour : la version pleine se révèle de gauche à droite au scroll
function outlineTitles() {
  document.querySelectorAll('.js-title-outline').forEach((title) => {
    const fill = title.querySelectorAll(':scope > .text-wrapper')[1];
    if (!fill) return;

    gsap.set(fill, { clipPath: 'polygon(0% 0%, 0% 0%, 0 100%, 0 100%)' });
    gsap.to(fill, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0 100%)',
      ease: 'none',
      scrollTrigger: {
        trigger: title,
        start: 'top 80%',
        end: 'top 20%',
        scrub: 1.5,
      },
    });
  });
}

// Titre doublé : chaque ligne est remplacée par sa copie qui monte depuis le bas
function rollTitles() {
  document.querySelectorAll('.js-title-roll').forEach((title) => {
    const lines = [...title.querySelectorAll(':scope > .text-wrapper')];
    const originals = lines.map((line) => line.children[0]);
    const clones = lines.map((line) => line.children[1]);

    // 115 % plutôt que 100 % : l'accent d'une majuscule (É) dépasse du haut de la ligne
    gsap.set(clones, { y: '115%' });
    gsap
      .timeline({ scrollTrigger: { trigger: title, start: 'top 65%' } })
      .to(clones, { y: '0%', duration: 1.5, ease: 'power3.out', stagger: 0.3 })
      .to(originals, { y: '-100%', duration: 1.5, ease: 'power3.out', stagger: 0.3 }, '<');
  });
}

// Titre sticky de la section sombre : les lettres montent une à une
function riseTitles() {
  document.querySelectorAll('.js-title-rise').forEach((title) => {
    const chars = splitChars(textOf(title));
    gsap.set(chars, { yPercent: 100 });
    gsap.to(chars, {
      yPercent: 0,
      duration: 1.2,
      stagger: 0.05,
      ease: 'power4.out',
      scrollTrigger: { trigger: title, start: title.dataset.start ?? 'top top' },
    });
  });
}
