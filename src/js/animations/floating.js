import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Boîtes en pointillés qui flottent doucement, chacune à son rythme
export function initFloating() {
  if (prefersReducedMotion) return;

  document.querySelectorAll('.js-floating-inner').forEach((el) => {
    gsap.fromTo(
      el,
      { y: -8 },
      {
        y: 8,
        duration: gsap.utils.random(1.2, 1.8),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: gsap.utils.random(0, 2),
      },
    );
  });
}
