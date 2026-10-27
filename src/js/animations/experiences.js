import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Page expériences : interface autour du carrousel WebGL (webgl/experienceCarousel.js).
//  - le texte de l'expérience centrée change avec un glissement masqué ;
//  - le compteur fait rouler ses chiffres ;
//  - « Voir le détail » ouvre un panneau latéral avec le contenu complet.

const pad = (n) => String(n).padStart(2, '0');

export async function initExperiences() {
  const root = document.querySelector('.js-exp');
  if (!root) return;

  const items = [...root.querySelectorAll('.js-exp-item')];
  const data = items.map((item) => ({
    image: item.dataset.image,
    kind: item.querySelector('.p-exp-detail__kind')?.textContent.trim() ?? '',
    title: item.querySelector('.p-exp-detail__title')?.textContent.trim() ?? '',
    meta: item.querySelector('.p-exp-detail__meta')?.textContent.trim() ?? '',
    article: item.querySelector('article'),
  }));
  const count = data.length;

  const kind = root.querySelector('.js-exp-kind');
  const title = root.querySelector('.js-exp-title');
  const meta = root.querySelector('.js-exp-meta');
  const digits = root.querySelector('.js-exp-digits');
  const drawer = root.querySelector('.js-exp-drawer');
  const drawerBody = root.querySelector('.js-exp-drawer-body');
  let current = 0;

  // Compteur : une colonne de chiffres qui défile
  digits.innerHTML = data.map((_, i) => `<span>${pad(i + 1)}</span>`).join('');
  root.querySelector('.js-exp-total').textContent = `/${pad(count)}`;

  const lines = [kind, title, meta];
  const fill = (i) => {
    kind.textContent = data[i].kind;
    title.textContent = data[i].title;
    meta.textContent = data[i].meta;
  };
  fill(0);

  const show = (i) => {
    const direction = i > current || (current === count - 1 && i === 0) ? 1 : -1;
    current = i;
    gsap.to(digits, { yPercent: (-100 / count) * i, duration: prefersReducedMotion ? 0 : 0.6, ease: 'power3.out' });
    if (prefersReducedMotion) return fill(i);
    gsap
      .timeline()
      .to(lines, { yPercent: -110 * direction, duration: 0.25, ease: 'power2.in', stagger: 0.04 })
      .add(() => fill(i))
      .fromTo(lines, { yPercent: 110 * direction }, { yPercent: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06 });
  };

  // ---------- Panneau de détail ----------
  const openDrawer = (i = current) => {
    drawerBody.replaceChildren(data[i].article.cloneNode(true));
    drawer.inert = false;
    drawer.classList.add('is-open');
    drawer.querySelector('.js-exp-close').focus();
  };
  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.inert = true;
    root.querySelector('.js-exp-open').focus();
  };
  root.querySelector('.js-exp-open').addEventListener('click', () => openDrawer());
  root.querySelector('.js-exp-close').addEventListener('click', closeDrawer);

  // Entrée : les textes montent, puis les images apparaissent.
  // L'écouteur est posé avant le chargement du carrousel, qui peut arriver après.
  let carousel = null;
  let entered = false;
  document.addEventListener(
    'page:enter',
    () => {
      entered = true;
      if (!prefersReducedMotion) {
        gsap.from(root.querySelectorAll('.p-exp__top > *, .p-exp__bottom > *'), {
          yPercent: 60,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.07,
          delay: 0.2,
        });
      }
      carousel?.reveal();
    },
    { once: true },
  );

  // ---------- Carrousel WebGL (chargé à part : Three.js n'est téléchargé que sur cette page) ----------
  try {
    const { createExperienceCarousel } = await import('../webgl/experienceCarousel.js');
    carousel = createExperienceCarousel({
      canvas: root.querySelector('.js-exp-canvas'),
      images: data.map((d) => d.image),
      reducedMotion: prefersReducedMotion,
      onChange: show,
      onSelect: openDrawer,
    });
    if (entered) carousel.reveal();
  } catch (error) {
    console.warn('Carrousel WebGL indisponible :', error);
  }

  const go = (step) => {
    if (carousel) step > 0 ? carousel.next() : carousel.prev();
    else show((current + step + count) % count);
  };
  root.querySelector('.js-exp-next').addEventListener('click', () => go(1));
  root.querySelector('.js-exp-prev').addEventListener('click', () => go(-1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) return closeDrawer();
    if (drawer.classList.contains('is-open') || e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
}
