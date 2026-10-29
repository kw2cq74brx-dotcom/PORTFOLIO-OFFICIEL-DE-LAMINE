import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion, startScroll, stopScroll } from '../core/scroll.js';
import { reveal } from '../core/pageTransition.js';

// Animation d'entrée (inspirée de ascension.pegassi.be), jouée à la première visite et à chaque actualisation :
//  1. sur le voile sombre, le sigle « BLG » en chrome 3D bascule depuis l'arrière en se retournant ;
//  2. les petits textes montent dans leur masque ; le sigle suit la souris ;
//  3. une fois la page prête, le sigle fonce vers l'écran et le voile s'efface sur la page.
// Three.js n'est téléchargé que si l'intro se joue.
const STORAGE_KEY = 'portfolio-intro-vue';
const MIN_DURATION = 2.8; // s, depuis le début de l'intro
const MAX_WAIT = 6; // s : au-delà, on n'attend plus le chargement de la page

const alreadySeen = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // stockage indisponible (navigation privée) : l'intro se rejouera, ce n'est pas grave
  }
};
const isReload = () => performance.getEntriesByType('navigation')[0]?.type === 'reload';

const wait = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const pageLoaded = () =>
  new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });

export async function playIntro() {
  const intro = document.querySelector('.js-preloader');
  if (!intro || prefersReducedMotion || (alreadySeen() && !isReload())) return false;
  markSeen();

  const start = performance.now();
  const labels = [...intro.querySelectorAll('.js-preloader-line')];
  intro.classList.add('is-active');
  stopScroll();
  gsap.set(labels, { yPercent: 110 });

  // 1. Sigle en chrome 3D (chargé à part) ; à défaut, on garde le voile et les textes
  let wordmark = null;
  try {
    const { createChromeWordmark } = await import('../webgl/chromeWordmark.js');
    wordmark = createChromeWordmark(intro.querySelector('.js-preloader-canvas'));
    wordmark.appear();
  } catch (error) {
    console.warn('Sigle 3D indisponible :', error);
    intro.classList.add('is-fallback');
  }

  // 2. Les petits textes montent dans leur masque
  gsap.to(labels, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.1, delay: 0.35 });

  // 3. Durée minimale, puis attente du chargement (plafonnée)
  const elapsed = (performance.now() - start) / 1000;
  await Promise.all([wait(Math.max(0, MIN_DURATION - elapsed)), Promise.race([pageLoaded(), wait(MAX_WAIT)])]);

  gsap.to(labels, { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.05 });
  if (wordmark) await wordmark.leave().then(() => wait(0)).catch(() => {});
  else await wait(0.5);

  // 4. Le voile s'efface : la page, déjà en place, apparaît et lance ses animations
  reveal();
  gsap.to(intro, {
    autoAlpha: 0,
    duration: 0.7,
    ease: 'power2.out',
    onComplete: () => {
      wordmark?.destroy();
      intro.classList.remove('is-active');
      gsap.set(intro, { clearProps: 'opacity,visibility' });
      startScroll();
    },
  });
  return true;
}
