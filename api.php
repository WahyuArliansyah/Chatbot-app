<?php
/**
 * Backend API Endpoint untuk Chatbot AI
 * File ini menangani request dari frontend, memproses prompt,
 * memanggil Google Gemini API, dan mengembalikan respons dalam format JSON.
 */

// Laporkan error saat debugging, matikan output html display agar respons JSON bersih
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set header JSON response
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight request (OPTIONS) untuk browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Muat konfigurasi API Key dan model
require_once __DIR__ . '/config.php';

// Validasi metode HTTP (Hanya menerima POST)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Metode tidak diizinkan. Silakan kirim request menggunakan metode POST.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Ambil data input dari request (Mendukung raw JSON dan standard Form Data)
$rawInput = file_get_contents('php://input');
$requestData = json_decode($rawInput, true);

if (!is_array($requestData)) {
    // Fallback ke $_POST jika dikirim via form biasa
    $requestData = $_POST;
}

// Ambil pesan/pertanyaan
$message = '';
if (isset($requestData['message'])) {
    $message = trim($requestData['message']);
} elseif (isset($requestData['pertanyaan'])) {
    $message = trim($requestData['pertanyaan']);
}

// Validasi isi pesan
if (empty($message)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Pertanyaan tidak boleh kosong. Silakan ketik pesan Anda.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Bangun struktur riwayat percakapan (Multi-turn conversation history)
$contents = [];

if (isset($requestData['history']) && is_array($requestData['history'])) {
    foreach ($requestData['history'] as $item) {
        if (!empty($item['text']) && !empty($item['role'])) {
            $role = ($item['role'] === 'user') ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => (string)$item['text']]
                ]
            ];
        }
    }
}

// Tambahkan pesan terkini dari pengguna ke dalam urutan percakapan
$contents[] = [
    'role' => 'user',
    'parts' => [
        ['text' => $message]
    ]
];

// Siapkan payload untuk dikirim ke Google Gemini API
$payload = [
    'contents' => $contents,
    'systemInstruction' => [
        'parts' => [
            ['text' => SYSTEM_INSTRUCTION]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 2048,
    ]
];

$endpointUrl = GEMINI_API_URL . '?key=' . GEMINI_API_KEY;

// Inisialisasi cURL
$ch = curl_init($endpointUrl);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json; charset=UTF-8'
    ],
    CURLOPT_CONNECTTIMEOUT => 10,       // Waktu maksimal untuk membuka koneksi (10 detik)
    CURLOPT_TIMEOUT => 90,              // Naikkan timeout eksekusi jadi 90 detik agar Gemini sempat jawab
    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, // Pakai IPv4 saja untuk hindari lag/hang dari IPv6
    CURLOPT_SSL_VERIFYPEER => true
]);

// Eksekusi request dengan mekanisme retry otomatis jika server Google sibuk (429/503)
$maxAttempts = 2;
$response = false;
$httpCode = 0;

for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        break; // Kesalahan koneksi jaringan lokal/cURL
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    // Jika rate limit (429) atau server Google sibuk (503), tunggu jeda dan coba lagi
    if (($httpCode == 429 || $httpCode == 503) && $attempt < $maxAttempts) {
        sleep(2 * $attempt);
        continue;
    }

    break;
}

// Periksa apakah terjadi kesalahan koneksi cURL
if (curl_errno($ch)) {
    $curlError = curl_error($ch);
    curl_close($ch);
    
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => 'Koneksi ke Google AI gagal: ' . $curlError
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

curl_close($ch);

// Parse response JSON dari Google
$result = json_decode($response, true);

if ($httpCode !== 200 || !is_array($result)) {
    $errorMessage = 'Gagal memproses permintaan AI.';
    if (isset($result['error']['message'])) {
        $errorMessage = $result['error']['message'];
    } elseif (!empty($response)) {
        $errorMessage = 'Respons server: ' . substr($response, 0, 300);
    }

    http_response_code($httpCode >= 400 && $httpCode < 600 ? $httpCode : 500);
    echo json_encode([
        'success' => false,
        'error' => $errorMessage
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Ekstrak teks jawaban dari struktur JSON Gemini
$replyText = '';
if (isset($result['candidates'][0]['content']['parts'])) {
    foreach ($result['candidates'][0]['content']['parts'] as $part) {
        if (isset($part['text'])) {
            $replyText .= $part['text'];
        }
    }
}

// Cek apakah jawaban berhasil didapatkan
if (empty($replyText)) {
    // Cek kemungkinan safety block / finish reason
    $finishReason = $result['candidates'][0]['finishReason'] ?? 'UNKNOWN';
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'AI tidak menghasilkan teks (Alasan: ' . $finishReason . '). Silakan coba dengan pertanyaan berbeda.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Berikan respons sukses ke frontend
echo json_encode([
    'success' => true,
    'reply' => $replyText,
    'model' => GEMINI_MODEL,
    'timestamp' => date('H:i')
], JSON_UNESCAPED_UNICODE);
