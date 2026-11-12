<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/** Warna dan edisi awal, sama dengan js/data.js. Data yang sudah ada tidak ditimpa. */
class CatalogSeeder extends Seeder
{
    public function run()
    {
        $now = date('Y-m-d H:i:s');
        $variants = [
            ['slug' => 'sand', 'name' => 'Sand', 'swatch' => '#c2a47c', 'stock' => 40, 'sort' => 10],
            ['slug' => 'midnight', 'name' => 'Midnight', 'swatch' => '#1f2023', 'stock' => 40, 'sort' => 20],
            ['slug' => 'sage', 'name' => 'Sage', 'swatch' => '#9aae94', 'stock' => 25, 'sort' => 30],
            ['slug' => 'ocean', 'name' => 'Ocean', 'swatch' => '#1f5d66', 'stock' => 25, 'sort' => 40],
            ['slug' => 'blush', 'name' => 'Blush', 'swatch' => '#e4bcb3', 'stock' => 20, 'sort' => 50],
            ['slug' => 'ivory', 'name' => 'Ivory', 'swatch' => '#ece5d6', 'stock' => 20, 'sort' => 60],
            ['slug' => 'ember', 'name' => 'Ember', 'swatch' => '#d4532f', 'stock' => 15, 'sort' => 70],
        ];
        foreach ($variants as $r) {
            if ($this->db->table('variants')->where('slug', $r['slug'])->countAllResults() === 0) {
                $this->db->table('variants')->insert($r + ['is_active' => 1, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        $editions = [
            ['slug' => 's9', 'name' => 'S9', 'price' => 2499000, 'sort' => 10],
            ['slug' => 's9-pro', 'name' => 'S9 Pro Kit', 'price' => 2899000, 'sort' => 20],
        ];
        foreach ($editions as $r) {
            if ($this->db->table('editions')->where('slug', $r['slug'])->countAllResults() === 0) {
                $this->db->table('editions')->insert($r + ['is_active' => 1, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }
}
