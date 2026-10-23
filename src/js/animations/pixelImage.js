import { gsap } from '../lib/gsap.js';

// Image révélée par pixels : on dessine l'image en très basse résolution
// dans un canvas, puis on augmente la résolution jusqu'à l'image nette.
export function initPixelImages() {
  document.querySelectorAll('.js-pixel').forEach(setup);
}

function setup(item) {
  const canvas = item.querySelector('canvas');
  const img = item.querySelector('img');
  if (!canvas || !img) return;

  const ctx = canvas.getContext('2d');
  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');
  const state = { progress: 0 };
  let crop = null;

  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', img.alt);
  item.classList.add('is-pixel');

  // Taille du canvas = taille affichée ; recadrage façon object-fit: cover
  const measure = () => {
    if (!img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.round(item.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(item.clientHeight * dpr));

    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const sw = canvas.width / scale;
    const sh = canvas.height / scale;
    crop = { sx: (img.naturalWidth - sw) / 2, sy: (img.naturalHeight - sh) / 2, sw, sh };
  };

  const render = () => {
    if (!crop) return;
    const { width: w, height: h } = canvas;

    const pixels = 18 + (w - 18) * Math.pow(state.progress, 2.5);
    const pw = Math.max(1, Math.round(pixels));
    const ph = Math.max(1, Math.round((h / w) * pw));

    temp.width = pw;
    temp.height = ph;
    tctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(temp, 0, 0, pw, ph, 0, 0, w, h);
  };

  const refresh = () => {
    measure();
    render();
  };

  if (img.complete) refresh();
  else img.addEventListener('load', refresh, { once: true });
  new ResizeObserver(refresh).observe(item);

  gsap.set(canvas, { scale: 1.1 });

  const intro = gsap
    .timeline({ scrollTrigger: { trigger: item, start: 'top 80%' } })
    .to(state, { progress: 1, duration: 1.5, onUpdate: render })
    .to(canvas, { scale: 1, duration: 1.5 }, 0);

  // Au survol de la carte, l'image se re-pixelise brièvement
  const card = item.closest('.c-card');
  card?.addEventListener('mouseenter', () => {
    if (intro.isActive() || intro.progress() < 1) return;
    gsap.fromTo(
      state,
      { progress: 0.3 },
      { progress: 1, duration: 0.9, ease: 'power2.out', onUpdate: render, overwrite: true },
    );
  });
}
