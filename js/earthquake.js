/**
 * Siaga Gempa - Live BMKG Earthquake Data Service & History Manager
 */

class EarthquakeService {
  constructor() {
    this.latestEarthquake = null;
    this.historyList = [];
    this.currentFilter = 'all';
    this.refreshTimer = null;
    this.countdownSec = 60;
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

    if (isTsunamiThreat) {
      // Merah: BAHAYA / WARNING — ada potensi tsunami (air naik)
      return { level: 4, label: 'Bahaya / Warning — Potensi Tsunami', badgeClass: 'red', isEmergency: true };
    } else if (magnitude >= 6.0) {
      // Orange: WASPADA — M 6.0+ tapi tidak ada tsunami
      return { level: 3, label: 'Waspada — M 6.0+ (Tanpa Tsunami)', badgeClass: 'orange', isEmergency: false };
    } else if (magnitude >= 5.0) {
      // Kuning: SIAGA — M 5.0–5.9
      return { level: 2, label: 'Siaga — Sedang', badgeClass: 'yellow', isEmergency: false };
    } else {
      // Hijau: RENDAH — M < 5.0
      return { level: 1, label: 'Rendah — Relatif Aman', badgeClass: 'green', isEmergency: false };
    }
  }

  async fetchLiveEarthquakeData() {
    try {
      // 1. Fetch Gempa Terbaru Real-time
      const autoRes = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
      if (autoRes.ok) {
        const data = await autoRes.json();
        if (data?.Infogempa?.gempa) {
          const g = data.Infogempa.gempa;
          const coords = (g.Coordinates || '').split(',');
          const lat = coords[0] ? parseFloat(coords[0].trim()) : 5.55;
          const lon = coords[1] ? parseFloat(coords[1].trim()) : 95.32;

          this.latestEarthquake = {
            id: 'latest',
            magnitude: parseFloat(g.Magnitude || 0),
            depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
            location: g.Wilayah || 'Banda Aceh',
            time: `${g.Tanggal || ''} ${g.Jam || ''}`.trim(),
            latitude: lat,
            longitude: lon,
            tsunami: g.Potensi || 'Tidak berpotensi tsunami',
            dirasakan: g.Dirasakan || '-'
          };
        }
      }

      // 2. Fetch Daftar Riwayat Gempa M 5.0+ Terbaru
      const listRes = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData?.Infogempa?.gempa && Array.isArray(listData.Infogempa.gempa)) {
          this.historyList = listData.Infogempa.gempa.map((item, index) => {
            const coords = (item.Coordinates || '').split(',');
            return {
              id: index + 1,
              magnitude: parseFloat(item.Magnitude || 0),
              depth: parseInt((item.Kedalaman || '0').replace(/[^0-9]/g, '')),
              location: item.Wilayah || 'Wilayah Indonesia',
              time: `${item.Tanggal || ''} ${item.Jam || ''}`.trim(),
              latitude: coords[0] ? parseFloat(coords[0].trim()) : 0,
              longitude: coords[1] ? parseFloat(coords[1].trim()) : 0,
              tsunami: item.Potensi || 'Tidak berpotensi tsunami'
            };
          });
        }
      }
    } catch (err) {
      console.warn('BMKG Live API fallback to offline cached data:', err);
      this.loadFallbackData();
    }

    if (!this.latestEarthquake) {
      this.loadFallbackData();
    }

    this.renderSpotlightUI();
    this.renderHistoryUI();
    this.updateMockupDisplay();
    this.startAutoRefresh();
  }

  loadFallbackData() {
    this.latestEarthquake = {
      id: 'fallback_latest',
      magnitude: 4.9,
      depth: 10,
      location: 'Pusat gempa berada di laut 46 km utara Ruteng-Manggarai',
      time: '26 Sep 2026 02:39:29 WIB',
      latitude: -8.23,
      longitude: 120.31,
      tsunami: 'Tidak berpotensi tsunami',
      dirasakan: 'II - III Kab. Manggarai'
    };

    this.historyList = [
      {
        id: 1,
        magnitude: 5.2,
        depth: 10,
        location: '127 km BaratLaut TAHUNA-KEP.SANGIHE-SULUT',
        time: '22 Sep 2026 06:48:13 WIB',
        latitude: 4.74,
        longitude: 125.30,
        tsunami: 'Tidak berpotensi tsunami'
      },
      {
        id: 2,
        magnitude: 5.3,
        depth: 10,
        location: '26 km BaratDaya PULAUPUAH-SULTENG',
        time: '21 Sep 2026 14:31:07 WIB',
        latitude: -0.70,
        longitude: 122.45,
        tsunami: 'Tidak berpotensi tsunami'
      },
      {
        id: 3,
        magnitude: 5.3,
        depth: 10,
        location: '34 km TimurLaut RUTENG-MANGGARAI-NTT',
        time: '21 Sep 2026 08:41:37 WIB',
        latitude: -8.33,
        longitude: 120.59,
        tsunami: 'Tidak berpotensi tsunami'
      },
      {
        id: 4,
        magnitude: 5.2,
        depth: 10,
        location: '198 km BaratDaya BAYAH-BANTEN (Pesisir Selatan)',
        time: '18 Sep 2026 21:36:17 WIB',
        latitude: -8.64,
        longitude: 105.74,
        tsunami: 'Tidak berpotensi tsunami'
      },
      {
        id: 5,
        magnitude: 5.6,
        depth: 10,
        location: '186 km BaratDaya BAYAH-BANTEN',
        time: '14 Sep 2026 16:27:39 WIB',
        latitude: -8.54,
        longitude: 105.78,
        tsunami: 'Tidak berpotensi tsunami'
      },
      {
        id: 6,
        magnitude: 6.2,
        depth: 145,
        location: '42 km TimurLaut PULAUDOI-MALUT',
        time: '14 Sep 2026 17:58:04 WIB',
        latitude: 2.52,
        longitude: 128.09,
        tsunami: 'Tidak berpotensi tsunami'
      }
    ];
  }

  renderSpotlightUI() {
    const eq = this.latestEarthquake;
    if (!eq) return;

    const magEl = document.getElementById('spotlight-mag');
    const locEl = document.getElementById('spotlight-loc');
    const timeEl = document.getElementById('spotlight-time');
    const depthEl = document.getElementById('spotlight-depth');
    const tsunamiEl = document.getElementById('spotlight-tsunami');
    const mapsBtn = document.getElementById('btn-spotlight-maps');

    if (magEl) magEl.textContent = eq.magnitude.toFixed(1);
    if (locEl) locEl.textContent = eq.location;
    if (timeEl) timeEl.textContent = eq.time;
    if (depthEl) depthEl.textContent = `${eq.depth} km`;
    if (tsunamiEl) tsunamiEl.textContent = eq.tsunami;

    if (mapsBtn) {
      mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${eq.latitude},${eq.longitude}`;
    }
  }

  renderHistoryUI() {
    const container = document.getElementById('eq-history-container');
    if (!container) return;

    let items = [...this.historyList];

    // Apply Filter
    if (this.currentFilter === 'sumatra') {
      items = items.filter(i => this.isSumatraAcehRegion(i.location, i.latitude, i.longitude));
    } else if (this.currentFilter === 'm5') {
      items = items.filter(i => i.magnitude >= 5.0);
    } else if (this.currentFilter === 'tsunami') {
      items = items.filter(i => i.tsunami.toLowerCase().includes('tsunami') && !i.tsunami.toLowerCase().includes('tidak'));
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: var(--text-dark-muted); background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed #cbd5e1;">
          Tidak ada data gempa yang cocok dengan filter yang dipilih saat ini.
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const isSumatra = this.isSumatraAcehRegion(item.location, item.latitude, item.longitude);
      const classification = this.classifyLevel(item.magnitude, item.tsunami);
      const badgeClass = classification.badgeClass;

      return `
        <div class="eq-history-card">
          <div class="eq-mag-badge ${badgeClass}">
            ${item.magnitude.toFixed(1)}
          </div>
          <div class="eq-info-block">
            <div class="eq-location-name">${item.location}</div>
            <div class="eq-meta-details">
              <span>🕒 ${item.time}</span>
              <span>📏 Kedalaman: ${item.depth} km</span>
              <span>🛡️ ${item.tsunami}</span>
            </div>
            ${isSumatra ? '<span class="eq-tag-sumatra">📍 Zona Sumatra-Aceh</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  setFilter(filterName) {
    this.currentFilter = filterName;
    document.querySelectorAll('.eq-filter-btn').forEach(btn => {
      if (btn.getAttribute('data-filter') === filterName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.renderHistoryUI();
  }

  updateMockupDisplay() {
    const eq = this.latestEarthquake;
    if (!eq) return;

    const statusTitleEl = document.getElementById('mockup-status-title');
    const locLabelEl = document.getElementById('mockup-loc-label');

    const isSumatra = this.isSumatraAcehRegion(eq.location, eq.latitude, eq.longitude);
    const classification = this.classifyLevel(eq.magnitude, eq.tsunami);

    if ((classification.level === 4 || (classification.level === 3 && isSumatra)) && isSumatra) {
      if (statusTitleEl) {
        statusTitleEl.textContent = `🚨 Gempa M ${eq.magnitude.toFixed(1)} & Tsunami!`;
        statusTitleEl.style.color = '#f87171';
      }
      if (locLabelEl) locLabelEl.textContent = `Bahaya Tinggi • ${eq.location}`;
    } else {
      if (statusTitleEl) {
        statusTitleEl.textContent = `M ${eq.magnitude.toFixed(1)} - ${eq.location}`;
        statusTitleEl.style.color = '#ffffff';
      }
      if (locLabelEl) locLabelEl.textContent = `BMKG Real-time • ${eq.time}`;
    }
  }

  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);

    this.countdownSec = 60;
    this.refreshTimer = setInterval(() => {
      this.countdownSec--;
      const timerEl = document.getElementById('live-countdown-sec');
      if (timerEl) timerEl.textContent = `${this.countdownSec}s`;

      if (this.countdownSec <= 0) {
        this.countdownSec = 60;
        this.fetchLiveEarthquakeData();
      }
    }, 1000);
  }
}

window.earthquakeService = new EarthquakeService();