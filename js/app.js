import { SHOP, VARIANTS, EDITIONS, PAYMENTS, SPECS, FAQ } from './data.js';
import { CREDIT } from './headphone.js';
import * as api from './api.js';
import * as sound from './sound.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const shortRp = n => (Math.floor(n / 1e4) / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + 'jt';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* tidak tersedia */ } },
};
const mobile = matchMedia('(max-width: 760px)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

// data (bisa diganti dari backend)
let variants = VARIANTS.map(v => ({ ...v, stock: null, available: true }));
let editions = EDITIONS.map(e => ({ ...e, available: true }));
let orderCount = null;
const saved = store.get('sb-pick', {});
let pick = {
  variant: variants.some(v => v.id === saved.variant) ? saved.variant : 'sand',
  edition: editions.some(e => e.id === saved.edition) ? saved.edition : (editions.find(e => e.best) || editions[0]).id,
};
const V = () => variants.find(v => v.id === pick.variant) || variants[0];
const E = () => editions.find(e => e.id === pick.edition) || editions[0];
let stage = null;

function toast(text) {
  const t = $('#toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800);
}
function openWhatsApp(text) {
  const url = `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
  const w = window.open(url, '_blank', 'noopener');
  if (!w) location.href = url;
}

/* ---------------- tampilan statis ---------------- */
function renderTexts() {
  const from = Math.min(...editions.map(e => e.price));
  $$('[data-price-text]').forEach(el => { el.textContent = 'mulai ' + rupiah(from); });
  $$('[data-price-short]').forEach(el => { el.textContent = shortRp(from); });
  $$('[data-ship]').forEach(el => { el.textContent = SHOP.shipping; });
  $('#order-count').textContent = orderCount === null ? 'dibuka' : orderCount.toLocaleString('id-ID');
}
function renderSpecs() {
  $('#spec-table').innerHTML = SPECS.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#faq-list').innerHTML = FAQ.map(([q, a]) => `<details class="reveal"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const wa = `https://wa.me/${SHOP.whatsapp}`;
  $('#foot-contact').innerHTML = `<li><a href="${wa}" target="_blank" rel="noopener">WhatsApp ${SHOP.whatsappLabel}</a></li><li><a href="mailto:${SHOP.email}">${SHOP.email}</a></li><li>${esc(SHOP.city)}</li>`;
  $('#credit-link').textContent = '“' + CREDIT.title + '”'; $('#credit-link').href = CREDIT.url;
  $('#credit-author').textContent = CREDIT.author; $('#credit-author').href = CREDIT.authorUrl;
  $('#year').textContent = new Date().getFullYear();
}
const stockText = v => {
  if (!v.available || v.stock === 0) return { text: 'Batch ini habis · masuk waitlist', low: true };
  if (v.stock === null) return { text: 'Tersedia untuk batch pertama', low: false };
  if (v.stock <= 10) return { text: `Sisa ${v.stock} unit di batch ini`, low: true };
  return { text: `${v.stock} unit tersedia di batch ini`, low: false };
};
const soldOut = v => !v.available || v.stock === 0;

function renderColors() {
  $('#swatches').innerHTML = variants.map(v => `<button class="swatch${soldOut(v) ? ' out' : ''}" type="button" role="radio" aria-checked="${v.id === pick.variant}" data-variant="${v.id}" style="background:${v.swatch}" aria-label="${esc(v.name)}${soldOut(v) ? ' (habis)' : ''}" title="${esc(v.name)}"></button>`).join('');
  const v = V(), st = stockText(v);
  $('#color-name').textContent = v.name;
  $('#color-note').textContent = '// ' + v.note;
  $('#color-stock').textContent = '// ' + st.text;
  $('#color-stock').classList.toggle('low', st.low);
  $('#color-buy').textContent = soldOut(v) ? 'Masuk waitlist warna ini' : 'Pre-order warna ini';
  $('#color-buy').dataset.open = soldOut(v) ? 'waitlist' : 'preorder';
}
function renderEditions() {
  $('#edition-grid').innerHTML = editions.map(e => `
    <article class="card edition reveal${e.best ? ' best' : ''}">
      <p class="ed-tag">// ${esc(e.tag)}</p>
      <h3 class="ed-name">${esc(e.name)}</h3>
      <p class="ed-price">${rupiah(e.price)}</p>
      <ul class="ed-items">${e.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <button class="btn ${e.best ? '' : 'dark'}" type="button" data-open="preorder" data-edition="${e.id}" ${e.available ? '' : 'disabled'}>${e.available ? 'Pilih ' + esc(e.name) : 'Belum tersedia'}</button>
    </article>`).join('');
}
function renderSheet() {
  $('#po-swatches').innerHTML = '<legend>Warna</legend>' + variants.map(v => `<label title="${esc(v.name)}"><input type="radio" name="variant" value="${v.id}" ${v.id === pick.variant ? 'checked' : ''} ${soldOut(v) ? 'disabled' : ''}><span style="--c:${v.swatch}" aria-label="${esc(v.name)}"></span></label>`).join('');
  $('#po-editions').innerHTML = '<legend>Edisi</legend>' + editions.map(e => `<label><input type="radio" name="edition" value="${e.id}" ${e.id === pick.edition ? 'checked' : ''} ${e.available ? '' : 'disabled'}><span>${esc(e.name)} <small>${shortRp(e.price)}</small></span></label>`).join('');
  $('#po-pay').innerHTML = '<legend>Pembayaran</legend>' + PAYMENTS.map((p, i) => `<label><input type="radio" name="pay" value="${esc(p)}" ${i === 0 ? 'checked' : ''}><span>${esc(p)}</span></label>`).join('');
  $('#wl-variant').innerHTML = variants.map(v => `<option value="${v.id}" ${v.id === pick.variant ? 'selected' : ''}>${esc(v.name)}</option>`).join('');
  updateSheet();
}
function updateSheet() {
  const f = $('#po-form'), v = V(), e = E();
  const qty = Math.max(1, Math.min(5, parseInt(f.qty.value, 10) || 1));
  $('#po-variant').textContent = v.name;
  $('#po-img').src = `img/variants/${v.id}.webp`; $('#po-img').alt = `Soundbox S9 warna ${v.name}`;
  $('#po-total').textContent = rupiah(e.price * qty);
}

function setVariant(id, { animate = true, silent = false } = {}) {
  const v = variants.find(x => x.id === id); if (!v) return;
  pick.variant = id; store.set('sb-pick', pick);
  stage?.setVariant(v.colors, animate);
  $$('.still').forEach(i => { i.src = `img/variants/${id}.webp`; i.alt = `Soundbox S9 warna ${v.name}`; });
  renderColors();
  const r = $(`#po-swatches input[value="${id}"]`); if (r) r.checked = true;
  $('#wl-variant').value = id;
  updateSheet();
  if (!silent) sound.tick(1 + variants.indexOf(v) * 0.06);
}

/* ---------------- pose 3D per bagian ---------------- */
// x, y: posisi (bagian dari lebar/tinggi layar), size: tinggi headphone dibanding tinggi layar
const FRONT = Math.PI / 2;
const POSES = {
  desk: {
    hero: { x: 0, y: 0.03, size: 0.66, rx: 0.16, ry: 0.72, rz: -0.06, op: 1, spread: 0, wide: 1 },
    specs: { x: -0.17, y: -0.05, size: 1.08, rx: 0.06, ry: 0.22, rz: 0.12, op: 1, spread: 0, wide: 1 },
    materials: { x: 0.2, y: -0.1, size: 0.9, rx: 0.42, ry: 1.3, rz: -0.28, op: 1, spread: 0, wide: 1 },
    colors: { x: 0.17, y: 0.02, size: 0.6, rx: 0.14, ry: 0.85, rz: 0, op: 1, spread: 0, wide: 1, spin: 0.35 },
    tech: { x: 0.33, y: 0.27, size: 0.32, rx: 0.2, ry: 2.4, rz: 0, op: 1, spread: 1, wide: 1 },
    editions: { x: -0.33, y: 0.27, size: 0.32, rx: 0.2, ry: 0.6, rz: 0, op: 1, spread: 1, wide: 1 },
    reviews: { x: 0.33, y: 0.3, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    faq: { x: 0.33, y: 0.3, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    track: { x: 0.33, y: 0.3, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    preorder: { x: 0, y: 0, size: 0.66, rx: 0, ry: FRONT, rz: 0, op: 1, spread: 1, wide: 1, fit: 0.25, anchor: 1 },  // anchor: menempel ke tombol pre-order  // fit: earcup mengapit tombol, sejajar gelombang
  },
  mobile: {
    hero: { x: 0, y: 0.06, size: 0.4, rx: 0.16, ry: 0.72, rz: -0.06, op: 1, spread: 0, wide: 1 },
    specs: { x: 0.08, y: 0.11, size: 0.66, rx: 0.06, ry: 0.18, rz: 0.12, op: 1, spread: 0, wide: 1 },
    materials: { x: -0.04, y: 0.1, size: 0.62, rx: 0.32, ry: 1.05, rz: -0.18, op: 1, spread: 0, wide: 1 },
    colors: { x: 0, y: 0.2, size: 0.4, rx: 0.14, ry: 0.85, rz: 0, op: 1, spread: 0, wide: 1, spin: 0.35 },
    tech: { x: 0, y: 0.25, size: 0.3, rx: 0.2, ry: 2.4, rz: 0, op: 0, spread: 1, wide: 1 },
    editions: { x: 0, y: 0.25, size: 0.3, rx: 0.2, ry: 0.6, rz: 0, op: 0, spread: 1, wide: 1 },
    reviews: { x: 0, y: 0.25, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    faq: { x: 0, y: 0.25, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    track: { x: 0, y: 0.25, size: 0.3, rx: 0.2, ry: 1.2, rz: 0, op: 0, spread: 1, wide: 1 },
    preorder: { x: 0, y: 0, size: 0.36, rx: 0, ry: FRONT, rz: 0, op: 1, spread: 1, wide: 1, fit: 0.33, anchor: 1 },
  },
};
// transisi whip-pan (kamera menyapu melewati tebing) saat pindah antara bagian ini, ke dua arah
const WIPES = new Set(['hero|specs', 'specs|materials', 'materials|colors', 'colors|tech', 'faq|preorder', 'track|preorder']);
const isWipe = (x, y) => WIPES.has(`${x}|${y}`) || WIPES.has(`${y}|${x}`);
const KEYS = ['x', 'y', 'size', 'rx', 'ry', 'rz', 'op', 'spread', 'wide', 'fit', 'anchor'];
const WHIP_MS = 1000;
const smooth = t => t * t * (3 - 2 * t);
let lastIndex = 0, shown = '';
function table() { return POSES[mobile.matches ? 'mobile' : 'desk']; }
function showScene(name, el) {
  shown = name;
  scenes.forEach(x => x.classList.toggle('active', x === el));
}
/* whip-pan: halaman lama, dinding tebing, lalu halaman baru disusun sebagai satu panorama
   dan digeser bersama tiap frame. Tepi dinding menempel tepat ke tebing halaman,
   jadi tidak ada celah kosong; komposisi baru dipasang saat layar penuh tertutup batu. */
const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let wp = null; // whip yang sedang berjalan
const hasRocks = n => (table()[n]?.spread ?? 1) < 0.5;
function setWord(word) {
  lastWord = word;
  const bw = $('#bigword');
  bw.classList.remove('swap'); bw.textContent = word;
}
function swapTo(name, el) {
  showScene(name, el);
  const p = table()[name];
  stage.jump(p);
  stage.setSpin(calm.matches ? 0 : (p.spin || 0));
  $('#rocks').style.setProperty('--spread', p.spread);
  setWord(el.dataset.word || '');
}
function whipLayers() { return [$('#gl'), $('#rocks'), $('.backdrop'), $('main')]; }  // teks ikut tersapu bersama kamera
function endWhip() {
  const w = wp; wp = null;
  whipLayers().forEach(x => { x.style.transform = ''; });
  $('#wipe').classList.remove('go');
  document.body.classList.remove('whipping');
  if (w?.next && w.next.name !== shown) whip(w.next.down, w.next.name, w.next.el);
}
function whip(down, name, el, scrollTop) {
  const body = document.body;
  if (calm.matches || body.classList.contains('intro') || !stage) { showScene(name, el); stage?.jump(table()[name]); return; }
  if (wp) {
    if (!wp.swapped) {
      if (name === wp.from) { wp.back = true; wp.backFrom = performance.now(); wp.backC = wp.c; return; } // balik arah sebelum tertutup
      wp.name = name; wp.el = el; wp.scrollTop = scrollTop; return;                                                              // ganti tujuan
    }
    wp.next = { down, name, el }; return;                                                              // antre setelah selesai
  }
  const vw = innerWidth, H = innerHeight * 1.08, ov = Math.round(vw * 0.05);
  const from = shown, A = hasRocks(from), B = hasRocks(name);
  const leftHas = down ? A : B, rightHas = down ? B : A;    // ujung kiri dinding menempel tebing kanan, ujung kanan menempel tebing kiri
  // dinding minimal 1.8 layar, dan cukup panjang untuk tebing ujung + bagian tengah di layar sempit
  const need = (leftHas ? 0 : H * 776 / 2072) + (rightHas ? 0 : H * 742 / 2072) + H * 317 / 1600 + vw * 1.1;
  const W = Math.round(Math.max(vw * 1.8, need));
  const fl = leftHas ? ov : 0, fr = rightHas ? ov : 0;
  const strip = $('#whip-strip');
  strip.classList.toggle('org-l', !leftHas); strip.classList.toggle('org-r', !rightHas);
  strip.style.width = (W + fl + fr) + 'px';
  strip.style.setProperty('--fl', fl + 'px'); strip.style.setProperty('--fr', fr + 'px');
  wp = { down, name, el, from, vw, W, D: vw + W, fl, start: performance.now(), swapped: false, c: 0, scrollTop };
  body.classList.add('whipping');
  $('#wipe').classList.add('go');
  sound.tick(0.6);
  const layers = whipLayers();
  const frame = now => {
    const w = wp; if (!w) return;
    let c, done;
    if (w.back) {           // kembali ke halaman semula dengan mulus
      const k = Math.min(1, (now - w.backFrom) / 380);
      c = w.backC * (1 - (1 - Math.pow(1 - k, 3))); done = k >= 1;
    } else {
      const t = Math.min(1, (now - w.start) / WHIP_MS);
      c = easeIO(t) * w.D; done = t >= 1;
      if (!w.swapped && c >= w.vw) {
        w.swapped = true;
        if (w.scrollTop != null) {   // pindah halaman saat layar tertutup batu penuh
          lastScene = w.name; lastIndex = scenes.indexOf(w.el);
          scrollTo({ top: w.scrollTop, behavior: 'instant' });
        }
        swapTo(w.name, w.el);
      }
    }
    w.c = c;
    const s = w.down ? 1 : -1;
    const page = w.swapped ? s * (w.D - c) : -s * c;
    const x = w.down ? w.vw - c - w.fl : c - w.W - w.fl;
    layers.forEach(l => { l.style.transform = `translate3d(${page.toFixed(1)}px,0,0)`; });
    strip.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    if (done) { if (w.back) showScene(w.from, scenes.find(e => e.dataset.scene === w.from)); endWhip(); }
    else requestAnimationFrame(frame);
  };
  frame(performance.now());
}

let scenes = [], lastScene = '', lastWord = '';

/* Antar bagian yang memakai whip, halaman berpindah per halaman: roda mouse, geser jari, atau tombol panah
   di batas bagian langsung memicu whip. Halaman berikutnya tidak terlihat sebelum transisi, dan posisi
   scroll baru dipindah saat layar tertutup tebing. Scroll biasa tetap jalan di bagian lain. */
const pagingOn = () => stage && !calm.matches && !document.body.classList.contains('intro') && !document.body.classList.contains('no3d');
function neighbor(dir) {
  const list = scenes.filter(el => el.offsetHeight > 0);
  const i = list.findIndex(el => el.dataset.scene === shown);
  const el = i < 0 ? null : list[i + dir];
  return el && isWipe(shown, el.dataset.scene) ? el : null;
}
function atEdge(dir) {
  const el = scenes.find(e => e.dataset.scene === shown); if (!el) return false;
  const r = el.getBoundingClientRect();
  return dir > 0 ? r.bottom <= innerHeight + 8 : r.top >= -8;
}
function pageWhip(dir) {
  if (!pagingOn()) return false;
  const el = neighbor(dir); if (!el || !atEdge(dir)) return false;
  const top = dir > 0 ? el.offsetTop : el.offsetTop + Math.max(0, el.offsetHeight - innerHeight);
  whip(dir > 0, el.dataset.scene, el, top);
  return true;
}
function setupPaging() {
  const skip = t => t?.closest?.('dialog, #menu, input, textarea, select');
  let lastWheel = 0, lock = 0;
  addEventListener('wheel', e => {
    if (e.ctrlKey || skip(e.target)) return;
    const t = performance.now(), gap = t - lastWheel; lastWheel = t;
    if (wp) { e.preventDefault(); lock = t + 450; return; }
    // sisa dorongan touchpad setelah transisi tidak langsung memicu transisi berikutnya
    if (t < lock) { e.preventDefault(); if (gap < 120) lock = t + 220; return; }
    const dir = Math.sign(e.deltaY);
    if (dir && pageWhip(dir)) e.preventDefault();
  }, { passive: false });
  let ty = null, fired = false;
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; fired = false; }, { passive: true });
  addEventListener('touchmove', e => {
    if (ty == null || skip(e.target)) return;
    if (wp) { if (e.cancelable) e.preventDefault(); return; }
    const dy = ty - e.touches[0].clientY, dir = Math.sign(dy);
    if (!dir || !pagingOn() || !neighbor(dir) || !atEdge(dir)) return;
    if (e.cancelable) e.preventDefault();
    if (!fired && Math.abs(dy) > 40) { fired = true; pageWhip(dir); }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || skip(e.target) || document.querySelector('dialog[open]')) return;
    const dir = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey) ? 1
      : ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) ? -1 : 0;
    if (!dir) return;
    if (wp) { e.preventDefault(); return; }
    if (pageWhip(dir)) e.preventDefault();
  });
}
function collectScenes() { scenes = $$('[data-scene]').filter(el => el.offsetParent !== null || getComputedStyle(el).display !== 'none'); $('#idx-total').textContent = scenes.length; }

function choreograph() {
  if (!scenes.length) return;
  const mid = innerHeight / 2;
  const centers = scenes.map(el => { const r = el.getBoundingClientRect(); return { el, d: r.top + Math.min(r.height, innerHeight) / 2 - mid, r }; });
  // bagian panjang: tahan pose selama tengah layar masih di dalam bagian itu
  let a = 0, b = 0, t = 0;
  const inside = centers.findIndex(c => c.r.height > innerHeight * 1.1 && c.r.top < mid && c.r.bottom > mid);
  if (inside >= 0) { a = b = inside; }
  else if (centers[0].d >= 0) { a = b = 0; }
  else if (centers[centers.length - 1].d <= 0) { a = b = centers.length - 1; }
  else {
    for (let i = 0; i < centers.length - 1; i++) {
      if (centers[i].d <= 0 && centers[i + 1].d >= 0) {
        a = i; b = i + 1;
        // jarak tempuh antara pose a (bagian a di tengah layar) dan pose b
        const da = -centers[i].d, db = centers[i + 1].d;
        t = da / (da + db);
        break;
      }
    }
  }
  const A = scenes[a].dataset.scene, B = scenes[b].dataset.scene;
  const now = t < 0.5 ? a : b, nowEl = scenes[now], name = nowEl.dataset.scene;
  const tbl = table();
  if (name !== lastScene) {
    const prev = lastScene;
    lastScene = name;
    if (prev && isWipe(prev, name)) whip(now > lastIndex, name, nowEl);
    else showScene(name, nowEl);
    lastIndex = now;
    $('#idx').textContent = now;
  }
  // antar bagian dengan whip: pose tidak di-scrub, langsung berganti saat layar tertutup
  let pose;
  if (a !== b && isWipe(A, B)) pose = { ...tbl[shown || name] };
  else {
    const pa = tbl[A], pb = tbl[B], k = smooth(Math.min(1, Math.max(0, (t - 0.15) / 0.7)));
    pose = {};
    KEYS.forEach(key => { const u = pa[key] ?? 0, v = pb[key] ?? 0; pose[key] = u + (v - u) * k; });
  }
  stage?.pose(pose);
  if (!document.body.classList.contains('whipping')) $('#rocks').style.setProperty('--spread', pose.spread.toFixed(3));
  stage?.setSpin(calm.matches ? 0 : (tbl[shown || name].spin || 0));
  const shownEl = scenes.find(x => x.dataset.scene === (shown || name)) || nowEl;
  const word = shownEl.dataset.word || '';
  if (word !== lastWord) {
    lastWord = word;
    const bw = $('#bigword');
    bw.classList.add('swap');
    setTimeout(() => { bw.textContent = word; bw.classList.remove('swap'); }, 260);
  }
}

/* ---------------- 3D ---------------- */
async function start3D() {
  const { webglOK, createStage } = await import('./stage.js');
  if (!webglOK()) throw new Error('WebGL2 tidak tersedia');
  const bar = $('#loader-bar'), pct = $('#loader-pct');
  stage = createStage($('#gl'), { onProgress: p => { bar.style.width = Math.round(p * 100) + '%'; pct.textContent = Math.round(p * 100) + '%'; } });
  stage.setVariant(V().colors, false);
  stage.jump({ ...POSES[mobile.matches ? 'mobile' : 'desk'].hero, light: 0 });
  await stage.ready;
  stage.setAnchor(() => (shown === 'preorder' ? poGeom() : null));
  window.__soundbox = { stage };
  document.body.classList.add('has3d');
  choreograph();
  return stage;
}
// pembuka seperti video: gelap total, headphone muncul tersorot, lalu seluruh adegan menjadi terang
let revealed = false;
function reveal() {
  if (revealed) return; revealed = true;
  const L = $('#loader');
  L.classList.add('lit');
  if (!stage) { L.classList.add('gone'); document.body.classList.remove('intro'); return; }
  const slow = calm.matches ? 0 : 1;
  setTimeout(() => stage.light(1), 900 * slow);
  setTimeout(() => {
    L.classList.add('gone'); document.body.classList.remove('intro');
    // teks hero baru mengetik masuk setelah adegan terang
    const cur = scenes.find(x => x.classList.contains('active'));
    if (cur) { cur.classList.remove('active'); requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.add('active'))); }
  }, 1500 * slow);
}

/* rotasi dengan menggeser di bagian Warna */
function setupDrag() {
  const z = $('#drag-zone'); let down = null;
  z.addEventListener('pointerdown', e => { down = e.clientX; z.setPointerCapture(e.pointerId); z.classList.add('drag'); stage?.setDragging(true); });
  z.addEventListener('pointermove', e => { if (down === null) return; stage?.addYaw((e.clientX - down) * 0.012); down = e.clientX; });
  const up = () => { down = null; z.classList.remove('drag'); stage?.setDragging(false); };
  z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up);
}

/* ---------------- animasi kanvas 2D ---------------- */
/* Komposisi pre-order: tombol hitam di tengah, earcup mengapitnya, gelombang suara menyambung keduanya.
   Semua ukuran diturunkan dari ukuran tombol, dan posisi ketiganya dihitung dari kotak bagian #preorder
   pada frame yang sama, jadi saat di-scroll tidak ada yang tertinggal. */
function poGeom() {
  const sec = $('#preorder'), disc = $('.po-disc');
  const r = sec.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const ring = vw <= 760 ? 6 : 8, rv = disc.offsetWidth / 2 + ring;        // jari-jari tombol termasuk cincin
  const m = stage && document.body.classList.contains('has3d') ? stage.metrics() : null;
  const shift = $('main').getBoundingClientRect().left;                     // geseran whip
  const g = { cx: r.left + r.width / 2, x: r.left + r.width / 2 - shift, y: r.top + r.height / 2, rv, half: rv * 3.1, cup: 0, ppu: 0, wide: 1 };
  if (m) {
    const WIDE = 1.75, GAP = 0.95;                                          // headband sedikit dilebarkan; jarak tombol–earcup hampir satu jari-jari untuk gelombang
    let ppu = rv * (1 + GAP) / (WIDE * m.cupDist - m.cupHalfW);
    ppu = Math.min(ppu, vh * 0.56, vw * 0.36 / (WIDE * m.cupDist + m.cupHalfW));
    const off = Math.max(rv * 1.25 + m.cupHalfW * ppu, WIDE * m.cupDist * ppu);
    g.ppu = ppu; g.wide = off / (m.cupDist * ppu);
    g.half = off - m.cupHalfW * ppu * 0.5;                                  // ujung gelombang masuk sedikit ke bantalan
    g.y += -m.cupY * ppu * 0.5;                                             // headband di atas, jadi grup diturunkan supaya seimbang di tengah
  }
  return g;
}
function setupWaves() {
  const po = $('#po-center'), c = $('#waves'), g = c.getContext('2d');
  let cw = 0, ch = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const sec = $('#preorder').getBoundingClientRect();
    const on = sec.bottom > -40 && sec.top < innerHeight + 40 && sec.right > 0 && sec.left < innerWidth;
    po.classList.toggle('on', on);
    if (!on) return;
    const G = poGeom();
    po.style.transform = `translate3d(${(G.cx - innerWidth / 2).toFixed(1)}px, ${(G.y - innerHeight / 2).toFixed(1)}px, 0)`;
    const w = Math.ceil(G.half * 2 + 8), h = Math.ceil(G.rv * 2.2), dpr = Math.min(devicePixelRatio || 1, 2);
    if (w !== cw || h !== ch) { cw = w; ch = h; c.style.width = w + 'px'; c.style.height = h + 'px'; c.width = w * dpr; c.height = h * dpr; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const t = calm.matches ? 0 : now / 1000, lines = 26, x0 = 4, x1 = w - 4;
    for (let i = 0; i < lines; i++) {
      const p = i / (lines - 1);
      g.beginPath();
      for (let x = x0; x <= x1; x += 4) {
        const u = (x - x0) / (x1 - x0), env = Math.sin(u * Math.PI);
        const y = h / 2 + env * (Math.sin(u * 9 + t * 1.3 + p * 2.2) * h * 0.2 + Math.sin(u * 4 - t * 0.7 + p * 5) * h * 0.11) * (0.4 + p * 0.6);
        x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.strokeStyle = `rgba(47, 91, 60, ${0.25 + p * 0.45})`; g.lineWidth = 0.9; g.stroke();
    }
  }
  requestAnimationFrame(frame);
}
function setupEq() {
  const c = $('#eq'), g = c.getContext('2d'); let on = false, raf = 0;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(c);
  function draw(now) {
    raf = on ? requestAnimationFrame(draw) : 0;
    const w = c.width, h = c.height, t = calm.matches ? 0 : now / 1000, n = 40;
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const noisy = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 6) * Math.sin(i * 0.3 + t * 2.3);
      const quiet = 0.06 + 0.04 * Math.sin(i + t * 3);
      const cut = Math.max(0, Math.min(1, (Math.sin(t * 0.8) + 1) / 2));
      const v = noisy * (1 - cut) + quiet * cut;
      const bw = w / n - 4, bh = Math.max(4, v * h * 0.9);
      g.fillStyle = i / n < 1 - cut ? '#141413' : '#2f5b3c';
      g.fillRect(i * (w / n) + 2, (h - bh) / 2, bw, bh);
    }
  }
}

/* ---------------- dialog ---------------- */
function openSheet(which, el) {
  if (which === 'preorder') {
    if (el?.dataset.edition) pick.edition = el.dataset.edition;
    if (soldOut(V())) { const first = variants.find(v => !soldOut(v)); if (first) setVariant(first.id, { silent: true }); }
    renderSheet();
    $('#po-done').hidden = true;
    $('#preorder-sheet').showModal();
  } else {
    $('#wl-form').reset(); $('#wl-variant').value = pick.variant;
    $$('#wl-form .form-error, #wl-form .form-ok').forEach(x => { x.hidden = true; });
    $('#waitlist-sheet').showModal();
  }
}
function setupSheets() {
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); closeMenu(); openSheet(o.dataset.open, o); }
    const sw = e.target.closest('[data-variant]');
    if (sw) setVariant(sw.dataset.variant);
  });
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));

  const f = $('#po-form');
  const saved = store.get('sb-buyer', {});
  ['name', 'phone', 'email', 'address', 'city'].forEach(k => { if (saved[k]) f[k].value = saved[k]; });
  f.addEventListener('change', e => {
    if (e.target.name === 'variant') setVariant(e.target.value);
    if (e.target.name === 'edition') { pick.edition = e.target.value; store.set('sb-pick', pick); }
    updateSheet();
  });
  f.qty.addEventListener('input', updateSheet);
  f.addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    f.qty.value = Math.max(1, Math.min(5, (parseInt(f.qty.value, 10) || 1) + +b.dataset.q)); updateSheet();
  });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#po-error'); err.hidden = true;
    $$('[aria-invalid]', f).forEach(x => x.removeAttribute('aria-invalid'));
    const val = k => f[k].value.trim(), bad = [];
    const qty = Math.max(1, Math.min(5, parseInt(f.qty.value, 10) || 1));
    if (val('name').length < 2) { bad.push('nama'); f.name.setAttribute('aria-invalid', 'true'); }
    if (val('phone').replace(/\D/g, '').length < 9) { bad.push('nomor WhatsApp'); f.phone.setAttribute('aria-invalid', 'true'); }
    if (val('email') && !/^\S+@\S+\.\S+$/.test(val('email'))) { bad.push('email yang benar'); f.email.setAttribute('aria-invalid', 'true'); }
    if (val('address').length < 8) { bad.push('alamat lengkap'); f.address.setAttribute('aria-invalid', 'true'); }
    if (val('city').length < 2) { bad.push('kota'); f.city.setAttribute('aria-invalid', 'true'); }
    if (soldOut(V())) bad.push('warna lain (warna ini habis)');
    if (bad.length) { err.textContent = 'Lengkapi dulu: ' + bad.join(', ') + '.'; err.hidden = false; $('[aria-invalid]', f)?.focus(); return; }
    store.set('sb-buyer', { name: val('name'), phone: val('phone'), email: val('email'), address: val('address'), city: val('city') });
    const v = V(), ed = E(), pay = f.pay.value;

    if (api.online()) {
      const btn = $('#po-submit'); btn.disabled = true; btn.textContent = 'Menyimpan…';
      try {
        const res = await api.preorder({ variant: v.id, edition: ed.id, qty, name: val('name'), phone: val('phone'), email: val('email'), address: val('address'), city: val('city'), pay, note: val('note'), website: f.website.value });
        $('#po-code').textContent = res.code;
        $('#po-done-text').textContent = res.message;
        $('#po-wa').href = res.whatsapp;
        $('#po-done').hidden = false;
        if (typeof res.orders === 'number') { orderCount = res.orders; renderTexts(); }
        loadCatalog();
      } catch (ex) {
        err.textContent = ex.message; err.hidden = false;
        Object.keys(ex.fields || {}).forEach(k => f[k]?.setAttribute?.('aria-invalid', 'true'));
        if (ex.status === 409) loadCatalog();
      } finally { btn.disabled = false; btn.textContent = 'Pre-order sekarang'; }
      return;
    }
    const msg = [
      `Halo ${SHOP.name}, saya mau pre-order ${SHOP.product}:`, '',
      `Warna: ${v.name}`, `Edisi: ${ed.name}`, `Jumlah: ${qty}`, `Total: ${rupiah(ed.price * qty)}`, '',
      `Nama: ${val('name')}`, `WhatsApp: ${val('phone')}`, val('email') ? `Email: ${val('email')}` : null,
      `Alamat: ${val('address')}, ${val('city')}`, `Bayar: ${pay}`, val('note') ? `Catatan: ${val('note')}` : null,
      '', 'Mohon info cara pembayarannya. Terima kasih!',
    ].filter(x => x !== null).join('\n');
    openWhatsApp(msg);
    toast('Pre-order dibuka di WhatsApp. Tinggal tekan kirim.');
  });

  const w = $('#wl-form');
  w.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('.form-error', w), ok = $('.form-ok', w); err.hidden = ok.hidden = true;
    const name = w.name.value.trim(), contact = w.contact.value.trim(), variant = w.variant.value;
    const isMail = /^\S+@\S+\.\S+$/.test(contact), isPhone = contact.replace(/\D/g, '').length >= 9 && !/[a-z@]/i.test(contact);
    if (name.length < 2 || (!isMail && !isPhone)) { err.textContent = 'Isi nama dan nomor WhatsApp atau email yang benar.'; err.hidden = false; return; }
    if (api.online()) {
      try {
        const res = await api.waitlist({ name, contact, variant, website: w.website.value });
        ok.textContent = res.message; ok.hidden = false; w.contact.value = '';
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
      return;
    }
    const v = variants.find(x => x.id === variant);
    openWhatsApp(`Halo ${SHOP.name}, saya ${name}. Tolong kabari saya kalau ${SHOP.product} warna ${v?.name || variant} tersedia. Kontak: ${contact}`);
    ok.textContent = 'Pesan waitlist dibuka di WhatsApp.'; ok.hidden = false;
  });
}

/* ---------------- menu, suara ---------------- */
function closeMenu() { $('#menu').hidden = true; $('#menu-btn').setAttribute('aria-expanded', 'false'); }
function setupChrome() {
  const btn = $('#menu-btn'), menu = $('#menu');
  btn.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const setSound = on => {
    document.body.classList.toggle('sound-on', on);
    $('#sound-btn').setAttribute('aria-pressed', String(on));
    $('#sound-btn').setAttribute('aria-label', on ? 'Matikan suara' : 'Nyalakan suara');
  };
  $('#sound-btn').addEventListener('click', () => setSound(sound.toggle()));
  $$('[data-sound]').forEach(b => b.addEventListener('click', () => setSound(sound.toggle(true))));
}
function setupReveal() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .card').forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

/* ---------------- ulasan & lacak ---------------- */
const starText = n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
function renderReviews(data) {
  const list = $('#review-list'), sum = $('#review-summary');
  if (!data || !data.items.length) {
    sum.innerHTML = '';
    list.innerHTML = `<p class="review-empty">Belum ada ulasan. Ulasan ditulis oleh pembeli setelah menerima ${esc(SHOP.product)}${api.online() ? ', dan tampil setelah dicek admin' : ''}.</p>`;
    return;
  }
  sum.innerHTML = `<strong>${data.average.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong><span class="mono">// dari ${data.count} ulasan pembeli</span>`;
  list.innerHTML = data.items.map(r => `
    <article class="card review"><p class="stars" aria-label="${r.rating} dari 5">${starText(r.rating)}</p><p>${esc(r.body)}</p>
    <footer>${esc(r.name)} · ${esc(r.variant)} · ${esc(r.date)}</footer></article>`).join('');
}
function setupReviewForm() {
  const f = $('#review-form');
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('.form-error', f), ok = $('.form-ok', f); err.hidden = ok.hidden = true;
    try {
      const res = await api.review({ code: f.code.value.trim(), phone: f.phone.value.trim(), rating: +f.rating.value, body: f.body.value.trim(), website: f.website.value });
      ok.textContent = res.message; ok.hidden = false; f.body.value = '';
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
  const t = $('#track-form');
  t.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('.form-error', t), out = $('#track-result'); err.hidden = true; out.innerHTML = '';
    try {
      const r = await api.track({ code: t.code.value.trim(), phone: t.phone.value.trim() });
      const idx = r.steps.findIndex(s => s.key === r.status);
      out.innerHTML = r.status === 'batal'
        ? `<p><b>${esc(r.code)}</b> dibatalkan.</p>`
        : `<p class="mono">// ${esc(r.code)} · ${esc(r.variant)} · ${esc(r.edition)} ×${r.qty}</p>
           <ol class="steps">${r.steps.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}">${esc(s.label)}</li>`).join('')}</ol>
           ${r.tracking ? `<p>Nomor resi: <b>${esc(r.tracking)}</b></p>` : ''}`;
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
  });
}

/* ---------------- backend ---------------- */
async function loadCatalog() {
  try {
    const c = await api.catalog();
    variants = VARIANTS.map(v => { const s = c.variants.find(x => x.slug === v.id); return s ? { ...v, name: s.name, stock: s.stock, available: s.available } : { ...v, available: false, stock: 0 }; });
    editions = EDITIONS.map(e => { const s = c.editions.find(x => x.slug === e.id); return s ? { ...e, name: s.name, price: s.price, available: s.available } : { ...e, available: false }; });
    orderCount = c.orders;
    renderTexts(); renderColors(); renderEditions(); renderSheet(); setupReveal();
  } catch (err) { console.warn('Katalog server gagal dimuat:', err.message); }
}

/* teks tiap adegan muncul bertahap (lihat .stagger di CSS) */
function markStagger() {
  $$('.scene').forEach(sc => {
    const els = $$(':scope .headline > span, :scope .label, :scope .icon-list li, :scope .side-list > .small, :scope .stats > div, :scope .model-card, :scope .color-panel > *, :scope .quote, :scope .po-meta', sc);
    els.forEach((el, i) => { el.classList.add('stagger'); el.style.setProperty('--i', i); });
  });
}

/* ---------------- mulai ---------------- */
markStagger();
renderTexts(); renderSpecs(); renderColors(); renderEditions(); renderSheet(); renderReviews(null);
setupChrome(); setupSheets(); setupDrag(); setupWaves(); setupEq(); setupReviewForm(); setupReveal(); setupPaging();
collectScenes();
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; choreograph(); }); } }, { passive: true });
addEventListener('pointermove', e => {
  const r = $('#rocks');
  r.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
  r.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
}, { passive: true });
addEventListener('resize', () => { collectScenes(); choreograph(); });
mobile.addEventListener?.('change', choreograph);

start3D().then(reveal).catch(err => {
  console.warn('3D dimatikan:', err.message);
  document.body.classList.add('no3d');
  reveal();
});
// pengaman: jangan biarkan layar pembuka menutupi halaman terlalu lama
setTimeout(() => { if (!$('#loader').classList.contains('gone')) reveal(); }, 15000);

api.connect().then(async b => {
  if (!b) { if (SHOP.baseOrders) { orderCount = SHOP.baseOrders; renderTexts(); } return; }
  document.body.classList.add('online');
  collectScenes();
  await loadCatalog();
  try { renderReviews(await api.reviews()); } catch { /* biarkan kosong */ }
});
