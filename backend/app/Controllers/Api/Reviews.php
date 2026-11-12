<?php

namespace App\Controllers\Api;

use App\Models\PreorderModel;

/** Ulasan hanya dari pembeli (kode pre-order + nomor WhatsApp), tampil setelah disetujui admin. */
class Reviews extends BaseApi
{
    public function index()
    {
        $db    = db_connect();
        $rows  = $db->table('reviews')->where('status', 'tampil')->orderBy('id', 'DESC')->limit(30)->get()->getResultArray();
        $stats = $db->table('reviews')->select('COUNT(*) AS n, AVG(rating) AS avg')->where('status', 'tampil')->get()->getRow();
        $months = [1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        return $this->respond([
            'count'   => (int) $stats->n,
            'average' => round((float) $stats->avg, 1),
            'items'   => array_map(static fn ($r) => [
                'name'    => self::shortName($r['name']),
                'variant' => $r['variant'],
                'rating'  => (int) $r['rating'],
                'body'    => $r['body'],
                'date'    => $months[(int) date('n', strtotime($r['created_at']))] . ' ' . date('Y', strtotime($r['created_at'])),
            ], $rows),
        ]);
    }

    public function create()
    {
        if (! $this->allowed('reviews', 4)) {
            return $this->tooMany();
        }
        $data = $this->payload() + ['code' => '', 'phone' => '', 'rating' => 0, 'body' => ''];
        if ($this->isBot($data)) {
            return $this->respondCreated(['message' => 'Terima kasih!']);
        }
        $order = (new PreorderModel())->findOwned((string) $data['code'], normalize_phone((string) $data['phone']));
        if (! $order || $order['status'] === 'batal') {
            return $this->respond(['status' => 404, 'message' => 'Kode pre-order dan nomor WhatsApp tidak cocok.'], 404);
        }
        $rating = (int) $data['rating'];
        $body   = trim(strip_tags((string) $data['body']));
        if ($rating < 1 || $rating > 5) {
            return $this->fail422('rating', 'Pilih nilai 1 sampai 5.');
        }
        if (mb_strlen($body) < 10 || mb_strlen($body) > 600) {
            return $this->fail422('body', 'Ulasan 10 sampai 600 huruf.');
        }
        $db  = db_connect();
        $row = ['name' => $order['name'], 'variant' => $order['variant_name'], 'rating' => $rating, 'body' => $body, 'status' => 'baru', 'updated_at' => date('Y-m-d H:i:s')];
        if ($db->table('reviews')->where('preorder_id', $order['id'])->countAllResults() > 0) {
            $db->table('reviews')->where('preorder_id', $order['id'])->update($row);
        } else {
            $db->table('reviews')->insert($row + ['preorder_id' => $order['id'], 'created_at' => date('Y-m-d H:i:s')]);
        }

        return $this->respondCreated(['message' => 'Terima kasih! Ulasanmu tampil setelah dicek admin.']);
    }

    /** "Ahmad Umraithi" menjadi "Ahmad U." supaya nama lengkap pembeli tidak tampil. */
    private static function shortName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name));

        return $parts[0] . (isset($parts[1]) ? ' ' . mb_strtoupper(mb_substr($parts[1], 0, 1)) . '.' : '');
    }
}
