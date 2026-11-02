// Glass cloche on a silver platter, monochrome studio light, floating steam motes.
// Only ever loaded through three-hero.js (dynamic import), so three stays off the critical path.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Mesh,
  Points,
  LineLoop,
  LatheGeometry,
  SphereGeometry,
  CylinderGeometry,
  TorusGeometry,
  PlaneGeometry,
  BoxGeometry,
  BufferGeometry,
  BufferAttribute,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  ShaderMaterial,
  LineBasicMaterial,
  DirectionalLight,
  AmbientLight,
  PointLight,
  PMREMGenerator,
  Vector2,
  Color,
  BackSide,
  DoubleSide,
  AdditiveBlending,
  ACESFilmicToneMapping,
  MathUtils,
} from 'three';

const MAX_DPR = 1.5;
const COARSE_DPR = 1.25;
const FPS_DESKTOP = 60;
const FPS_COARSE = 30;
const WARMUP_FRAMES = 20;
const MEASURE_FRAMES = 90;
const MIN_FPS = 24;
const DT_CAP = 0.05;

const yieldToMain = () => new Promise((r) => setTimeout(r, 0));

const MOTE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float h = 3.2;
    p.y = mod(p.y + uTime * (0.08 + aSeed * 0.12), h) - 0.2;
    p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.12;
    p.z += cos(uTime * 0.35 + aSeed * 21.0) * 0.12;
    vAlpha = smoothstep(-0.2, 0.4, p.y) * (1.0 - smoothstep(2.2, 3.0, p.y)) * (0.35 + aSeed * 0.5);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed) * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const MOTE_FRAG = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(1.0), smoothstep(0.5, 0.0, d) * vAlpha);
  }
`;

/** Studio softboxes baked into a PMREM env map: chrome and glass reflections with no HDR download. */
function makeEnvironment(renderer) {
  const env = new Scene();
  const disposables = [];
  const add = (geo, color, intensity, pos, rot = [0, 0, 0]) => {
    const mat = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
    const m = new Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    env.add(m);
    disposables.push(geo, mat);
  };
  const roomGeo = new BoxGeometry(30, 16, 30);
  const roomMat = new MeshBasicMaterial({ color: 0x050505, side: BackSide });
  env.add(new Mesh(roomGeo, roomMat));
  disposables.push(roomGeo, roomMat);
  add(new PlaneGeometry(22, 5), 0xffffff, 5, [0, 7.5, 0], [Math.PI / 2, 0, 0]);
  add(new PlaneGeometry(3, 12), 0xffffff, 3, [-12, 2, 0], [0, Math.PI / 2, 0]);
  add(new PlaneGeometry(2, 10), 0xffffff, 1.6, [12, 1, -4], [0, -Math.PI / 2, 0]);
  add(new PlaneGeometry(16, 2), 0xbfbfbf, 0.6, [0, -6, 6], [-Math.PI / 2, 0, 0]);
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0.03);
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());
  return target;
}

function domeGeometry(radius, height, segments) {
  const pts = [];
  const steps = 28;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(Math.cos(a) * radius + 0.0001, Math.sin(a) * height));
  }
  return new LatheGeometry(pts.reverse(), segments);
}

function platterGeometry(segments) {
  const pts = [
    [0.0, 0.0],
    [1.7, 0.0],
    [2.05, 0.06],
    [2.25, 0.16],
    [2.3, 0.2],
    [2.26, 0.22],
    [2.0, 0.12],
    [1.7, 0.06],
    [0.0, 0.06],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(pts, segments);
}

function makeMotes(count, size) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const r = Math.sqrt(Math.random()) * 2.8;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 3.2;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.8;
    seed[i] = Math.random();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const mat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: size } },
    vertexShader: MOTE_VERT,
    fragmentShader: MOTE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return new Points(geo, mat);
}

function makeOrbit(radius, opacity) {
  const n = 128;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    arr[i * 3] = Math.cos(a) * radius;
    arr[i * 3 + 2] = Math.sin(a) * radius;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(arr, 3));
  return new LineLoop(geo, new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity }));
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{onLive?:Function, onFail?:(reason:string)=>void}} hooks
 */
export async function createClocheScene(canvas, { onLive = () => {}, onFail = () => {} } = {}) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 768;
  const lowTier = coarse || small;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !lowTier,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowTier ? COARSE_DPR : MAX_DPR));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 60);
  await yieldToMain();

  const envTarget = makeEnvironment(renderer);
  scene.environment = envTarget.texture;
  await yieldToMain();

  const segments = lowTier ? 48 : 96;
  const chrome = new MeshPhysicalMaterial({ color: 0xf2f2f2, metalness: 0.85, roughness: 0.26, envMapIntensity: 1.5 });
  const glass = lowTier
    ? new MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.04,
        transparent: true,
        opacity: 0.28,
        clearcoat: 1,
        envMapIntensity: 1.6,
        side: DoubleSide,
        depthWrite: false,
      })
    : new MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 1,
        thickness: 0.45,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.4,
        specularIntensity: 1,
        side: DoubleSide,
      });

  const cloche = new Group();
  const platter = new Mesh(platterGeometry(segments), chrome);
  const dome = new Mesh(domeGeometry(1.55, 1.3, segments), glass);
  dome.position.y = 0.08;
  const rim = new Mesh(new TorusGeometry(1.56, 0.035, 12, segments), chrome);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.09;
  const stem = new Mesh(new CylinderGeometry(0.05, 0.08, 0.14, 24), chrome);
  stem.position.y = 1.43;
  const knob = new Mesh(new SphereGeometry(0.15, 32, 20), chrome);
  knob.position.y = 1.58;
  const lid = new Group();
  lid.add(dome, rim, stem, knob);
  cloche.add(platter, lid);

  const orbitA = makeOrbit(2.9, 0.22);
  const orbitB = makeOrbit(3.4, 0.1);
  orbitA.rotation.x = 0.18;
  orbitB.rotation.x = -0.12;
  const motes = makeMotes(lowTier ? 120 : 240, lowTier ? 3 : 4);
  motes.position.y = -0.2;

  const rig = new Group();
  rig.add(cloche, orbitA, orbitB, motes);
  rig.position.y = -0.55;
  scene.add(rig);

  const key = new DirectionalLight(0xffffff, 2.0);
  key.position.set(-5, 7, 8);
  const rimLight = new DirectionalLight(0xffffff, 1.2);
  rimLight.position.set(4, 3, -6);
  const cursor = new PointLight(0xffffff, 6, 12, 2);
  cursor.position.set(0, 1.5, 3.5);
  scene.add(key, rimLight, cursor, new AmbientLight(0xffffff, 0.12));

  // Sizing: keep the cloche framed on portrait screens.
  let width = 0;
  let height = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && Math.abs(h - height) < (coarse ? 160 : 1) && height) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fit = camera.aspect < 1 ? 1 / Math.max(camera.aspect, 0.45) : 1;
    camera.position.set(0, 1.4, 8.5 * Math.min(fit, 1.9));
    camera.lookAt(0, 0.35, 0);
    camera.updateProjectionMatrix();
  };
  resize();

  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    renderer.compile(scene, camera);
  }
  await yieldToMain();

  // Pointer parallax.
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const onPointer = (e) => {
    // Synthetic events without coordinates would put NaN into the rig transforms and blank the canvas.
    if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  // Loop control.
  const frameBudget = 1 / (lowTier ? FPS_COARSE : FPS_DESKTOP);
  let raf = 0;
  let last = 0;
  let acc = 0;
  let time = 0;
  let onScreen = true;
  let destroyed = false;
  let probe = { frames: 0, start: 0, done: false };

  const paused = () =>
    document.hidden || !onScreen || document.documentElement.classList.contains('motion-paused');

  const frame = (now) => {
    raf = 0;
    if (destroyed || paused()) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(DT_CAP, (now - (last || now)) / 1000);
    last = now;
    acc += dt;
    if (acc < frameBudget * 0.92) return;
    const step = Math.min(DT_CAP, acc);
    acc = 0;
    time += step;

    const k = 1 - Math.exp(-step * 4);
    smooth.x += (pointer.x - smooth.x) * k;
    smooth.y += (pointer.y - smooth.y) * k;

    cloche.rotation.y = time * 0.18 + smooth.x * 0.35;
    rig.rotation.x = MathUtils.clamp(smooth.y * 0.12, -0.15, 0.15) + 0.05;
    rig.position.y = -0.55 + Math.sin(time * 0.8) * 0.07;
    lid.position.y = 0.05 + Math.max(0, Math.sin(time * 0.45)) * 0.18;
    orbitA.rotation.y = time * 0.12;
    orbitB.rotation.y = -time * 0.08;
    motes.material.uniforms.uTime.value = time;
    cursor.position.set(smooth.x * 6, -smooth.y * 3.5 + 1.5, 3.5);

    renderer.render(scene, camera);
    probeFps(now);
  };

  const start = () => {
    if (!raf && !destroyed && !paused()) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  function probeFps(now) {
    if (probe.done) return;
    probe.frames += 1;
    if (probe.frames === WARMUP_FRAMES) probe.start = now;
    if (probe.frames === WARMUP_FRAMES + MEASURE_FRAMES) {
      probe.done = true;
      const fps = (MEASURE_FRAMES / (now - probe.start)) * 1000;
      const floor = Math.min(MIN_FPS, 1 / frameBudget - 6);
      if (fps < floor) fail(`slow ${fps.toFixed(1)}fps`);
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) start();
    else stop();
  });
  io.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  const onMotion = () => (paused() ? stop() : start());
  let resizeRaf = 0;
  const ro = new ResizeObserver(() => {
    if (destroyed) return;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      if (destroyed) return;
      resize();
      if (!raf) renderer.render(scene, camera);
    });
  });
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('motionchange', onMotion);
  const onLost = (e) => {
    e.preventDefault();
    fail('context-lost');
  };
  canvas.addEventListener('webglcontextlost', onLost);
  // Back/forward cache: a persisted page keeps its GL context, so only pause it and resume on
  // pageshow. A real unload disposes everything.
  const onPageHide = (e) => (e.persisted ? stop() : destroy());
  const onPageShow = (e) => e.persisted && start();
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    io.disconnect();
    ro.disconnect();
    cancelAnimationFrame(resizeRaf);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('motionchange', onMotion);
    canvas.removeEventListener('webglcontextlost', onLost);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    // Hand the hero back to the static poster so a restored page is never blank.
    canvas.closest('.hero3d')?.classList.remove('is-live');
    if (document.documentElement.dataset.hero3d === 'live') document.documentElement.dataset.hero3d = 'static';
    scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m?.dispose());
    });
    envTarget.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  function fail(reason) {
    onFail(reason);
    destroy();
  }

  renderer.render(scene, camera);
  onLive();
  start();
  return { destroy, start, stop };
}
