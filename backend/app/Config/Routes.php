<?php

use App\Filters\AdminAuth;
use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// Halaman utama = website (installer menyalin frontend ke public/)
$routes->get('/', 'Home::index');

// ---------- API JSON untuk website ----------
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => 'cors'], static function ($routes) {
    $routes->get('health', 'Health::index');
    $routes->get('catalog', 'Catalog::index');
    $routes->post('preorders', 'Preorders::create');
    $routes->post('preorders/track', 'Preorders::track');
    $routes->post('waitlist', 'Waitlist::create');
    $routes->get('reviews', 'Reviews::index');
    $routes->post('reviews', 'Reviews::create');
    $routes->options('(:any)', static fn () => service('response')->setStatusCode(204));
});

// ---------- Login admin ----------
$routes->get('admin/login', 'Auth::login');
$routes->post('admin/login', 'Auth::attempt', ['filter' => 'csrf']);
$routes->get('admin/logout', 'Auth::logout');

// ---------- Panel admin (wajib login, semua POST dicek CSRF) ----------
$routes->group('admin', ['namespace' => 'App\Controllers\Admin', 'filter' => AdminAuth::class], static function ($routes) {
    $routes->get('/', 'Dashboard::index');

    $routes->get('preorder', 'Preorders::index');
    $routes->get('preorder/csv', 'Preorders::export');
    $routes->post('preorder/(:num)/status', 'Preorders::updateStatus/$1');
    $routes->post('preorder/(:num)/resi', 'Preorders::updateTracking/$1');
    $routes->post('preorder/(:num)/hapus', 'Preorders::delete/$1');

    $routes->get('waitlist', 'Waitlist::index');
    $routes->get('waitlist/csv', 'Waitlist::export');
    $routes->post('waitlist/(:num)/dikabari', 'Waitlist::toggle/$1');
    $routes->post('waitlist/(:num)/hapus', 'Waitlist::delete/$1');

    $routes->get('ulasan', 'Reviews::index');
    $routes->post('ulasan/(:num)/status', 'Reviews::updateStatus/$1');
    $routes->post('ulasan/(:num)/hapus', 'Reviews::delete/$1');

    $routes->get('produk', 'Products::index');
    $routes->post('produk/warna/(:num)', 'Products::updateVariant/$1');
    $routes->post('produk/edisi/(:num)', 'Products::updateEdition/$1');
});
