<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<section class="card">
    <div class="card-head"><h2>Warna &amp; stok batch ini</h2></div>
    <div class="table-wrap"><table>
        <thead><tr><th>Warna</th><th>Nama tampilan</th><th>Stok</th><th>Dijual</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($variants as $v): ?>
            <tr><td><span class="dot big" style="background:<?= esc($v['swatch']) ?>"></span> <span class="muted"><?= esc($v['slug']) ?></span></td>
                <td colspan="4"><form class="inline grid4" method="post" action="<?= site_url('admin/produk/warna/' . $v['id']) ?>"><?= csrf_field() ?>
                    <input name="name" value="<?= esc($v['name']) ?>" maxlength="40" aria-label="Nama warna">
                    <input name="stock" type="number" min="0" value="<?= (int) $v['stock'] ?>" aria-label="Stok <?= esc($v['name']) ?>">
                    <label class="check"><input type="checkbox" name="is_active" value="1" <?= $v['is_active'] ? 'checked' : '' ?>> Aktif</label>
                    <button class="btn sm primary" type="submit">Simpan</button></form></td></tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
    <p class="hint">Stok berkurang otomatis setiap ada pre-order dan kembali kalau pre-order dibatalkan. Stok 0 = warna tampil "habis" dan pembeli diarahkan ke waitlist.</p>
</section>
<section class="card">
    <div class="card-head"><h2>Edisi &amp; harga</h2></div>
    <div class="table-wrap"><table>
        <thead><tr><th>Edisi</th><th colspan="4">Nama · harga (Rp) · dijual</th></tr></thead>
        <tbody>
        <?php foreach ($editions as $e): ?>
            <tr><td><b><?= esc($e['slug']) ?></b></td>
                <td colspan="4"><form class="inline grid4" method="post" action="<?= site_url('admin/produk/edisi/' . $e['id']) ?>"><?= csrf_field() ?>
                    <input name="name" value="<?= esc($e['name']) ?>" maxlength="40" aria-label="Nama edisi">
                    <input name="price" type="number" min="1000" step="1000" value="<?= (int) $e['price'] ?>" aria-label="Harga <?= esc($e['name']) ?>">
                    <label class="check"><input type="checkbox" name="is_active" value="1" <?= $e['is_active'] ? 'checked' : '' ?>> Aktif</label>
                    <button class="btn sm primary" type="submit">Simpan</button></form></td></tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
    <p class="hint">Harga baru langsung berlaku di website. Pre-order lama tetap memakai harga saat dipesan.</p>
</section>
<?= $this->endSection() ?>
