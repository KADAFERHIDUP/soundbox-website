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
  for (const m of meshes) {
    box.setFromObject(m).getCenter(c);
    const part = partOf(m.name);
    m.userData.side = part === 'band' || part === 'pad' ? 0 : Math.sign(c.z);
    m.userData.p0 = m.position.clone(); m.userData.s0 = m.scale.clone();
  }
  const all = new THREE.Box3().setFromObject(flat);
  const size = all.getSize(new THREE.Vector3()), center = all.getCenter(new THREE.Vector3());
  const k = 1 / size.y;
  flat.scale.setScalar(k);
  flat.position.copy(center).multiplyScalar(-k);
  const holder = new THREE.Group();
  holder.add(flat);
  let wideNow = 1;
  // f = 1 normal; f > 1 headband lebih lebar dan kedua earcup bergeser keluar
  holder.userData.setWide = f => {
    if (Math.abs(f - wideNow) < 1e-4) return;
    wideNow = f;
    for (const m of meshes) {
      const { side, p0, s0 } = m.userData;
      if (side === 0) { m.position.z = p0.z * f; m.scale.z = s0.z * f; }
      else m.position.z = p0.z + side * (f - 1) * 1.75;
    }
  };
  return holder;
}
