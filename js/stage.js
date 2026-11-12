// Panggung 3D: headphone di tengah dan dua tebing batu pasir di kiri-kanan (dibuat dari kode, tanpa foto).
// Posisi headphone diatur lewat "pose" yang diubah oleh scroll; semua gerakan dihaluskan.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { makeMaterials, paint, loadHeadphone } from './headphone.js';

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

/* ---------- noise 3D (simplex) untuk bentuk batu ---------- */
const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
function makeNoise(seed) {
  const p = new Uint8Array(512), perm = [...Array(256).keys()];
  let s = seed;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const F3 = 1 / 3, G3 = 1 / 6;
  return (x, y, z) => {
    const t = (x + y + z) * F3, i = Math.floor(x + t), j = Math.floor(y + t), k = Math.floor(z + t);
    const t0 = (i + j + k) * G3, x0 = x - i + t0, y0 = y - j + t0, z0 = z - k + t0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
    else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
    const pts = [[x0, y0, z0, 0, 0, 0], [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1], [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2], [x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3, 1, 1, 1]];
    let n = 0;
    for (const [dx, dy, dz, a, b, c] of pts) {
      let tt = 0.6 - dx * dx - dy * dy - dz * dz;
      if (tt > 0) { const g = grad3[p[(i + a) + p[(j + b) + p[(k + c) & 255] & 255] & 255] % 12]; tt *= tt; n += tt * tt * (g[0] * dx + g[1] * dy + g[2] * dz); }
    }
    return 32 * n;
  };
}

/* ---------- tebing batu pasir ---------- */
// Satu tiang tinggi per sisi: silinder resolusi tinggi yang permukaannya digerus noise
// dengan lapisan horizontal (seperti tebing pasir yang terkikis angin) dan lubang-lubang kecil.
function cliffGeometry(noise, seed, radial, rows) {
  const g = new THREE.CylinderGeometry(1, 1, 12, radial, rows, true);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), v = new THREE.Vector3();
  const deep = new THREE.Color('#24120a'), dark = new THREE.Color('#5a3019'), mid = new THREE.Color('#99643a'), light = new THREE.Color('#d6ad80'), tmp = new THREE.Color();
  const o = seed * 3.7;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x), y = v.y;
    const cx = Math.cos(a), cz = Math.sin(a);
    // bentuk besar: tonjolan dan lekukan sepanjang tebing
    let r = 1 + 0.42 * noise(cx * 0.9 + o, y * 0.2, cz * 0.9);
    r += 0.16 * noise(cx * 2.2, y * 0.6 + o, cz * 2.2);
    // lapisan erosi horizontal (noise memanjang ke samping)
    const layer = noise(cx * 1.6 + o, y * 2.3, cz * 1.6);
    r += 0.075 * layer;
    const groove = Math.pow(Math.abs(noise(cx * 1.4, y * 4.6 + o, cz * 1.4)), 0.6);
    r -= 0.05 * (1 - groove);
    // lubang dan butiran
    const pit = noise(cx * 7 + o, y * 7, cz * 7);
    r -= 0.035 * Math.max(0, pit);
    r += 0.012 * noise(cx * 22, y * 22, cz * 22 + o);
    pos.setXYZ(i, cx * r, y, cz * r);
    // warna: bagian dalam celah gelap, tonjolan terang
    const f = THREE.MathUtils.clamp(0.42 + (r - 1) * 1.5 + layer * 0.18 - Math.max(0, pit) * 0.6 + noise(cx * 12, y * 12, cz * 12) * 0.08, 0, 1);
    if (f < 0.25) tmp.copy(deep).lerp(dark, f / 0.25);
    else if (f < 0.6) tmp.copy(dark).lerp(mid, (f - 0.25) / 0.35);
    else tmp.copy(mid).lerp(light, (f - 0.6) / 0.4);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function buildCliff(noise, side, radial, rows) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.35 });
  const m = new THREE.Mesh(cliffGeometry(noise, side > 0 ? 11 : 4, radial, rows), mat);
  m.scale.set(2.1, 1, 1.6);
  const group = new THREE.Group(); group.add(m);
  return group;
}

export function createStage(canvas, { onProgress } = {}) {
  const mobile = matchMedia('(max-width: 700px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 1.75));
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
  const spot = new THREE.SpotLight(0xfff1dd, 0, 30, 0.35, 0.6); spot.position.set(0, 7, 6); scene.add(spot); scene.add(spot.target);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const visH = () => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const visW = () => visH() * camera.aspect;

  // tebing
  const noise = makeNoise(7);
  const cliffs = [buildCliff(noise, -1, mobile ? 96 : 160, mobile ? 220 : 360), buildCliff(noise, 1, mobile ? 96 : 160, mobile ? 220 : 360)];
  cliffs.forEach(c => scene.add(c));

  // headphone
  const mats = makeMaterials();
  const hp = new THREE.Group(), tilt = new THREE.Group();
  hp.add(tilt); scene.add(hp);
  let model = null;

  const cur = { x: 0, y: 0, size: 0.7, rx: 0.2, ry: 0.9, rz: 0, close: 0, light: 0, op: 1, spread: 0, wide: 1 };
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
    const k = calm.matches ? 1 : 1 - Math.exp(-dt * 5.5), kf = calm.matches ? 1 : 1 - Math.exp(-dt * 9);
    for (const key of ['x', 'y', 'size', 'rx', 'ry', 'rz', 'op', 'spread', 'wide']) cur[key] = ease(cur[key], tgt[key], k);
    cur.close = ease(cur.close, tgt.close, kf);
    cur.light = ease(cur.light, tgt.light, calm.matches ? 1 : 1 - Math.exp(-dt * 1.6));
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

    // tebing: tepi dalam di 17% layar (HP: 12%), "close" menggeser keduanya menutupi layar
    const edge = W * ease(mobile ? 0.1 : 0.13, -0.1, cur.spread);
    cliffs.forEach((c, i) => {
      const s = i ? 1 : -1;
      const sc = Math.max(1, H / 4.6);
      const open = W / 2 - edge + (mobile ? 2.45 : 2.9) * sc, shut = 1.6 * sc;
      c.position.set(s * ease(open, shut, cur.close), 0, -1.2);
      c.rotation.y = i * 2.1 + (calm.matches ? 0 : now / 60000);
      c.scale.setScalar(sc);
    });

    // cahaya: intro gelap -> terang
    const L = cur.light;
    hemi.intensity = 0.05 + 0.75 * L;
    key.intensity = 0.2 + 2.4 * L;
    rim.intensity = 1.4;
    spot.intensity = (1 - L) * 60;
    scene.environmentIntensity = 0.1 + 0.55 * L;
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
