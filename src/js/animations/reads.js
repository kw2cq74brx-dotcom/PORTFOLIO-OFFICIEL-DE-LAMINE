import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { prefersReducedMotion, scrollState, scrollToTarget } from '../core/scroll.js';

// Veille — « Mes lectures » en carrousel 3D en boucle, à fond dégradé réactif
// (d'après le principe de « Infinite 3D Gradient Carousel », Clément Grellier pour Codrops).
// La section reste à l'écran : le scroll de la page fait tourner le carrousel, et on peut aussi
// le faire glisser. Les cartes se répartissent en boucle autour de la carte active ;
// le fond prend les couleurs de cette carte (data-c1 et data-c2).

const CONFIG = {
  smoothing: 0.1,
  rotation: 34, // degrés par position
  depth: 170, // recul (px) par position
  fade: 0.42, // perte d'opacité par position
  scrollPerCard: 0.8, // hauteurs d'écran de scroll par carte
  dragThreshold: 6, // px : en dessous, c'est un clic
};

const { clamp, interpolate } = gsap.utils;
const lerp = (a, b, t) => a + (b - a) * t;

export function initReads() {
  const root = document.querySelector('.js-reads');
  if (!root || prefersReducedMotion) return;

  const stage = root.querySelector('.js-reads-stage');
  const bg = root.querySelector('.js-reads-bg');
  const deck = root.querySelector('.js-reads-deck');
  const counter = root.querySelector('.js-reads-counter');
  const cards = [...root.querySelectorAll('.js-reads-card')].map((el, index) => ({
    el,
    index,
    colors: [el.dataset.c1, el.dataset.c2],
  }));
  const count = cards.length;
  const last = count - 1;
  root.classList.add('is-carousel');

  let spacing = 1;
  const resize = () => {
    spacing = Math.min(cards[0].el.offsetWidth * 0.92, window.innerWidth * 0.62);
  };
  resize();
  ScrollTrigger.addEventListener('refreshInit', resize);

  const state = { target: 0, position: 0 };
  const trigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${last * window.innerHeight * CONFIG.scrollPerCard}`,
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => (state.target = self.progress * last),
  });
  const scrollFor = (position) => trigger.start + (position / last) * (trigger.end - trigger.start);

  // Glisser : on déplace le scroll de la page, qui reste la seule source de position
  let drag = null;
  let dragged = false;
  deck.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, position: state.target };
    dragged = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const delta = drag.x - e.clientX;
    if (Math.abs(delta) > CONFIG.dragThreshold) dragged = true;
    if (!dragged) return;
    const y = scrollFor(clamp(0, last, drag.position + delta / spacing));
    if (scrollState.lenis) scrollState.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  });
  window.addEventListener('pointerup', () => (drag = null));
  window.addEventListener('pointercancel', () => (drag = null));

  cards.forEach((card) => {
    // Après un glissement, le relâchement n'ouvre pas de lien ; une carte de côté vient au centre
    card.el.addEventListener('click', (e) => {
      if (dragged) e.preventDefault();
      else if (!card.el.classList.contains('is-active')) {
        e.preventDefault();
        scrollToTarget(scrollFor(card.index), { duration: 1, lock: false });
      }
    });
    // Au clavier, atteindre un lien amène sa carte au centre
    card.el.addEventListener('focusin', () => {
      if (card.el.querySelector(':focus-visible')) scrollToTarget(scrollFor(card.index), { duration: 0.8, lock: false });
    });
  });

  const render = (time) => {
    const step = gsap.ticker.deltaRatio(60) || 1;
    state.position = lerp(state.position, state.target, 1 - Math.pow(1 - CONFIG.smoothing, step));

    cards.forEach((card) => {
      // Écart à la carte active, ramené dans la boucle : le carrousel n'a pas de bord
      const offset = gsap.utils.wrap(-count / 2, count / 2, card.index - state.position);
      const distance = Math.abs(offset);
      const isActive = distance < 0.5;
      const { style } = card.el;
      style.transform =
        `translate3d(${offset * spacing}px, 0, ${-distance * CONFIG.depth}px) ` +
        `rotateY(${clamp(-70, 70, -offset * CONFIG.rotation)}deg)`;
      style.opacity = clamp(0, 1, 1 - distance * CONFIG.fade);
      style.zIndex = 10 - Math.round(distance * 2);
      card.el.classList.toggle('is-active', isActive);
    });

    const from = Math.floor(state.position);
    const to = Math.min(from + 1, last);
    const blend = state.position - from;
    bg.style.setProperty('--c1', interpolate(cards[from].colors[0], cards[to].colors[0], blend));
    bg.style.setProperty('--c2', interpolate(cards[from].colors[1], cards[to].colors[1], blend));
    bg.style.setProperty('--x', `${50 + Math.sin(time * 0.3) * 12}%`);
    counter.textContent = `${String(Math.round(state.position) + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
  };

  // Le rendu ne tourne que lorsque la section est à l'écran
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? gsap.ticker.add(render) : gsap.ticker.remove(render)),
  });
  render(0);
}
