import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Tableau de synthèse :
//  - à l'arrivée, l'en-tête descend, les lignes apparaissent puis les cases se remplissent
//    dans le sens de lecture, en un temps fixe quel que soit leur nombre ;
//  - joué une seule fois : le tableau reste ensuite entièrement lisible, et son déclencheur
//    est libéré. Rien ne déborde vers le bas : le conteneur défile en largeur sur mobile ;
//  - au survol, la colonne est mise en évidence avec la ligne, pour lire le croisement
//    réalisation / compétence.
const FILL_DURATION = 0.9; // s, pour remplir toutes les cases

export function initSynthesis() {
  document.querySelectorAll('.js-synthesis').forEach((table) => {
    initCrosshair(table);
    if (prefersReducedMotion) return;

    const checks = table.querySelectorAll('tbody .c-synth__check.is-on');
    gsap.set(checks, { scale: 0 });
    gsap
      .timeline({ scrollTrigger: { trigger: table, start: 'top 80%', once: true } })
      .from(table.querySelectorAll('thead th'), { y: -12, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.04 })
      .from(table.querySelectorAll('tbody tr'), { opacity: 0, duration: 0.5, ease: 'power1.out', stagger: 0.05, clearProps: 'opacity' }, 0.15)
      .from(table.querySelectorAll('tbody th > *'), { x: -16, duration: 0.6, ease: 'power3.out', stagger: 0.02, clearProps: 'transform' }, 0.15)
      .to(checks, { scale: 1, duration: 0.35, ease: 'back.out(3)', stagger: { amount: FILL_DURATION }, clearProps: 'transform' }, 0.45);
  });
}

// Un seul écouteur sur le tableau ; les classes ne changent que si la colonne change
function initCrosshair(table) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let current = -1;
  const mark = (column, active) => {
    if (column < 2) return; // Réalisation et Période ne sont pas des compétences
    [...table.rows].forEach((row) => row.cells[column]?.classList.toggle('is-col', active));
  };

  table.addEventListener('pointerover', (e) => {
    const column = e.target.closest('td, th')?.cellIndex ?? -1;
    if (column === current) return;
    mark(current, false);
    mark(column, true);
    current = column;
  });
  table.addEventListener('pointerleave', () => {
    mark(current, false);
    current = -1;
  });
}
