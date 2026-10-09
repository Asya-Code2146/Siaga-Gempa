class EarthquakeService {
  constructor() {
    this.latestEarthquake = null;
    this.historyList = [];
    this.currentFilter = 'all';
    this.refreshTimer = null;
    this.countdownSec = 60;
    this.isRefreshing = false;
    this.lastUpdatedTimestamp = null;
    this.sumatraKeywords = [
      'aceh', 'banda aceh', 'meulaboh', 'sabang', 'simeulue', 'lhokseumawe',
      'pidie', 'sigli', 'nagan raya', 'takengon', 'subulussalam', 'singkil',
      'tapaktuan', 'bireuen', 'langsa', 'calang', 'jantho', 'bener meriah',
      'gayo lues', 'aceh jaya', 'aceh besar', 'aceh barat', 'aceh selatan',
      'aceh timur', 'aceh utara', 'sumatera', 'sumatra', 'nias', 'mentawai',
      'padang', 'medan', 'sibolga', 'bengkulu', 'lampung', 'sumut', 'sumbar',
      'riau', 'jambi'
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

  classifyLevel(magnitude, tsunamiText = '', alertState = '') {
    const tsuLower = (tsunamiText || '').toLowerCase();
    const isEnded = tsuLower.includes('berakhir') || tsuLower.includes('dicabut') || alertState === 'ended';
    const isTsunamiThreat = !isEnded && (alertState === 'active_warning' ||
      (tsuLower.includes('tsunami') && !tsuLower.includes('tidak berpotensi') && !tsuLower.includes('tidak')));

    if (isTsunamiThreat) {
      return { level: 4, label: 'Bahaya / Warning — Potensi Tsunami Aktif', badgeClass: 'red', isEmergency: true };
    } else if (isEnded) {
      return { level: 2, label: 'Peringatan Tsunami Telah Berakhir', badgeClass: 'green', isEmergency: false };
    } else if (magnitude >= 6.0) {
      return { level: 3, label: 'Waspada — M 6.0+ (Tanpa Tsunami)', badgeClass: 'orange', isEmergency: false };
    } else if (magnitude >= 5.0) {
      return { level: 2, label: 'Siaga — Sedang', badgeClass: 'yellow', isEmergency: false };
    } else {
      return { level: 1, label: 'Rendah — Relatif Aman', badgeClass: 'green', isEmergency: false };
    }
  }

  checkIsToday(dateString, dateTimeStr) {
    try {
      if (dateTimeStr) {
        const itemDate = new Date(dateTimeStr);
        const now = new Date();
        return itemDate.toDateString() === now.toDateString();
      }
      if (dateString) {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const todayStr = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
        return dateString.includes(todayStr);
      }
    } catch (e) {}
    return false;
  }

  parseTimestamp(item) {
    if (item.dateTime) {
      const ts = Date.parse(item.dateTime);
      if (!isNaN(ts)) return ts;
    }
    try {
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
        'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
      };
      const parts = (item.time || '').split(' ');
      if (parts.length >= 4) {
        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]] ?? 0;
        const year = parseInt(parts[2], 10);
        const timeParts = (parts[3] || '00:00:00').split(':');
        const hour = parseInt(timeParts[0] || '0', 10);
        const min = parseInt(timeParts[1] || '0', 10);
        const sec = parseInt(timeParts[2] || '0', 10);
        return new Date(Date.UTC(year, month, day, hour - 7, min, sec)).getTime();
      }
    } catch (e) {}
    return 0;
  }

  async fetchLiveEarthquakeData() {
    const cacheBuster = `?t=${Date.now()}`;
    let fetchedAuto = null;
    let rawItems = [];
    let isDegraded = false;

    try {
      const [autoRes, dirasakanRes, terkiniRes] = await Promise.allSettled([
        fetch(`https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json${cacheBuster}`),
        fetch(`https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json${cacheBuster}`),
        fetch(`https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json${cacheBuster}`)
      ]);

      if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
        const autoData = await autoRes.value.json();
        const g = autoData?.Infogempa?.gempa;
        if (g) {
          const coords = (g.Coordinates || '').split(',');
          const lat = coords[0] ? parseFloat(coords[0].trim()) : 5.55;
          const lon = coords[1] ? parseFloat(coords[1].trim()) : 95.32;
          const timeStr = `${g.Tanggal || ''} ${g.Jam || ''}`.trim();

          fetchedAuto = {
            id: 'latest',
            magnitude: parseFloat(g.Magnitude || 0),
            depth: parseInt((g.Kedalaman || '0').replace(/[^0-9]/g, '')),
            location: g.Wilayah || 'Banda Aceh',
            time: timeStr,
            dateTime: g.DateTime || '',
            latitude: lat,
            longitude: lon,
            tsunami: g.Potensi || 'Tidak berpotensi tsunami',
            dirasakan: g.Dirasakan || '-',
            isLatest: true,
            isToday: this.checkIsToday(g.Tanggal, g.DateTime)
          };
          rawItems.push(fetchedAuto);
        }
      }

      if (dirasakanRes.status === 'fulfilled' && dirasakanRes.value.ok) {
        const dData = await dirasakanRes.value.json();
        const list = dData?.Infogempa?.gempa;
        if (Array.isArray(list)) {
          list.forEach((item, idx) => {
            const coords = (item.Coordinates || '').split(',');
            const lat = coords[0] ? parseFloat(coords[0].trim()) : 0;
            const lon = coords[1] ? parseFloat(coords[1].trim()) : 0;
            const timeStr = `${item.Tanggal || ''} ${item.Jam || ''}`.trim();

            rawItems.push({
              id: `dirasakan_${idx}`,
              magnitude: parseFloat(item.Magnitude || 0),
              depth: parseInt((item.Kedalaman || '0').replace(/[^0-9]/g, '')),
              location: item.Wilayah || 'Wilayah Indonesia',
              time: timeStr,
              dateTime: item.DateTime || '',
              latitude: lat,
              longitude: lon,
              tsunami: item.Potensi || (item.Dirasakan ? `Dirasakan: ${item.Dirasakan}` : 'Tidak berpotensi tsunami'),
              dirasakan: item.Dirasakan || '-',
              isLatest: false,
              isToday: this.checkIsToday(item.Tanggal, item.DateTime)
            });
          });
        }
      }

      if (terkiniRes.status === 'fulfilled' && terkiniRes.value.ok) {
        const tData = await terkiniRes.value.json();
        const list = tData?.Infogempa?.gempa;
        if (Array.isArray(list)) {
          list.forEach((item, idx) => {
            const coords = (item.Coordinates || '').split(',');
            const lat = coords[0] ? parseFloat(coords[0].trim()) : 0;
            const lon = coords[1] ? parseFloat(coords[1].trim()) : 0;
            const timeStr = `${item.Tanggal || ''} ${item.Jam || ''}`.trim();

            rawItems.push({
              id: `terkini_${idx}`,
              magnitude: parseFloat(item.Magnitude || 0),
              depth: parseInt((item.Kedalaman || '0').replace(/[^0-9]/g, '')),
              location: item.Wilayah || 'Wilayah Indonesia',
              time: timeStr,
              dateTime: item.DateTime || '',
              latitude: lat,
              longitude: lon,
              tsunami: item.Potensi || 'Tidak berpotensi tsunami',
              dirasakan: item.Dirasakan || '-',
              isLatest: false,
              isToday: this.checkIsToday(item.Tanggal, item.DateTime)
            });
          });
        }
      }

      if (rawItems.length === 0) {
        const proxyRes = await fetch(`/api/earthquake${cacheBuster}`);
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          const pList = Array.isArray(proxyData) ? proxyData : (proxyData.data || []);
          if (Array.isArray(pList) && pList.length > 0) {
            rawItems = pList.map((item, idx) => ({
              id: item.id || idx,
              magnitude: parseFloat(item.magnitude || 0),
              depth: parseInt(item.depth || 0),
              location: item.location || '',
              time: item.time || '',
              dateTime: item.dateTime || '',
              latitude: parseFloat(item.latitude || 0),
              longitude: parseFloat(item.longitude || 0),
              tsunami: item.tsunami || 'Tidak berpotensi tsunami',
              dirasakan: item.dirasakan || '-',
              isLatest: item.is_latest || false,
              isToday: this.checkIsToday(item.time, item.dateTime)
            }));
          }
        }
      }
    } catch (err) {
      isDegraded = true;
    }

    if (rawItems.length > 0) {
      const seen = new Set();
      const deduped = [];

      for (const item of rawItems) {
        const key = `${item.location.slice(0, 20)}_${item.time}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      deduped.sort((a, b) => {
        const tsA = this.parseTimestamp(a);
        const tsB = this.parseTimestamp(b);
        return tsB - tsA;
      });

      this.historyList = deduped;
      this.latestEarthquake = fetchedAuto || deduped[0];
      this.lastUpdatedTimestamp = new Date();
      this.saveLocalCache(deduped);
    } else if (!this.latestEarthquake) {
      this.loadCachedOrFallback();
    }

    this.updateConnectionStatus(isDegraded);

    if (this.latestEarthquake) {
      this.checkAndNotifyNewEarthquake(this.latestEarthquake);
      if (window.mapService) {
        window.mapService.updateEpicenter(
          this.latestEarthquake.latitude,
          this.latestEarthquake.longitude,
          this.latestEarthquake.magnitude,
          this.latestEarthquake.location,
          this.latestEarthquake.tsunami,
          this.latestEarthquake.depth,
          this.latestEarthquake.time
        );
      }
    }

    this.renderSpotlightUI();
    this.renderHistoryUI();
    this.updateMockupDisplay();
    this.startAutoRefresh();

    if (window.aiSeismicAnalyst) {
      window.aiSeismicAnalyst.updateAnalysis(this.historyList);
    }
  }

  saveLocalCache(items) {
    try {
      localStorage.setItem('siagagempa_offline_eq', JSON.stringify({
        timestamp: Date.now(),
        data: items
      }));
    } catch (e) {}
  }

  loadCachedOrFallback() {
    try {
      const local = localStorage.getItem('siagagempa_offline_eq');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.data && parsed.data.length > 0) {
          this.historyList = parsed.data;
          this.latestEarthquake = parsed.data[0];
          return;
        }
      }
    } catch (e) {}
    this.loadFallbackData();
  }

  updateConnectionStatus(isDegraded) {
    const statusEl = document.getElementById('api-sync-status');
    if (!statusEl) return;

    if (!navigator.onLine) {
      statusEl.className = 'sync-status-badge offline';
      statusEl.textContent = 'Mode Offline (Cache Lokal)';
    } else if (isDegraded) {
      statusEl.className = 'sync-status-badge warning';
      statusEl.textContent = 'BMKG Gangguan (Data Cache)';
    } else {
      statusEl.className = 'sync-status-badge live';
      statusEl.textContent = 'Tersinkron BMKG';
    }
  }

  checkAndNotifyNewEarthquake(eq) {
    if (!eq) return;
    if (eq.is_simulation) return;

    const eqId = `${eq.dateTime || eq.time}_${eq.magnitude}_${eq.location}`.replace(/[^a-zA-Z0-9]/g, '_');
    const lastNotified = localStorage.getItem('siagagempa_last_notified_eq');

    if (!lastNotified) {
      localStorage.setItem('siagagempa_last_notified_eq', eqId);
      return;
    }

    if (lastNotified !== eqId) {
      localStorage.setItem('siagagempa_last_notified_eq', eqId);

      const isSumatra = this.isSumatraAcehRegion(eq.location, eq.latitude, eq.longitude);
      const classification = this.classifyLevel(eq.magnitude, eq.tsunami, eq.tsunami_alert_state);

      if (classification.isEmergency && isSumatra) {
        window.notificationManager?.triggerEmergencyModal(eq);
      } else {
        const title = classification.level >= 3
          ? `Gempa Signifikan BMKG: M ${eq.magnitude.toFixed(1)}`
          : `Info Gempa BMKG: M ${eq.magnitude.toFixed(1)}`;
        window.notificationManager?.showNormalToast(
          title,
          `${eq.location} • Kedalaman ${eq.depth} km • ${eq.tsunami}`,
          eq.magnitude
        );
      }
    }
  }

  loadFallbackData() {
    this.latestEarthquake = {
      id: 'fallback_latest',
      magnitude: 4.8,
      depth: 10,
      location: 'Pusat gempa berada di laut 54 km barat laut Calang-Aceh Jaya',
      time: '30 Sep 2026 09:35:54 WIB',
      latitude: 4.84,
      longitude: 95.14,
      tsunami: 'Dirasakan di Calang, Banda Aceh, Aceh Besar',
      dirasakan: 'III-IV Calang, III Aceh Besar, III Banda Aceh, II Sigli',
      isToday: false
    };

    this.historyList = [
      this.latestEarthquake,
      {
        id: 1,
        magnitude: 4.5,
        depth: 10,
        location: 'Pusat gempa berada di laut 127 km Barat Daya Kota Sabang',
        time: '28 Sep 2026 21:43:09 WIB',
        latitude: 5.19,
        longitude: 94.41,
        tsunami: 'Dirasakan di Sabang & Banda Aceh',
        dirasakan: 'III-IV Aceh Besar, III-IV Banda Aceh',
        isToday: false
      },
      {
        id: 2,
        magnitude: 3.4,
        depth: 10,
        location: 'Pusat gempa berada di darat 18 km barat Bener Meriah',
        time: '28 Sep 2026 00:54:05 WIB',
        latitude: 4.76,
        longitude: 96.70,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: 'III Aceh Tengah, III Bener Meriah',
        isToday: false
      },
      {
        id: 3,
        magnitude: 5.2,
        depth: 10,
        location: '127 km BaratLaut TAHUNA-KEP.SANGIHE-SULUT',
        time: '22 Sep 2026 06:48:13 WIB',
        latitude: 4.74,
        longitude: 125.30,
        tsunami: 'Tidak berpotensi tsunami',
        dirasakan: '-',
        isToday: false
      }
    ];
  }

  async manualRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    const icon = document.getElementById('manual-refresh-icon');
    if (icon) icon.classList.add('spinning');

    const btn = document.getElementById('btn-manual-refresh-eq');
    if (btn) btn.classList.add('loading');

    try {
      await this.fetchLiveEarthquakeData();
      this.countdownSec = 60;
      const timerEl = document.getElementById('live-countdown-sec');
      if (timerEl) timerEl.textContent = '60s';

      window.notificationManager?.showNormalToast(
        'Data Gempa Real-Time Diperbarui',
        'Berhasil memuat data gempa terkini langsung dari BMKG.',
        0
      );
    } catch (e) {
    } finally {
      this.isRefreshing = false;
      setTimeout(() => {
        if (icon) icon.classList.remove('spinning');
        if (btn) btn.classList.remove('loading');
      }, 500);
    }
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
    const lastUpdateEl = document.getElementById('spotlight-last-update');

    if (magEl) magEl.textContent = eq.magnitude.toFixed(1);
    if (locEl) locEl.textContent = eq.location;
    if (timeEl) timeEl.textContent = eq.time;
    if (depthEl) depthEl.textContent = `${eq.depth} km`;
    if (tsunamiEl) tsunamiEl.textContent = eq.tsunami;

    if (lastUpdateEl && this.lastUpdatedTimestamp) {
      lastUpdateEl.textContent = this.lastUpdatedTimestamp.toLocaleTimeString('id-ID');
    }

    if (mapsBtn) {
      mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${eq.latitude},${eq.longitude}`;
    }
  }

  renderHistoryUI() {
    const container = document.getElementById('eq-history-container');
    if (!container) return;

    let items = [...this.historyList];

    if (this.currentFilter === 'sumatra') {
      items = items.filter(i => this.isSumatraAcehRegion(i.location, i.latitude, i.longitude));
    } else if (this.currentFilter === 'm5') {
      items = items.filter(i => i.magnitude >= 5.0);
    } else if (this.currentFilter === 'tsunami') {
      items = items.filter(i => {
        const tsu = (i.tsunami || '').toLowerCase();
        return tsu.includes('tsunami') && !tsu.includes('tidak berpotensi');
      });
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: var(--text-dark-muted); background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed #cbd5e1;">
          Tidak ada data gempa yang cocok dengan filter yang dipilih saat ini.
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((item, idx) => {
      const isSumatra = this.isSumatraAcehRegion(item.location, item.latitude, item.longitude);
      const classification = this.classifyLevel(item.magnitude, item.tsunami, item.tsunami_alert_state);
      const badgeClass = classification.badgeClass;
      const isTopRecent = idx === 0 || item.isToday;

      return `
        <div class="eq-history-card ${isTopRecent ? 'is-realtime-entry' : ''}" onclick="window.earthquakeService?.focusOnMap(${item.latitude}, ${item.longitude}, ${item.magnitude}, '${item.location.replace(/'/g, "\\'")}')">
          <div class="eq-mag-badge ${badgeClass}">
            ${item.magnitude.toFixed(1)}
          </div>
          <div class="eq-info-block">
            <div class="eq-location-name">
              ${item.location}
              ${item.is_simulation ? '<span class="eq-tag-sim" style="background:#64748b;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:6px;">🧪 DATA SIMULASI</span>' : ''}
              ${item.isToday && !item.is_simulation ? '<span class="eq-tag-today">⚡ HARI INI</span>' : ''}
              ${idx === 0 && !item.is_simulation ? '<span class="eq-tag-latest">🔥 TERBARU</span>' : ''}
            </div>
            <div class="eq-meta-details">
              <span>🕒 ${item.time}</span>
              <span>📏 Kedalaman: ${item.depth} km</span>
              <span>🛡️ ${item.tsunami}</span>
            </div>
            ${item.dirasakan && item.dirasakan !== '-' ? `
              <div class="eq-meta-dirasakan">
                <span>📢 <strong>Dirasakan:</strong> ${item.dirasakan}</span>
              </div>
            ` : ''}
            ${isSumatra ? '<span class="eq-tag-sumatra">📍 Zona Sumatra-Aceh</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  focusOnMap(lat, lon, mag, loc) {
    if (window.mapService) {
      window.mapService.panTo(lat, lon, 7);
      const mapEl = document.getElementById('map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
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