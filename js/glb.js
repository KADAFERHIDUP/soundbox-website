// Pembaca file .glb (glTF 2.0 biner) untuk three.js, tanpa library tambahan.
// Mendukung: hierarki node, material PBR lengkap (warna, normal, kasar/logam, emisi, oklusi),
// alpha BLEND/MASK, KHR_texture_transform, KHR_materials_transmission/clearcoat,
// dan KHR_mesh_quantization (atribut bilangan bulat yang dinormalisasi).
import * as THREE from 'three';

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
const WRAP = { 33071: THREE.ClampToEdgeWrapping, 33648: THREE.MirroredRepeatWrapping, 10497: THREE.RepeatWrapping };
const KNOWN = ['KHR_mesh_quantization', 'KHR_texture_transform', 'KHR_materials_transmission', 'KHR_materials_clearcoat'];

export async function loadGLB(url, { onProgress } = {}) {
  const buf = await fetchBuffer(url, onProgress);
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Bukan file .glb');
  let off = 12, json = null, bin = null;
  while (off < buf.byteLength) {
    const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
    else if (type === 0x004e4942) bin = new Uint8Array(buf, off + 8, len);
    off += 8 + len;
  }
  const missing = (json.extensionsRequired || []).filter(e => !KNOWN.includes(e));
  if (missing.length) throw new Error('Model memakai ekstensi: ' + missing.join(', '));

  const view = i => { const v = json.bufferViews[i]; return { bytes: bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength), stride: v.byteStride || 0 }; };
  const accessor = i => {
    const a = json.accessors[i], T = COMP[a.componentType], n = SIZE[a.type];
    const out = new T(a.count * n);
    if (a.bufferView !== undefined) {
      const { bytes, stride } = view(a.bufferView);
      const start = a.byteOffset || 0, el = n * T.BYTES_PER_ELEMENT;
      if ((!stride || stride === el) && (bytes.byteOffset + start) % T.BYTES_PER_ELEMENT === 0) out.set(new T(bytes.buffer, bytes.byteOffset + start, a.count * n));
      else {
        const copy = bytes.slice(start, start + (a.count - 1) * (stride || el) + el);
        for (let k = 0; k < a.count; k++) out.set(new T(copy.buffer, k * (stride || el), n), k * n);
      }
    }
    return { array: out, itemSize: n, normalized: !!a.normalized, type: a.componentType };
  };

  // gambar dibaca sekali, tekstur dibuat per pemakaian (warna memakai sRGB, data memakai linear)
  const bitmaps = await Promise.all((json.images || []).map(im => {
    const { bytes } = view(im.bufferView);
    return decodeImage(new Blob([bytes], { type: im.mimeType }));
  }));
  const texture = (info, srgb) => {
    if (!info) return null;
    const t = json.textures[info.index], s = (json.samplers || [])[t.sampler] || {};
    const tex = new THREE.Texture(bitmaps[t.source]);
    tex.flipY = false;
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = WRAP[s.wrapS] ?? THREE.RepeatWrapping;
    tex.wrapT = WRAP[s.wrapT] ?? THREE.RepeatWrapping;
    tex.anisotropy = 4;
    const tt = info.extensions?.KHR_texture_transform;
    if (tt) {
      if (tt.offset) tex.offset.fromArray(tt.offset);
      if (tt.scale) tex.repeat.fromArray(tt.scale);
      if (tt.rotation) tex.rotation = -tt.rotation;
    }
    if (info.texCoord) tex.channel = info.texCoord;
    tex.needsUpdate = true;
    return tex;
  };

  const materials = (json.materials || []).map(m => {
    const p = m.pbrMetallicRoughness || {}, ext = m.extensions || {};
    const c = p.baseColorFactor || [1, 1, 1, 1];
    const physical = ext.KHR_materials_transmission || ext.KHR_materials_clearcoat;
    const mat = new (physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({
      name: m.name || '',
      color: new THREE.Color().setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace),
      metalness: p.metallicFactor ?? 1,
      roughness: p.roughnessFactor ?? 1,
      side: m.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      transparent: m.alphaMode === 'BLEND',
      opacity: m.alphaMode === 'BLEND' ? c[3] : 1,
      alphaTest: m.alphaMode === 'MASK' ? (m.alphaCutoff ?? 0.5) : 0,
      depthWrite: m.alphaMode !== 'BLEND',
    });
    mat.map = texture(p.baseColorTexture, true);
    mat.metalnessMap = mat.roughnessMap = texture(p.metallicRoughnessTexture, false);
    if (m.normalTexture) {
      mat.normalMap = texture(m.normalTexture, false);
      const s = m.normalTexture.scale ?? 1;
      mat.normalScale.set(s, -s);
    }
    if (m.occlusionTexture) { mat.aoMap = texture(m.occlusionTexture, false); mat.aoMapIntensity = m.occlusionTexture.strength ?? 1; }
    if (m.emissiveFactor) mat.emissive.setRGB(...m.emissiveFactor, THREE.LinearSRGBColorSpace);
    mat.emissiveMap = texture(m.emissiveTexture, true);
    if (ext.KHR_materials_transmission) mat.transmission = ext.KHR_materials_transmission.transmissionFactor ?? 0;
    if (ext.KHR_materials_clearcoat) {
      mat.clearcoat = ext.KHR_materials_clearcoat.clearcoatFactor ?? 0;
      mat.clearcoatRoughness = ext.KHR_materials_clearcoat.clearcoatRoughnessFactor ?? 0;
    }
    return mat;
  });
  const fallback = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });

  const KEYS = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', TEXCOORD_1: 'uv1', COLOR_0: 'color' };
  const meshes = (json.meshes || []).map(m => m.primitives.filter(pr => (pr.mode ?? 4) === 4).map(pr => {
    const g = new THREE.BufferGeometry();
    for (const [name, idx] of Object.entries(pr.attributes)) {
      const key = KEYS[name];
      if (!key) continue;
      const a = accessor(idx);
      let arr = a.array;
      if (a.normalized && NORM[a.type]) { const d = NORM[a.type]; arr = Float32Array.from(arr, v => Math.max(v / d, -1)); }
      else if (!(arr instanceof Float32Array)) arr = Float32Array.from(arr);
      g.setAttribute(key, new THREE.BufferAttribute(arr, a.itemSize));
    }
    if (g.attributes.color && g.attributes.color.itemSize === 4) g.userData.colorAlpha = true;
    if (pr.indices !== undefined) g.setIndex(new THREE.BufferAttribute(accessor(pr.indices).array, 1));
    if (!g.attributes.normal) g.computeVertexNormals();
    let mat = pr.material !== undefined ? materials[pr.material] : fallback;
    if (g.attributes.color) { mat = mat.clone(); mat.vertexColors = true; }
    return { geometry: g, material: mat };
  }));

  const build = i => {
    const n = json.nodes[i], obj = new THREE.Group();
    obj.name = n.name || '';
    if (n.matrix) new THREE.Matrix4().fromArray(n.matrix).decompose(obj.position, obj.quaternion, obj.scale);
    if (n.translation) obj.position.fromArray(n.translation);
    if (n.rotation) obj.quaternion.fromArray(n.rotation);
    if (n.scale) obj.scale.fromArray(n.scale);
    if (n.mesh !== undefined) meshes[n.mesh].forEach(p => { const m = new THREE.Mesh(p.geometry, p.material); m.name = obj.name; obj.add(m); });
    (n.children || []).forEach(c => obj.add(build(c)));
    return obj;
  };
  const scene = new THREE.Group();
  (json.scenes[json.scene || 0].nodes || []).forEach(i => scene.add(build(i)));
  scene.userData.asset = json.asset;
  return scene;
}

// Safari (iPhone/iPad/Mac) punya masalah dengan ImageBitmap di WebGL dan menolak sebagian opsinya,
// jadi di Safari gambar dibaca lewat elemen <img> biasa. Browser lain memakai createImageBitmap.
const SAFARI = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent);
async function decodeImage(blob) {
  if (!SAFARI && !window.__glbUseImg && typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch { /* lanjut ke <img> */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await (img.decode ? img.decode() : new Promise((ok, no) => { img.onload = ok; img.onerror = no; }));
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// unduh dengan laporan kemajuan (0..1) kalau server memberi ukuran file
async function fetchBuffer(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat ' + url + ' (' + res.status + ')');
  const total = +res.headers.get('content-length') || 0;
  if (!onProgress || !res.body || !total) { const b = await res.arrayBuffer(); onProgress?.(1); return b; }
  const reader = res.body.getReader(), parts = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); got += value.length;
    onProgress(Math.min(got / total, 1));
  }
  const out = new Uint8Array(got);
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out.buffer;
}
