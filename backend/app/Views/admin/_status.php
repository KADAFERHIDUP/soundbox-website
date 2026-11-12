<?php $labels = config('Store')->statuses; ?>
<form method="post" action="<?= site_url("admin/preorder/{$r['id']}/status") ?>"><?= csrf_field() ?>
    <select name="status" class="s-<?= esc($r['status']) ?>" onchange="this.form.submit()" aria-label="Status <?= esc($r['code']) ?>">
        <?php foreach ($labels as $k => $l): ?><option value="<?= $k ?>" <?= $r['status'] === $k ? 'selected' : '' ?>><?= $l ?></option><?php endforeach ?>
    </select>
</form>
