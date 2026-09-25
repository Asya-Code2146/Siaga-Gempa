export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [autoRes, listRes] = await Promise.all([
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
    ]);

    const results = [];

    if (autoRes.ok) {
      const autoData = await autoRes.json();
      const g = autoData?.Infogempa?.gempa;
      if (g) {
        const coords = (g.Coordinates || '').split(',');
        results.push({
          id: 1,
          magnitude: parseFloat(g.Magnitude || 0),
          depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
          location: g.Wilayah || '',
          time: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
          latitude: coords[0] ? parseFloat(coords[0].trim()) : 0,
          longitude: coords[1] ? parseFloat(coords[1].trim()) : 0,
          tsunami: g.Potensi || 'Tidak berpotensi tsunami',
          dirasakan: g.Dirasakan || '-',
          shakemap: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : '',
          is_latest: true
        });
      }
    }

    if (listRes.ok) {
      const listData = await listRes.json();
      const gempaList = listData?.Infogempa?.gempa;
      if (Array.isArray(gempaList)) {
        let idx = 2;
        for (const g of gempaList) {
          const gTime = `${g.Tanggal || ''} ${g.Jam || ''}`.trim();
          if (results.length > 0 && results[0].location === g.Wilayah && results[0].time === gTime) {
            continue;
          }
          const coords = (g.Coordinates || '').split(',');
          results.push({
            id: idx++,
            magnitude: parseFloat(g.Magnitude || 0),
            depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
            location: g.Wilayah || '',
            time: gTime,
            latitude: coords[0] ? parseFloat(coords[0].trim()) : 0,
            longitude: coords[1] ? parseFloat(coords[1].trim()) : 0,
            tsunami: g.Potensi || 'Tidak berpotensi tsunami',
            dirasakan: g.Dirasakan || '-',
            shakemap: '',
            is_latest: false
          });
          if (results.length >= 15) break;
        }
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('BMKG Fetch Error:', error);
    return res.status(500).json({ error: 'Gagal mengambil data BMKG', details: error.message });
  }
}
