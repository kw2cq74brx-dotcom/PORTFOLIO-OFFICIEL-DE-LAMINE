import { gsap } from '../lib/gsap.js';
import { prefersReducedMotion } from '../core/scroll.js';

// Curseur « lentille de verre » (adapté de 14islands/codrops-scroll-rig-tutorial, licence MIT) :
// un disque suit la souris avec un léger amorti. Le fond WebGL lit `lens` pour réfracter
// la glace liquide sous le disque ; le disque HTML ajoute reflets et liseré par-dessus la page.

// Partagé avec le fond WebGL (coordonnées en pixels CSS, origine en haut à gauche)
export const lens = { x: 0, y: 0, radius: 0, visible: false };

const DAMPING = 0.14; // temps d'amorti en secondes, comme dans le tutoriel
const HOVER_SCALE = 0.55; // la lentille se rétracte sur les éléments cliquables
const INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"]';

export function initLens() {
  // Uniquement avec une souris : pas de lentille sur écran tactile
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const el = document.createElement('div');
  el.className = 'c-lens';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  // Diamètre : 8 % du plus petit côté de l'écran, borné
  let baseRadius = 0;
  const resize = () => {
    baseRadius = gsap.utils.clamp(44, 80, Math.min(window.innerWidth, window.innerHeight) * 0.08) / 2;
    el.style.width = el.style.height = `${baseRadius * 2}px`;
  };
  resize();
  window.addEventListener('resize', resize);

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const look = { scale: 1, opacity: 0 };

  const show = (visible) => {
    lens.visible = visible;
    gsap.to(look, { opacity: visible ? 1 : 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  };

  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    if (!lens.visible) {
      // Première apparition : la lentille démarre sous la souris, sans glisser depuis le centre
      lens.x = target.x;
      lens.y = target.y;
      show(true);
    }
  });
  document.documentElement.addEventListener('pointerleave', () => show(false));

  document.addEventListener('pointerover', (e) => {
    const onInteractive = Boolean(e.target.closest?.(INTERACTIVE));
    gsap.to(look, { scale: onInteractive ? HOVER_SCALE : 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
  });

  gsap.ticker.add((time, deltaMs) => {
    // Amorti exponentiel indépendant du nombre d'images par seconde
    const follow = prefersReducedMotion ? 1 : 1 - Math.exp(-(deltaMs / 1000) * (2 / DAMPING));
    lens.x += (target.x - lens.x) * follow;
    lens.y += (target.y - lens.y) * follow;
    lens.radius = baseRadius * look.scale;

    el.style.opacity = look.opacity;
    el.style.transform = `translate3d(${lens.x - baseRadius}px, ${lens.y - baseRadius}px, 0) scale(${look.scale})`;
  });
}
