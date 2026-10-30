import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';
import { injectIcons } from '../data/toolIcons.js';
import { splitChars } from './split.js';

// Formations — le programme en paquet de cartes (principe de la section « produce » d'ironhill.au).
// La section reste à l'écran le temps d'un défilement lié au scroll :
//  1. le grand titre de fond apparaît lettre par lettre ;
//  2. chaque module arrive de côté (alternativement droite / gauche) en tournoyant,
//     se pose sur le paquet avec une légère inclinaison, et le titre s'estompe derrière ;
//  3. la pagination suit la carte du dessus.

// Position de repos de chaque carte sur le paquet : décalage (px) et inclinaison (deg)
const REST = [
  { x: -10, y: 6, rotation: -5 },
  { x: 12, y: -4, rotation: 4 },
  { x: -6, y: 8, rotation: -2.5 },
  { x: 10, y: 2, rotation: 5.5 },
  { x: 0, y: -2, rotation: -1.5 },
];

export function initProgramme() {
  const section = document.querySelector('.js-prog');
  if (!section) return;

  injectIcons(section);
  if (prefersReducedMotion) {
    section.classList.add('is-static');
    return;
  }

  const cards = [...section.querySelectorAll('.js-prog-card')];
  const dots = [...section.querySelectorAll('.js-prog-dot')];
  const backdrop = section.querySelector('.js-prog-backdrop');
  const chars = [...backdrop.querySelectorAll('.p-prog__line')].flatMap((line) => splitChars(line));

  const setActive = (index) => dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  setActive(0);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${(cards.length + 1) * window.innerHeight * 0.8}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      // une étape = 1 unité de temps : la carte i arrive entre i + 1 et i + 2
      onUpdate: () => setActive(gsap.utils.clamp(0, cards.length - 1, Math.round(tl.time() - 1.5))),
    },
  });

  tl.fromTo(chars, { opacity: 0.06 }, { opacity: 1, duration: 1, stagger: { amount: 0.8, from: 'random' } }, 0);

  cards.forEach((card, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const rest = REST[i % REST.length];
    tl.fromTo(
      card,
      {
        // entièrement hors champ, coins inclinés compris, quelle que soit la largeur d'écran
        x: () => side * (window.innerWidth / 2 + card.offsetWidth + 80),
        y: () => window.innerHeight * 0.55,
        rotation: side * 38,
      },
      { ...rest, duration: 1, ease: 'power2.out' },
      i + 1,
    );
  });

  // Le titre s'estompe sous le paquet dès l'arrivée de la première carte
  tl.to(backdrop, { opacity: 0.18, duration: 1 }, 1);
  // Un court temps de pause sur la dernière carte avant de libérer la section
  tl.to({}, { duration: 0.5 });
}
