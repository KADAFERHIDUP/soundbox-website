// Panggung 3D: headphone di tengah. Tebing batu adalah foto (lapisan HTML di belakang kanvas).
// Posisi headphone diatur lewat "pose" yang diubah oleh scroll; semua gerakan dihaluskan.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { makeMaterials, paint, loadHeadphone } from './headphone.js';

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

export function createStage(canvas, { onProgress } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x6b4a33, 0.8); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe9cf, 2.6); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.4); rim.position.set(-6, 3, -4); scene.add(rim);
  const spot = new THREE.SpotLight(0xfff1dd, 0, 30, 0.22, 0.85); spot.position.set(0, 7, 6); scene.add(spot); scene.add(spot.target);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const visH = () => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const visW = () => visH() * camera.aspect;

  // headphone
  const mats = makeMaterials();
  const hp = new THREE.Group(), tilt = new THREE.Group();
  hp.add(tilt); scene.add(hp);
  let model = null;

  const cur = { x: 0, y: 0, size: 0.7, rx: 0.2, ry: 0.9, rz: 0, light: 0, op: 1, wide: 1 };
  const tgt = { ...cur };
  let spin = 0, spinAngle = 0, mx = 0, my = 0, dragging = false;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // warna: transisi halus dari warna lama ke warna baru
  let fromC = null, toC = null, mixT = 1;
  const parts = Object.keys(mats);
  function setVariant(colors, animate = true) {
    if (!animate || !toC) { paint(mats, colors); toC = colors; mixT = 1; return; }
    fromC = Object.fromEntries(parts.map(p => [p, mats[p].color.clone()]));
    toC = colors; mixT = 0;
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let last = performance.now(), running = true;
  const ease = (a, b, k) => a + (b - a) * k;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!running) return;
    const k = calm.matches ? 1 : 1 - Math.exp(-dt * 8.5);
    for (const key of ['x', 'y', 'size', 'rx', 'ry', 'rz', 'op', 'wide']) cur[key] = ease(cur[key], tgt[key], k);
    cur.light = ease(cur.light, tgt.light, calm.matches ? 1 : 1 - Math.exp(-dt * 1.15));
    if (spin && !calm.matches) spinAngle += spin * dt;
    else if (!spin && !dragging) { const home = Math.round(spinAngle / (Math.PI * 2)) * Math.PI * 2; spinAngle = ease(spinAngle, home, 1 - Math.exp(-dt * 2)); }

    if (mixT < 1 && fromC) {
      mixT = Math.min(1, mixT + dt * 2.2);
      const t = mixT * mixT * (3 - 2 * mixT);
      for (const p of parts) { const hex = toC[p === 'buttons' ? 'metal' : p]; if (hex) mats[p].color.copy(fromC[p]).lerp(new THREE.Color(hex), t); }
    }

    const H = visH(), W = visW();
    // headphone
    hp.position.set(cur.x * W, cur.y * H + (calm.matches ? 0 : Math.sin(now / 900) * 0.03 * cur.size * H), 0);
    hp.scale.setScalar(Math.max(cur.size * H, 0.0001) * cur.op);
    hp.visible = cur.op > 0.01;
    tilt.rotation.set(cur.rx + my * 0.12, cur.ry + spinAngle + mx * 0.25, cur.rz);
    model?.userData.setWide?.(cur.wide);

    // cahaya: intro gelap -> terang
    const L = cur.light;
    // L = 0: gelap, hanya sorot tipis dari atas dan kilau di tepi; L = 1: terang penuh
    const L2 = L * L;
    hemi.intensity = 0.01 + 0.79 * L2;
    key.intensity = 0.02 + 2.58 * L2;
    rim.intensity = 1.4 + (1 - L) * 2.6;
    spot.intensity = (1 - L) * 22;
    scene.environmentIntensity = 0.02 + 0.63 * L2;
    renderer.toneMappingExposure = 0.55 + 0.37 * L;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; last = performance.now(); });

  const ready = loadHeadphone(mats, onProgress).then(m => { model = m; tilt.add(m); return m; });

  return {
    ready,
    setVariant,
    pose(p) { Object.assign(tgt, p); },
    jump(p) { Object.assign(tgt, p); Object.assign(cur, p); },
    setSpin(v) { spin = v; },
    addYaw(d) { spinAngle += d; },
    setDragging(v) { dragging = v; },
    light(v) { tgt.light = v; },
    renderer,
  };
}
