<?php

namespace App\Controllers\Api;

class Waitlist extends BaseApi
{
    public function create()
    {
        if (! $this->allowed('waitlist', 5)) {
            return $this->tooMany();
        }
        $data = $this->payload() + ['name' => '', 'contact' => '', 'variant' => ''];
        if ($this->isBot($data)) {
            return $this->respondCreated(['message' => 'Kamu sudah masuk waitlist.']);
        }
        if (mb_strlen($data['name']) < 2 || mb_strlen($data['name']) > 80) {
            return $this->fail422('name', 'Tulis namamu.');
        }
        $contact = (string) $data['contact'];
        if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
            $contact = strtolower($contact);
        } elseif (($p = normalize_phone($contact)) !== null) {
            $contact = $p;
        } else {
            return $this->fail422('contact', 'Isi nomor WhatsApp atau email yang benar.');
        }
        $variant = db_connect()->table('variants')->where('slug', (string) $data['variant'])->get()->getRowArray();
        $table   = db_connect()->table('waitlist');
        $row     = ['name' => strip_tags($data['name']), 'variant' => $variant['name'] ?? null, 'notified' => 0, 'updated_at' => date('Y-m-d H:i:s')];
        if ($table->where('contact', $contact)->countAllResults() > 0) {
            db_connect()->table('waitlist')->where('contact', $contact)->update($row);
        } else {
            $table->insert($row + ['contact' => $contact, 'ip' => $this->request->getIPAddress(), 'created_at' => date('Y-m-d H:i:s')]);
        }

        return $this->respondCreated(['message' => 'Kamu sudah masuk waitlist' . (isset($variant['name']) ? " untuk warna {$variant['name']}" : '') . '. Kami kabari saat tersedia.']);
    }
}
