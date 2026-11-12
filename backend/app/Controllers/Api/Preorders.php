<?php

namespace App\Controllers\Api;

use App\Models\EditionModel;
use App\Models\PreorderModel;
use App\Models\VariantModel;

/**
 * Pre-order dari website. Harga diambil dari database (bukan dari browser),
 * dan stok warna dikurangi secara atomik supaya tidak bisa terjual melebihi stok.
 */
class Preorders extends BaseApi
{
    public function create()
    {
        if (! $this->allowed('preorders', 5)) {
            return $this->tooMany();
        }
        $data = $this->payload();
        if ($this->isBot($data)) {
            return $this->respondCreated(['code' => 'SB-000000-0000', 'message' => 'Pre-order tercatat.']);
        }
        $cfg   = config('Store');
        $data += ['variant' => '', 'edition' => '', 'qty' => 1, 'name' => '', 'phone' => '', 'email' => '', 'address' => '', 'city' => '', 'pay' => '', 'note' => ''];
        $rules = [
            'variant' => 'required|alpha_dash|max_length[30]',
            'edition' => 'required|alpha_dash|max_length[30]',
            'qty'     => "required|is_natural_no_zero|less_than_equal_to[{$cfg->maxQty}]",
            'name'    => 'required|min_length[2]|max_length[80]',
            'phone'   => 'required|max_length[20]',
            'email'   => 'permit_empty|valid_email|max_length[120]',
            'address' => 'required|min_length[8]|max_length[400]',
            'city'    => 'required|min_length[2]|max_length[60]',
            'pay'     => 'required|in_list[' . implode(',', $cfg->payments) . ']',
            'note'    => 'permit_empty|max_length[300]',
        ];
        $messages = [
            'qty'     => ['less_than_equal_to' => "Maksimal {$cfg->maxQty} unit per pre-order.", 'is_natural_no_zero' => 'Jumlah tidak valid.'],
            'name'    => ['required' => 'Tulis nama penerima.', 'min_length' => 'Nama terlalu pendek.'],
            'phone'   => ['required' => 'Tulis nomor WhatsApp.'],
            'email'   => ['valid_email' => 'Email tidak valid.'],
            'address' => ['required' => 'Tulis alamat pengiriman.', 'min_length' => 'Alamat terlalu pendek.'],
            'city'    => ['required' => 'Tulis kota.'],
            'pay'     => ['in_list' => 'Pilih cara bayar.'],
        ];
        if (! $this->validateData($data, $rules, $messages)) {
            return $this->invalid();
        }
        $phone = normalize_phone($data['phone']);
        if ($phone === null) {
            return $this->fail422('phone', 'Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890.');
        }
        $variant = (new VariantModel())->where('slug', $data['variant'])->where('is_active', 1)->first();
        $edition = (new EditionModel())->where('slug', $data['edition'])->where('is_active', 1)->first();
        if (! $variant || ! $edition) {
            return $this->respond(['status' => 409, 'message' => 'Warna atau edisi itu sudah tidak tersedia. Muat ulang halaman.'], 409);
        }
        $qty = (int) $data['qty'];

        $m  = new PreorderModel();
        $db = db_connect();
        $db->transStart();
        // kurangi stok hanya kalau cukup; kalau tidak, tidak ada baris yang berubah
        $db->query('UPDATE variants SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?', [$qty, date('Y-m-d H:i:s'), $variant['id'], $qty]);
        if ($db->affectedRows() !== 1) {
            $db->transRollback();
            $left = (int) $db->table('variants')->select('stock')->where('id', $variant['id'])->get()->getRow()->stock;

            return $this->respond(['status' => 409, 'message' => $left > 0 ? "Stok {$variant['name']} tinggal {$left} unit." : "Maaf, {$variant['name']} sudah habis untuk batch ini. Pilih warna lain atau masuk waitlist."], 409);
        }
        $row = [
            'code'         => $m->makeCode(),
            'variant_id'   => $variant['id'],
            'variant_name' => $variant['name'],
            'edition_name' => $edition['name'],
            'unit_price'   => (int) $edition['price'],
            'qty'          => $qty,
            'total'        => (int) $edition['price'] * $qty,
            'name'         => strip_tags($data['name']),
            'phone'        => $phone,
            'email'        => $data['email'] !== '' ? strtolower($data['email']) : null,
            'address'      => strip_tags($data['address']),
            'city'         => strip_tags($data['city']),
            'pay'          => $data['pay'],
            'note'         => $data['note'] !== '' ? strip_tags($data['note']) : null,
            'status'       => 'menunggu',
            'ip'           => $this->request->getIPAddress(),
        ];
        $m->insert($row);
        $db->transComplete();
        if (! $db->transStatus()) {
            return $this->respond(['status' => 500, 'message' => 'Pre-order gagal disimpan. Coba lagi.'], 500);
        }

        $text = "Halo {$cfg->name}, saya {$row['name']}. Konfirmasi pre-order {$row['code']}:\n"
            . "{$cfg->name} {$row['edition_name']}, warna {$row['variant_name']} ×{$qty}\n"
            . 'Total: ' . rupiah($row['total']) . "\nBayar: {$row['pay']}\nKirim ke: {$row['address']}, {$row['city']}";

        return $this->respondCreated([
            'code'     => $row['code'],
            'total'    => $row['total'],
            'orders'   => $m->publicCount(),
            'whatsapp' => wa_url($cfg->whatsapp, $text),
            'message'  => 'Total ' . rupiah($row['total']) . '. Stok sudah kami tahan untukmu. ' . $cfg->payNote,
        ]);
    }

    /** Lacak status: butuh kode + nomor WhatsApp yang sama dengan saat memesan. */
    public function track()
    {
        if (! $this->allowed('track', 10)) {
            return $this->tooMany();
        }
        $data  = $this->payload() + ['code' => '', 'phone' => ''];
        $order = (new PreorderModel())->findOwned((string) $data['code'], normalize_phone((string) $data['phone']));
        if (! $order) {
            return $this->respond(['status' => 404, 'message' => 'Pre-order tidak ditemukan. Cek lagi kode dan nomor WhatsApp-nya.'], 404);
        }
        $steps = [];
        foreach (config('Store')->statuses as $k => $l) {
            if ($k !== 'batal') {
                $steps[] = ['key' => $k, 'label' => $l];
            }
        }

        return $this->respond([
            'code' => $order['code'], 'status' => $order['status'], 'steps' => $steps,
            'variant' => $order['variant_name'], 'edition' => $order['edition_name'], 'qty' => (int) $order['qty'],
            'tracking' => $order['tracking'],
        ]);
    }
}
