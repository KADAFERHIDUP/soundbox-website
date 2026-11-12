<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/** Pengaturan toko Soundbox yang dipakai API dan panel admin. */
class Store extends BaseConfig
{
    public string $name     = 'Soundbox';
    public string $product  = 'Soundbox S9';
    public string $whatsapp = '6282276078880';

    /** Bank tujuan transfer yang dikirim ke pembeli lewat WhatsApp (isi sendiri). */
    public string $payNote = 'Detail pembayaran kami kirim lewat WhatsApp setelah pesan konfirmasi diterima.';

    public int $maxQty = 5;

    /** Angka tambahan pada penghitung pemesan (misalnya pesanan offline). */
    public int $ordersOffset = 0;

    public array $statuses = [
        'menunggu' => 'Menunggu bayar',
        'dibayar'  => 'Dibayar',
        'produksi' => 'Produksi',
        'dikirim'  => 'Dikirim',
        'selesai'  => 'Diterima',
        'batal'    => 'Batal',
    ];

    public array $payments = ['Transfer bank', 'QRIS', 'E-wallet'];
}
