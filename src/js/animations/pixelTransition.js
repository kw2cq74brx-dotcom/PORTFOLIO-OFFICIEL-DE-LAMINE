import { gsap } from '../lib/gsap.js';

// Bande de pixels entre deux sections : au scroll, les cases changent de couleur
// au hasard, de plus en plus nombreuses vers le bas, avec quelques cases d'accent.
//
// <div class="c-pixels js-pixel-transition"
//      data-from="rgba(1,3,8,0)" data-to="rgba(1,3,8,0.55)" data-accent="#7FE7FF"
//      data-probs="0.1,0.2,0.5,0.7,1,1" data-end="top 20%"></div>
const COLS = 25;
const ACCENT_COUNT = 6;

export function initPixelTransitions() {
  document.querySelectorAll('.js-pixel-transition').forEach(setup);
}

function setup(wrapper) {
  const { from, to, accent } = wrapper.dataset;
  const probabilities = (wrapper.dataset.probs ?? '0.1,0.2,0.5,0.7,1,1').split(',').map(Number);
  const end = wrapper.dataset.end ?? 'top 20%';
  const rows = probabilities.length;

  const targetCells = [];
  const accentCandidates = [];
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'c-pixels__cell';
      cell.style.backgroundColor = from;

      if (Math.random() < probabilities[row]) {
        const data = { el: cell, color: to };
        targetCells.push(data);
        // Les accents restent dans les rangées du haut
        if (row < rows - 2) accentCandidates.push(data);
      }

      fragment.appendChild(cell);
    }
  }
  wrapper.appendChild(fragment);

  gsap.utils.shuffle(accentCandidates);
  accentCandidates.slice(0, ACCENT_COUNT).forEach((cell) => (cell.color = accent));

  gsap.to(
    targetCells.map((c) => c.el),
    {
      backgroundColor: (i) => targetCells[i].color,
      duration: 0.05,
      ease: 'none',
      stagger: { each: 0.003, from: 'random' },
      scrollTrigger: { trigger: wrapper, start: 'top bottom', end, scrub: true },
    },
  );
}
