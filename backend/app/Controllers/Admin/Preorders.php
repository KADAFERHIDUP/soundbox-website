<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\PreorderModel;
use CodeIgniter\Exceptions\PageNotFoundException;

class Preorders extends BaseController
{
    public function index()
    {
        $status = (string) $this->request->getGet('status');
        $q      = trim((string) $this->request->getGet('q'));
        $m      = new PreorderModel();
        if (isset(config('Store')->statuses[$status])) {
            $m->where('status', $status);
        }
        if ($q !== '') {
            $m->groupStart()->like('code', $q)->orLike('name', $q)->orLike('phone', $q)->orLike('city', $q)->groupEnd();
        }

        return view('admin/preorders', ['title' => 'Pre-order', 'rows' => $m->orderBy('id', 'DESC')->findAll(300), 'status' => $status, 'q' => $q]);
    }

    /** Ganti status. Batal mengembalikan stok; dari batal ke status lain mengambil stok lagi (kalau cukup). */
    public function updateStatus(int $id)
    {
        $m      = new PreorderModel();
        $row    = $m->find($id) ?? throw new PageNotFoundException();
        $status = (string) $this->request->getPost('status');
        $labels = config('Store')->statuses;
        if (! isset($labels[$status]) || $status === $row['status']) {
            return redirect()->back();
        }
        $db = db_connect();
        $db->transStart();
        if ($status === 'batal' && $row['variant_id']) {
            $db->query('UPDATE variants SET stock = stock + ? WHERE id = ?', [$row['qty'], $row['variant_id']]);
        } elseif ($row['status'] === 'batal' && $row['variant_id']) {
            $db->query('UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?', [$row['qty'], $row['variant_id'], $row['qty']]);
            if ($db->affectedRows() !== 1) {
                $db->transRollback();

                return redirect()->back()->with('error', 'Stok ' . esc($row['variant_name']) . ' tidak cukup untuk mengaktifkan lagi ' . esc($row['code']) . '.');
            }
        }
        $m->update($id, ['status' => $status]);
        $db->transComplete();

        return redirect()->back()->with('success', esc($row['code']) . ' sekarang ' . $labels[$status] . '.');
    }

    public function updateTracking(int $id)
    {
        $m   = new PreorderModel();
        $row = $m->find($id) ?? throw new PageNotFoundException();
        $resi = trim(strip_tags((string) $this->request->getPost('tracking')));
        if (mb_strlen($resi) > 60) {
            return redirect()->back()->with('error', 'Nomor resi terlalu panjang.');
        }
        $data = ['tracking' => $resi ?: null];
        if ($resi && in_array($row['status'], ['menunggu', 'dibayar', 'produksi'], true)) {
            $data['status'] = 'dikirim';
        }
        $m->update($id, $data);

        return redirect()->back()->with('success', 'Resi ' . esc($row['code']) . ' disimpan.');
    }

    public function delete(int $id)
    {
        $m   = new PreorderModel();
        $row = $m->find($id) ?? throw new PageNotFoundException();
        $db  = db_connect();
        $db->transStart();
        if ($row['status'] !== 'batal' && $row['variant_id']) {
            $db->query('UPDATE variants SET stock = stock + ? WHERE id = ?', [$row['qty'], $row['variant_id']]);
        }
        $db->table('reviews')->where('preorder_id', $id)->delete();
        $m->delete($id);
        $db->transComplete();

        return redirect()->back()->with('success', 'Pre-order ' . esc($row['code']) . ' dihapus, stok dikembalikan.');
    }

    public function export()
    {
        $rows = (new PreorderModel())->orderBy('id', 'DESC')->findAll();
        $cfg  = config('Store');
        $out  = fopen('php://temp', 'w+');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Kode', 'Tanggal', 'Warna', 'Edisi', 'Jumlah', 'Total', 'Nama', 'WhatsApp', 'Email', 'Alamat', 'Kota', 'Bayar', 'Catatan', 'Status', 'Resi'], ';');
        foreach ($rows as $r) {
            fputcsv($out, [$r['code'], $r['created_at'], $r['variant_name'], $r['edition_name'], $r['qty'], $r['total'], $r['name'], $r['phone'], $r['email'], $r['address'], $r['city'], $r['pay'], $r['note'], $cfg->statuses[$r['status']] ?? $r['status'], $r['tracking']], ';');
        }
        rewind($out);

        return $this->response->setHeader('Content-Type', 'text/csv; charset=utf-8')
            ->setHeader('Content-Disposition', 'attachment; filename="preorder-soundbox-' . date('Ymd') . '.csv"')
            ->setBody(stream_get_contents($out));
    }
}
