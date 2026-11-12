<?= $this->extend('admin/layout') ?>
<?= $this->section('content') ?>
<div class="toolbar"><span class="muted"><?= count($rows) ?> kontak</span><a class="btn" href="<?= site_url('admin/waitlist/csv') ?>">Unduh CSV</a></div>
<section class="card">
<?php if (! $rows): ?><p class="empty">Belum ada yang masuk waitlist.</p><?php else: ?>
    <div class="table-wrap"><table>
        <thead><tr><th>Nama</th><th>Kontak</th><th>Warna</th><th>Masuk</th><th>Dikabari</th><th>Aksi</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): $mail = str_contains($r['contact'], '@'); ?>
            <tr class="<?= $r['notified'] ? 'off' : '' ?>">
                <td><?= esc($r['name']) ?></td>
                <td><?= esc($r['contact']) ?></td>
                <td><?= esc($r['variant'] ?? '—') ?></td>
                <td class="muted"><?= esc(waktu($r['created_at'])) ?></td>
                <td><form method="post" action="<?= site_url("admin/waitlist/{$r['id']}/dikabari") ?>"><?= csrf_field() ?><button class="btn sm <?= $r['notified'] ? 'ok' : '' ?>" type="submit"><?= $r['notified'] ? 'Sudah' : 'Belum' ?></button></form></td>
                <td><div class="actions">
                    <?php if ($mail): ?><a class="btn sm" href="mailto:<?= esc($r['contact']) ?>?subject=<?= rawurlencode('Soundbox S9 tersedia') ?>">Email</a>
                    <?php else: ?><a class="btn sm wa" target="_blank" rel="noopener" href="<?= esc(wa_url($r['contact'], "Halo {$r['name']}, Soundbox S9" . ($r['variant'] ? " warna {$r['variant']}" : '') . ' sudah bisa dipesan lagi. Pesan di website kami ya!')) ?>">WhatsApp</a><?php endif ?>
                    <form method="post" action="<?= site_url("admin/waitlist/{$r['id']}/hapus") ?>" onsubmit="return confirm('Hapus kontak ini?')"><?= csrf_field() ?><button class="btn sm danger" type="submit">Hapus</button></form>
                </div></td>
            </tr>
        <?php endforeach ?>
        </tbody>
    </table></div>
<?php endif ?>
</section>
<?= $this->endSection() ?>
