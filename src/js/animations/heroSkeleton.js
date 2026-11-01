import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Accueil — hero construit avec le composant « skeleton » de daisyUI :
//  1. à l'arrivée, chaque élément (photo, textes, boutons) est remplacé par des barres
//     qui ont sa taille exacte et son nombre de lignes ;
//  2. le contenu réel prend leur place de haut en bas, et le nom se déplie ;
//  3. le nom et le rôle gardent ensuite le reflet animé de « skeleton-text ».
// Les barres sont créées ici : sans JS, ou si les animations sont réduites, le contenu s'affiche directement.

const HOLD = 1.3; // s : durée d'affichage des squelettes après l'entrée sur la page
const TITLE_DURATION = 2.4; // s : dépliage complet du nom (voir scaleTitles)
const LINE_WIDTHS = ['100%', '94%', '62%'];

const TARGETS = ['.p-fv__photo', '.p-fv__id-text p', '.p-fv__title', '.p-fv__vision p', '.p-fv__top .c-cta'].join(',');

function textWidth(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
}

function buildSkeleton(el) {
  const style = getComputedStyle(el);
  const lines = Math.max(1, Math.round(el.clientHeight / parseFloat(style.lineHeight)) || 1);
  const isBlock = el.matches('.c-cta, .p-fv__photo');
  const skeleton = document.createElement('span');
  skeleton.className = `c-skel${isBlock ? ' c-skel--block' : ''}`;
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.style.alignItems = { center: 'center', right: 'flex-end' }[style.textAlign] ?? 'flex-start';

  const singleWidth = `${Math.min(textWidth(el), el.clientWidth || Infinity)}px`;
  for (let i = 0; i < (isBlock ? 1 : lines); i++) {
    const bar = document.createElement('span');
    bar.className = 'skeleton';
    if (!isBlock) bar.style.width = lines === 1 ? singleWidth : LINE_WIDTHS[i % LINE_WIDTHS.length];
    skeleton.appendChild(bar);
  }

  el.classList.add('c-skel-host', 'is-hidden');
  el.appendChild(skeleton);
  return skeleton;
}

// Reflet permanent : le texte reçoit les classes daisyUI une fois ses lettres en place
function addShimmer(hero) {
  gsap.set(hero.querySelectorAll('.p-fv__title .char'), { clearProps: 'transform,transformOrigin' });
  hero.querySelector('.p-fv__title .text-wrapper').classList.add('skeleton', 'skeleton-text');
  hero.querySelector('.p-fv__id-text .t-base').classList.add('skeleton', 'skeleton-text');
}

export function initHeroSkeleton() {
  const hero = document.querySelector('.js-hero');
  if (!hero || prefersReducedMotion) return;

  const targets = [...hero.querySelectorAll(TARGETS)];
  const skeletons = targets.map(buildSkeleton);
  hero.setAttribute('aria-busy', 'true');
  // Le nom se déplie (titles.js) quand ses squelettes s'effacent
  hero.querySelector('.p-fv__title').dataset.delay = HOLD + 0.2;

  const resolve = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        skeletons.forEach((skeleton) => skeleton.remove());
        targets.forEach((el) => el.classList.remove('c-skel-host'));
        hero.removeAttribute('aria-busy');
      },
    });
    targets.forEach((el, i) => tl.add(() => el.classList.remove('is-hidden'), i * 0.03));
    tl.to(skeletons, { autoAlpha: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 }, 0);
    gsap.delayedCall(TITLE_DURATION, () => addShimmer(hero));
  };

  document.addEventListener('page:enter', () => gsap.delayedCall(HOLD, resolve), { once: true });
}
