export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [autoRes, dirasakanRes, listRes] = await Promise.allSettled([
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json'),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json'),
      fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
    ]);

    const results = [];
    const seen = new Set();

    const addEntry = (g, isLatest = false) => {
      const gTime = `${g.Tanggal || ''} ${g.Jam || ''}`.trim();
      const loc = g.Wilayah || '';
      const key = `${loc.slice(0, 20)}_${gTime}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      const isSim = /simulasi|uji coba|drill|test/i.test(loc);
      const tsunami = g.Potensi || (g.Dirasakan ? `Dirasakan: ${g.Dirasakan}` : 'Tidak berpotensi tsunami');
      const tsuLower = tsunami.toLowerCase();

      let alertState = 'none';
      if (tsuLower.includes('berakhir') || tsuLower.includes('dicabut')) {
        alertState = 'ended';
      } else if (tsuLower.includes('tsunami') && !tsuLower.includes('tidak')) {
        alertState = 'active_warning';
      }

      const coords = (g.Coordinates || '').split(',');
      results.push({
        id: results.length + 1,
        magnitude: parseFloat(g.Magnitude || 0),
        depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
        location: loc,
        time: gTime,
        dateTime: g.DateTime || '',
        latitude: coords[0] ? parseFloat(coords[0].trim()) : 0,
        longitude: coords[1] ? parseFloat(coords[1].trim()) : 0,
        tsunami: tsunami,
        tsunami_alert_state: alertState,
        dirasakan: g.Dirasakan || '-',
        shakemap: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : '',
        is_latest: isLatest,
        is_simulation: isSim,
        source: 'BMKG Indonesia (TEWS)'
      });
    };

    if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
      const autoData = await autoRes.value.json();
      if (autoData?.Infogempa?.gempa) {
        addEntry(autoData.Infogempa.gempa, true);
      }
    }

    if (dirasakanRes.status === 'fulfilled' && dirasakanRes.value.ok) {
      const dData = await dirasakanRes.value.json();
      const dList = dData?.Infogempa?.gempa;
      if (Array.isArray(dList)) {
        for (const g of dList) {
          addEntry(g, false);
        }
      }
    }

    if (listRes.status === 'fulfilled' && listRes.value.ok) {
      const listData = await listRes.value.json();
      const gempaList = listData?.Infogempa?.gempa;
      if (Array.isArray(gempaList)) {
        for (const g of gempaList) {
          addEntry(g, false);
          if (results.length >= 25) break;
        }
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengambil data BMKG', details: error.message });
  }
}
