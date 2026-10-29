import { gsap } from '../lib/gsap.js';

// Grille de pixels plein écran : elle couvre la page au chargement,
// se dissout à l'arrivée et se reforme avant de changer de page.
let overlay;
let cells = [];

function build() {
  overlay = document.querySelector('.js-transition');
  if (!overlay) return false;

  const cols = window.innerWidth < 768 ? 8 : 16;
  const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
  overlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  overlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < cols * rows; i++) {
    const cell = document.createElement('div');
    cell.className = 'c-transition__cell';
    fragment.appendChild(cell);
  }
  overlay.appendChild(fragment);
  overlay.style.backgroundColor = 'transparent';
  cells = [...overlay.children];
  return true;
}

export function enter() {
  if (!build()) return gsap.timeline();

  return gsap.to(cells, {
    opacity: 0,
    duration: 0.05,
    ease: 'none',
    stagger: { amount: 0.6, from: 'random' },
    onComplete: () => gsap.set(overlay, { visibility: 'hidden' }),
  });
}

// Après l'intro : la page est déjà dévoilée par la dissolution, la grille reste cachée
export function reveal() {
  if (build()) gsap.set(overlay, { visibility: 'hidden' });
}

export function leave() {
  if (!overlay) return Promise.resolve();

  gsap.set(overlay, { visibility: 'visible', pointerEvents: 'all' });
  return gsap.to(cells, {
    opacity: 1,
    duration: 0.05,
    ease: 'none',
    stagger: { amount: 0.5, from: 'random' },
  });
}

// Retour arrière depuis le cache du navigateur : la page revient couverte, on la libère
window.addEventListener('pageshow', (e) => {
  if (!e.persisted || !overlay) return;
  gsap.set(cells, { opacity: 0 });
  gsap.set(overlay, { visibility: 'hidden', pointerEvents: 'none' });
});
