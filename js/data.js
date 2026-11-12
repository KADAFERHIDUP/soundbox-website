// Data toko dan produk. Ubah di sini untuk mengganti harga, warna, atau nomor WhatsApp.

export const SHOP = {
  name: 'Soundbox',
  product: 'Soundbox S9',
  whatsapp: '6282276078880',
  whatsappLabel: '0822-7607-8880',
  email: 'umraithi769@gmail.com',
  city: 'Lhokseumawe, Aceh',
  shipping: '15–20 hari',
  baseOrders: 0,          // angka awal penghitung pre-order (tanpa backend)
};

// warna tiap bagian: cangkang, cincin, bantalan telinga, headband, bantalan kepala, logam, kain dalam
export const VARIANTS = [
  { id: 'sand', name: 'Sand', note: 'Krem pasir dengan aksen emas', swatch: '#c2a47c',
    colors: { shell: '#b8976b', ring: '#46463a', cushion: '#d9c6a6', band: '#ad8c62', pad: '#a8a090', metal: '#c19a5b', inner: '#3d3b35' } },
  { id: 'midnight', name: 'Midnight', note: 'Hitam doff, logam perak', swatch: '#1f2023',
    colors: { shell: '#1f2023', ring: '#2c2d31', cushion: '#2a2a2d', band: '#1c1d20', pad: '#3a3a3d', metal: '#9aa0a8', inner: '#121212' } },
  { id: 'sage', name: 'Sage', note: 'Hijau daun yang kalem', swatch: '#9aae94',
    colors: { shell: '#9aae94', ring: '#3f4d40', cushion: '#e6ebdf', band: '#8ea488', pad: '#c9d1c2', metal: '#cfcfc6', inner: '#2d352d' } },
  { id: 'ocean', name: 'Ocean', note: 'Biru laut, bantalan putih', swatch: '#1f5d66',
    colors: { shell: '#1f5d66', ring: '#173f46', cushion: '#f1f1ee', band: '#1f5d66', pad: '#e9ecea', metal: '#8fa6ad', inner: '#20292b' } },
  { id: 'blush', name: 'Blush', note: 'Merah muda pudar, rose gold', swatch: '#e4bcb3',
    colors: { shell: '#e4bcb3', ring: '#9b6b60', cushion: '#f6e8e2', band: '#ddb1a6', pad: '#efd9d2', metal: '#c99a86', inner: '#4a3a37' } },
  { id: 'ivory', name: 'Ivory', note: 'Putih gading yang bersih', swatch: '#ece5d6',
    colors: { shell: '#ece5d6', ring: '#8f8a7f', cushion: '#f8f4ec', band: '#e6dfcf', pad: '#ddd6c6', metal: '#d8d2c5', inner: '#3b3935' } },
  { id: 'ember', name: 'Ember', note: 'Oranye bara, aksen hitam', swatch: '#d4532f',
    colors: { shell: '#d4532f', ring: '#2a2422', cushion: '#f0e6dc', band: '#c84b2a', pad: '#e7ddd2', metal: '#2e2e2e', inner: '#1d1a19' } },
];

export const EDITIONS = [
  { id: 's9', name: 'S9', price: 2499000, tag: 'Untuk sehari-hari',
    items: ['Headphone S9', 'Kantong kain', 'Kabel USB-C 1 m', 'Garansi 1 tahun'] },
  { id: 's9-pro', name: 'S9 Pro Kit', price: 2899000, tag: 'Paling lengkap', best: true,
    items: ['Headphone S9', 'Hard case', 'Bantalan cadangan', 'Kabel 3,5 mm anyaman', 'Kabel USB-C 1 m', 'Garansi 2 tahun'] },
];

export const PAYMENTS = ['Transfer bank', 'QRIS', 'E-wallet'];

export const SPECS = [
  ['Driver', '40 mm dinamis, berlapis bio-selulosa'],
  ['Peredam bising', 'ANC hibrida hingga −35 dB, mode transparansi'],
  ['Baterai', '60 jam (ANC mati) · 40 jam (ANC nyala)'],
  ['Isi cepat', '10 menit untuk 5 jam pemakaian, USB-C'],
  ['Koneksi', 'Bluetooth 5.3, multipoint 2 perangkat, jack 3,5 mm'],
  ['Codec', 'SBC, AAC, LDAC'],
  ['Mikrofon', '4 mikrofon dengan peredam angin'],
  ['Berat', '248 gram'],
  ['Kontrol', 'Panel sentuh di cangkang kanan + 3 tombol fisik'],
  ['Aplikasi', 'Soundbox App: EQ 10 band, deteksi pemakaian'],
];

export const FAQ = [
  ['Kapan pre-order dikirim?', 'Produksi dan pengiriman memakan waktu 15–20 hari setelah pembayaran lunas. Kode pre-order dipakai untuk melacak status.'],
  ['Apakah bisa batal setelah bayar?', 'Bisa sebelum masuk produksi (status masih "Dibayar"). Dana dikembalikan penuh dalam 3 hari kerja.'],
  ['Bantalan dan headband bisa diganti?', 'Bisa. Bantalan telinga memakai magnet dan headband dilepas dengan satu sekrup. Suku cadang dijual terpisah.'],
  ['Apakah tahan keringat?', 'S9 tahan cipratan dan keringat ringan (IPX4), jadi aman untuk olahraga ringan.'],
  ['Bisa dipakai main game?', 'Bisa. Ada mode latensi rendah di aplikasi, dan kabel 3,5 mm untuk latensi nol.'],
  ['Garansinya bagaimana?', 'S9 bergaransi 1 tahun, S9 Pro Kit 2 tahun. Klaim cukup lewat WhatsApp dengan kode pre-order.'],
];

export const WORDS = ['dope', 'swag', 'trill', 'fresh', 'vibe', 'hype'];
