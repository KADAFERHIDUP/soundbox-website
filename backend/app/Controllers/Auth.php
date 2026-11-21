<?php

namespace App\Controllers;

use App\Database\Seeds\AdminSeeder;
use App\Models\UserModel;

class Auth extends BaseController
{
    public function login()
    {
        if (session()->get('admin')) {
            return redirect()->to(site_url('admin'));
        }

        return view('auth/login', ['title' => 'Login Admin']);
    }

    public function attempt()
    {
        // jeda singkat per IP supaya password tidak bisa ditebak beruntun
        if (service('throttler')->check('login-' . md5((string) $this->request->getIPAddress()), 5, 5 * MINUTE) === false) {
            return redirect()->back()->withInput()->with('error', 'Terlalu banyak percobaan. Tunggu 5 menit.');
        }

        if (! $this->validate(['email' => 'required|valid_email', 'password' => 'required'])) {
            return redirect()->back()->withInput()->with('error', 'Isi email dan password dengan benar.');
        }

        $user = (new UserModel())->where('email', $this->request->getPost('email'))->first();

        // hash pembanding supaya waktu respons sama, baik email terdaftar maupun tidak
        $hash = $user['password_hash'] ?? '$2y$10$kLlS1M2fsJFe5G86P9z8EuUcZD0uv/uoO9aU1xKjdGPpWCx3hguuC';
        $ok   = password_verify((string) $this->request->getPost('password'), $hash) && $user !== null;

        if (! $ok) {
            return redirect()->back()->withInput()->with('error', 'Email atau password salah.');
        }

        if (in_array(strtolower((string) $this->request->getPost('password')), AdminSeeder::KNOWN, true)) {
            return redirect()->back()->withInput()->with('error', 'Password ini pernah tertulis di contoh publik, jadi tidak bisa dipakai lagi. Ganti dulu lewat terminal: php spark admin:password');
        }

        session()->regenerate();
        session()->set('admin', ['id' => $user['id'], 'name' => $user['name']]);

        return redirect()->to(site_url('admin'));
    }

    public function logout()
    {
        session()->remove('admin');
        session()->regenerate(true);

        return redirect()->to(site_url('admin/login'))->with('success', 'Kamu sudah logout.');
    }
}
