<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<?php $cfg = config('Store'); ?>
<div class="toolbar">
    <nav class="tabs">
        <a class="<?= $status === '' ? 'active' : '' ?>" href="<?= site_url('admin/preorder') ?>">Semua</a>
        <?php foreach ($cfg->statuses as $k => $l): ?><a class="<?= $status === $k ? 'active' : '' ?>" href="<?= site_url('admin/preorder?status=' . $k) ?>"><?= $l ?></a><?php endforeach ?>
    </nav>
    <form class="filters" method="get" action="<?= site_url('admin/preorder') ?>">
        <?php if ($status): ?><input type="hidden" name="status" value="<?= esc($status) ?>"><?php endif ?>
        <input type="search" name="q" value="<?= esc($q) ?>" placeholder="Cari kode, nama, nomor, kota" aria-label="Cari pre-order">
        <a class="btn" href="<?= site_url('admin/preorder/csv') ?>">Unduh CSV</a>
    </form>
</div>
<section class="card">
<?php if (! $rows): ?>
    <p class="empty"><?= $q !== '' || $status !== '' ? 'Tidak ada pre-order yang cocok.' : 'Belum ada pre-order. Pre-order dari website muncul di sini.' ?></p>
<?php else: ?>
    <div class="table-wrap"><table>
        <thead><tr><th>Kode</th><th>Pesanan</th><th>Pemesan &amp; alamat</th><th>Status</th><th>Resi</th><th>Aksi</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
            <tr>
                <td><b class="code"><?= esc($r['code']) ?></b><br><span class="muted"><?= esc(waktu($r['created_at'])) ?></span></td>
                <td><?= esc($r['edition_name']) ?> · <b><?= esc($r['variant_name']) ?></b> ×<?= (int) $r['qty'] ?><br><span class="muted"><?= rupiah($r['total']) ?> · <?= esc($r['pay']) ?></span></td>
                <td><?= esc($r['name']) ?> · <?= esc($r['phone']) ?><?= $r['email'] ? '<br><span class="muted">' . esc($r['email']) . '</span>' : '' ?><br><span class="muted"><?= esc($r['address']) ?>, <?= esc($r['city']) ?></span><?php if ($r['note']): ?><br><em class="note">“<?= esc($r['note']) ?>”</em><?php endif ?></td>
                <td><?= view('admin/_status', ['r' => $r]) ?></td>
                <td><form class="inline" method="post" action="<?= site_url("admin/preorder/{$r['id']}/resi") ?>"><?= csrf_field() ?><input name="tracking" value="<?= esc($r['tracking'] ?? '') ?>" placeholder="No. resi" aria-label="Nomor resi <?= esc($r['code']) ?>"><button class="btn sm" type="submit">Simpan</button></form></td>
                <td><div class="actions">
                    <a class="btn sm wa" target="_blank" rel="noopener" href="<?= esc(wa_url($r['phone'], "Halo {$r['name']}, kami dari {$cfg->name}. Pre-order {$r['code']} ({$r['edition_name']} {$r['variant_name']} ×{$r['qty']}) totalnya " . rupiah($r['total']) . '.')) ?>">WhatsApp</a>
                    <form method="post" action="<?= site_url("admin/preorder/{$r['id']}/hapus") ?>" onsubmit="return confirm('Hapus pre-order <?= esc($r['code'], 'js') ?>? Stok dikembalikan.')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
                </div></td>
            </tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
    <p class="hint">Status <b>Batal</b> mengembalikan stok warna. Mengisi nomor resi otomatis mengubah status menjadi <b>Dikirim</b>. Pembeli bisa melacak status lewat website dengan kode + nomor WhatsApp.</p>
<?php endif ?>
</section>
<?= $this->endSection() ?>
