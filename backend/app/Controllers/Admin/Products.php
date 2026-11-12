<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Models\EditionModel;
use App\Models\VariantModel;
use CodeIgniter\Exceptions\PageNotFoundException;

/** Stok per warna dan harga per edisi. Warna baru butuh warna 3D-nya di js/data.js juga. */
class Products extends BaseController
{
    public function index()
    {
        return view('admin/products', [
            'title'    => 'Produk & stok',
            'variants' => (new VariantModel())->orderBy('sort')->findAll(),
            'editions' => (new EditionModel())->orderBy('sort')->findAll(),
        ]);
    }

    public function updateVariant(int $id)
    {
        $m   = new VariantModel();
        $row = $m->find($id) ?? throw new PageNotFoundException();
        if (! $this->validate(['stock' => 'required|is_natural|less_than_equal_to[100000]', 'name' => 'required|max_length[40]'])) {
            return redirect()->back()->with('error', 'Stok harus angka 0 atau lebih, nama wajib diisi.');
        }
        $m->update($id, [
            'name'      => strip_tags((string) $this->request->getPost('name')),
            'stock'     => (int) $this->request->getPost('stock'),
            'is_active' => $this->request->getPost('is_active') ? 1 : 0,
        ]);

        return redirect()->back()->with('success', 'Warna ' . esc($row['name']) . ' disimpan.');
    }

    public function updateEdition(int $id)
    {
        $m   = new EditionModel();
        $row = $m->find($id) ?? throw new PageNotFoundException();
        if (! $this->validate(['price' => 'required|is_natural_no_zero|less_than_equal_to[1000000000]', 'name' => 'required|max_length[40]'])) {
            return redirect()->back()->with('error', 'Harga harus angka tanpa titik, nama wajib diisi.');
        }
        $m->update($id, [
            'name'      => strip_tags((string) $this->request->getPost('name')),
            'price'     => (int) $this->request->getPost('price'),
            'is_active' => $this->request->getPost('is_active') ? 1 : 0,
        ]);

        return redirect()->back()->with('success', 'Edisi ' . esc($row['name']) . ' disimpan.');
    }
}
