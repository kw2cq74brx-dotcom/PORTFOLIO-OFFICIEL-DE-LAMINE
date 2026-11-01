import { menu } from '../components/menu.js';
import { leave } from './pageTransition.js';
import { scrollToTarget, easeInOutQuad } from './scroll.js';

const normalize = (path) => path.replace(/index\.html$/, '');

// Un seul écouteur pour tous les liens :
// - ancre de la page courante → défilement fluide
// - page présente en section de l'accueil → défilement jusqu'à la section
// - autre page du site → transition en pixels puis navigation
// - le reste (externe, mailto, tel, téléchargement) → comportement natif
export function initNavigation() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    if (link.classList.contains('js-back-to-top')) {
      e.preventDefault();
      scrollToTarget(0, { duration: 2, easing: easeInOutQuad });
      return;
    }

    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;

    if (normalize(url.pathname) === normalize(window.location.pathname)) {
      e.preventDefault();
      menu.close();
      scrollToTarget(url.hash || 0);
      return;
    }

    if (!/(\.html|\/)$/.test(url.pathname)) return;

    const page = url.pathname.match(/([^/]+)\.html$/)?.[1];
    if (document.querySelector(`[data-section="${page}"]`)) {
      e.preventDefault();
      menu.close();
      // ancre absente de l'accueil (#stages…) : on va au début de la section
      scrollToTarget(url.hash && document.querySelector(url.hash) ? url.hash : `#${page}`, { duration: 1.6 });
      return;
    }

    e.preventDefault();
    leave().then(() => {
      window.location.href = url.href;
    });
  });
}
