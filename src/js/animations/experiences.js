import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Page expériences (principe de la section « process » de kerna.studio) :
//  - une timeline centrale se remplit au scroll ; quand elle atteint le point d'une étape,
//    le point grossit, la carte s'ouvre (le bloc numéro se rétracte et dévoile le texte)
//    et les tags surgissent un à un avec un rebond ;
//  - en remontant, l'étape se referme : les tags disparaissent dans l'ordre inverse.
// Les chiffres sont dessinés en points (matrice 5 × 9, chaque case doublée).

const DIGITS = {
  1: ['..#..', '.##..', '#.#..', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#....', '#....', '#####'],
  3: ['.###.', '#...#', '....#', '....#', '..##.', '....#', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#..#.', '#####', '...#.', '...#.', '...#.'],
  5: ['#####', '#....', '#....', '####.', '....#', '....#', '....#', '#...#', '.###.'],
};

// Ligne d'activation : la timeline est « remplie » jusqu'à 67 % de la hauteur de l'écran
const LINE = '67%';

function dotDigit(digit) {
  const rows = DIGITS[digit];
  if (!rows) return '';
  const dots = [];
  rows.forEach((row, y) =>
    [...row].forEach((bit, x) => {
      if (bit !== '#') return;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        dots.push(`<circle cx="${x * 2 + dx + 0.5}" cy="${y * 2 + dy + 0.5}" r="0.42"/>`);
      }
    }),
  );
  return `<svg viewBox="0 0 10 18" fill="currentColor">${dots.join('')}</svg>`;
}

export function initExperiences() {
  const container = document.querySelector('.js-xp-steps');
  if (!container) return;

  const steps = [...container.querySelectorAll('.js-xp-step')];
  const timeline = container.querySelector('.js-xp-timeline');
  const track = container.querySelector('.js-xp-track');
  const fill = container.querySelector('.js-xp-fill');

  container.querySelectorAll('.js-xp-digit').forEach((el) => (el.innerHTML = dotDigit(el.dataset.digit)));

  const points = steps.map(() => {
    const point = document.createElement('span');
    point.className = 'p-xp__point';
    timeline.appendChild(point);
    return point;
  });

  // Rail et points : du centre de la première étape au centre de la dernière
  const layout = () => {
    const centers = steps.map((step) => step.offsetTop + step.offsetHeight / 2);
    track.style.top = `${centers[0]}px`;
    track.style.height = `${centers.at(-1) - centers[0]}px`;
    points.forEach((point, i) => (point.style.top = `${centers[i]}px`));
  };
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);

  const states = steps.map((step) => ({
    num: step.querySelector('.js-xp-num'),
    tags: [...step.querySelectorAll('.js-xp-tag')],
    open: false,
  }));
  const collapsedWidth = (num) => parseFloat(getComputedStyle(num).getPropertyValue('--num-collapsed')) || 141;

  if (prefersReducedMotion) {
    states.forEach(({ num }) => num.classList.add('is-open'));
    points.forEach((point) => point.classList.add('is-active'));
    return;
  }

  gsap.set(fill, { scaleY: 0 });
  gsap.set(states.flatMap((s) => s.tags), { scale: 0 });

  const open = (i) => {
    const state = states[i];
    if (state.open) return;
    state.open = true;
    points[i].classList.add('is-active');
    gsap.to(state.num, { width: collapsedWidth(state.num), duration: 1, ease: 'expo.out', overwrite: true });
    gsap.to(state.tags, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.55)', stagger: 0.15, overwrite: true });
  };
  const close = (i) => {
    const state = states[i];
    if (!state.open) return;
    state.open = false;
    points[i].classList.remove('is-active');
    gsap.to(state.tags, { scale: 0, duration: 0.3, ease: 'power3.in', stagger: { each: 0.06, from: 'end' }, overwrite: true });
    gsap.to(state.num, {
      width: state.num.parentElement.clientWidth,
      duration: 0.9,
      ease: 'expo.out',
      delay: 0.15,
      overwrite: true,
      // de retour à 100 % en CSS : la largeur suit le redimensionnement
      onComplete: () => gsap.set(state.num, { clearProps: 'width' }),
    });
  };

  // Remplissage de la timeline, lié au scroll
  gsap.to(fill, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: track, start: `top ${LINE}`, end: `bottom ${LINE}`, scrub: true },
  });

  // Chaque étape s'ouvre quand la ligne d'activation atteint son centre (son point)
  steps.forEach((step, i) =>
    ScrollTrigger.create({
      trigger: step,
      start: `center ${LINE}`,
      onEnter: () => open(i),
      onLeaveBack: () => close(i),
    }),
  );

}
