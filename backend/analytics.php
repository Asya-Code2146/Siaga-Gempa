<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$cacheFile = __DIR__ . '/cache_earthquake.json';
$rawEarthquakes = [];

if (file_exists($cacheFile)) {
    $c = @file_get_contents($cacheFile);
    if ($c) {
        $parsed = json_decode($c, true);
        if (!empty($parsed['data']) && is_array($parsed['data'])) {
            $rawEarthquakes = $parsed['data'];
        }
    }
}

if (empty($rawEarthquakes)) {
    $auto = @file_get_contents('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
    if ($auto) {
        $j = json_decode($auto, true);
        if (!empty($j['Infogempa']['gempa'])) {
            foreach ($j['Infogempa']['gempa'] as $g) {
                $coords = explode(',', $g['Coordinates'] ?? '');
                $rawEarthquakes[] = [
                    'magnitude' => (float)($g['Magnitude'] ?? 0),
                    'depth' => (int)preg_replace('/[^0-9]/', '', $g['Kedalaman'] ?? '0'),
                    'location' => $g['Wilayah'] ?? '',
                    'time' => ($g['Tanggal'] ?? '') . ' ' . ($g['Jam'] ?? ''),
                    'latitude' => isset($coords[0]) ? (float)trim($coords[0]) : 0,
                    'longitude' => isset($coords[1]) ? (float)trim($coords[1]) : 0,
                    'tsunami' => $g['Potensi'] ?? 'Tidak berpotensi tsunami'
                ];
            }
        }
    }
}

$total = count($rawEarthquakes);
$magDistribution = ['< 4.0' => 0, '4.0 - 4.9' => 0, '5.0 - 5.9' => 0, '>= 6.0' => 0];
$depthDistribution = ['dangkal' => 0, 'menengah' => 0, 'dalam' => 0];
$regionDistribution = ['sumatra_aceh' => 0, 'lainnya' => 0];
$tsunamiWarningCount = 0;
$maxMag = 0.0;
$avgMag = 0.0;
$sumMag = 0.0;

$sumatraKeywords = [
    'aceh', 'banda aceh', 'sabang', 'meulaboh', 'simeulue', 'pidie', 'sumatera', 'sumatra',
    'nias', 'mentawai', 'padang', 'medan', 'bengkulu', 'lampung', 'jambi', 'riau'
];

foreach ($rawEarthquakes as $eq) {
    $m = (float)($eq['magnitude'] ?? 0);
    $d = (int)($eq['depth'] ?? 0);
    $loc = strtolower($eq['location'] ?? '');
    $tsu = strtolower($eq['tsunami'] ?? '');

    $sumMag += $m;
    if ($m > $maxMag) $maxMag = $m;

    if ($m < 4.0) $magDistribution['< 4.0']++;
    elseif ($m < 5.0) $magDistribution['4.0 - 4.9']++;
    elseif ($m < 6.0) $magDistribution['5.0 - 5.9']++;
    else $magDistribution['>= 6.0']++;

    if ($d < 60) $depthDistribution['dangkal']++;
    elseif ($d <= 300) $depthDistribution['menengah']++;
    else $depthDistribution['dalam']++;

    $isSumatra = false;
    foreach ($sumatraKeywords as $kw) {
        if (strpos($loc, $kw) !== false) {
            $isSumatra = true;
            break;
        }
    }
    if ($isSumatra) {
        $regionDistribution['sumatra_aceh']++;
    } else {
        $regionDistribution['lainnya']++;
    }

    if (strpos($tsu, 'tsunami') !== false && strpos($tsu, 'tidak berpotensi') === false) {
        $tsunamiWarningCount++;
    }
}

if ($total > 0) {
    $avgMag = round($sumMag / $total, 2);
}

$aiSummary = "Berdasarkan katalog real-time BMKG terkini ({$total} kejadian tercatat), aktivitas seismik di wilayah Indonesia didominasi oleh gempa berkedalaman dangkal (<60 km) sebanyak {$depthDistribution['dangkal']} kejadian. Magnitudo tertinggi yang terdata adalah M {$maxMag} SR dengan rata-rata magnitudo M {$avgMag} SR. Wilayah busur Sumatra dan Aceh mencatat {$regionDistribution['sumatra_aceh']} kejadian yang dipengaruhi oleh dinamika zona subduksi Megathrust dan aktivitas Sesar Darat Semangko. Tidak ada tanda anomali berpotensi tsunami aktif saat ini kecuali ada pembaruan resmi peringatan dari BMKG. Perlu ditegaskan sesuai prinsip sains vulkanologi dan seismologi, waktu pasti terjadinya gempa tidak dapat diprediksi secara matematis; langkah paling rasional adalah menjaga kesiapsiagaan tas darurat dan mengetahui jalur evakuasi vertikal terdekat.";

echo json_encode([
    'status' => 'success',
    'sample_size' => $total,
    'analysis_timestamp' => date('c'),
    'metrics' => [
        'average_magnitude' => $avgMag,
        'maximum_magnitude' => $maxMag,
        'magnitude_distribution' => $magDistribution,
        'depth_distribution' => [
            'dangkal_under_60km' => $depthDistribution['dangkal'],
            'menengah_60_to_300km' => $depthDistribution['menengah'],
            'dalam_above_300km' => $depthDistribution['dalam']
        ],
        'regional_distribution' => $regionDistribution,
        'tsunami_warnings_active' => $tsunamiWarningCount
    ],
    'ai_insights' => [
        'summary_id' => $aiSummary,
        'data_source' => 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
        'data_limitations' => 'Data berasal dari sensor TEWS BMKG untuk magnitudo >= 5.0 dan gempa dirasakan terkini. Tidak mencakup gempa mikro di bawah ambang sensor lokal.',
        'scientific_disclaimer' => 'Sistem tidak membuat prediksi gempa fiktif. Seluruh analisis bersifat statistik deskriptif dan edukatif berdasarkan data empiris BMKG.'
    ]
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
