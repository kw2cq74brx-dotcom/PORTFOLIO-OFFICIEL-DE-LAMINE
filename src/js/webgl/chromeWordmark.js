import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from '../lib/gsap.js';
import fontData from '../data/blg-font.json';

// Sigle « BLG » en chrome 3D (principe inspiré de ascension.pegassi.be) :
//  - métal poli qui reflète une pièce virtuelle, teinté glacé ;
//  - surface qui ondule légèrement (normales perturbées) ;
//  - entrée : le sigle bascule depuis l'arrière en se retournant ;
//  - il s'incline vers la souris ; plus il penche, plus les couleurs se séparent ;
//  - quelques étincelles sur l'arête.
// Police : Helvetiker Bold (MgOpen, licence libre), réduite aux trois lettres utiles.

const CONFIG = {
  color: '#e6f0ff',
  roughness: 0.08,
  clearcoat: 0.25,
  envIntensity: 1.6,
  wobble: 0.035,
  wobbleScale: 0.09,
  lean: 0.18, // inclinaison maximale vers la souris (radians)
  follow: 0.08,
  splitBase: 0.0012, // séparation des couleurs au repos
  splitTilt: 0.006, // séparation supplémentaire quand le sigle penche
  intro: { duration: 1.5, flip: Math.PI, depth: 2.2, ease: 'expo.out' },
};

// Glints : position (x, y) dans le repère du sigle, taille
const SPARKLES = [
  [-0.95, 0.42, 0.16],
  [0.12, -0.38, 0.11],
  [0.98, 0.3, 0.13],
];

function sparkleTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  // Croix lumineuse
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(c, 0);
  ctx.quadraticCurveTo(c, c, size, c);
  ctx.quadraticCurveTo(c, c, c, size);
  ctx.quadraticCurveTo(c, c, 0, c);
  ctx.quadraticCurveTo(c, c, c, 0);
  ctx.fill();
  // Halo
  const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.35);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createChromeWordmark(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // ---------- Scène du sigle (rendue dans une texture) ----------
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.z = 5;

  const material = new THREE.MeshPhysicalMaterial({
    color: CONFIG.color,
    metalness: 1,
    roughness: CONFIG.roughness,
    clearcoat: CONFIG.clearcoat,
    clearcoatRoughness: 0.3,
    envMapIntensity: CONFIG.envIntensity,
  });
  const wobble = { u_time: { value: 0 }, u_wobble: { value: CONFIG.wobble }, u_wobbleScale: { value: CONFIG.wobbleScale } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, wobble);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWobblePos;\nvarying mat3 vWobbleBasis;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvWobblePos = position.xy;\nvWobbleBasis = normalMatrix;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float u_time;\nuniform float u_wobble;\nuniform float u_wobbleScale;\nvarying vec2 vWobblePos;\nvarying mat3 vWobbleBasis;',
      )
      .replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
        {
          vec2 q = vWobblePos / u_wobbleScale + u_time * 0.25;
          vec2 tilt = vec2(
            sin(q.x + q.y * 0.7) + 0.6 * sin(q.x * 2.3 - q.y * 1.9 + 1.7),
            sin(q.y * 1.1 - q.x * 0.5 + 0.9) + 0.6 * sin(q.x * 1.7 + q.y * 2.6 + 3.1)
          ) * u_wobble;
          normal = normalize(normal + vWobbleBasis * vec3(tilt, 0.0));
        }`,
      );
  };

  const font = new FontLoader().parse(fontData);
  const geometry = new TextGeometry('BLG', {
    font,
    size: 1,
    depth: 0.28,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.035,
    bevelSegments: 6,
  });
  geometry.center();
  const solid = new THREE.Mesh(geometry, material);

  const pivot = new THREE.Group();
  pivot.add(solid);

  const sparkleMap = sparkleTexture();
  const sparkles = SPARKLES.map(([x, y, s]) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sparkleMap, blending: THREE.AdditiveBlending, depthTest: false, transparent: true }),
    );
    sprite.position.set(x, y, 0.22);
    sprite.userData.base = s;
    sprite.scale.setScalar(s);
    pivot.add(sprite);
    return sprite;
  });
  scene.add(pivot);

  // ---------- Passe finale : séparation des couleurs (aberration chromatique) ----------
  const target = new THREE.WebGLRenderTarget(4, 4, { samples: 4 });
  const post = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      uniforms: { u_tex: { value: target.texture }, u_split: { value: new THREE.Vector2() }, u_alpha: { value: 0 } },
      vertexShader: 'varying vec2 v_uv; void main(){ v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D u_tex;
        uniform vec2 u_split;
        uniform float u_alpha;
        varying vec2 v_uv;
        void main() {
          vec4 c = texture2D(u_tex, v_uv);
          float r = texture2D(u_tex, v_uv + u_split).r;
          float b = texture2D(u_tex, v_uv - u_split).b;
          gl_FragColor = vec4(r, c.g, b, c.a * u_alpha);
        }`,
    }),
  );
  const postScene = new THREE.Scene();
  postScene.add(post);
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---------- Taille : le sigle occupe ~45 % de la largeur (70 % sur mobile) ----------
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    target.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    camera.aspect = w / h;
    geometry.computeBoundingBox();
    const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const share = w < 768 ? 0.7 : 0.45;
    const visibleWidth = width / share;
    camera.position.z = visibleWidth / 2 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Souris ----------
  const aim = new THREE.Vector2();
  const tilt = new THREE.Vector2();
  const onMove = (e) => aim.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  const onLeave = () => aim.set(0, 0);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeave);

  // ---------- Animation ----------
  const intro = { p: 0, out: 0 };
  const uniforms = post.material.uniforms;

  const render = (time) => {
    wobble.u_time.value = time;
    tilt.lerp(aim, CONFIG.follow);

    const rest = 1 - intro.p;
    pivot.rotation.set(tilt.y * CONFIG.lean + rest * CONFIG.intro.flip - intro.out * 0.5, tilt.x * CONFIG.lean, 0);
    pivot.position.z = -rest * CONFIG.intro.depth + intro.out * 1.6;

    sparkles.forEach((sprite, i) => {
      const twinkle = 0.6 + 0.4 * Math.sin(time * 2.2 + i * 2.1) + Math.abs(tilt.x + tilt.y) * 0.6;
      sprite.scale.setScalar(sprite.userData.base * twinkle * intro.p);
    });

    const split = CONFIG.splitBase + (Math.abs(tilt.x) + Math.abs(tilt.y)) * CONFIG.splitTilt + intro.out * 0.02;
    uniforms.u_split.value.set(split, split * 0.3);

    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCamera);
  };
  gsap.ticker.add(render);

  return {
    // Le sigle bascule depuis l'arrière en se retournant
    appear: () =>
      gsap
        .timeline()
        .to(intro, { p: 1, duration: CONFIG.intro.duration, ease: CONFIG.intro.ease })
        .to(uniforms.u_alpha, { value: 1, duration: CONFIG.intro.duration, ease: CONFIG.intro.ease }, 0),
    // Il fonce vers l'écran en se dédoublant, puis s'efface
    leave: () =>
      gsap
        .timeline()
        .to(intro, { out: 1, duration: 0.9, ease: 'power3.in' })
        .to(uniforms.u_alpha, { value: 0, duration: 0.5, ease: 'power1.in' }, 0.4),
    destroy: () => {
      gsap.ticker.remove(render);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      geometry.dispose();
      material.dispose();
      sparkleMap.dispose();
      target.dispose();
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}
