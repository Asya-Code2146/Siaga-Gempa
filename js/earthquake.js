/**
 * Siaga Gempa - Earthquake Service & Sumatra-Aceh Danger Classifier
 */

class EarthquakeService {
  constructor() {
    this.latestEarthquake = null;
    this.historyList = [];
    this.isSimulated = false;
    this.sumatraKeywords = [
      'aceh', 'banda aceh', 'meulaboh', 'sabang', 'simeulue', 'lhokseumawe',
      'pidie', 'sigli', 'nagan raya', 'takengon', 'subulussalam', 'singkil',
      'tapaktuan', 'bireuen', 'langsa', 'sumatera', 'sumatra', 'nias',
      'mentawai', 'padang', 'medan', 'sibolga', 'bengkulu', 'lampung', 'sumut', 'sumbar'
    ];
  }

  isSumatraAcehRegion(location, lat, lon) {
    const locLower = (location || '').toLowerCase();
    for (const kw of this.sumatraKeywords) {
      if (locLower.includes(kw)) {
        return true;
      }
    }
    // Geografis Bounding Box Pulau Sumatra
    if (typeof lat === 'number' && typeof lon === 'number') {
      if (lat >= -6.2 && lat <= 6.2 && lon >= 94.5 && lon <= 106.2) {
        return true;
      }
    }
    return false;
  }

  classifyLevel(magnitude, tsunamiText = '') {
    const tsuLower = (tsunamiText || '').toLowerCase();
    const isTsunamiThreat = tsuLower.includes('tsunami') && !tsuLower.includes('tidak berpotensi');

    if (magnitude >= 6.5 || isTsunamiThreat) {
      return {
        level: 3,
        label: 'Level 3 - Sangat Bahaya / Potensi Tsunami',
        isEmergency: true
      };
    } else if (magnitude >= 5.0) {
      return {
        level: 2,
        label: 'Level 2 - Sedang / Waspada',
        isEmergency: false
      };
    } else {
      return {
        level: 1,
        label: 'Level 1 - Gempa Lemah / Relatif Aman',
        isEmergency: false
      };
    }
  }

  processEarthquakeAlert(eqData) {
    const isSumatra = this.isSumatraAcehRegion(eqData.location, eqData.latitude, eqData.longitude);
    const classification = this.classifyLevel(eqData.magnitude, eqData.tsunami);

    this.updateMockupUI(eqData, isSumatra, classification);

    if (isSumatra && classification.level === 3) {
      // 🚨 Memicu Full-Screen Alarm Takeover
      console.log('🚨 GEMPA TINGKAT TINGGI & POTENSI TSUNAMI SUMATRA-ACEH TERDETEKSI!');
      window.notificationManager?.triggerEmergencyModal(eqData);
    } else {
      // 🔔 Hanya Notifikasi Toast Biasa
      console.log('ℹ️ Aktivitas seismik di luar zona utama Sumatra/Aceh atau di bawah Level 3.');
      const regionNote = isSumatra ? 'Wilayah Sumatra-Aceh (Aman)' : 'Di Luar Wilayah Rawan Sumatra-Aceh';
      window.notificationManager?.showNormalToast(
        'Info Gempa Terkini',
        `${eqData.location} • Kedalaman ${eqData.depth} km. ${eqData.tsunami}. (${regionNote})`,
        eqData.magnitude
      );
    }
  }

  updateMockupUI(eqData, isSumatra, classification) {
    const statusTitleEl = document.getElementById('mockup-status-title');
    const locLabelEl = document.getElementById('mockup-loc-label');

    if (classification.level === 3 && isSumatra) {
      if (statusTitleEl) {
        statusTitleEl.textContent = `🚨 Gempa M ${eqData.magnitude.toFixed(1)} & Tsunami!`;
        statusTitleEl.style.color = '#f87171';
      }
      if (locLabelEl) {
        locLabelEl.textContent = `Bahaya Tinggi • ${eqData.location}`;
      }
    } else {
      if (statusTitleEl) {
        statusTitleEl.textContent = 'Tidak ada aktivitas signifikan';
        statusTitleEl.style.color = '#ffffff';
      }
      if (locLabelEl) {
        locLabelEl.textContent = 'Peringatan dini • Banda Aceh';
      }
    }
  }

  async fetchLiveEarthquakeData() {
    if (this.isSimulated) return;

    try {
      const bmkgRes = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      if (bmkgRes.ok) {
        const data = await bmkgRes.json();
        if (data?.Infogempa?.gempa) {
          const g = data.Infogempa.gempa;
          const coords = (g.Coordinates || '').split(',');
          const lat = coords[0] ? parseFloat(coords[0].trim()) : 5.55;
          const lon = coords[1] ? parseFloat(coords[1].trim()) : 95.32;

          const latest = {
            id: 1,
            magnitude: parseFloat(g.Magnitude || 0),
            depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
            location: g.Wilayah || 'Banda Aceh',
            time: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
            latitude: lat,
            longitude: lon,
            tsunami: g.Potensi || 'Tidak berpotensi tsunami',
            dirasakan: g.Dirasakan || '-'
          };

          this.latestEarthquake = latest;
          return;
        }
      }
    } catch (e) {
      console.warn('BMKG Live API offline or CORS, using fallback standby data:', e);
    }

    // Default standby
    this.latestEarthquake = {
      id: 1,
      magnitude: 4.6,
      depth: 15,
      location: '65 km Barat Daya BANDA ACEH',
      time: 'Hari Ini 10:30:15 WIB',
      latitude: 5.25,
      longitude: 95.10,
      tsunami: 'Tidak berpotensi tsunami',
      dirasakan: 'II-III Banda Aceh'
    };
  }
}

window.earthquakeService = new EarthquakeService();