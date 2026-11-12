// Model headphone Soundbox S9: memuat .glb, memberi material yang lebih realistis,
// dan mengganti warna per bagian (varian warna).
// Model: "JBL Headphone (changeable colour)" oleh Sharma ji, CC BY 4.0. Logo pada model sudah dihapus.
import * as THREE from 'three';
import { loadGLB } from './glb.js';

export const MODEL_URL = 'models/soundbox-s9.glb';
export const CREDIT = {
  title: 'JBL Headphone (changeable colour)',
  author: 'Sharma ji',
  url: 'https://sketchfab.com/3d-models/jbl-headphone-changeable-colour-fceab67bac8f4d1f8331197305da3dda',
  authorUrl: 'https://sketchfab.com/vfxstudio987',
};

// bagian model menurut nama mesh-nya
const PARTS = [
  ['cushion', /^pCylinder1_/],
  ['inner', /^pCylinder2_/],
  ['buttons', /^(pCylinder[5-8]_|polySurface2_)/],
  ['ring', /^polySurface3_/],
  ['shell', /^polySurface1_/],
  ['band', /^polySurface4_/],
  ['pad', /^polySurface(5|6)_/],
  ['metal', /^([Jj]oint_|polySurface(7|8|10|11)_|wier_|pCylinder4_)/],
];
const partOf = name => (PARTS.find(([, re]) => re.test(name)) || ['shell'])[0];

// tekstur halus buatan sendiri: butiran kulit dan anyaman kain
function grainTexture(kind) {
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let v;
    if (kind === 'fabric') {
      const wx = Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 8), wy = Math.sin(y * Math.PI / 2) * Math.sin(x * Math.PI / 8);
      v = 128 + (((x >> 1) + (y >> 1)) % 2 ? wx : wy) * 60 + (Math.random() - 0.5) * 40;
    } else {
      v = 128 + (Math.random() - 0.5) * 90;
    }
    const i = (y * n + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if (kind !== 'fabric') { g.filter = 'blur(1px)'; g.drawImage(c, 0, 0); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(kind === 'fabric' ? 10 : 6, kind === 'fabric' ? 10 : 6);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function makeMaterials() {
  const leather = grainTexture('leather'), fabric = grainTexture('fabric');
  return {
    shell: new THREE.MeshPhysicalMaterial({ roughness: 0.48, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    ring: new THREE.MeshPhysicalMaterial({ roughness: 0.42, metalness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    cushion: new THREE.MeshPhysicalMaterial({ roughness: 0.74, metalness: 0, sheen: 0.5, sheenRoughness: 0.6, bumpMap: leather, bumpScale: 0.6 }),
    band: new THREE.MeshPhysicalMaterial({ roughness: 0.62, metalness: 0, sheen: 0.3, bumpMap: leather, bumpScale: 0.35 }),
    pad: new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, bumpMap: fabric, bumpScale: 1.4 }),
    metal: new THREE.MeshStandardMaterial({ roughness: 0.26, metalness: 1 }),
    buttons: new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 1 }),
    inner: new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, bumpMap: fabric, bumpScale: 1.2 }),
  };
}

// warna tiap varian: cangkang, cincin, bantalan, headband, bantalan kepala, logam, kain dalam
export function paint(mats, colors) {
  for (const [part, mat] of Object.entries(mats)) {
    const hex = colors[part === 'buttons' ? 'metal' : part];
    if (hex) mat.color.set(hex);
  }
}

// memuat model, mengganti material, menormalkan ukuran (tinggi = 1) dan memusatkannya.
// Semua mesh dipindah ke satu grup datar supaya headband bisa "dilebarkan" (efek modular di bagian pre-order).
export async function loadHeadphone(mats, onProgress) {
  const raw = await loadGLB(MODEL_URL, { onProgress });
  raw.updateMatrixWorld(true);
  const flat = new THREE.Group(), meshes = [];
  raw.traverse(o => { if (o.isMesh) meshes.push(o); });
  const box = new THREE.Box3(), c = new THREE.Vector3();
  for (const m of meshes) {
    m.material = mats[partOf(m.name)];
    flat.attach(m);
  }
  flat.updateMatrixWorld(true);
  const all = new THREE.Box3().setFromObject(flat);
  const size = all.getSize(new THREE.Vector3()), center = all.getCenter(new THREE.Vector3());
  // tiap mesh dikelompokkan: headband dan earcup kiri/kanan. Titik putar tiap earcup = tengah earcup itu sendiri.
  const sideOf = m => (box.setFromObject(m).getCenter(c).z < center.z ? -1 : 1);
  const isBand = m => { const pt = partOf(m.name); return pt === 'band' || pt === 'pad'; };
  const bandG = new THREE.Group(), cupG = { '-1': new THREE.Group(), '1': new THREE.Group() };
  const cupB = { '-1': new THREE.Box3(), '1': new THREE.Box3() };
  for (const m of meshes) if (!isBand(m)) cupB[sideOf(m)].union(new THREE.Box3().setFromObject(m));
  for (const sd of [-1, 1]) cupG[sd].position.copy(cupB[sd].getCenter(new THREE.Vector3()));
  flat.add(bandG, cupG[-1], cupG[1]); flat.updateMatrixWorld(true);
  // ukuran penampang headband asli: tebal (diukur di puncak lengkungan) dan lebar depan-belakang
  let bandDepth = 0, tMin = Infinity, tMax = -Infinity;
  const v = new THREE.Vector3(), bb = new THREE.Box3();
  for (const m of meshes) {
    if (!isBand(m)) continue;
    bb.union(new THREE.Box3().setFromObject(m));
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (Math.abs(v.z - center.z) < size.y * 0.03) { tMin = Math.min(tMin, v.y); tMax = Math.max(tMax, v.y); }
    }
  }
  bandDepth = bb.max.x - bb.min.x;
  const bandThick = Math.max(size.y * 0.03, Math.min(size.y * 0.09, (tMax - tMin) * 1.2));
  // ujung atas penyangga earcup (tempat headband menyambung), relatif ke titik putar earcup
  const tip = { '-1': new THREE.Vector3(), '1': new THREE.Vector3() };
  for (const sd of [-1, 1]) {
    const top = cupB[sd].max.y, acc = new THREE.Vector3(); let n = 0;
    for (const m of meshes) {
      if (isBand(m) || sideOf(m) !== sd) continue;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        if (v.y > top - size.y * 0.03) { acc.add(v); n++; }
      }
    }
    tip[sd].copy(n ? acc.divideScalar(n) : cupB[sd].getCenter(new THREE.Vector3())).setY(top).sub(cupG[sd].position);
  }
  for (const m of meshes) (isBand(m) ? bandG : cupG[sideOf(m)]).attach(m);
  const cupBox = cupB[-1].clone().union(cupB[1]);
  const cupC = cupBox.getCenter(new THREE.Vector3());
  const base = { '-1': cupG[-1].position.clone(), '1': cupG[1].position.clone() };
  const d = (Math.abs(base[-1].z - center.z) + Math.abs(base[1].z - center.z)) / 2;
  const k = 1 / size.y;
  flat.scale.setScalar(k);
  flat.position.copy(center).multiplyScalar(-k);
  const holder = new THREE.Group();
  holder.add(flat);
  holder.userData.cupDist = d * k;
  holder.userData.cupY = (cupC.y - center.y) * k;
  holder.userData.cupH = cupBox.getSize(new THREE.Vector3()).y * k;
  holder.userData.cupHalfW = cupB[1].getSize(new THREE.Vector3()).z / 2 * k;
  holder.userData.cups = [cupG[-1], cupG[1]];

  // headband pengganti untuk posisi lebar: lengkungan utuh dari ujung penyangga kiri ke kanan,
  // dengan tebal dan lebar yang sama seperti aslinya, jadi tidak pernah terputus atau gepeng
  const procBand = new THREE.Group(); procBand.visible = false; flat.add(procBand);
  const rrect = (w, h, r, oy = 0) => {
    const sh = new THREE.Shape(), x0 = -w / 2, y0 = -h / 2 + oy;
    r = Math.min(r, w / 2, h / 2);
    sh.moveTo(x0 + r, y0); sh.lineTo(x0 + w - r, y0); sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    sh.lineTo(x0 + w, y0 + h - r); sh.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    sh.lineTo(x0 + r, y0 + h); sh.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    return sh;
  };
  const tipAt = sd => {                                             // posisi ujung penyangga setelah earcup digeser dan diputar
    const p = tip[sd].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), cupG[sd].rotation.y);
    return p.add(cupG[sd].position);
  };
  function buildBand() {
    procBand.children.forEach(o => o.geometry.dispose()); procBand.clear();
    const L = tipAt(-1), R = tipAt(1), zL = L.z, zR = R.z, xMid = (L.x + R.x) / 2;
    const yTop = Math.min(L.y, R.y) - bandThick * 0.35;           // sedikit masuk ke penyangga
    const a = (zR - zL) / 2, cz = (zL + zR) / 2, H = a * 1.05;
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const th = Math.PI * (1 - i / 64), cs = Math.cos(th), sn = Math.sin(th);
      pts.push(new THREE.Vector3(xMid, yTop + H * Math.pow(sn, 0.8), cz + a * Math.sign(cs) * Math.pow(Math.abs(cs), 0.85)));
    }
    const path = new THREE.CatmullRomCurve3(pts);
    const opt = { steps: 160, bevelEnabled: false, extrudePath: path };
    const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(bandDepth, bandThick, bandThick * 0.45), opt), mats.band);
    const pad = new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(bandDepth * 0.72, bandThick * 0.55, bandThick * 0.25, bandThick * 0.72), opt), mats.pad);
    procBand.add(shell, pad);
  }
  let wideNow = 1, built = '';
  // f = 1 bentuk asli; f > 1 kedua earcup bergeser keluar dan headband diganti lengkungan yang lebih lebar
  holder.userData.setWide = f => {
    if (Math.abs(f - wideNow) < 1e-4) return;
    wideNow = f;
    const wide = f > 1.02;
    bandG.visible = !wide; procBand.visible = wide;
    cupG[-1].position.z = base[-1].z - (wide ? (f - 1) * d : 0);
    cupG[1].position.z = base[1].z + (wide ? (f - 1) * d : 0);
    rebuild();
  };
  function rebuild() {
    if (!procBand.visible) return;
    const key = wideNow.toFixed(3) + '|' + cupG[1].rotation.y.toFixed(3);
    if (key !== built) { built = key; buildBand(); }
  }
  // memutar earcup di sumbu tegak (melawan efek perspektif saat earcup berada jauh di tepi layar)
  holder.userData.setCupYaw = a => { cupG[1].rotation.y = a; cupG[-1].rotation.y = -a; rebuild(); };
  return holder;
}
