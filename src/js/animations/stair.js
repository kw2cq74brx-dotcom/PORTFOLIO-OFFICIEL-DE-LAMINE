import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Formations — le BTS SIO en escalier (principe de la section « process » de leveled-agency.fr).
// L'empilement lui-même est en CSS (marches collantes, décalées d'une case) ; le JS ajoute :
//  - l'entrée de chaque marche : la bande s'ouvre de gauche à droite, le numéro et le titre
//    montent dans leur masque, puis le contenu apparaît ;
//  - pendant que la marche suivante monte la recouvrir, son contenu se replie et s'assombrit
//    (lié au scroll) : seules les cases numéro restent visibles.
export function initStair() {
  const list = document.querySelector('.js-stair');
  if (!list || prefersReducedMotion) return;

  const steps = [...list.querySelectorAll('.js-stair-step')];

  steps.forEach((step, i) => {
    const header = step.querySelector('.p-stair__header');
    const reveal = step.querySelectorAll('.js-stair-reveal');
    const content = step.querySelector('.js-stair-content');

    gsap
      .timeline({ scrollTrigger: { trigger: step, start: 'top 85%', toggleActions: 'play none none reverse' } })
      .fromTo(header, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out' })
      .from(reveal, { yPercent: 110, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.15)
      .from(content.children, { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.3);

    const next = steps[i + 1];
    if (!next) return;
    const veil = document.createElement('div');
    veil.className = 'p-stair__veil';
    veil.setAttribute('aria-hidden', 'true');
    content.appendChild(veil);

    // La marche suivante part du bas de ce contenu (marche déjà collée) et monte jusqu'au
    // bas de l'en-tête : le contenu se replie au même rythme, comme un accordéon, et
    // s'assombrit. Il ne reste alors que la case numéro, d'où l'escalier.
    const stick = () => parseFloat(getComputedStyle(step).top);
    gsap
      .timeline({
        scrollTrigger: {
          trigger: next,
          start: () => `top ${stick() + header.offsetHeight + content.offsetHeight}px`,
          end: () => `top ${stick() + header.offsetHeight}px`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(content, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', ease: 'none' })
      .to(veil, { opacity: 0.8, ease: 'none' }, 0);
  });
}
