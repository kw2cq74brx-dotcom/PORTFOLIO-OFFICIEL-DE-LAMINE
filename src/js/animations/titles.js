import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';
import { splitChars, splitWords } from './split.js';

// Textes au scroll, adaptés de « On-Scroll Typography Animations », set 2
// (Codrops, licence MIT — github.com/codrops/OnScrollTypographyAnimations).
//  - grands titres (.js-fx-title) : un effet par lettre, en alternance ;
//  - phrases d'accroche : les mots arrivent de la profondeur (effet 27, sans épinglage) ;
//  - descriptions : les mots s'allument et le bloc se redresse (effet 16).
// Les bornes du dépôt sont avancées : tout est lisible quand le texte atteint le milieu de l'écran.
// Sur sa propre page, un texte déjà visible au chargement se joue une fois, sans attendre le scroll.

const LEADS = '.p-ab-hero__title, .p-ab-cycle__lead, .p-ab-steps__title, .p-ab-cta__title, .p-ct__socials-title, .p-xp__lead';
const TEXTS = [
  '.p-head__lead p:last-child',
  '.p-pile__lead',
  '.p-stair__intro',
  '.p-projects__intro p:last-child',
  '.p-next__wrapper > .t-base',
  '.p-depth__intro p:last-child',
  '.p-reads__head > .t-base',
  '.p-ab-cycle__text',
].join(', ');

const SCROLL_RANGE = { start: 'top 98%', end: 'top 42%' };

// Dans une section épinglée, le texte se joue à l'arrivée de la section, avant l'épinglage.
// C'est donc la section, qui ne bouge pas, qui sert de repère : ScrollTrigger décale sinon
// tout repère situé dans l'élément épinglé de la durée de l'épinglage.
const PINNED_SECTIONS = '.js-toolkit, .js-depth, .js-reads';
const PINNED_RANGE = { start: 'top 95%', end: 'top 30%' };
const rangeFor = (el) => {
  const section = el.closest(PINNED_SECTIONS);
  return section ? { trigger: section, ...PINNED_RANGE } : { trigger: el, ...SCROLL_RANGE };
};

// Effets de titre : [état de départ, réglages d'arrivée]. La perspective vient du mot parent.
const TITLE_EFFECTS = [
  // 20 : bascule depuis le bas, dans le désordre
  () => [
    { transformOrigin: '50% 100%', opacity: 0, rotationX: 90 },
    { ease: 'power4', stagger: { each: 0.03, from: 'random' } },
  ],
  // 18 : les lettres arrivent du fond
  () => [{ opacity: 0.2, z: -800 }, { ease: 'back.out(1.2)', stagger: 0.04 }],
  // 19 : bascule depuis le haut
  () => [
    { transformOrigin: '50% 0%', opacity: 0, rotationX: -90, z: -200 },
    { ease: 'power1', stagger: 0.05 },
  ],
  // 23 : lettres minuscules qui se déploient depuis le côté
  (chars) => [
    { scale: 0.01, x: (i) => (chars.length - i - 1) * -50 },
    { ease: 'power4' },
  ],
  // 17 : rotation et profondeur aléatoires
  () => [
    { opacity: 0, rotationX: () => gsap.utils.random(-120, 120), z: () => gsap.utils.random(-200, 200) },
    { ease: 'none', stagger: 0.02 },
  ],
];

// Lié au scroll, ou joué une fois si le texte est visible dès l'ouverture de sa page
function isInFirstView(el) {
  return !el.closest('[data-section]') && window.scrollY === 0 && el.getBoundingClientRect().top < window.innerHeight * 0.9;
}

function animate(el, targets, from, to, delay) {
  const inFirstView = isInFirstView(el);
  const arrival = { opacity: 1, x: 0, y: 0, z: 0, scale: 1, rotation: 0, rotationX: 0, xPercent: 0, yPercent: 0 };
  const settings = inFirstView
    ? { duration: 1.2, delay, ease: 'power3.out' }
    : { ...to, scrollTrigger: { ...rangeFor(el), scrub: true } };
  gsap.fromTo(targets, { willChange: 'opacity, transform', ...from }, { ...arrival, ...settings, stagger: to.stagger });
}

function fxTitles(delay) {
  document.querySelectorAll('.js-fx-title').forEach((title, index) => {
    const wrappers = [...title.querySelectorAll('.text-wrapper')];
    const chars = (wrappers.length ? wrappers : [title]).flatMap((wrapper) => [...splitChars(wrapper)]);
    chars.forEach((char) => gsap.set(char.parentNode, { perspective: 1000 }));
    const [from, to] = TITLE_EFFECTS[index % TITLE_EFFECTS.length](chars);
    animate(title, chars, from, to, delay);
  });
}

function fxLeads(delay) {
  document.querySelectorAll(LEADS).forEach((lead) => {
    const words = splitWords(lead);
    words.forEach((word) => gsap.set(word.parentNode, { perspective: 1000 }));
    animate(
      lead,
      words,
      {
        opacity: 0,
        z: () => gsap.utils.random(300, 600),
        xPercent: () => gsap.utils.random(-60, 60),
        yPercent: () => gsap.utils.random(-10, 10),
        rotationX: () => gsap.utils.random(-90, 90),
      },
      { ease: 'expo', stagger: { each: 0.006, from: 'random' } },
      delay,
    );
  });
}

function fxTexts(delay) {
  document.querySelectorAll(TEXTS).forEach((text) => {
    if (!isInFirstView(text)) {
      gsap.fromTo(
        text,
        { transformOrigin: '0% 50%', rotate: 3 },
        { rotate: 0, ease: 'none', scrollTrigger: { ...rangeFor(text), scrub: true } },
      );
    }
    animate(text, splitWords(text), { opacity: 0.1 }, { ease: 'none', stagger: 0.05 }, delay);
  });
}

// Nom du hero : ses lettres se déplient à l'ouverture, après les squelettes (heroSkeleton.js)
function heroTitle(delay) {
  const title = document.querySelector('.js-title-scale');
  if (!title) return;
  const chars = splitChars(title.querySelector('.text-wrapper'));
  gsap.set(chars, { scaleY: 0, transformOrigin: 'bottom center' });
  gsap.to(chars, {
    scaleY: 1,
    duration: 1.2,
    ease: 'power4.out',
    delay: Number(title.dataset.delay ?? delay),
    stagger: { each: 0.05, from: 'random' },
  });
}

export function initTitles({ delay = 0 } = {}) {
  heroTitle(delay);
  if (prefersReducedMotion) return;
  fxTitles(delay);
  fxLeads(delay);
  fxTexts(delay);
}
