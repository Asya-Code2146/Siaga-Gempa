<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/database.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (empty($data['endpoint'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Endpoint langganan diperlukan']);
    exit();
}

$endpoint = trim($data['endpoint']);
$publicKey = $data['keys']['p256dh'] ?? ($data['public_key'] ?? '');
$authKey = $data['keys']['auth'] ?? ($data['auth_key'] ?? '');

if ($pdo) {
    try {
        $stmt = $pdo->prepare("INSERT INTO devices (endpoint, public_key, auth_key) VALUES (?, ?, ?)");
        $stmt->execute([$endpoint, $publicKey, $authKey]);
        echo json_encode(['success' => true, 'message' => 'Langganan notifikasi berhasil didaftarkan']);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Gagal menyimpan langganan ke database']);
        exit();
    }
}

echo json_encode(['success' => true, 'message' => 'Langganan dicatat dalam mode tanpa database']);
?>
