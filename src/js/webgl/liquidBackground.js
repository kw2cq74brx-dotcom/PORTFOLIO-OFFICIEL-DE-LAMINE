import { prefersReducedMotion } from '../core/scroll.js';
import { lens } from '../components/lens.js';

// Fond « glace liquide » : un shader plein écran qui déforme un bruit fractal
// (domain warping) pour imiter une surface de glace en fusion, sombre,
// traversée de reflets bleutés. WebGL natif, sans librairie.
// La lentille du curseur (components/lens.js) y réfracte le fond.

const vertexSource = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uLens; // centre de la lentille, en pixels du canvas (origine en bas)
uniform float uLensRadius;
uniform float uLensOn;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotation * p;
    amplitude *= 0.5;
  }
  return value;
}

// Couleur de la glace liquide en un point de l'écran (pixels du canvas)
vec3 liquid(vec2 fragCoord) {
  vec2 uv = fragCoord / uResolution;
  vec2 p = (fragCoord - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  p += uMouse * 0.06;

  float t = uTime * 0.035;

  // Double déformation du bruit : c'est elle qui donne l'aspect liquide
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 1.6 + 2.5 * q + vec2(1.7, 9.2) + 1.5 * t),
    fbm(p * 1.6 + 2.5 * q + vec2(8.3, 2.8) - t)
  );
  float f = fbm(p * 1.2 + 3.0 * r);

  vec3 base = vec3(0.012, 0.018, 0.035);
  vec3 deep = vec3(0.03, 0.09, 0.18);
  vec3 violet = vec3(0.14, 0.08, 0.3);
  vec3 ice = vec3(0.45, 0.8, 1.0);

  vec3 color = mix(base, deep, smoothstep(0.25, 0.85, f));
  color = mix(color, violet, smoothstep(0.55, 1.1, length(q)) * 0.3);

  // Crêtes fines et lumineuses : les reflets de la glace
  float ridge = pow(1.0 - abs(f * 2.0 - 1.0), 14.0);
  color += ice * ridge * 0.22;
  color += ice * pow(r.x, 7.0) * 0.18;

  // Vignette pour garder les bords sombres et le texte lisible
  color *= 1.0 - 0.5 * length(uv - 0.5);
  return color;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 toLens = fc - uLens;
  float d = length(toLens);

  if (uLensOn < 0.5 || d > uLensRadius) {
    gl_FragColor = vec4(liquid(fc), 1.0);
    return;
  }

  // Sous la lentille : grossissement au centre, bord qui tord l'image,
  // et canaux rouge / vert / bleu décalés (aberration chromatique)
  float n = d / uLensRadius;
  vec2 dir = d > 0.0 ? toLens / d : vec2(0.0);
  vec2 q = uLens + toLens * (0.72 + 0.55 * pow(n, 3.0));
  vec2 ca = dir * uLensRadius * 0.05 * n * n;
  vec3 refracted = vec3(liquid(q + ca).r, liquid(q).g, liquid(q - ca).b);

  // Verre : plus lumineux, liseré clair sur le bord, reflet en haut à gauche
  refracted = refracted * 1.25 + vec3(0.45, 0.8, 1.0) * 0.05;
  refracted += vec3(0.75, 0.9, 1.0) * smoothstep(0.82, 1.0, n) * 0.35;
  refracted += smoothstep(0.35, 0.0, length(toLens / uLensRadius - vec2(-0.35, 0.4))) * 0.16;

  // Bord adouci pour éviter l'escalier
  float edge = smoothstep(1.0, 0.96, n);
  vec3 color = edge < 1.0 ? mix(liquid(fc), refracted, edge) : refracted;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

export function initLiquidBackground() {
  const canvas = document.querySelector('.js-liquid');
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return; // le dégradé CSS du canvas sert de repli

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  // Un seul triangle qui couvre tout l'écran
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uMouse = gl.getUniformLocation(program, 'uMouse');
  const uLens = gl.getUniformLocation(program, 'uLens');
  const uLensRadius = gl.getUniformLocation(program, 'uLensRadius');
  const uLensOn = gl.getUniformLocation(program, 'uLensOn');

  // Rendu en demi-résolution : le flou est voulu et le GPU respire
  const scale = 0.5;
  const resize = () => {
    canvas.width = Math.round(window.innerWidth * scale);
    canvas.height = Math.round(window.innerHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.targetX = e.clientX / window.innerWidth - 0.5;
    mouse.targetY = 0.5 - e.clientY / window.innerHeight;
  });

  const start = performance.now();
  const render = (now) => {
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    // Lentille : pixels CSS → pixels du canvas (demi-résolution, axe Y inversé)
    gl.uniform2f(uLens, lens.x * scale, (window.innerHeight - lens.y) * scale);
    gl.uniform1f(uLensRadius, lens.radius * scale);
    gl.uniform1f(uLensOn, lens.visible ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!prefersReducedMotion) requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}
