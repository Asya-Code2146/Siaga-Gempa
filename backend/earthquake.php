<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: s-maxage=20, stale-while-revalidate=40');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/database.php';

$cacheFile = __DIR__ . '/cache_earthquake.json';
$cacheTtl = 30;

function fetchUrl($url, $timeout = 4) {
    $ctx = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'header' => "User-Agent: SiagaGempa-App/2.0\r\nAccept: application/json\r\n"
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    $content = @file_get_contents($url, false, $ctx);
    if ($content === false) {
        return null;
    }
    return json_decode($content, true);
}

$now = time();
if (file_exists($cacheFile) && ($now - filemtime($cacheFile) < $cacheTtl)) {
    $cached = @file_get_contents($cacheFile);
    if ($cached) {
        echo $cached;
        exit();
    }
}

$autoData = fetchUrl('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
$dirasakanData = fetchUrl('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
$terkiniData = fetchUrl('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');

$results = [];
$seen = [];

$parseItem = function($g, $isLatest = false) use (&$results, &$seen) {
    if (!$g || !is_array($g)) return;
    $timeStr = trim(($g['Tanggal'] ?? '') . ' ' . ($g['Jam'] ?? ''));
    $loc = trim($g['Wilayah'] ?? '');
    $key = strtolower(substr($loc, 0, 24) . '_' . $timeStr);
    if (isset($seen[$key])) return;
    $seen[$key] = true;

    $coords = explode(',', $g['Coordinates'] ?? '');
    $lat = isset($coords[0]) ? (float)trim($coords[0]) : 0.0;
    $lon = isset($coords[1]) ? (float)trim($coords[1]) : 0.0;
    $depthRaw = $g['Kedalaman'] ?? '0';
    $depth = (int)preg_replace('/[^0-9]/', '', $depthRaw);
    $mag = (float)($g['Magnitude'] ?? 0);
    $tsunami = $g['Potensi'] ?? (!empty($g['Dirasakan']) ? 'Dirasakan: ' . $g['Dirasakan'] : 'Tidak berpotensi tsunami');
    $dateTime = $g['DateTime'] ?? '';

    $isSim = (stripos($loc, 'simulasi') !== false || stripos($loc, 'uji coba') !== false || stripos($loc, 'drill') !== false || stripos($loc, 'test') !== false);

    $tsuLower = strtolower($tsunami);
    $alertState = 'none';
    if (strpos($tsuLower, 'berakhir') !== false || strpos($tsuLower, 'dicabut') !== false) {
        $alertState = 'ended';
    } elseif (strpos($tsuLower, 'tsunami') !== false && strpos($tsuLower, 'tidak') === false) {
        $alertState = 'active_warning';
    }

    $results[] = [
        'id' => count($results) + 1,
        'event_id' => md5($key),
        'magnitude' => $mag,
        'depth' => $depth,
        'location' => $loc,
        'time' => $timeStr,
        'dateTime' => $dateTime,
        'latitude' => $lat,
        'longitude' => $lon,
        'tsunami' => $tsunami,
        'tsunami_alert_state' => $alertState,
        'dirasakan' => $g['Dirasakan'] ?? '-',
        'shakemap' => !empty($g['Shakemap']) ? 'https://data.bmkg.go.id/DataMKG/TEWS/' . $g['Shakemap'] : '',
        'is_latest' => $isLatest,
        'is_simulation' => $isSim,
        'source' => 'BMKG Indonesia (TEWS)'
    ];
};

if (!empty($autoData['Infogempa']['gempa'])) {
    $parseItem($autoData['Infogempa']['gempa'], true);
}

if (!empty($dirasakanData['Infogempa']['gempa']) && is_array($dirasakanData['Infogempa']['gempa'])) {
    foreach ($dirasakanData['Infogempa']['gempa'] as $d) {
        $parseItem($d, false);
    }
}

if (!empty($terkiniData['Infogempa']['gempa']) && is_array($terkiniData['Infogempa']['gempa'])) {
    foreach ($terkiniData['Infogempa']['gempa'] as $t) {
        $parseItem($t, false);
        if (count($results) >= 30) break;
    }
}

if (!empty($results)) {
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO earthquakes (event_id, magnitude, depth, location, time_str, date_time, latitude, longitude, tsunami_potential, tsunami_alert_state, dirasakan, shakemap, is_realtime, is_simulation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE magnitude=VALUES(magnitude), depth=VALUES(depth), tsunami_potential=VALUES(tsunami_potential), tsunami_alert_state=VALUES(tsunami_alert_state), is_simulation=VALUES(is_simulation)");
            foreach ($results as $item) {
                $dt = !empty($item['dateTime']) ? date('Y-m-d H:i:s', strtotime($item['dateTime'])) : null;
                $stmt->execute([
                    $item['event_id'],
                    $item['magnitude'],
                    $item['depth'],
                    $item['location'],
                    $item['time'],
                    $dt,
                    $item['latitude'],
                    $item['longitude'],
                    $item['tsunami'],
                    $item['tsunami_alert_state'],
                    $item['dirasakan'],
                    $item['shakemap'],
                    $item['is_latest'] ? 1 : 0,
                    $item['is_simulation'] ? 1 : 0
                ]);
            }
        } catch (Exception $ex) {}
    }

    $jsonOutput = json_encode([
        'status' => 'success',
        'count' => count($results),
        'last_synced' => date('c'),
        'data' => $results
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    @file_put_contents($cacheFile, $jsonOutput);
    echo $jsonOutput;
    exit();
}

if (file_exists($cacheFile)) {
    $cached = @file_get_contents($cacheFile);
    if ($cached) {
        $data = json_decode($cached, true);
        if (is_array($data)) {
            $data['status'] = 'degraded_cache';
            $data['warning'] = 'Gagal terhubung ke BMKG langsung, menampilkan data cache terakhir.';
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
}

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM earthquakes ORDER BY id DESC LIMIT 20");
        $dbRows = $stmt->fetchAll();
        if (!empty($dbRows)) {
            $formatted = array_map(function($r) {
                return [
                    'id' => (int)$r['id'],
                    'event_id' => $r['event_id'],
                    'magnitude' => (float)$r['magnitude'],
                    'depth' => (int)$r['depth'],
                    'location' => $r['location'],
                    'time' => $r['time_str'],
                    'dateTime' => $r['date_time'],
                    'latitude' => (float)$r['latitude'],
                    'longitude' => (float)$r['longitude'],
                    'tsunami' => $r['tsunami_potential'],
                    'tsunami_alert_state' => $r['tsunami_alert_state'] ?? 'none',
                    'dirasakan' => $r['dirasakan'],
                    'shakemap' => $r['shakemap'],
                    'is_latest' => (bool)$r['is_realtime'],
                    'is_simulation' => (bool)($r['is_simulation'] ?? 0),
                    'source' => 'Database Siaga Gempa'
                ];
            }, $dbRows);
            echo json_encode([
                'status' => 'database_fallback',
                'count' => count($formatted),
                'last_synced' => date('c'),
                'data' => $formatted
            ]);
            exit();
        }
    } catch (Exception $ex) {}
}

http_response_code(503);
echo json_encode([
    'status' => 'error',
    'message' => 'Layanan data gempa BMKG sedang tidak dapat dijangkau dan belum ada cache.',
    'data' => []
]);
?>
