import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { injectIcons } from '../data/toolIcons.js';

// Page compétences : un éventail de cartes par bloc, piloté par le scroll.
//  1. la première carte du premier bloc apparaît seule au centre (au chargement) ;
//  2. au scroll, les autres arrivent une à une depuis les côtés en tournant,
//     et l'éventail s'élargit pour leur faire de la place ;
//  3. l'éventail complet marque une pause, puis les cartes se regroupent et tombent ;
//  4. le bloc suivant prend le relais, jusqu'au dernier.

const SCROLL_PER_UNIT = 0.2; // part de hauteur d'écran défilée par unité de timeline

export function initToolkit() {
  const root = document.querySelector('.js-toolkit');
  if (!root) return;

  injectIcons(root);

  const stage = root.querySelector('.js-toolkit-stage');
  const head = root.querySelector('.js-toolkit-head');
  const hint = root.querySelector('.js-toolkit-hint');
  const counter = root.querySelector('.js-toolkit-counter');
  const bars = [...root.querySelectorAll('.js-toolkit-bar')];
  const subtitles = [...root.querySelectorAll('.js-toolkit-subtitle')];
  const sets = [...root.querySelectorAll('.js-toolkit-set')].map((set) => [...set.children]);
  const allCards = sets.flat();

  // Les cartes de droite passent devant celles de gauche
  sets.forEach((cards) => cards.forEach((card, k) => (card.style.zIndex = k + 1)));
  gsap.set(allCards, { xPercent: -50, yPercent: -50, opacity: 0 });
  gsap.set(subtitles.slice(1), { yPercent: 100 });

  // Position d'une carte dans un éventail de m cartes (i = 0 tout à gauche)
  const fan = (i, m) => {
    const c = i - (m - 1) / 2;
    const w = allCards[0].offsetWidth;
    // Sur mobile, l'éventail déborde un peu de l'écran pour rester lisible
    const spread = window.innerWidth < 768 ? 1.3 : 0.92;
    const room = Math.min(window.innerWidth * spread, 1600) - w;
    const step = m > 1 ? Math.min(w * 0.68, room / (m - 1)) : 0;
    return { x: c * step, y: c * c * w * 0.02, rotation: c * 4 };
  };
  const slot = (i, m) => ({
    x: () => fan(i, m).x,
    y: () => fan(i, m).y,
    rotation: fan(i, m).rotation,
  });

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  tl.to(hint, { opacity: 0, duration: 0.3 }, 0);

  tl.addLabel('bloc0');
  sets.forEach((cards, s) => {
    const order = appearanceOrder(cards.length);
    const center = (cards.length - 1) / 2;

    order.forEach((k, step) => {
      // Cartes visibles après cette étape, rangées de gauche à droite
      const visible = order.slice(0, step + 1).sort((a, b) => a - b);
      const card = cards[k];

      // La toute première carte est déjà en place : elle surgit à l'arrivée sur la page
      if (s === 0 && step === 0) {
        gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 1 });
        return;
      }

      const side = k < center ? -1 : 1;
      const from =
        step === 0
          ? { x: 0, y: () => window.innerHeight * 0.7, rotation: 0, opacity: 0 }
          : { x: () => side * window.innerWidth * 0.6, y: () => window.innerHeight * 0.25, rotation: side * 40, opacity: 0 };

      // Chaque carte démarre avant la fin de la précédente (sauf la première à entrer au scroll)
      const firstScrolled = step === 0 || (s === 0 && step === 1);
      tl.fromTo(
        card,
        from,
        { ...slot(visible.indexOf(k), visible.length), opacity: 1, duration: 1 },
        firstScrolled ? '>' : '-=0.5',
      );

      // Les cartes déjà présentes s'écartent pour lui faire de la place
      visible
        .filter((i) => i !== k)
        .forEach((i) => tl.to(cards[i], { ...slot(visible.indexOf(i), visible.length), duration: 1 }, '<'));
    });

    // Pause : l'éventail complet reste affiché
    tl.to({}, { duration: 0.8 });

    // Sortie : les cartes se regroupent au centre puis tombent
    tl.to(cards, { x: 0, y: 0, rotation: 0, duration: 0.6, stagger: { each: 0.03, from: 'edges' } }).to(cards, {
      y: () => window.innerHeight * 0.8,
      rotation: () => gsap.utils.random(-25, 25),
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
      stagger: { each: 0.04, from: 'random' },
    });

    tl.to(subtitles[s], { yPercent: -100, duration: 0.6 }, '<');
    if (s < sets.length - 1) {
      tl.to(subtitles[s + 1], { yPercent: 0, duration: 0.6 }, '<0.3').addLabel(`bloc${s + 1}`, '<');
    }
  });

  // Transition finale vers « Expériences » : le titre s'efface à son tour
  tl.to(head, { opacity: 0, yPercent: -30, duration: 0.8 }, '<0.2');

  // Lu depuis la position du scroll (et non tl.time(), en retard à cause du scrub)
  const updateProgress = (progress = 0) => {
    const time = progress * tl.duration();
    const current = sets.reduce((acc, _, s) => (tl.labels[`bloc${s}`] <= time ? s : acc), 0);
    bars.forEach((bar, s) => bar.classList.toggle('is-active', s === current));
    if (counter) counter.textContent = `[0${current + 1} / 0${sets.length}]`;
  };

  ScrollTrigger.create({
    animation: tl,
    trigger: stage,
    pin: true,
    start: 'top top',
    end: () => `+=${tl.duration() * window.innerHeight * SCROLL_PER_UNIT}`,
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => updateProgress(self.progress),
  });
  updateProgress();

  // Quand la page se révèle, la première carte surgit seule au centre
  const first = sets[0][appearanceOrder(sets[0].length)[0]].querySelector('.c-tool__inner');
  const intro = gsap.from(first, {
    paused: true,
    y: 160,
    scale: 0.6,
    rotation: -8,
    opacity: 0,
    duration: 1.4,
    delay: 0.6,
    ease: 'power4.out',
    clearProps: 'transform,opacity',
  });
  document.addEventListener('page:enter', () => intro.play(), { once: true });
}

// Ordre d'apparition : du centre vers les bords, en alternant droite et gauche
function appearanceOrder(n) {
  const center = (n - 1) / 2;
  return [...Array(n).keys()].sort((a, b) => {
    const da = Math.abs(a - center);
    const db = Math.abs(b - center);
    return da === db ? b - a : da - db;
  });
}
