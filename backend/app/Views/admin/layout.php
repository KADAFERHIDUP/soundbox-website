<?php
$admin = session('admin');
$db    = db_connect();
$badge = [
    'po'     => $db->table('preorders')->where('status', 'menunggu')->countAllResults(),
    'wl'     => $db->table('waitlist')->where('notified', 0)->countAllResults(),
    'ulasan' => $db->table('reviews')->where('status', 'baru')->countAllResults(),
];
$path  = uri_string();
$nav   = [
    ['admin', 'Dashboard', 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z', null],
    ['admin/preorder', 'Pre-order', 'M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0', 'po'],
    ['admin/waitlist', 'Waitlist', 'M4 6h16M4 12h10M4 18h7M18 15v6M15 18h6', 'wl'],
    ['admin/ulasan', 'Ulasan', 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z', 'ulasan'],
    ['admin/produk', 'Produk & stok', 'M4 13a8 8 0 0 1 16 0v5h-4v-6h4M4 13v5h4v-6H4', null],
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title><?= esc($title ?? 'Admin') ?> · Admin <?= esc(config('Store')->name) ?></title>
    <link rel="icon" href="<?= base_url('img/favicon.svg') ?>" type="image/svg+xml">
    <link rel="stylesheet" href="<?= base_url('css/admin.css') ?>">
</head>
<body>
<div class="admin">
    <aside class="sidebar" id="sidebar">
        <a href="<?= site_url('admin') ?>" class="brand"><span class="mark">◎</span><span>sound<b>box</b></span> <small>admin</small></a>
        <nav>
            <?php foreach ($nav as [$url, $label, $icon, $key]): $on = $url === 'admin' ? $path === 'admin' : str_starts_with($path, $url); ?>
                <a href="<?= site_url($url) ?>" class="<?= $on ? 'active' : '' ?>"><svg viewBox="0 0 24 24"><path d="<?= $icon ?>"/></svg><?= $label ?><?php if ($key && $badge[$key]): ?><span class="pill"><?= $badge[$key] ?></span><?php endif ?></a>
            <?php endforeach ?>
        </nav>
        <div class="sidebar-foot">
            <a href="<?= base_url('/') ?>" target="_blank" rel="noopener">↗ Lihat website</a>
            <a href="<?= site_url('admin/logout') ?>">⎋ Logout</a>
        </div>
    </aside>
    <main class="main">
        <header class="topbar">
            <button type="button" class="menu-toggle" aria-label="Buka menu" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
            <h1><?= esc($title ?? 'Admin') ?></h1>
            <span class="who"><?= esc($admin['name'] ?? '') ?></span>
        </header>
        <?php if (session('success')): ?><div class="alert ok"><?= session('success') ?></div><?php endif ?>
        <?php if (session('error')): ?><div class="alert err"><?= esc(session('error')) ?></div><?php endif ?>
        <?php if (session('errors')): ?><div class="alert err"><ul><?php foreach ((array) session('errors') as $e): ?><li><?= esc($e) ?></li><?php endforeach ?></ul></div><?php endif ?>
        <?= $this->renderSection('content') ?>
    </main>
</div>
</body>
</html>
