export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
  const userLon = req.query.lon ? parseFloat(req.query.lon) : null;
  const typeFilter = req.query.type ? req.query.type.trim() : '';

  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  const shelters = [
    {
      id: 1,
      name: 'Gedung Evakuasi Tsunami Lambung (TES Lambung)',
      type: 'gedung_tsunami',
      type_label: 'Gedung Evakuasi Vertikal Tsunami',
      latitude: 5.5412,
      longitude: 95.3045,
      elevation_meters: 18,
      capacity: 1200,
      address: 'Gampong Lambung, Kec. Meuraxa, Kota Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'BPBD Kota Banda Aceh & BNPB',
      verification_status: 'terverifikasi',
      is_tsunami_safe: true,
      facilities: 'Rooftop evakuasi, tangga darurat luar ganda, sirene EWS, tangki air cadangan, panel surya'
    },
    {
      id: 2,
      name: 'Gedung Evakuasi Tsunami Deah Glumpang',
      type: 'gedung_tsunami',
      type_label: 'Gedung Evakuasi Vertikal Tsunami',
      latitude: 5.5563,
      longitude: 95.2981,
      elevation_meters: 18,
      capacity: 1000,
      address: 'Gampong Deah Glumpang, Kec. Meuraxa, Kota Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'BPBD Kota Banda Aceh & BNPB',
      verification_status: 'terverifikasi',
      is_tsunami_safe: true,
      facilities: 'Akses ramah lansia, generator darurat otomatis, ruang medis darurat'
    },
    {
      id: 3,
      name: 'Gedung Evakuasi Tsunami Alue Deah Teungoh',
      type: 'gedung_tsunami',
      type_label: 'Gedung Evakuasi Vertikal Tsunami',
      latitude: 5.5512,
      longitude: 95.2905,
      elevation_meters: 18,
      capacity: 1500,
      address: 'Gampong Alue Deah Teungoh, Kec. Meuraxa, Kota Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'BPBD Kota Banda Aceh & BNPB',
      verification_status: 'terverifikasi',
      is_tsunami_safe: true,
      facilities: 'Rooftop shelter terbuka, helipad darurat, pasokan air bersih'
    },
    {
      id: 4,
      name: 'Gedung Escape Building Kantor TDMRC USK',
      type: 'gedung_tsunami',
      type_label: 'Gedung Riset & Evakuasi Vertikal',
      latitude: 5.5788,
      longitude: 95.3421,
      elevation_meters: 16,
      capacity: 800,
      address: 'Jl. Prof. Dr. Abdurrahman Lubis, Syiah Kuala, Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'TDMRC Universitas Syiah Kuala',
      verification_status: 'terverifikasi',
      is_tsunami_safe: true,
      facilities: 'Pusat riset bencana tsunami, radio VHF, logistik P3K'
    },
    {
      id: 5,
      name: 'Kawasan Dataran Tinggi Bukit Mata Ie',
      type: 'tempat_tinggi',
      type_label: 'Perbukitan / Dataran Tinggi Alami',
      latitude: 5.5015,
      longitude: 95.2891,
      elevation_meters: 75,
      capacity: 5000,
      address: 'Kecamatan Darul Imarah, Aceh Besar',
      city: 'Aceh Besar',
      verified_by: 'BPBD Aceh Besar',
      verification_status: 'terverifikasi',
      is_tsunami_safe: true,
      facilities: 'Ketinggian aman dari tsunami ekstrem, area tenda darurat, akses jalur darat'
    },
    {
      id: 6,
      name: 'Lapangan Blang Padang',
      type: 'titik_kumpul_terbuka',
      type_label: 'Titik Kumpul Terbuka (Gempa)',
      latitude: 5.5526,
      longitude: 95.3175,
      elevation_meters: 4,
      capacity: 10000,
      address: 'Jl. Iskandar Muda, Baiturrahman, Kota Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'BPBD Kota Banda Aceh',
      verification_status: 'terverifikasi',
      is_tsunami_safe: false,
      facilities: 'Area lapangan terbuka bebas runtuhan gempa, akses mudah armada darurat'
    },
    {
      id: 7,
      name: 'Stadion Harapan Bangsa Lhong Raya',
      type: 'titik_kumpul_terbuka',
      type_label: 'Titik Kumpul Terbuka & Posko Pengungsian',
      latitude: 5.5218,
      longitude: 95.3283,
      elevation_meters: 7,
      capacity: 15000,
      address: 'Lhong Raya, Banda Raya, Kota Banda Aceh',
      city: 'Banda Aceh',
      verified_by: 'BPBD Aceh / Dispora',
      verification_status: 'terverifikasi',
      is_tsunami_safe: false,
      facilities: 'Stadion terlindung luas, genset pusat, tenda darurat, akses helipad'
    }
  ];

  let filtered = shelters;
  if (typeFilter) {
    filtered = filtered.filter(s => s.type === typeFilter);
  }

  const results = filtered.map(s => {
    let distance = null;
    let walkMins = null;
    let driveMins = null;
    let routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}&travelmode=walking`;

    if (userLat !== null && !isNaN(userLat) && userLon !== null && !isNaN(userLon)) {
      distance = calculateHaversine(userLat, userLon, s.latitude, s.longitude);
      walkMins = Math.round((distance / 4.5) * 60);
      driveMins = Math.max(1, Math.round((distance / 30) * 60));
      routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${s.latitude},${s.longitude}&travelmode=walking`;
    }

    return {
      ...s,
      distance_km: distance,
      walking_time_min: walkMins,
      driving_time_min: driveMins,
      google_maps_route_url: routeUrl
    };
  });

  if (userLat !== null && userLon !== null) {
    results.sort((a, b) => a.distance_km - b.distance_km);
  }

  return res.status(200).json({
    status: 'success',
    total: results.length,
    user_location: (userLat !== null && userLon !== null) ? { lat: userLat, lon: userLon } : null,
    data: results
  });
}
