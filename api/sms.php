<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit(0);
}


$input = json_decode(file_get_contents('php://input'), true);
$phone = $_POST['phone'] ?? $_GET['phone'] ?? $input['phone'] ?? '';
$message = $_POST['message'] ?? $_GET['message'] ?? $input['message'] ?? 'Peringatan Gempa!';
$latitude = $_POST['latitude'] ?? $_GET['latitude'] ?? $input['latitude'] ?? '';
$longitude = $_POST['longitude'] ?? $_GET['longitude'] ?? $input['longitude'] ?? '';

if (empty($phone)) {
    echo json_encode([
        'success' => false,
        'error' => 'Nomor telepon tujuan belum disetting.'
    ]);
    exit;
}


$cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
$timestamp = date('Y-m-d H:i:s');


if (!empty($latitude) && !empty($longitude) && strpos($message, 'maps.google.com') === false) {
    $mapsLink = "https://maps.google.com/?q={$latitude},{$longitude}";
    $message .= " | Posisi: {$mapsLink}";
}

$logEntry = "[{$timestamp}] KE: {$cleanPhone} | PESAN: {$message}" . PHP_EOL;
@file_put_contents(__DIR__ . '/sms_log.txt', $logEntry, FILE_APPEND);

echo json_encode([
    'success' => true,
    'message' => 'SMS Darurat berhasil dikirim (Tersimulasi & Tercatat di Log Server).',
    'details' => [
        'recipient' => $cleanPhone,
        'timestamp' => $timestamp,
        'message_preview' => $message
    ]
]);
?>