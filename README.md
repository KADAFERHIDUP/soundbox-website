# Soundbox S9

Website headphone full 3D, dibuat oleh **Ahmad Umraithi**. Konsepnya mengikuti video referensi: kertas abu kehijauan, foto tebing batu pasir di kiri-kanan, headphone 3D melayang di tengah, kata besar bergaya coretan di belakangnya, huruf grotesk dengan tulisan tangan oranye, dan transisi whip-pan: kamera menyapu cepat ke samping melewati tebing, komposisi berganti saat layar tertutup batu, lalu teks muncul bertahap.

Online di **https://soundbox.kadaferhidup.my.id** (GitHub Pages).

## Isi halaman

1. **Pembuka**: layar gelap dengan persentase pemuatan, headphone muncul tersorot di kegelapan, lalu seluruh adegan perlahan menjadi terang.
2. **Hero**: "Experience the next *level* in sound", kata latar *dope*, kartu spesifikasi singkat, tombol "click to enable sound".
3. **Specifications**: headphone diperbesar dari samping, tiga keunggulan, angka baterai/ANC/berat.
4. **Materials**: headphone berputar memperlihatkan bantalan, daftar material ramah lingkungan.
5. **Pilih warna**: 7 warna (Sand, Midnight, Sage, Ocean, Blush, Ivory, Ember). Warna headphone 3D berganti dengan halus, dan headphone bisa diputar dengan menggeser layar.
6. **Teknologi**: animasi peredam bising, baterai, multipoint, dan tabel spesifikasi lengkap.
7. **Edisi & isi kotak**: S9 dan S9 Pro Kit, plus daftar suku cadang.
8. **Ulasan**: hanya dari pembeli asli (kode pre-order + nomor WhatsApp) dan tampil setelah disetujui admin.
9. **Tanya jawab**.
10. **Lacak pesanan** (saat backend aktif).
11. **Pre-order**: headband melebar, kedua earcup di tepi layar, tombol bulat *pre ORDER* dengan gelombang suara, harga, jumlah pemesan, dan teks berjalan "PRE-ORDER IS *open*".

Fitur lain: menu besar, suara latar dibuat langsung oleh browser (tanpa file audio), form pre-order dan waitlist, pilihan warna dan data pembeli diingat di perangkat, gambar diam kalau perangkat tidak mendukung 3D, dan menghormati pengaturan *reduced motion*.

## Model 3D

Headphone memakai model [“JBL Headphone (changeable colour)”](https://sketchfab.com/3d-models/jbl-headphone-changeable-colour-fceab67bac8f4d1f8331197305da3dda) oleh [Sharma ji](https://sketchfab.com/vfxstudio987), lisensi **CC BY 4.0** (kredit wajib, sudah ada di footer). Perubahan yang dilakukan:

- **Logo JBL pada model dihapus**, karena produknya dijual dengan merek Soundbox.
- Material diganti (kulit sintetis bertekstur, kain rajut, logam), warnanya dibuat per bagian untuk 7 varian.
- Disederhanakan dari 164 ribu menjadi 61 ribu segitiga: file 5,2 MB menjadi 1,3 MB.

Tebing batu memakai foto ngarai yang disediakan pemilik website; langitnya sudah dihapus dan fotonya dipertajam (`img/rock-left.webp`, `img/rock-right.webp`, `img/rock-strip.webp` untuk tekstur sapuan). Pastikan foto itu boleh dipakai.

## Mengubah isi

`js/data.js`: nama toko, nomor WhatsApp, warna (beserta warna tiap bagian headphone), edisi dan harga, spesifikasi, tanya jawab, kata-kata latar.

## Backend

Folder `backend/` berisi backend CodeIgniter 4 + MySQL. Kalau aktif, website otomatis memakai stok per warna, harga per edisi, dan jumlah pemesan dari database; pre-order tersimpan dengan kode (`SB-261112-K7Q2`) dan stok dikurangi; waitlist dan ulasan tersimpan; pembeli bisa melacak pesanan. Panel admin di `/admin`: dashboard, pre-order (status, nomor resi, CSV), waitlist (CSV), ulasan (setujui/sembunyikan), produk & stok. Cara memasang ada di [backend/README.md](backend/README.md).

Tanpa backend (GitHub Pages), pre-order dan waitlist dikirim lewat WhatsApp.

## Menjalankan di komputer

Buka lewat server, bukan klik dua kali `index.html`: VS Code *Live Server*, atau `python -m http.server 8000` lalu buka http://localhost:8000.

## Domain

File `CNAME` berisi `soundbox.kadaferhidup.my.id`. Di Domainesia buat record **CNAME** `soundbox` → `kadaferhidup.github.io`, lalu aktifkan GitHub Pages (branch `main`, folder root).
