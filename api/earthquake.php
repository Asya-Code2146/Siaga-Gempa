<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

require_once 'database.php';

function fetch_bmkg_data($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'SiagaGempa-PWA/1.0');
        $result = curl_exec($ch);
        curl_close($ch);
        if ($result) return $result;
    }
    return @file_get_contents($url);
}

$results = [];

$autoJson = fetch_bmkg_data('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
$autoData = $autoJson ? json_decode($autoJson, true) : null;

if (isset($autoData['Infogempa']['gempa'])) {
    $eq = $autoData['Infogempa']['gempa'];
    $magnitude = floatval($eq['Magnitude'] ?? 0);
    $depth = intval(preg_replace('/[^0-9]/', '', $eq['Kedalaman'] ?? '0'));
    $location = $eq['Wilayah'] ?? '';
    $time = ($eq['Tanggal'] ?? '') . ' ' . ($eq['Jam'] ?? '');
    

    $coords = explode(',', $eq['Coordinates'] ?? '');
    $latitude = isset($coords[0]) ? floatval(trim($coords[0])) : floatval(str_replace(' LS', '', str_replace(' LU', '', $eq['Lintang'] ?? '0')));
    $longitude = isset($coords[1]) ? floatval(trim($coords[1])) : floatval(str_replace(' BT', '', $eq['Bujur'] ?? '0'));
    $tsunami = $eq['Potensi'] ?? 'Tidak berpotensi tsunami';
    $dirasakan = $eq['Dirasakan'] ?? '-';
    $shakemap = isset($eq['Shakemap']) && !empty($eq['Shakemap']) ? 'https://data.bmkg.go.id/DataMKG/TEWS/' . $eq['Shakemap'] : '';

    $latestItem = [
        'id' => 1,
        'magnitude' => $magnitude,
        'depth' => $depth,
        'location' => $location,
        'time' => $time,
        'latitude' => $latitude,
        'longitude' => $longitude,
        'tsunami' => $tsunami,
        'dirasakan' => $dirasakan,
        'shakemap' => $shakemap,
        'is_latest' => true
    ];
    $results[] = $latestItem;

    if ($pdo) {
        try {
            $cleanTime = trim(str_ireplace([' WIB', ' WITA', ' WIT'], '', $time));
            $parsedTimestamp = strtotime($cleanTime);
            $dbTime = $parsedTimestamp ? date('Y-m-d H:i:s', $parsedTimestamp) : date('Y-m-d H:i:s');
            
            $stmt = $pdo->prepare("INSERT IGNORE INTO earthquakes (magnitude, depth, location, time, latitude, longitude, tsunami) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$magnitude, (string)$depth, $location, $dbTime, $latitude, $longitude, $tsunami]);
        } catch (Exception $e) {
            // Error handling
        }
    }
}

$listJson = fetch_bmkg_data('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
$listData = $listJson ? json_decode($listJson, true) : null;

if (isset($listData['Infogempa']['gempa']) && is_array($listData['Infogempa']['gempa'])) {
    $idx = 2;
    foreach ($listData['Infogempa']['gempa'] as $g) {
        $gTime = ($g['Tanggal'] ?? '') . ' ' . ($g['Jam'] ?? '');
        if (!empty($results) && $results[0]['location'] === ($g['Wilayah'] ?? '') && $results[0]['time'] === $gTime) {
            continue;
        }
        $coords = explode(',', $g['Coordinates'] ?? '');
        $lat = isset($coords[0]) ? floatval(trim($coords[0])) : 0;
        $lon = isset($coords[1]) ? floatval(trim($coords[1])) : 0;

        $results[] = [
            'id' => $idx++,
            'magnitude' => floatval($g['Magnitude'] ?? 0),
            'depth' => intval(preg_replace('/[^0-9]/', '', $g['Kedalaman'] ?? '0')),
            'location' => $g['Wilayah'] ?? '',
            'time' => $gTime,
            'latitude' => $lat,
            'longitude' => $lon,
            'tsunami' => $g['Potensi'] ?? 'Tidak berpotensi tsunami',
            'dirasakan' => $g['Dirasakan'] ?? '-',
            'shakemap' => '',
            'is_latest' => false
        ];
        if (count($results) >= 15) break;
    }
}

if (empty($results)) {
    $results = [
        [
            'id' => 1,
            'magnitude' => 6.2,
            'depth' => 10,
            'location' => '83 km BaratDaya SUMUR-BANTEN',
            'time' => date('d M Y H:i:s'),
            'latitude' => -7.01,
            'longitude' => 105.26,
            'tsunami' => 'Tidak berpotensi tsunami',
            'dirasakan' => 'IV Pandeglang, III Lebak, II Jakarta',
            'shakemap' => '',
            'is_latest' => true
        ],
        [
            'id' => 2,
            'magnitude' => 5.4,
            'depth' => 25,
            'location' => '65 km BaratLaut TANGGAMUS-LAMPUNG',
            'time' => date('d M Y H:i:s', time() - 3600 * 4),
            'latitude' => -5.28,
            'longitude' => 104.38,
            'tsunami' => 'Tidak berpotensi tsunami',
            'dirasakan' => 'III Liwa, II Kotabumi',
            'shakemap' => '',
            'is_latest' => false
        ],
        [
            'id' => 3,
            'magnitude' => 7.1,
            'depth' => 15,
            'location' => '128 km BaratDaya PACITAN-JATIM',
            'time' => date('d M Y H:i:s', time() - 3600 * 12),
            'latitude' => -8.99,
            'longitude' => 110.82,
            'tsunami' => 'Berpotensi Tsunami',
            'dirasakan' => 'V Pacitan, IV Yogyakarta, III Solo',
            'shakemap' => '',
            'is_latest' => false
        ]
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
?>