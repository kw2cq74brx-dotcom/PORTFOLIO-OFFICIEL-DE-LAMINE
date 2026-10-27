import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Page À propos (structure inspirée de lxlcreative.co.uk/about) :
//  - entrée : les cartes et le titre du hero montent en fondu ;
//  - élan au survol : une carte frôlée par la souris part dans le sens du geste puis revient ;
//  - image qui change au scroll dans la section « Qui suis-je » ;
//  - image qui défile au survol des cartes du parcours ;
//  - traits manuscrits qui se dessinent au scroll.

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initAbout() {
  initEnter();
  initMomentum();
  initImageCycle();
  initHoverCycle();
  initDrawSvg();
}

function initEnter() {
  const items = document.querySelectorAll('.js-enter');
  if (!items.length || prefersReducedMotion) return;
  gsap.set(items, { yPercent: 25, autoAlpha: 0 });
  document.addEventListener(
    'page:enter',
    () => gsap.to(items, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: 0.3 }),
    { once: true },
  );
}

// Élan au survol : on mesure la vitesse de la souris, puis la carte touchée reçoit
// cette vitesse (et une rotation selon le côté frôlé) avant de revenir au repos (InertiaPlugin).
function initMomentum() {
  if (!canHover() || prefersReducedMotion) return;

  const clampMove = gsap.utils.clamp(-1080, 1080);
  const clampTurn = gsap.utils.clamp(-60, 60);

  document.querySelectorAll('.js-momentum').forEach((zone) => {
    const mouse = { x: 0, y: 0, dx: 0, dy: 0 };
    zone.addEventListener('mousemove', (e) => {
      mouse.dx = e.clientX - mouse.x;
      mouse.dy = e.clientY - mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    zone.querySelectorAll('.js-momentum-item').forEach((item) => {
      const target = item.querySelector('.js-momentum-target');
      if (!target) return;

      item.addEventListener('mouseenter', (e) => {
        const rect = target.getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);
        // Produit vectoriel : frôler la carte par le haut ou par le bas la fait tourner dans un sens ou l'autre
        const torque = (offsetX * mouse.dy - offsetY * mouse.dx) / (Math.hypot(offsetX, offsetY) || 1);

        gsap.to(target, {
          inertia: {
            x: { velocity: clampMove(mouse.dx * 30), end: 0 },
            y: { velocity: clampMove(mouse.dy * 30), end: 0 },
            rotation: { velocity: clampTurn(torque * 20), end: 0 },
            resistance: 200,
          },
          overwrite: 'auto',
        });
      });
    });
  });
}

// L'image affichée dépend de la progression du scroll dans la section
function initImageCycle() {
  document.querySelectorAll('.js-image-cycle').forEach((wrap) => {
    const images = [...wrap.querySelectorAll('.js-image-cycle-item')];
    if (images.length < 2) return;
    images.forEach((img, i) => gsap.set(img, { autoAlpha: i === 0 ? 1 : 0 }));
    if (prefersReducedMotion) return;

    let current = 0;
    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 70%',
      end: 'bottom 40%',
      onUpdate: (self) => {
        const index = Math.min(images.length - 1, Math.floor(self.progress * images.length));
        if (index === current) return;
        gsap.set(images[current], { autoAlpha: 0 });
        gsap.set(images[index], { autoAlpha: 1 });
        current = index;
      },
    });
  });
}

// Au survol (ou quand la carte est entièrement visible sur mobile), l'image change toutes les 500 ms
function initHoverCycle() {
  document.querySelectorAll('.js-hover-cycle').forEach((card) => {
    const images = [...card.querySelectorAll('.js-hover-cycle-image')];
    if (images.length < 2) return;
    images.forEach((img, i) => gsap.set(img, { autoAlpha: i === 0 ? 1 : 0 }));
    if (prefersReducedMotion) return;

    let index = 0;
    let timer = null;
    const step = () => {
      const next = (index + 1) % images.length;
      gsap.set(images[index], { autoAlpha: 0 });
      gsap.set(images[next], { autoAlpha: 1 });
      index = next;
    };
    const start = () => {
      if (!timer) timer = setInterval(step, 500);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };

    if (canHover()) {
      card.addEventListener('mouseenter', start);
      card.addEventListener('mouseleave', stop);
      card.addEventListener('focusin', start);
      card.addEventListener('focusout', (e) => {
        if (!card.contains(e.relatedTarget)) stop();
      });
    } else {
      new IntersectionObserver(
        (entries) => entries.forEach((entry) => (entry.isIntersecting ? start() : stop())),
        { threshold: 1 },
      ).observe(card);
    }
  });
}

// Trait manuscrit qui se dessine quand la section arrive (DrawSVGPlugin)
function initDrawSvg() {
  document.querySelectorAll('.js-draw-svg').forEach((wrap) => {
    const path = wrap.querySelector('path');
    if (!path) return;
    const from = wrap.dataset.drawReverse === 'true' ? '100% 100%' : '0%';
    if (prefersReducedMotion) {
      gsap.set(path, { drawSVG: '100%' });
      return;
    }
    gsap.fromTo(
      path,
      { drawSVG: from },
      { drawSVG: '100%', duration: 3, ease: 'power2.inOut', scrollTrigger: { trigger: wrap, start: 'top 70%', once: true } },
    );
  });
}
