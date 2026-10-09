<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/database.php';

$userLat = isset($_GET['lat']) ? (float)$_GET['lat'] : null;
$userLon = isset($_GET['lon']) ? (float)$_GET['lon'] : null;
$typeFilter = isset($_GET['type']) ? trim($_GET['type']) : '';

function calculateHaversine($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return round($earthRadius * $c, 2);
}

$defaultShelters = [
    [
        'id' => 1,
        'name' => 'Gedung Evakuasi Tsunami Lambung (TES Lambung)',
        'type' => 'gedung_tsunami',
        'type_label' => 'Gedung Evakuasi Vertikal Tsunami',
        'latitude' => 5.5412,
        'longitude' => 95.3045,
        'elevation_meters' => 18,
        'capacity' => 1200,
        'address' => 'Gampong Lambung, Kec. Meuraxa, Kota Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'BPBD Kota Banda Aceh & BNPB',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => true,
        'facilities' => 'Rooftop evakuasi, tangga darurat luar ganda, sirene EWS, tangki air cadangan, panel surya'
    ],
    [
        'id' => 2,
        'name' => 'Gedung Evakuasi Tsunami Deah Glumpang',
        'type' => 'gedung_tsunami',
        'type_label' => 'Gedung Evakuasi Vertikal Tsunami',
        'latitude' => 5.5563,
        'longitude' => 95.2981,
        'elevation_meters' => 18,
        'capacity' => 1000,
        'address' => 'Gampong Deah Glumpang, Kec. Meuraxa, Kota Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'BPBD Kota Banda Aceh & BNPB',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => true,
        'facilities' => 'Akses ramah lansia, generator darurat otomatis, ruang medis darurat'
    ],
    [
        'id' => 3,
        'name' => 'Gedung Evakuasi Tsunami Alue Deah Teungoh',
        'type' => 'gedung_tsunami',
        'type_label' => 'Gedung Evakuasi Vertikal Tsunami',
        'latitude' => 5.5512,
        'longitude' => 95.2905,
        'elevation_meters' => 18,
        'capacity' => 1500,
        'address' => 'Gampong Alue Deah Teungoh, Kec. Meuraxa, Kota Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'BPBD Kota Banda Aceh & BNPB',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => true,
        'facilities' => 'Rooftop shelter terbuka, helipad darurat, pasokan air bersih'
    ],
    [
        'id' => 4,
        'name' => 'Gedung Escape Building Kantor TDMRC USK',
        'type' => 'gedung_tsunami',
        'type_label' => 'Gedung Riset & Evakuasi Vertikal',
        'latitude' => 5.5788,
        'longitude' => 95.3421,
        'elevation_meters' => 16,
        'capacity' => 800,
        'address' => 'Jl. Prof. Dr. Abdurrahman Lubis, Syiah Kuala, Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'TDMRC Universitas Syiah Kuala',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => true,
        'facilities' => 'Pusat riset bencana tsunami, radio VHF, logistik P3K'
    ],
    [
        'id' => 5,
        'name' => 'Kawasan Dataran Tinggi Bukit Mata Ie',
        'type' => 'tempat_tinggi',
        'type_label' => 'Perbukitan / Dataran Tinggi Alami',
        'latitude' => 5.5015,
        'longitude' => 95.2891,
        'elevation_meters' => 75,
        'capacity' => 5000,
        'address' => 'Kecamatan Darul Imarah, Aceh Besar',
        'city' => 'Aceh Besar',
        'verified_by' => 'BPBD Aceh Besar',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => true,
        'facilities' => 'Ketinggian aman dari tsunami ekstrem, area tenda darurat, akses jalur darat'
    ],
    [
        'id' => 6,
        'name' => 'Lapangan Blang Padang',
        'type' => 'titik_kumpul_terbuka',
        'type_label' => 'Titik Kumpul Terbuka (Gempa)',
        'latitude' => 5.5526,
        'longitude' => 95.3175,
        'elevation_meters' => 4,
        'capacity' => 10000,
        'address' => 'Jl. Iskandar Muda, Baiturrahman, Kota Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'BPBD Kota Banda Aceh',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => false,
        'facilities' => 'Area lapangan terbuka bebas runtuhan gempa, akses mudah armada darurat'
    ],
    [
        'id' => 7,
        'name' => 'Stadion Harapan Bangsa Lhong Raya',
        'type' => 'titik_kumpul_terbuka',
        'type_label' => 'Titik Kumpul Terbuka & Posko Pengungsian',
        'latitude' => 5.5218,
        'longitude' => 95.3283,
        'elevation_meters' => 7,
        'capacity' => 15000,
        'address' => 'Lhong Raya, Banda Raya, Kota Banda Aceh',
        'city' => 'Banda Aceh',
        'verified_by' => 'BPBD Aceh / Dispora',
        'verification_status' => 'terverifikasi',
        'is_tsunami_safe' => false,
        'facilities' => 'Stadion terlindung luas, genset pusat, tenda darurat, akses helipad'
    ]
];

$shelters = $defaultShelters;

if ($pdo) {
    try {
        $query = "SELECT * FROM evacuation_shelters WHERE 1=1";
        $params = [];
        if (!empty($typeFilter)) {
            $query .= " AND type = ?";
            $params[] = $typeFilter;
        }
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        if (!empty($rows)) {
            $shelters = array_map(function($r) {
                return [
                    'id' => (int)$r['id'],
                    'name' => $r['name'],
                    'type' => $r['type'],
                    'type_label' => $r['type'] === 'gedung_tsunami' ? 'Gedung Evakuasi Vertikal Tsunami' : ($r['type'] === 'tempat_tinggi' ? 'Perbukitan / Dataran Tinggi' : 'Titik Kumpul Terbuka (Gempa)'),
                    'latitude' => (float)$r['latitude'],
                    'longitude' => (float)$r['longitude'],
                    'elevation_meters' => (int)$r['elevation_meters'],
                    'capacity' => (int)$r['capacity'],
                    'address' => $r['address'],
                    'city' => $r['city'],
                    'verified_by' => $r['verified_by'],
                    'verification_status' => $r['verification_status'],
                    'is_tsunami_safe' => ($r['type'] === 'gedung_tsunami' || $r['type'] === 'tempat_tinggi'),
                    'facilities' => $r['facilities'] ?? '-'
                ];
            }, $rows);
        }
    } catch (Exception $e) {}
}

if (!empty($typeFilter) && $shelters === $defaultShelters) {
    $shelters = array_values(array_filter($shelters, function($s) use ($typeFilter) {
        return $s['type'] === $typeFilter;
    }));
}

if ($userLat !== null && $userLon !== null) {
    foreach ($shelters as &$s) {
        $dist = calculateHaversine($userLat, $userLon, $s['latitude'], $s['longitude']);
        $s['distance_km'] = $dist;
        $walkMinutes = round(($dist / 4.5) * 60);
        $driveMinutes = max(1, round(($dist / 30) * 60));
        $s['walking_time_min'] = $walkMinutes;
        $s['driving_time_min'] = $driveMinutes;
        $s['google_maps_route_url'] = "https://www.google.com/maps/dir/?api=1&origin={$userLat},{$userLon}&destination={$s['latitude']},{$s['longitude']}&travelmode=walking";
    }
    unset($s);

    usort($shelters, function($a, $b) {
        return ($a['distance_km'] <=> $b['distance_km']);
    });
} else {
    foreach ($shelters as &$s) {
        $s['distance_km'] = null;
        $s['walking_time_min'] = null;
        $s['driving_time_min'] = null;
        $s['google_maps_route_url'] = "https://www.google.com/maps/dir/?api=1&destination={$s['latitude']},{$s['longitude']}&travelmode=walking";
    }
    unset($s);
}

echo json_encode([
    'status' => 'success',
    'total' => count($shelters),
    'user_location' => ($userLat !== null && $userLon !== null) ? ['lat' => $userLat, 'lon' => $userLon] : null,
    'data' => $shelters
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
