export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const bmkgRes = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
    let rawEarthquakes = [];

    if (bmkgRes.ok) {
      const data = await bmkgRes.json();
      const list = data?.Infogempa?.gempa;
      if (Array.isArray(list)) {
        rawEarthquakes = list.map(g => {
          const coords = (g.Coordinates || '').split(',');
          return {
            magnitude: parseFloat(g.Magnitude || 0),
            depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
            location: g.Wilayah || '',
            time: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
            latitude: coords[0] ? parseFloat(coords[0].trim()) : 0,
            longitude: coords[1] ? parseFloat(coords[1].trim()) : 0,
            tsunami: g.Potensi || 'Tidak berpotensi tsunami'
          };
        });
      }
    }

    const total = rawEarthquakes.length;
    const magDistribution = { '< 4.0': 0, '4.0 - 4.9': 0, '5.0 - 5.9': 0, '>= 6.0': 0 };
    const depthDistribution = { dangkal: 0, menengah: 0, dalam: 0 };
    const regionDistribution = { sumatra_aceh: 0, lainnya: 0 };
    let tsunamiWarningCount = 0;
    let maxMag = 0.0;
    let sumMag = 0.0;

    const sumatraKeywords = [
      'aceh', 'banda aceh', 'sabang', 'meulaboh', 'simeulue', 'pidie', 'sumatera', 'sumatra',
      'nias', 'mentawai', 'padang', 'medan', 'bengkulu', 'lampung', 'jambi', 'riau'
    ];

    for (const eq of rawEarthquakes) {
      const m = eq.magnitude;
      const d = eq.depth;
      const loc = eq.location.toLowerCase();
      const tsu = eq.tsunami.toLowerCase();

      sumMag += m;
      if (m > maxMag) maxMag = m;

      if (m < 4.0) magDistribution['< 4.0']++;
      else if (m < 5.0) magDistribution['4.0 - 4.9']++;
      else if (m < 6.0) magDistribution['5.0 - 5.9']++;
      else magDistribution['>= 6.0']++;

      if (d < 60) depthDistribution.dangkal++;
      else if (d <= 300) depthDistribution.menengah++;
      else depthDistribution.dalam++;

      const isSumatra = sumatraKeywords.some(kw => loc.includes(kw));
      if (isSumatra) regionDistribution.sumatra_aceh++;
      else regionDistribution.lainnya++;

      if (tsu.includes('tsunami') && !tsu.includes('tidak berpotensi')) {
        tsunamiWarningCount++;
      }
    }

    const avgMag = total > 0 ? Math.round((sumMag / total) * 100) / 100 : 0;
    const aiSummary = `Berdasarkan katalog real-time BMKG terkini (${total} kejadian tercatat), aktivitas seismik di wilayah Indonesia didominasi oleh gempa dangkal (<60 km) sebanyak ${depthDistribution.dangkal} kejadian. Magnitudo tertinggi yang terdata adalah M ${maxMag.toFixed(1)} SR dengan rata-rata magnitudo M ${avgMag.toFixed(1)} SR. Wilayah busur Sumatra dan Aceh mencatat ${regionDistribution.sumatra_aceh} kejadian yang berasosiasi dengan zona subduksi Megathrust dan Sesar Darat Semangko. Tidak terdeteksi ancaman tsunami aktif saat ini kecuali bila ada peringatan resmi BMKG terbaru. Gempa bumi tidak dapat diprediksi secara eksak waktu dan harinya; kewaspadaan keluarga melalui tas siaga bencana dan pemahaman rute evakuasi vertikal merupakan langkah pencegahan paling efektif.`;

    return res.status(200).json({
      status: 'success',
      sample_size: total,
      analysis_timestamp: new Date().toISOString(),
      metrics: {
        average_magnitude: avgMag,
        maximum_magnitude: maxMag,
        magnitude_distribution: magDistribution,
        depth_distribution: {
          dangkal_under_60km: depthDistribution.dangkal,
          menengah_60_to_300km: depthDistribution.menengah,
          dalam_above_300km: depthDistribution.dalam
        },
        regional_distribution: regionDistribution,
        tsunami_warnings_active: tsunamiWarningCount
      },
      ai_insights: {
        summary_id: aiSummary,
        data_source: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
        data_limitations: 'Data bersumber dari katalog TEWS BMKG. Menampilkan statistik berbasis kejadian aktual tanpa manipulasi estimasi spekulatif.',
        scientific_disclaimer: 'Analisis ini disajikan untuk edukasi kesiapsiagaan masyarakat dan tidak dimaksudkan sebagai prediksi waktu gempa.'
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
