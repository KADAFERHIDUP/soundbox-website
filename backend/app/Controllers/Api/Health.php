<?php

namespace App\Controllers\Api;

class Health extends BaseApi
{
    public function index()
    {
        return $this->respond(['ok' => true, 'name' => config('Store')->product, 'time' => date('c')]);
    }
}
