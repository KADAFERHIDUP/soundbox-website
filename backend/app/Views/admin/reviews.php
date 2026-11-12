<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<section class="card">
<?php if (! $rows): ?><p class="empty">Belum ada ulasan. Pembeli menulis ulasan di website dengan kode pre-order + nomor WhatsApp.</p><?php else: ?>
    <div class="reviews-admin">
    <?php foreach ($rows as $r): ?>
        <article class="review-card s-border-<?= esc($r['status']) ?>">
            <header><b><?= str_repeat('★', (int) $r['rating']) ?><span class="muted"><?= str_repeat('★', 5 - (int) $r['rating']) ?></span></b><span class="tag s-<?= esc($r['status']) ?>"><?= ['baru' => 'Perlu dicek', 'tampil' => 'Tampil', 'sembunyi' => 'Disembunyikan'][$r['status']] ?? esc($r['status']) ?></span></header>
            <p><?= esc($r['body']) ?></p>
            <p class="muted"><?= esc($r['name']) ?> · <?= esc($r['variant']) ?> · <?= esc($r['code'] ?? '') ?> · <?= esc(waktu($r['created_at'])) ?></p>
            <div class="actions">
                <?php foreach (['tampil' => 'Tampilkan', 'sembunyi' => 'Sembunyikan'] as $k => $l): if ($r['status'] === $k) continue; ?>
                <form method="post" action="<?= site_url("admin/ulasan/{$r['id']}/status") ?>"><?= csrf_field() ?><input type="hidden" name="status" value="<?= $k ?>"><button class="btn sm <?= $k === 'tampil' ? 'primary' : '' ?>" type="submit"><?= $l ?></button></form>
                <?php endforeach ?>
                <form method="post" action="<?= site_url("admin/ulasan/{$r['id']}/hapus") ?>" onsubmit="return confirm('Hapus ulasan ini?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
            </div>
        </article>
    <?php endforeach ?>
    </div>
<?php endif ?>
</section>
<?= $this->endSection() ?>
