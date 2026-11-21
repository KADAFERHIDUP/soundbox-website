<?php

namespace App\Database\Seeds;

use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\Seeder;
use RuntimeException;

class AdminSeeder extends Seeder
{
    /** Password contoh yang dulu tertulis di repo publik. Siapa pun bisa mencobanya, jadi ditolak. */
    public const KNOWN = ['burger123', 'buycars123', 'fabulous123', 'kumoramen123', 'soundbox123', 'admin12345', 'password123'];

    public function run()
    {
        $email = env('ADMIN_EMAIL', 'umraithi769@gmail.com');

        if ($this->db->table('users')->where('email', $email)->countAllResults() > 0) {
            return;
        }

        $password = (string) env('ADMIN_PASSWORD', '');

        if ($password === '') {
            // Tidak ada password bawaan: kalau ADMIN_PASSWORD kosong, buat yang acak dan tampilkan sekali saja.
            $password = bin2hex(random_bytes(8));
            CLI::write("Password admin dibuat otomatis: {$password}", 'yellow');
            CLI::write('Simpan sekarang. Password ini tidak ditampilkan lagi.', 'yellow');
        } elseif (! self::isStrong($password)) {
            throw new RuntimeException('ADMIN_PASSWORD terlalu lemah atau sudah pernah tertulis di contoh: minimal 10 karakter, berisi huruf dan angka.');
        }

        $now = date('Y-m-d H:i:s');
        $this->db->table('users')->insert([
            'name'          => 'Ahmad Umraithi',
            'email'         => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);
    }

    /** Minimal 10 karakter, ada huruf dan angka, dan bukan password contoh yang pernah dipublikasikan. */
    public static function isStrong(string $password): bool
    {
        return strlen($password) >= 10 && strlen($password) <= 72
            && preg_match('/[A-Za-z]/', $password) && preg_match('/\d/', $password)
            && ! in_array(strtolower($password), self::KNOWN, true);
    }
}
