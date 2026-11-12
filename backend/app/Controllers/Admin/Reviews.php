<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use CodeIgniter\Exceptions\PageNotFoundException;

class Reviews extends BaseController
{
    public function index()
    {
        $rows = db_connect()->table('reviews r')->select('r.*, p.code')->join('preorders p', 'p.id = r.preorder_id', 'left')
            ->orderBy("CASE r.status WHEN 'baru' THEN 0 ELSE 1 END", '', false)->orderBy('r.id', 'DESC')->get()->getResultArray();

        return view('admin/reviews', ['title' => 'Ulasan', 'rows' => $rows]);
    }

    public function updateStatus(int $id)
    {
        $status = (string) $this->request->getPost('status');
        if (! in_array($status, ['tampil', 'sembunyi', 'baru'], true)) {
            return redirect()->back();
        }
        $t = db_connect()->table('reviews');
        if ($t->where('id', $id)->countAllResults() === 0) {
            throw new PageNotFoundException();
        }
        db_connect()->table('reviews')->where('id', $id)->update(['status' => $status, 'updated_at' => date('Y-m-d H:i:s')]);

        return redirect()->back()->with('success', $status === 'tampil' ? 'Ulasan ditampilkan di website.' : 'Ulasan disembunyikan.');
    }

    public function delete(int $id)
    {
        db_connect()->table('reviews')->where('id', $id)->delete();

        return redirect()->back()->with('success', 'Ulasan dihapus.');
    }
}
