<?php

namespace App\Commands;

use App\Database\Seeds\AdminSeeder;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/** Ganti password admin dari terminal: php spark admin:password [email] */
class AdminPassword extends BaseCommand
{
    protected $group       = 'Admin';
    protected $name        = 'admin:password';
    protected $description = 'Ganti password akun admin.';
    protected $usage       = 'admin:password [email]';

    public function run(array $params)
    {
        $email = $params[0] ?? (string) env('ADMIN_EMAIL', 'umraithi769@gmail.com');
        $db    = db_connect();
        $user  = $db->table('users')->where('email', $email)->get()->getRowArray();

        if ($user === null) {
            CLI::error("Admin {$email} tidak ditemukan.");

            return EXIT_ERROR;
        }

        $password = (string) ($params['password'] ?? CLI::prompt('Password baru (minimal 10 karakter, ada huruf dan angka)'));

        if (! AdminSeeder::isStrong($password)) {
            CLI::error('Password terlalu lemah atau sudah pernah tertulis di contoh publik.');

            return EXIT_ERROR;
        }

        $db->table('users')->where('id', $user['id'])->update([
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);
        CLI::write("Password {$email} sudah diganti.", 'green');

        return EXIT_SUCCESS;
    }
}
