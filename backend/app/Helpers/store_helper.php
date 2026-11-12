<?php

if (! function_exists('rupiah')) {
    function rupiah(int|float|string|null $n): string
    {
        return 'Rp ' . number_format((float) $n, 0, ',', '.');
    }
}

if (! function_exists('wa_url')) {
    /** Link WhatsApp; nomor 08xx otomatis diubah ke 628xx. */
    function wa_url(string $phone, string $text = ''): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        }

        return 'https://wa.me/' . $digits . ($text !== '' ? '?text=' . rawurlencode($text) : '');
    }
}

if (! function_exists('normalize_phone')) {
    /** "0812-3456 789" atau "+62 812..." menjadi "0812345678". null kalau bukan nomor Indonesia. */
    function normalize_phone(?string $phone): ?string
    {
        $d = preg_replace('/\D+/', '', (string) $phone);
        if (str_starts_with($d, '62')) {
            $d = '0' . substr($d, 2);
        }

        return preg_match('/^08\d{8,11}$/', $d) ? $d : null;
    }
}

if (! function_exists('waktu')) {
    function waktu(string $datetime): string
    {
        $months = [1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $t      = strtotime($datetime);

        return date('j', $t) . ' ' . $months[(int) date('n', $t)] . ' ' . date('Y, H.i', $t);
    }
}

if (! function_exists('tanggal')) {
    /** "2026-11-12" menjadi "Kamis, 12 November 2026". */
    function tanggal(string $date, bool $withDay = true): string
    {
        $days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $months = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $t      = strtotime($date);

        return ($withDay ? $days[(int) date('w', $t)] . ', ' : '') . date('j', $t) . ' ' . $months[(int) date('n', $t)] . ' ' . date('Y', $t);
    }
}

if (! function_exists('jam')) {
    function jam(string $hhmm): string
    {
        return str_replace(':', '.', substr($hhmm, 0, 5));
    }
}
