import { gsap } from '../lib/gsap.js';

// Tableau de synthèse : les lignes montent une à une,
// puis les cases cochées apparaissent au hasard, comme des pixels
export function initSynthesis() {
  document.querySelectorAll('.js-synthesis').forEach((table) => {
    const rows = table.querySelectorAll('tbody tr');
    const checks = table.querySelectorAll('tbody .c-synth__check.is-on');

    gsap.set(checks, { scale: 0 });
    gsap
      .timeline({ scrollTrigger: { trigger: table, start: 'top 75%' } })
      .from(rows, { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' })
      .to(checks, { scale: 1, duration: 0.4, ease: 'back.out(3)', stagger: { each: 0.04, from: 'random' } }, 0.3);
  });
}
