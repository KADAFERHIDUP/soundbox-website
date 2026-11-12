<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php $s = $stats; ?>
<div class="stats">
    <a class="stat hot" href="<?= site_url('admin/preorder?status=menunggu') ?>"><span>Menunggu bayar</span><b><?= $s['waiting'] ?></b></a>
    <a class="stat" href="<?= site_url('admin/preorder?status=dibayar') ?>"><span>Dibayar / produksi</span><b><?= $s['paid'] ?></b></a>
    <div class="stat"><span>Unit dipesan</span><b><?= $s['units'] ?></b></div>
    <div class="stat"><span>Uang masuk (dibayar)</span><b><?= rupiah($s['revenue']) ?></b></div>
    <div class="stat"><span>Pre-order hari ini</span><b><?= rupiah($s['today']) ?></b></div>
    <a class="stat" href="<?= site_url('admin/waitlist') ?>"><span>Waitlist belum dikabari</span><b><?= $s['waitlist'] ?></b></a>
    <a class="stat <?= $s['reviews'] ? 'warn' : '' ?>" href="<?= site_url('admin/ulasan') ?>"><span>Ulasan perlu dicek</span><b><?= $s['reviews'] ?></b></a>
</div>
<div class="dash">
    <section class="card">
        <div class="card-head"><h2>Pre-order terbaru</h2><a href="<?= site_url('admin/preorder') ?>">Semua →</a></div>
        <?php if (! $recent): ?><p class="empty">Belum ada pre-order.</p><?php else: ?>
        <div class="table-wrap"><table>
            <thead><tr><th>Kode</th><th>Pemesan</th><th>Pesanan</th><th>Total</th><th>Status</th></tr></thead>
            <tbody><?php foreach ($recent as $r): ?>
                <tr><td><b><?= esc($r['code']) ?></b><br><span class="muted"><?= esc(waktu($r['created_at'])) ?></span></td>
                    <td><?= esc($r['name']) ?><br><span class="muted"><?= esc($r['city']) ?></span></td>
                    <td><?= esc($r['edition_name']) ?> · <?= esc($r['variant_name']) ?> ×<?= (int) $r['qty'] ?></td>
                    <td><?= rupiah($r['total']) ?></td>
                    <td><?= view('admin/_status', ['r' => $r]) ?></td></tr>
            <?php endforeach ?></tbody>
        </table></div>
        <?php endif ?>
    </section>
    <aside class="card">
        <div class="card-head"><h2>Stok per warna</h2><a href="<?= site_url('admin/produk') ?>">Atur →</a></div>
        <ul class="mini">
            <?php foreach ($variants as $v): $n = $sold[$v['id']] ?? 0; $tot = max(1, $n + (int) $v['stock']); ?>
            <li class="stock-row"><span class="dot" style="background:<?= esc($v['swatch']) ?>"></span><div class="grow"><b><?= esc($v['name']) ?></b><?php if (! $v['is_active']): ?> <span class="tag">nonaktif</span><?php endif ?>
                <div class="bar"><i style="width:<?= round($n / $tot * 100) ?>%"></i></div>
                <span class="muted"><?= $n ?> dipesan · sisa <?= (int) $v['stock'] ?></span></div></li>
            <?php endforeach ?>
        </ul>
    </aside>
</div>
<?= $this->endSection() ?>
