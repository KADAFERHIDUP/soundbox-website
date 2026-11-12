<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * CORS untuk /api. Dibutuhkan hanya kalau frontend dibuka dari alamat lain
 * (misalnya GitHub Pages atau Live Server). Atur daftar alamat di .env: CORS_ORIGINS.
 */
class Cors extends BaseConfig
{
    public array $default = [
        'allowedOrigins'         => [],
        'allowedOriginsPatterns' => [],
        'supportsCredentials'    => false,
        'allowedHeaders'         => ['Content-Type', 'Accept'],
        'exposedHeaders'         => [],
        'allowedMethods'         => ['GET', 'POST', 'OPTIONS'],
        'maxAge'                 => 7200,
    ];

    public function __construct()
    {
        parent::__construct();

        $origins = (string) env('CORS_ORIGINS', 'http://localhost:5500,http://127.0.0.1:5500,https://soundbox.kadaferhidup.my.id,https://kadaferhidup.github.io');
        $this->default['allowedOrigins'] = array_values(array_filter(array_map('trim', explode(',', $origins))));
    }
}
