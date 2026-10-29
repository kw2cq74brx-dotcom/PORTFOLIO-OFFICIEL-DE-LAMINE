import { gsap } from '../lib/gsap.js';
import { startScroll, stopScroll } from '../core/scroll.js';

// Exposé pour que la navigation puisse fermer le menu avant de défiler
export const menu = {
  isOpen: false,
  close() {},
};

export function initMenu() {
  const button = document.querySelector('.js-menu-button');
  const overlay = document.querySelector('.js-menu');
  if (!button || !overlay) return;

  const css = getComputedStyle(document.documentElement);
  const textColor = css.getPropertyValue('--text').trim();
  const bgColor = css.getPropertyValue('--bg').trim();
  const glassColor = css.getPropertyValue('--glass-nav').trim();

  const trigger = button.querySelector('.c-menu-button__button');
  const panel = overlay.querySelector('.c-menu__wrapper');
  const openLabel = button.querySelectorAll('.c-menu-button__label--open');
  const closeLabel = button.querySelectorAll('.c-menu-button__label--close');
  const items = panel.querySelectorAll('.text-wrapper > span');

  gsap.set(overlay, { opacity: 0, pointerEvents: 'none' });
  gsap.set(panel, { opacity: 0, rotate: -28, transformOrigin: 'left top' });
  gsap.set(openLabel, { yPercent: 0 });
  gsap.set(closeLabel, { yPercent: 100 });
  gsap.set(trigger, { backgroundColor: glassColor });
  gsap.set(items, { display: 'inline-block', yPercent: 100 });

  const ease = { duration: 1, ease: 'power4.out' };

  const openTl = gsap
    .timeline({ paused: true })
    .to(overlay, { opacity: 1, pointerEvents: 'all', ...ease })
    .to(panel, { opacity: 1, rotate: 0, ...ease }, 0)
    .to(openLabel, { yPercent: -100, ...ease }, 0)
    .to(closeLabel, { yPercent: 0, ...ease }, 0)
    .to(trigger, { backgroundColor: textColor, color: bgColor, ...ease }, 0)
    .to(items, { yPercent: 0, stagger: 0.06, ...ease }, 0);

  const closeTl = gsap
    .timeline({ paused: true })
    .to(openLabel, { yPercent: 0, ...ease }, 0)
    .to(trigger, { backgroundColor: glassColor, color: textColor, ...ease }, 0)
    .to(closeLabel, { yPercent: 100, ...ease }, 0)
    .to(panel, { opacity: 0, rotate: -28, ...ease }, 0)
    .to(overlay, { opacity: 0, pointerEvents: 'none', ...ease }, 0)
    .set(items, { yPercent: 100 });

  const toggle = (open, { restoreScrollNow = false } = {}) => {
    menu.isOpen = open;
    trigger.setAttribute('aria-expanded', String(open));
    overlay.inert = !open;

    if (open) {
      stopScroll();
      openTl.restart();
      return;
    }

    closeTl.restart();
    if (restoreScrollNow) {
      startScroll();
    } else {
      closeTl.eventCallback('onComplete', () => {
        startScroll();
        closeTl.eventCallback('onComplete', null);
      });
    }
  };

  trigger.addEventListener('click', () => toggle(!menu.isOpen));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) toggle(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.isOpen) {
      toggle(false);
      trigger.focus();
    }
  });

  menu.close = () => {
    if (menu.isOpen) toggle(false, { restoreScrollNow: true });
  };
}
