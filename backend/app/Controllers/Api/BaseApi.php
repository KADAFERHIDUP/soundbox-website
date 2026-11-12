<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Dasar semua endpoint API: baca JSON atau form, batasi jumlah request per IP,
 * dan buang kiriman robot spam (kolom jebakan "website" yang tersembunyi di form).
 */
abstract class BaseApi extends BaseController
{
    use ResponseTrait;

    protected $format = 'json';

    protected function payload(): array
    {
        $json = $this->request->getJSON(true);
        $data = is_array($json) ? $json : $this->request->getPost();

        return array_map(static fn ($v) => is_string($v) ? trim($v) : $v, (array) $data);
    }

    /** true kalau IP ini masih boleh mengirim (default 8 kiriman per menit per endpoint). */
    protected function allowed(string $bucket, int $capacity = 8, int $seconds = MINUTE): bool
    {
        $key = 'api-' . $bucket . '-' . md5((string) $this->request->getIPAddress());

        return service('throttler')->check($key, $capacity, $seconds) !== false;
    }

    protected function tooMany(): ResponseInterface
    {
        return $this->respond(['status' => 429, 'message' => 'Terlalu banyak permintaan. Coba lagi sebentar lagi.'], 429);
    }

    protected function isBot(array $data): bool
    {
        return ! empty($data['website']);
    }

    protected function fail422(string $field, string $message): ResponseInterface
    {
        return $this->respond(['status' => 422, 'message' => $message, 'errors' => [$field => $message]], 422);
    }

    protected function invalid(): ResponseInterface
    {
        $errors = $this->validator ? $this->validator->getErrors() : [];

        return $this->respond(['status' => 422, 'message' => reset($errors) ?: 'Data tidak valid.', 'errors' => $errors], 422);
    }
}
