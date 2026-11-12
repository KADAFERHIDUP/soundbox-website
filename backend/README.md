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

Buka http://localhost:8080 (website) dan http://localhost:8080/admin (admin). **Ganti `ADMIN_PASSWORD` di `.env` sebelum menjalankan seeder.** Kalau website diubah, jalankan installer lagi supaya `public/` ikut terbarui.

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
