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

export function initSmoothScroll() {
  if (prefersReducedMotion) return;

  const lenis = new Lenis({ duration: 1.2, easing: easeOutCubic });

  // Lenis et ScrollTrigger avancent sur la même horloge (le ticker GSAP)
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  scrollState.lenis = lenis;
}

export function scrollToTarget(target, { duration = 1, easing = easeOutQuad } = {}) {
  const done = () => (scrollState.isAutoScrolling = false);
  scrollState.isAutoScrolling = true;

  if (scrollState.lenis) {
    scrollState.lenis.scrollTo(target, { duration, easing, lock: true, onComplete: done });
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
