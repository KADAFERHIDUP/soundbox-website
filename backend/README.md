# Backend Soundbox (CodeIgniter 4)

Backend opsional untuk website Soundbox S9. Kalau aktif, website otomatis:

- memakai **stok per warna, harga per edisi, dan jumlah pemesan** dari database;
- menyimpan **pre-order** dengan kode (`SB-261112-K7Q2`), mengurangi stok warna secara aman (tidak bisa terjual melebihi stok), lalu pembeli konfirmasi dan bayar lewat WhatsApp;
- menyimpan **waitlist** (WhatsApp atau email) dan **ulasan** pembeli;
- membiarkan pembeli **melacak pesanan** dengan kode + nomor WhatsApp.

Harga selalu dihitung ulang di server, jadi harga dari browser tidak dipakai.

## Panel admin (`/admin`)

| Halaman | Isi |
|---|---|
| Dashboard | Menunggu bayar, dibayar/produksi, unit dipesan, uang masuk, waitlist, ulasan baru, stok per warna |
| Pre-order | Ubah status (Menunggu bayar → Dibayar → Produksi → Dikirim → Diterima, atau Batal), isi nomor resi (otomatis jadi Dikirim), WhatsApp pembeli, hapus, unduh CSV. Batal mengembalikan stok |
| Waitlist | Daftar kontak per warna, tandai sudah dikabari, WhatsApp/email, unduh CSV |
| Ulasan | Ulasan masuk dari pembeli; tampilkan atau sembunyikan |
| Produk & stok | Stok dan nama tiap warna, harga dan nama tiap edisi, aktif/nonaktif |

Keamanan: password ter-hash, batas percobaan login, CSRF di semua form admin, batas kiriman API per IP, kolom jebakan robot, dan ulasan/lacak hanya bisa dengan kode + nomor WhatsApp yang cocok. Nama pembeli di ulasan publik disingkat (misalnya "Ahmad U.").

## Memasang di komputer (XAMPP / Laragon)

Butuh PHP 8.1+, Composer, dan MySQL.

```bash
cd backend
./install.sh          # Windows: install.bat
php spark db:create soundbox_db
php spark migrate
php spark db:seed DatabaseSeeder
php spark serve
```

Buka http://localhost:8080 (website) dan http://localhost:8080/admin (admin). **Isi `ADMIN_PASSWORD` di `.env` sebelum menjalankan seeder** (minimal 10 karakter, ada huruf dan angka). Kalau website diubah, jalankan installer lagi supaya `public/` ikut terbarui.

## Pengamanan

- Harga, total, dan stok selalu dihitung di server dari database. Angka kiriman browser tidak dipercaya.
- Login admin dibatasi 5 percobaan per 5 menit per IP, dengan waktu respons yang sama untuk email terdaftar maupun tidak.
- Semua kiriman API publik dibatasi per menit **dan** per hari per IP, supaya satu orang tidak bisa menghabiskan stok atau membanjiri admin dengan data palsu.
- Tidak ada password admin bawaan. `ADMIN_PASSWORD` wajib minimal 10 karakter berisi huruf dan angka; kalau dikosongkan, password acak dibuat saat seeding. Password contoh lama (misalnya `admin12345`) ditolak saat login.
- Ganti password admin kapan saja: `php spark admin:password`.
- File CSV untuk admin aman dibuka di Excel: isi yang diawali `=`, `+`, `-`, atau `@` tidak dijalankan sebagai rumus.
- Foto upload dicek isinya, diberi nama acak, dan folder upload menolak menjalankan skrip.

## Hosting

- **Satu server (disarankan):** upload `backend/` ke hosting PHP, arahkan domain ke `backend/public`, isi `.env` (database, `app.baseURL`, `CI_ENVIRONMENT = production`).
- **Website di GitHub Pages, backend di tempat lain:** tambahkan `<script>window.SOUNDBOX_API = 'https://domain-backend/api'</script>` sebelum `js/app.js`, dan isi `CORS_ORIGINS` di `.env`.

## API

| Method | Alamat | Isi |
|---|---|---|
| GET | `/api/health` | Cek backend aktif |
| GET | `/api/catalog` | Warna + stok, edisi + harga, jumlah pemesan |
| POST | `/api/preorders` | `{variant, edition, qty, name, phone, email, address, city, pay, note}` |
| POST | `/api/preorders/track` | `{code, phone}` |
| POST | `/api/waitlist` | `{name, contact, variant}` |
| GET/POST | `/api/reviews` | Daftar ulasan / kirim `{code, phone, rating, body}` |

Status, cara bayar, dan catatan pembayaran diatur di `app/Config/Store.php`. Warna baru di admin juga butuh warna 3D-nya di `js/data.js`.
