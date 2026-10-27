import { gsap, ScrollTrigger } from '../lib/gsap.js';

// Page projets (adapté du CodePen gridmorphic/WbQPRwv) :
// le texte des projets défile à gauche pendant que l'image reste épinglée à droite.
// À chaque projet, l'image courante se découpe vers le haut pour révéler la suivante,
// et le voile coloré de la page prend la teinte du projet.
// Sur mobile, pas d'épinglage : textes et images alternent, avec un léger parallaxe.

const MOBILE = '(max-width: 768px)';

export function initProjects() {
  const arch = document.querySelector('.js-arch');
  if (!arch) return;

  const infos = [...arch.querySelectorAll('.js-arch-info')];
  const wrappers = [...arch.querySelectorAll('.js-arch-img')];
  const imgs = wrappers.map((wrapper) => wrapper.querySelector('img'));
  const right = arch.querySelector('.js-arch-right');
  const tint = document.querySelector('.js-arch-tint');

  // Teinte légère du voile pour chaque projet
  const tints = wrappers.map((wrapper) => gsap.utils.splitColor(wrapper.dataset.color));
  const tintOf = (i) => `rgba(${tints[i].join(',')}, 0.09)`;

  // Le premier projet est au-dessus de la pile
  wrappers.forEach((wrapper, i) => (wrapper.style.zIndex = wrappers.length - i));

  // Mobile : on intercale texte, image, texte, image…
  const handleLayout = () => {
    const isMobile = window.matchMedia(MOBILE).matches;
    infos.forEach((info, i) => (info.style.order = isMobile ? i * 2 : ''));
    wrappers.forEach((wrapper, i) => (wrapper.style.order = isMobile ? i * 2 + 1 : ''));
  };
  handleLayout();
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleLayout, 100);
  });

  if (tint) gsap.set(tint, { backgroundColor: tintOf(0) });

  ScrollTrigger.matchMedia({
    '(min-width: 769px)': () => {
      gsap.set(imgs, { clipPath: 'inset(0)', objectPosition: '50% 0%' });

      const main = gsap.timeline({
        scrollTrigger: {
          trigger: arch,
          start: 'top top',
          end: 'bottom bottom',
          pin: right,
          scrub: true,
        },
      });

      imgs.forEach((img, i) => {
        const next = imgs[i + 1];
        if (!next) return;
        const step = gsap
          .timeline()
          .to(img, { clipPath: 'inset(0px 0px 100%)', objectPosition: '50% 60%', duration: 1.5, ease: 'none' }, 0)
          .to(next, { objectPosition: '50% 40%', duration: 1.5, ease: 'none' }, 0);
        if (tint) step.to(tint, { backgroundColor: tintOf(i + 1), duration: 1.5, ease: 'power2.inOut' }, 0);
        main.add(step);
      });
    },

    [MOBILE]: () => {
      gsap.set(imgs, { objectPosition: '50% 60%' });

      imgs.forEach((img, i) => {
        const step = gsap.timeline({
          scrollTrigger: {
            trigger: img,
            start: 'top-=70% top+=50%',
            end: 'bottom+=200% bottom',
            scrub: true,
          },
        });
        step.to(img, { objectPosition: '50% 30%', duration: 5, ease: 'none' });
        if (tint) step.to(tint, { backgroundColor: tintOf(i), duration: 1.5, ease: 'power2.inOut' });
      });
    },
  });
}
