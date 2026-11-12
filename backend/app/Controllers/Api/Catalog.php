<?php

namespace App\Controllers\Api;

use App\Models\EditionModel;
use App\Models\PreorderModel;
use App\Models\VariantModel;

/** Warna (dengan stok), edisi (dengan harga), dan jumlah pemesan. */
class Catalog extends BaseApi
{
    public function index()
    {
        $variants = array_map(static fn ($v) => [
            'slug'      => $v['slug'],
            'name'      => $v['name'],
            'stock'     => (int) $v['stock'],
            'available' => (bool) $v['is_active'] && (int) $v['stock'] > 0,
        ], (new VariantModel())->where('is_active', 1)->orderBy('sort')->findAll());
        $editions = array_map(static fn ($e) => [
            'slug'      => $e['slug'],
            'name'      => $e['name'],
            'price'     => (int) $e['price'],
            'available' => true,
        ], (new EditionModel())->where('is_active', 1)->orderBy('sort')->findAll());

        return $this->respond(['variants' => $variants, 'editions' => $editions, 'orders' => (new PreorderModel())->publicCount()]);
    }
}
