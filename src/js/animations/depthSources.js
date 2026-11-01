import { gsap, ScrollTrigger } from '../lib/gsap.js';
import { prefersReducedMotion, scrollToTarget } from '../core/scroll.js';

// Veille — défilement en profondeur des sources, adapté de « Atmospheric Depth Gallery »
// (Houmahani Kane, Codrops, licence MIT — github.com/houmahani/codrops-depth-gallery).
// On garde ses calculs : caméra qui avance dans un couloir de plans, lissage et vitesse du
// scroll, fondu entre plans, parallaxe à la souris, « respiration » et couleurs d'ambiance.
// Deux adaptations : le scroll de la page pilote la caméra (section épinglée, au lieu de capter
// la molette) et les plans sont les cartes HTML en CSS 3D, pour garder de vrais liens cliquables.

const CONFIG = {
  planeGap: 5,
  viewOffset: 5, // distance caméra-plan à laquelle une carte est à sa taille réelle
  scrollToWorld: 0.01,
  scrollSmoothing: 0.08,
  velocityDamping: 0.12,
  velocityMax: 1.5,
  planeFadeSmoothing: 0.14,
  parallax: { x: 0.16, y: 0.08, smoothing: 0.08 },
  breath: { tilt: 0.045, scale: 0.03, smoothing: 0.14, gain: 1.1 },
  drift: { y: 0.05, smoothing: 0.05 },
  xSpread: { desktop: 2, mobile: 0.25 },
  mobileBreakpoint: 768,
  titleFade: 0.14, // opacité du grand titre une fois les cartes arrivées
};

const { clamp } = gsap.utils;
const lerp = (a, b, t) => a + (b - a) * t;

export function initDepthSources() {
  const root = document.querySelector('.js-depth');
  if (!root || prefersReducedMotion) return;

  const stage = root.querySelector('.js-depth-stage');
  const scene = root.querySelector('.js-depth-scene');
  const bg = root.querySelector('.js-depth-bg');
  const head = root.querySelector('.js-depth-head');
  const cards = [...root.querySelectorAll('.js-depth-card')].map((el, index) => ({
    el,
    index,
    x: Number(el.dataset.x),
    opacity: 0,
    mood: [el.dataset.blob1, el.dataset.blob2],
  }));
  const last = cards.length - 1;
  root.classList.add('is-depth');

  // La caméra part une case avant la première carte : le titre s'affiche seul, puis les cartes arrivent
  const cameraStart = CONFIG.viewOffset + CONFIG.planeGap;
  const cameraEnd = CONFIG.viewOffset - last * CONFIG.planeGap;

  let unit = 1; // pixels pour une unité du monde (une carte fait 3 unités de large)
  let spread = 1;
  const resize = () => {
    unit = cards[0].el.offsetWidth / 3;
    spread = window.innerWidth <= CONFIG.mobileBreakpoint ? CONFIG.xSpread.mobile : CONFIG.xSpread.desktop;
    scene.style.perspective = `${CONFIG.viewOffset * unit}px`;
  };
  resize();
  ScrollTrigger.addEventListener('refreshInit', resize);

  const state = { target: cameraStart, camera: cameraStart, velocity: 0, breath: 0, drift: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );

  const trigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${(cards.length + 0.5) * window.innerHeight * 0.75}`,
    pin: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => (state.target = lerp(cameraStart, cameraEnd, self.progress)),
  });

  // Au clavier, atteindre un lien amène sa carte à l'écran
  cards.forEach((card) =>
    card.el.addEventListener('focusin', () => {
      if (!card.el.querySelector(':focus-visible')) return; // pas au clic de souris
      const progress = (card.index + 1) / (last + 1);
      scrollToTarget(trigger.start + progress * (trigger.end - trigger.start), { duration: 1, lock: false });
    }),
  );

  const render = (time) => {
    const step = gsap.ticker.deltaRatio(60) || 1; // indéfini avant le premier tick du ticker
    const smooth = (amount) => 1 - Math.pow(1 - amount, step);

    // Scroll lissé et vitesse (Scroll.js)
    const previous = state.camera;
    state.camera = lerp(state.camera, state.target, smooth(CONFIG.scrollSmoothing));
    const rawVelocity = (previous - state.camera) / CONFIG.scrollToWorld;
    state.velocity = clamp(
      -CONFIG.velocityMax,
      CONFIG.velocityMax,
      lerp(state.velocity, rawVelocity, smooth(CONFIG.velocityDamping)),
    );
    const speed = Math.abs(state.velocity) / CONFIG.velocityMax;
    state.breath = lerp(state.breath, clamp(0, 1, speed * CONFIG.breath.gain), smooth(CONFIG.breath.smoothing));
    state.drift = lerp(state.drift, state.velocity / CONFIG.velocityMax, smooth(CONFIG.drift.smoothing));
    pointer.x = lerp(pointer.x, pointer.tx, smooth(CONFIG.parallax.smoothing));
    pointer.y = lerp(pointer.y, pointer.ty, smooth(CONFIG.parallax.smoothing));

    // Position dans le couloir : 0 = première carte de face (-1 avant son arrivée)
    const depth = (CONFIG.viewOffset - state.camera) / CONFIG.planeGap;
    const currentIndex = clamp(0, last, Math.floor(depth));
    const blend = clamp(0, 1, depth - currentIndex);

    cards.forEach((card) => {
      // Fondu entre le plan courant et le suivant (Gallery.updatePlaneVisibility)
      let targetOpacity = 0;
      if (depth < 0) targetOpacity = card.index === 0 ? clamp(0, 1, depth + 1) : 0;
      // La carte sortante s'efface plus vite : grossie par la caméra, elle gênerait la lecture
      else if (card.index === currentIndex) targetOpacity = currentIndex === last ? 1 : clamp(0, 1, 1 - blend * 2.2);
      else if (card.index === currentIndex + 1) targetOpacity = blend;
      card.opacity = lerp(card.opacity, targetOpacity, smooth(CONFIG.planeFadeSmoothing));

      // Parallaxe, dérive et respiration (Gallery.updatePlaneMotion)
      const influence = card.opacity * (1 + card.index * 0.05);
      const breath = state.breath * card.opacity;
      const x = card.x * spread + pointer.x * CONFIG.parallax.x * influence;
      const y = pointer.y * CONFIG.parallax.y * influence + state.drift * CONFIG.drift.y;
      const distance = state.camera + card.index * CONFIG.planeGap;
      const tiltX = -pointer.y * CONFIG.breath.tilt * breath;
      const tiltY = pointer.x * CONFIG.breath.tilt * breath;

      card.el.style.opacity = card.opacity;
      card.el.classList.toggle('is-active', card.opacity > 0.5);
      card.el.style.transform =
        `translate3d(${x * unit}px, ${-y * unit}px, ${(CONFIG.viewOffset - distance) * unit}px) ` +
        `rotateX(${tiltX}rad) rotateY(${tiltY}rad) scale(${1 + CONFIG.breath.scale * breath})`;
    });

    // Ambiance : deux taches de couleur qui glissent lentement et suivent la carte (Background)
    const next = cards[Math.min(currentIndex + 1, last)];
    const t = time * 0.28;
    const style = bg.style;
    style.setProperty('--blob1', gsap.utils.interpolate(cards[currentIndex].mood[0], next.mood[0], blend));
    style.setProperty('--blob2', gsap.utils.interpolate(cards[currentIndex].mood[1], next.mood[1], blend));
    style.setProperty('--blob1-x', `${50 + Math.sin(t) * 13 + Math.sin(t * 1.618) * 5}%`);
    style.setProperty('--blob1-y', `${52 - Math.cos(t * 0.794) * 9 - Math.cos(t * 1.272) * 3}%`);
    style.setProperty('--blob2-x', `${35 + Math.cos(t * 0.927) * 11 + Math.cos(t * 1.414) * 4}%`);
    style.setProperty('--blob2-y', `${45 - Math.sin(t * 1.175) * 7 - Math.sin(t * 0.618) * 3}%`);
    style.setProperty('--lift', speed * 0.1);

    head.style.opacity = lerp(1, CONFIG.titleFade, clamp(0, 1, depth + 1));
  };

  // Le rendu ne tourne que lorsque la section est à l'écran
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? gsap.ticker.add(render) : gsap.ticker.remove(render)),
  });
  render(0);
}
