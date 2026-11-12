<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use CodeIgniter\Exceptions\PageNotFoundException;

class Waitlist extends BaseController
{
    public function index()
    {
        $rows = db_connect()->table('waitlist')->orderBy('notified')->orderBy('id', 'DESC')->get()->getResultArray();

        return view('admin/waitlist', ['title' => 'Waitlist', 'rows' => $rows]);
    }

    public function toggle(int $id)
    {
        $t   = db_connect()->table('waitlist');
        $row = $t->where('id', $id)->get()->getRowArray() ?? throw new PageNotFoundException();
        db_connect()->table('waitlist')->where('id', $id)->update(['notified' => $row['notified'] ? 0 : 1, 'updated_at' => date('Y-m-d H:i:s')]);

        return redirect()->back();
    }

    public function delete(int $id)
    {
        db_connect()->table('waitlist')->where('id', $id)->delete();

        return redirect()->back()->with('success', 'Kontak dihapus dari waitlist.');
    }

    public function export()
    {
        $rows = db_connect()->table('waitlist')->orderBy('id', 'DESC')->get()->getResultArray();
        $out  = fopen('php://temp', 'w+');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Tanggal', 'Nama', 'Kontak', 'Warna', 'Sudah dikabari'], ';');
        foreach ($rows as $r) {
            fputcsv($out, [$r['created_at'], $r['name'], $r['contact'], $r['variant'], $r['notified'] ? 'ya' : 'belum'], ';');
        }
        rewind($out);

        return $this->response->setHeader('Content-Type', 'text/csv; charset=utf-8')
            ->setHeader('Content-Disposition', 'attachment; filename="waitlist-soundbox-' . date('Ymd') . '.csv"')
            ->setBody(stream_get_contents($out));
    }
}
