<?php

namespace App\Controllers;

/** Menampilkan frontend (public/index.html) di alamat utama server. */
class Home extends BaseController
{
    public function index()
    {
        $file = FCPATH . 'index.html';

        if (! is_file($file)) {
            return $this->response->setStatusCode(503)->setBody(
                '<p style="font-family:sans-serif">Frontend belum disalin ke folder <code>public/</code>. Jalankan <code>install.bat</code> atau <code>./install.sh</code> lagi.</p>'
            );
        }

        return $this->response->setContentType('text/html')->setBody(file_get_contents($file));
    }
}
