<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;

class Dashboard extends BaseController
{
    public function index()
    {
        $db    = db_connect();
        $today = date('Y-m-d') . ' 00:00:00';
        $sum   = static fn ($q) => (int) ($q->get()->getRow()->total ?? 0);
        $stats = [
            'waiting'  => $db->table('preorders')->where('status', 'menunggu')->countAllResults(),
            'paid'     => $db->table('preorders')->whereIn('status', ['dibayar', 'produksi'])->countAllResults(),
            'units'    => (int) ($db->table('preorders')->selectSum('qty')->where('status !=', 'batal')->get()->getRow()->qty ?? 0),
            'revenue'  => $sum($db->table('preorders')->selectSum('total')->whereIn('status', ['dibayar', 'produksi', 'dikirim', 'selesai'])),
            'today'    => $sum($db->table('preorders')->selectSum('total')->where('status !=', 'batal')->where('created_at >=', $today)),
            'waitlist' => $db->table('waitlist')->where('notified', 0)->countAllResults(),
            'reviews'  => $db->table('reviews')->where('status', 'baru')->countAllResults(),
        ];
        $recent   = $db->table('preorders')->orderBy('id', 'DESC')->limit(8)->get()->getResultArray();
        $variants = $db->table('variants')->orderBy('sort')->get()->getResultArray();
        $sold     = [];
        foreach ($db->table('preorders')->select('variant_id, SUM(qty) AS qty')->where('status !=', 'batal')->groupBy('variant_id')->get()->getResultArray() as $r) {
            $sold[$r['variant_id']] = (int) $r['qty'];
        }

        return view('admin/dashboard', ['title' => 'Dashboard', 'stats' => $stats, 'recent' => $recent, 'variants' => $variants, 'sold' => $sold]);
    }
}
