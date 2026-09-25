class EarthquakeService {
  constructor() {
    this.latestEarthquake = null;
    this.historyList = [];
    this.currentFilter = 'all';
    this.isSimulated = false;
    this.onUpdateCallbacks = [];
  }

  onUpdate(callback) {
    this.onUpdateCallbacks.push(callback);
  }

  notifyUpdate() {
    this.onUpdateCallbacks.forEach(cb => cb(this.latestEarthquake, this.historyList));
  }


  classifyLevel(magnitude, tsunamiText = '') {
    const isTsunamiThreat = tsunamiText.toLowerCase().includes('tsunami') && 
                            !tsunamiText.toLowerCase().includes('tidak berpotensi');

    if (magnitude >= 6.0 || isTsunamiThreat) {
      return {
        level: 3,
        label: 'Level 3 - Sangat Bahaya / Parah',
        shortLabel: 'Tinggi / Bahaya',
        badgeClass: 'lvl3',
        cardClass: 'lvl-3',
        color: '#ef4444',
        icon: '🚨',
        description: 'Gempa berskala besar atau berpotensi tsunami! Wajib segera evakuasi ke tempat aman!',
        isEmergency: true
      };
    } else if (magnitude >= 5.0) {
      return {
        level: 2,
        label: 'Level 2 - Sedang / Waspada',
        shortLabel: 'Sedang / Waspada',
        badgeClass: 'lvl2',
        cardClass: 'lvl-2',
        color: '#f59e0b',
        icon: '⚠️',
        description: 'Getaran gempa terasa nyata di banyak wilayah. Jauhi kaca, benda gantung, dan dinding rapuh.',
        isEmergency: false
      };
    } else {
      return {
        level: 1,
        label: 'Level 1 - Rendah / Gempa Lemah',
        shortLabel: 'Rendah / Normal',
        badgeClass: 'lvl1',
        cardClass: 'lvl-1',
        color: '#10b981',
        icon: '🟢',
        description: 'Getaran lemah/minor, dirasakan sebagian orang. Kondisi lingkungan tergolong aman terkendali.',
        isEmergency: false
      };
    }
  }

  /**
   * Ambil data dari server lokal / BMKG langsung
   */
  async fetchLiveEarthquakeData() {
    if (this.isSimulated) {
      // Jika sedang mode simulasi, pertahankan data simulasi kecuali di-reset
      return;
    }

    try {
      let response = await fetch('api/earthquake').catch(() => null);
      if (!response || !response.ok) {
        response = await fetch('api/earthquake.php').catch(() => null);
      }
      
      let data;
      if (response && response.ok) {
        data = await response.json();
      } else {
        throw new Error('Local API endpoint not available');
      }

      if (Array.isArray(data) && data.length > 0) {
        this.processFetchedData(data);
        return;
      }
      throw new Error('Data lokal kosong');
    } catch (err) {
      console.warn('API lokal tidak aktif, langsung mengambil dari feed resmi BMKG...', err);

      try {
        // 2. Direct BMKG TEWS Open API
        const bmkgRes = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
        if (bmkgRes.ok) {
          const bmkgData = await bmkgRes.json();
          if (bmkgData?.Infogempa?.gempa) {
            const g = bmkgData.Infogempa.gempa;
            const coords = (g.Coordinates || '').split(',');
            const lat = coords[0] ? parseFloat(coords[0].trim()) : -6.2;
            const lon = coords[1] ? parseFloat(coords[1].trim()) : 106.8;

            const latest = {
              id: 1,
              magnitude: parseFloat(g.Magnitude || 0),
              depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
              location: g.Wilayah || 'Wilayah Indonesia',
              time: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
              latitude: lat,
              longitude: lon,
              tsunami: g.Potensi || 'Tidak berpotensi tsunami',
              dirasakan: g.Dirasakan || '-',
              shakemap: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : ''
            };

            this.processFetchedData([latest, ...this.getDefaultHistoryData()]);
            return;
          }
        }
      } catch (bmkgErr) {
        console.warn('BMKG CORS/network error, memuat data darurat cache offline...', bmkgErr);
      }

      // 3. Fallback Data Realistis Offline
      this.processFetchedData(this.getDefaultHistoryData());
    }
  }

  processFetchedData(data) {
    if (!data || data.length === 0) return;

    const previousLatest = this.latestEarthquake;
    this.latestEarthquake = data[0];
    this.historyList = data.slice(1);

    // Periksa apakah gempa baru terdeteksi
    if (previousLatest && previousLatest.time !== this.latestEarthquake.time) {
      const classification = this.classifyLevel(
        this.latestEarthquake.magnitude, 
        this.latestEarthquake.tsunami
      );

      if (classification.level === 3) {
        window.notificationManager?.triggerEmergencyModal(this.latestEarthquake);
      } else {
        window.notificationManager?.showNotification(`Info Gempa: M ${this.latestEarthquake.magnitude}`, {
          body: `${this.latestEarthquake.location} - Kedalaman ${this.latestEarthquake.depth} km.`,
          level: classification.level
        });
        window.notificationManager?.playTone(classification.level === 2 ? 660 : 440);
      }
    }

    this.notifyUpdate();
  }

  /**
   * Simulasi Gempa untuk Pengujian Sistem (Level 1, Level 2, Level 3)
   */
  simulateEarthquake(level) {
    this.isSimulated = true;
    let simEq;

    if (level === 1) {
      simEq = {
        id: 991,
        magnitude: 4.2,
        depth: 10,
        location: '34 km Barat Daya SUKABUMI-JABAR',
        time: new Date().toLocaleTimeString('id-ID') + ' WIB (Simulasi)',
        latitude: -7.28,
        longitude: 106.55,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'II-III Pelabuhan Ratu',
        is_simulation: true
      };
      window.notificationManager?.playTone(550, 'sine', 0.5);
      window.notificationManager?.showNotification('Simulasi Gempa Level 1', {
        body: 'M 4.2 - Sukabumi. Tingkat Rendah / Gempa Lemah.',
        level: 1
      });
    } else if (level === 2) {
      simEq = {
        id: 992,
        magnitude: 5.7,
        depth: 18,
        location: '62 km Barat Laut SUMUR-BANTEN',
        time: new Date().toLocaleTimeString('id-ID') + ' WIB (Simulasi)',
        latitude: -6.75,
        longitude: 105.15,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'IV Pandeglang, III Serang, II Jakarta',
        is_simulation: true
      };
      window.notificationManager?.playTone(770, 'triangle', 0.8);
      window.notificationManager?.showNotification('⚠️ Simulasi Gempa Level 2 (Sedang)', {
        body: 'M 5.7 - Banten. Waspada getaran sedang.',
        level: 2
      });
    } else {
      // Level 3 Sangat Bahaya
      simEq = {
        id: 993,
        magnitude: 7.4,
        depth: 12,
        location: '88 km Barat Daya PACITAN-JATIM',
        time: new Date().toLocaleTimeString('id-ID') + ' WIB (Simulasi)',
        latitude: -8.95,
        longitude: 110.95,
        tsunami: 'BERPOTENSI TSUNAMI (Peringatan Siaga)',
        dirasakan: 'VI Pacitan, V Yogyakarta, IV Solo, III Malang',
        is_simulation: true
      };
      // Langsung pemicu Alarm Penuh Level 3
      window.notificationManager?.triggerEmergencyModal(simEq);
    }

    this.latestEarthquake = simEq;
    this.notifyUpdate();
  }

  resetSimulation() {
    this.isSimulated = false;
    this.fetchLiveEarthquakeData();
  }

  getDefaultHistoryData() {
    return [
      {
        id: 1,
        magnitude: 6.2,
        depth: 10,
        location: '83 km Barat Daya SUMUR-BANTEN',
        time: '24 Sep 2026 14:15:30 WIB',
        latitude: -7.01,
        longitude: 105.26,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'IV Pandeglang, III Lebak, II Jakarta'
      },
      {
        id: 2,
        magnitude: 5.3,
        depth: 22,
        location: '45 km Timur Laut TANGGAMUS-LAMPUNG',
        time: '24 Sep 2026 09:20:11 WIB',
        latitude: -5.12,
        longitude: 104.75,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'III Kota Agung, II Bandar Lampung'
      },
      {
        id: 3,
        magnitude: 4.8,
        depth: 15,
        location: '28 km Tenggara KAB-CILACAP-JATENG',
        time: '23 Sep 2026 21:40:05 WIB',
        latitude: -7.95,
        longitude: 109.12,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'II Cilacap, II Kebumen'
      },
      {
        id: 4,
        magnitude: 6.8,
        depth: 14,
        location: '135 km Barat Daya BOLAANG UKI-BOLSEL-SULUT',
        time: '23 Sep 2026 16:11:50 WIB',
        latitude: 0.12,
        longitude: 123.88,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'IV Kotamobagu, III Gorontalo, II Manado'
      },
      {
        id: 5,
        magnitude: 3.9,
        depth: 8,
        location: '12 km Barat Daya KOTA-JAYAPURA-PAPUA',
        time: '23 Sep 2026 06:05:22 WIB',
        latitude: -2.58,
        longitude: 140.62,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'II-III Kota Jayapura'
      }
    ];
  }
}

// Instance global
window.earthquakeService = new EarthquakeService();