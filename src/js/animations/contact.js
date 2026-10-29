import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';
import { splitChars } from './split.js';

// Page contact (structure inspirée de buckssauce.com/contact) :
//  - les lettres du titre montent une à une, les rayons se déploient puis tournent lentement ;
//  - les coordonnées montent ligne par ligne, le soulignement de l'e-mail se dessine ;
//  - le formulaire puis les cartes réseaux apparaissent au scroll.
export function initContact() {
  const title = document.querySelector('.js-ct-title');
  if (!title) return;

  const chars = splitChars(title.querySelector('.text-wrapper'));
  const rays = document.querySelectorAll('.js-ct-rays path');
  const lines = document.querySelectorAll('.js-ct-line');
  const underline = document.querySelector('.js-ct-underline path');
  const fields = document.querySelectorAll('.js-ct-form > *');

  if (prefersReducedMotion) return;

  gsap.set(chars, { yPercent: 110, opacity: 0 });
  gsap.set(lines, { y: 24, opacity: 0 });
  gsap.set(rays, { drawSVG: '0%' });
  gsap.set(underline, { drawSVG: '0%' });

  document.addEventListener(
    'page:enter',
    () => {
      gsap
        .timeline({ delay: 0.3 })
        .to(chars, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.05 })
        .to(rays, { drawSVG: '100%', duration: 1.2, ease: 'power3.out', stagger: { each: 0.012, from: 'random' } }, 0.1)
        .to(lines, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.45)
        .to(underline, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut' }, 0.9);

      // Les rayons tournent très lentement, comme un soleil
      gsap.to('.js-ct-rays', { rotation: 360, duration: 240, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    },
    { once: true },
  );

  gsap.from('.js-ct-social', {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out',
    stagger: 0.1,
    // rend la main au CSS pour l'effet de survol (la carte se soulève)
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.p-ct__socials', start: 'top 85%' },
  });

  gsap.from(fields, {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.06,
    scrollTrigger: { trigger: '.js-ct-form', start: 'top 85%' },
  });
}
