import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { scrollState } from '../core/scroll.js';

export function initHeader() {
  const header = document.querySelector('.js-header');
  if (!header) return;

  markCurrentPage();
  hideOnScroll(header);
  rollOnHover(header);
}

// Lien de la page courante (header + menu), d'après <body data-page="…">
function markCurrentPage(page = document.body.dataset.page) {
  document.querySelectorAll('[data-nav].is-current').forEach((link) => {
    link.classList.remove('is-current');
    link.removeAttribute('aria-current');
  });
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => {
    link.classList.add('is-current');
    link.setAttribute('aria-current', 'page');
  });
}

// Accueil : le lien actif suit la section affichée. Le bouton WhatsApp apparaît sur la section contact.
// À appeler après la création des sections épinglées, qui décalent tout ce qui suit.
export function initSectionSpy() {
  const sections = [...document.querySelectorAll('[data-section]')];
  sections.forEach((section) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => self.isActive && markCurrentPage(section.dataset.section),
    }),
  );
  if (!sections.length) return;

  ScrollTrigger.create({ trigger: sections[0], start: 'top 50%', onLeaveBack: () => markCurrentPage() });
  const whatsapp = document.querySelector('.c-whatsapp');
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top 70%',
    onEnter: () => whatsapp.classList.add('is-visible'),
    onLeaveBack: () => whatsapp.classList.remove('is-visible'),
  });
}

// Le header se cache quand on descend et réapparaît (en cascade) quand on remonte
function hideOnScroll(header) {
  const items = header.querySelectorAll('.js-header-item');
  let isHidden = false;
  let anim;

  const getHideY = () => {
    const top = parseFloat(getComputedStyle(header).top);
    return -(header.offsetHeight + top + 8);
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      if (scrollState.isAutoScrolling) return;

      if (self.direction === 1 && !isHidden) {
        isHidden = true;
        anim?.kill();
        anim = gsap.to(header, { y: getHideY(), duration: 0.45, ease: 'power3.inOut' });
      }

      if (self.direction === -1 && isHidden) {
        isHidden = false;
        anim?.kill();
        gsap.set(items, { y: -50 });
        anim = gsap
          .timeline()
          .to(header, { y: 0, duration: 0.45, ease: 'power3.out' })
          .to(items, { y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }, '<');
      }
    },
  });
}

// Au survol, le libellé se réduit et sa copie bascule en place avec une rotation
function rollOnHover(header) {
  header.querySelectorAll('.c-header__link').forEach((link) => {
    const label = link.querySelector('.c-header__label--default');
    const clone = link.querySelector('.c-header__label--clone');
    gsap.set(clone, { rotate: 28, y: '100%', transformOrigin: 'left center' });

    const roll = (on) => {
      const opts = { duration: 0.6, ease: 'power4.out', overwrite: 'auto' };
      gsap.to(clone, { rotate: on ? 0 : 28, y: on ? '0%' : '100%', ...opts });
      gsap.to(label, { scale: on ? 0 : 1, ...opts });
    };

    link.addEventListener('mouseenter', () => roll(true));
    link.addEventListener('mouseleave', () => roll(false));
  });
}
