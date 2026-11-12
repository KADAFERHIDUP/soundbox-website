<?php

namespace App\Models;

use CodeIgniter\Model;

class PreorderModel extends Model
{
    protected $table         = 'preorders';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['code', 'variant_id', 'variant_name', 'edition_name', 'unit_price', 'qty', 'total', 'name', 'phone', 'email', 'address', 'city', 'pay', 'note', 'status', 'tracking', 'ip'];

    /** Kode pendek yang mudah dibacakan, misalnya SB-261112-K7Q2. */
    public function makeCode(): string
    {
        $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = 'SB-' . date('ymd') . '-';
            for ($i = 0; $i < 4; $i++) {
                $code .= $abc[random_int(0, strlen($abc) - 1)];
            }
        } while ($this->db->table($this->table)->where('code', $code)->countAllResults() > 0);

        return $code;
    }

    /** Jumlah pemesan yang ditampilkan di website (pre-order yang tidak batal). */
    public function publicCount(): int
    {
        return (int) $this->db->table($this->table)->selectSum('qty')->where('status !=', 'batal')->get()->getRow()->qty + config('Store')->ordersOffset;
    }

    /** Cari pre-order dari kode + nomor WhatsApp (keduanya harus cocok). */
    public function findOwned(string $code, ?string $phone): ?array
    {
        if ($phone === null) {
            return null;
        }

        return $this->where('code', strtoupper(trim($code)))->where('phone', $phone)->first();
    }
}
