import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Page formations : pile de cartes basée sur le composant « stack » de daisyUI.
// daisyUI place les cartes selon leur ordre dans le DOM (la première dessus, entière ;
// les suivantes décalées et réduites, effet accentué dans pages.css). Pour faire tourner la pile, on déplace donc
// la carte dans le DOM : la transition CSS fait glisser les autres à leur nouvelle place.
//  - suivante : la carte du dessus s'envole, puis repasse sous la pile ;
//  - précédente : la carte du dessous revient se poser sur la pile.

const FLY = { y: '-70%', x: '35%', rotation: 14, opacity: 0 };

export function initPile() {
  const pile = document.querySelector('.js-pile');
  if (!pile) return;

  const section = document.querySelector('.js-pile-section');
  const counter = document.querySelector('.js-pile-counter');
  const live = document.querySelector('.js-pile-live');
  const cards = [...pile.children];
  const total = cards.length;
  const pad = (n) => String(n).padStart(2, '0');
  let busy = false;

  const update = () => {
    const top = pile.firstElementChild;
    const index = cards.indexOf(top) + 1;
    if (counter) counter.textContent = `${pad(index)} / ${pad(total)}`;
    if (live) live.textContent = `Formation ${index} sur ${total} : ${top.dataset.title}`;
    // Seule la carte du dessus est lue par les lecteurs d'écran
    cards.forEach((card) => card.setAttribute('aria-hidden', card === top ? 'false' : 'true'));
  };

  // Relance la transition CSS depuis la position actuelle (inline) vers la place daisyUI
  const settle = (card) => {
    card.getBoundingClientRect();
    card.style.transition = '';
    card.getBoundingClientRect();
    gsap.set(card, { clearProps: 'transform,opacity' });
  };

  const next = () => {
    if (busy) return;
    busy = true;
    const top = pile.firstElementChild;
    gsap.set(top, { transition: 'none' });
    gsap.to(top, {
      ...FLY,
      duration: prefersReducedMotion ? 0 : 0.45,
      ease: 'power2.in',
      onComplete: () => {
        pile.appendChild(top);
        settle(top);
        update();
        setTimeout(() => (busy = false), 250);
      },
    });
  };

  const prev = () => {
    if (busy) return;
    busy = true;
    const bottom = pile.lastElementChild;
    gsap.set(bottom, { transition: 'none', ...FLY, x: '-35%', rotation: -14 });
    pile.prepend(bottom);
    settle(bottom);
    update();
    setTimeout(() => (busy = false), 450);
  };

  // Un lien dans une carte (ex. certification) s'ouvre sans faire tourner la pile
  pile.addEventListener('click', (e) => !e.target.closest('a') && next());
  pile.addEventListener('keydown', (e) => {
    if (e.target.closest('a')) return;
    if (['Enter', ' ', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      next();
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      prev();
    }
  });
  document.querySelector('.js-pile-next')?.addEventListener('click', next);
  document.querySelector('.js-pile-prev')?.addEventListener('click', prev);

  update();

  // Entrée au scroll : les cartes tombent une à une sur la pile
  if (!prefersReducedMotion) {
    gsap.set(cards, { transition: 'none' });
    gsap.from([...cards].reverse(), {
      y: () => gsap.utils.random(160, 260),
      x: () => gsap.utils.random(-80, 80),
      rotation: () => gsap.utils.random(-18, 18),
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: section, start: 'top 55%' },
      onComplete: () => cards.forEach(settle),
    });
  }
}
