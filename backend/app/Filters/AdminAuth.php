<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Melindungi semua halaman /admin: wajib login,
 * dan setiap form POST di panel admin dicek token CSRF-nya.
 */
class AdminAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (! session()->get('admin')) {
            return redirect()->to(site_url('admin/login'))->with('error', 'Silakan login dulu.');
        }

        if (strtolower($request->getMethod()) === 'post') {
            service('security')->verify($request);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
