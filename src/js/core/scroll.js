import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap.js';

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// État partagé : le header ne doit pas se masquer pendant un défilement automatique
export const scrollState = {
  lenis: null,
  isAutoScrolling: false,
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuad = (t) => 1 - Math.pow(1 - t, 2);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Réglages du défilement : celui du site, ou celui du CodePen gridmorphic/WbQPRwv
// (page avec <body data-scroll="codepen">) : sortie exponentielle, lissé aussi au doigt
const presets = {
  default: { duration: 1.2, easing: easeOutCubic },
  codepen: {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    gestureOrientation: 'vertical',
    syncTouch: true,
    touchMultiplier: 2,
  },
};

export function initSmoothScroll() {
  // data-scroll="none" : page plein écran sans défilement (expériences)
  if (prefersReducedMotion || document.body.dataset.scroll === 'none') return;

  const lenis = new Lenis(presets[document.body.dataset.scroll] ?? presets.default);

  // Lenis et ScrollTrigger avancent sur la même horloge (le ticker GSAP)
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  scrollState.lenis = lenis;
}

export function scrollToTarget(target, { duration = 1, easing = easeOutQuad, lock = true } = {}) {
  const done = () => (scrollState.isAutoScrolling = false);
  scrollState.isAutoScrolling = true;

  if (scrollState.lenis) {
    scrollState.lenis.scrollTo(target, { duration, easing, lock, onComplete: done });
    return;
  }

  // Sans Lenis (mouvement réduit) : défilement natif
  let top = target;
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) return done();
    top = el.getBoundingClientRect().top + window.scrollY;
  }
  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  done();
}

export const stopScroll = () => scrollState.lenis?.stop();
export const startScroll = () => scrollState.lenis?.start();
