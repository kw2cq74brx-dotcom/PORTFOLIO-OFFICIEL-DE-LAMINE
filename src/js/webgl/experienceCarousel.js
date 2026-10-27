import * as THREE from 'three';
import { gsap } from '../lib/gsap.js';

// Carrousel WebGL de la page expériences (principe inspiré de ricardochance.com/work) :
//  - images larges qui défilent horizontalement en boucle et se calent au centre ;
//  - effet « tonneau » : à grande vitesse, les images se pincent au centre et se relèvent aux bords ;
//  - déformation de l'image sous la souris (grille de déplacement qui se relâche) ;
//  - légère parallaxe de l'image dans son cadre.

const CONFIG = {
  aspect: 1.6, // largeur / hauteur des images
  maxVw: 0.5,
  maxVh: 0.5,
  tabletVw: 0.85,
  mobileVw: 0.9,
  gapRatio: 0.04, // écart entre images, en part de la largeur d'écran
  barrelScale: 0.32,
  barrelLift: 0.25,
  barrelAttack: 0.06,
  barrelRelease: 0.035,
  barrelThreshold: 0.012,
  barrelSpeed: 0.18,
  wheelSpeed: 0.0011, // part d'image parcourue par pixel de molette
  follow: 0.08, // lissage du déplacement
  snapDelay: 160, // ms sans geste avant de se caler sur l'image la plus proche
  gridSize: 12,
  gridRadius: 0.1,
  gridStrength: 0.15,
  gridRelax: 0.9,
  gridDistort: 0.02,
  parallax: 1.2,
};

const vertexShader = /* glsl */ `
uniform float uBarrel;
uniform float uLift;
uniform float uMeshX;
uniform float uMeshWidth;
uniform float uViewportWidth;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  // Courbe commune à tout l'écran : pincement au centre, relèvement sur les bords
  float worldX = uMeshX + pos.x * uMeshWidth;
  float n = clamp(worldX / (uViewportWidth * 0.5), -1.0, 1.0);
  float pinch = cos(abs(n) * 1.5707963);
  pos.y *= 1.0 - pinch * uBarrel;
  pos.y *= 1.0 + (1.0 - pinch) * uBarrel * uLift;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform sampler2D uGrid;
uniform vec2 uRepeat;
uniform vec2 uOffset;
uniform float uAlpha;
uniform float uDim;
uniform float uGridDistort;
varying vec2 vUv;

void main() {
  vec4 grid = texture2D(uGrid, vUv);
  vec2 uv = vUv * uRepeat + uOffset - uGridDistort * grid.rg;
  vec3 color = texture2D(uTexture, uv).rgb * uDim;
  gl_FragColor = vec4(color, uAlpha);
}
`;

const wrap = (value, length) => ((value % length) + length) % length;

export function createExperienceCarousel({ canvas, images, onChange, onSelect, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

  const count = images.length;
  const view = { w: 0, h: 0, slideW: 0, slideH: 0, step: 0 };
  const motion = { target: 0, current: 0, previous: 0, barrel: 0, dragging: false };
  const pointer = { x: -9999, y: -9999, inside: false };
  let lastIndex = -1;
  let snapTimer = null;

  const loader = new THREE.TextureLoader();
  const geometry = new THREE.PlaneGeometry(1, 1, 32, 10);

  const slides = images.map((src) => {
    const gridData = new Float32Array(4 * CONFIG.gridSize * CONFIG.gridSize);
    const grid = new THREE.DataTexture(gridData, CONFIG.gridSize, CONFIG.gridSize, THREE.RGBAFormat, THREE.FloatType);
    grid.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTexture: { value: null },
        uGrid: { value: grid },
        uRepeat: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uAlpha: { value: 0 },
        uDim: { value: 1 },
        uGridDistort: { value: CONFIG.gridDistort },
        uBarrel: { value: 0 },
        uLift: { value: CONFIG.barrelLift },
        uMeshX: { value: 0 },
        uMeshWidth: { value: 1 },
        uViewportWidth: { value: 1 },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const slide = { mesh, material, grid, gridData, ratio: 1, reveal: { y: 0, alpha: 0 }, mouse: { x: 0, y: 0, vx: 0, vy: 0 } };
    loader.load(src, (texture) => {
      // Pas de conversion d'espace colorimétrique : le shader recopie les couleurs telles quelles
      material.uniforms.uTexture.value = texture;
      slide.ratio = texture.image.width / texture.image.height || 1;
    });
    return slide;
  });

  // ---------- Mise en page ----------
  const resize = () => {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    renderer.setSize(view.w, view.h, false);
    camera.left = -view.w / 2;
    camera.right = view.w / 2;
    camera.top = view.h / 2;
    camera.bottom = -view.h / 2;
    camera.updateProjectionMatrix();

    if (view.w >= 1024) {
      view.slideW = Math.min(view.w * CONFIG.maxVw, view.h * CONFIG.maxVh * CONFIG.aspect);
    } else {
      view.slideW = view.w * (view.w >= 480 ? CONFIG.tabletVw : CONFIG.mobileVw);
    }
    view.slideH = view.slideW / CONFIG.aspect;
    view.step = view.slideW + view.w * CONFIG.gapRatio;
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Commandes ----------
  const scheduleSnap = () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      if (!motion.dragging) motion.target = Math.round(motion.target);
    }, CONFIG.snapDelay);
  };

  const goTo = (index) => {
    // Chemin le plus court dans la boucle
    const currentIndex = Math.round(motion.target);
    let delta = wrap(index - currentIndex, count);
    if (delta > count / 2) delta -= count;
    motion.target = currentIndex + delta;
    if (reducedMotion) motion.current = motion.target;
  };
  const next = () => goTo(Math.round(motion.target) + 1);
  const prev = () => goTo(Math.round(motion.target) - 1);

  const onWheel = (e) => {
    if (e.target.closest?.('.js-exp-drawer')) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    motion.target += gsap.utils.clamp(-120, 120, delta) * CONFIG.wheelSpeed * (reducedMotion ? 3 : 1);
    scheduleSnap();
  };
  window.addEventListener('wheel', onWheel, { passive: true });

  // Glisser (souris ou doigt) ; un clic sans glisser sélectionne l'image touchée
  let drag = null;
  const toLocal = (e) => ({ x: e.clientX - view.w / 2, y: view.h / 2 - e.clientY });
  const slideAt = ({ x, y }) =>
    slides.findIndex(({ mesh }) => Math.abs(x - mesh.position.x) < mesh.scale.x / 2 && Math.abs(y - mesh.position.y) < mesh.scale.y / 2);

  canvas.addEventListener('pointerdown', (e) => {
    drag = { startX: e.clientX, lastX: e.clientX, moved: 0 };
    motion.dragging = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const local = toLocal(e);
    pointer.x = local.x;
    pointer.y = local.y;
    pointer.inside = true;
    if (!drag) return;
    const dx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    drag.moved += Math.abs(dx);
    motion.target -= dx / view.step;
  });
  const endDrag = (e) => {
    if (!drag) return;
    const clicked = drag.moved < 6;
    drag = null;
    motion.dragging = false;
    if (clicked) {
      const hit = slideAt(toLocal(e));
      if (hit >= 0) {
        hit === wrap(Math.round(motion.target), count) ? onSelect?.(hit) : goTo(hit);
        return;
      }
    }
    scheduleSnap();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => (pointer.inside = false));

  // ---------- Déformation sous la souris ----------
  const stepGrid = (slide, hovered) => {
    const { gridData, grid, mouse } = slide;
    const size = CONFIG.gridSize;
    for (let i = 0; i < size * size; i++) {
      gridData[4 * i] *= CONFIG.gridRelax;
      gridData[4 * i + 1] *= CONFIG.gridRelax;
    }
    if (hovered) {
      const { mesh } = slide;
      const u = (pointer.x - mesh.position.x) / mesh.scale.x + 0.5;
      const v = (pointer.y - mesh.position.y) / mesh.scale.y + 0.5;
      mouse.vx = u - mouse.x;
      mouse.vy = v - mouse.y;
      mouse.x = u;
      mouse.y = v;
      const radius = size * CONFIG.gridRadius;
      for (let gx = 0; gx < size; gx++) {
        for (let gy = 0; gy < size; gy++) {
          const dx = u * size - gx;
          const dy = v * size - gy;
          const dist2 = dx * dx + dy * dy;
          if (dist2 >= radius * radius || dist2 === 0) continue;
          const power = Math.min(radius / Math.sqrt(dist2), 10);
          const index = 4 * (gx + size * gy);
          gridData[index] += 100 * CONFIG.gridStrength * mouse.vx * power;
          gridData[index + 1] -= 100 * CONFIG.gridStrength * mouse.vy * power;
        }
      }
    } else {
      mouse.vx = mouse.vy = 0;
    }
    grid.needsUpdate = true;
  };

  // ---------- Boucle de rendu ----------
  const render = (time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    motion.previous = motion.current;
    motion.current += (motion.target - motion.current) * (reducedMotion ? 1 : 1 - Math.pow(1 - CONFIG.follow, dt * 60));

    // Effet tonneau proportionnel à la vitesse, qui monte vite et redescend doucement
    const speed = Math.abs(motion.current - motion.previous);
    const wanted = reducedMotion
      ? 0
      : speed > CONFIG.barrelThreshold
        ? Math.min((speed - CONFIG.barrelThreshold) * 60 * CONFIG.barrelSpeed, 1)
        : 0;
    const lerp = wanted > motion.barrel ? CONFIG.barrelAttack : CONFIG.barrelRelease;
    motion.barrel += (wanted - motion.barrel) * (1 - Math.pow(1 - lerp, dt * 60));

    slides.forEach((slide, i) => {
      // Position dans la boucle, ramenée entre -count/2 et +count/2 autour du centre
      let offset = wrap(i - motion.current + count / 2, count) - count / 2;
      const x = offset * view.step;
      const { mesh, material } = slide;
      mesh.position.set(x, slide.reveal.y, 0);
      mesh.scale.set(view.slideW, view.slideH, 1);

      const u = material.uniforms;
      u.uMeshX.value = x;
      u.uMeshWidth.value = view.slideW;
      u.uViewportWidth.value = view.w;
      u.uBarrel.value = motion.barrel * CONFIG.barrelScale;
      u.uAlpha.value = slide.reveal.alpha;
      u.uDim.value = 1 - Math.min(Math.abs(offset), 1) * 0.45;

      // Image recadrée façon « cover », avec une marge pour la parallaxe horizontale
      const frame = CONFIG.aspect;
      let rx = slide.ratio > frame ? frame / slide.ratio : 1;
      let ry = slide.ratio > frame ? 1 : slide.ratio / frame;
      rx /= CONFIG.parallax;
      ry /= CONFIG.parallax;
      const maxShift = (1 - rx) / 2;
      const n = gsap.utils.clamp(-1, 1, x / (view.w / 2));
      u.uRepeat.value.set(rx, ry);
      u.uOffset.value.set((1 - rx) / 2 + n * maxShift, (1 - ry) / 2);

      stepGrid(slide, pointer.inside && !motion.dragging && Math.abs(pointer.x - x) < view.slideW / 2 && Math.abs(pointer.y) < view.slideH / 2);
    });

    const index = wrap(Math.round(motion.current), count);
    if (index !== lastIndex) {
      lastIndex = index;
      onChange?.(index);
    }

    renderer.render(scene, camera);
  };
  gsap.ticker.add(render);

  // Entrée : les images montent une à une en fondu
  const reveal = () => {
    slides.forEach((slide, i) => {
      const order = Math.abs(wrap(i - Math.round(motion.current) + count / 2, count) - count / 2);
      gsap.fromTo(
        slide.reveal,
        { y: -view.h * 0.15, alpha: 0 },
        { y: 0, alpha: 1, duration: reducedMotion ? 0 : 1.4, ease: 'power2.out', delay: 0.1 + order * 0.14 },
      );
    });
  };

  return { next, prev, goTo, reveal };
}
