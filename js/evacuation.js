class EvacuationService {
  constructor() {
    this.userCoords = null;
    this.shelters = [];
    this.selectedType = 'all';
    this.initDefaultShelters();
    this.initChecklistState();
  }

  initDefaultShelters() {
    this.shelters = [
      {
        id: 1,
        name: 'Gedung Evakuasi Tsunami Lambung (TES Lambung)',
        type: 'gedung_tsunami',
        type_label: 'Gedung Evakuasi (TES)',
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
        type_label: 'Gedung Evakuasi (TES)',
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
        type_label: 'Gedung Evakuasi (TES)',
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
        type_label: 'Gedung Evakuasi Vertikal',
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
        type_label: 'Dataran Tinggi / Bukit',
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
        type_label: 'Titik Kumpul Terbuka',
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
        type_label: 'Titik Kumpul Terbuka',
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
  }

  async loadSheltersFromApi() {
    try {
      const url = this.userCoords
        ? `/api/shelters?lat=${this.userCoords.lat}&lon=${this.userCoords.lon}`
        : '/api/shelters';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          this.shelters = json.data;
        }
      }
    } catch (e) {}

    this.recalculateDistances();
    this.renderSheltersUI();
    if (window.mapService) {
      window.mapService.plotShelters(this.getFilteredShelters());
    }
  }

  calculateHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  recalculateDistances() {
    if (!this.userCoords) return;

    this.shelters.forEach(s => {
      const dist = this.calculateHaversine(this.userCoords.lat, this.userCoords.lon, s.latitude, s.longitude);
      s.distance_km = dist;
      s.walking_time_min = Math.round((dist / 4.5) * 60);
      s.driving_time_min = Math.max(1, Math.round((dist / 30) * 60));
      s.google_maps_route_url = `https://www.google.com/maps/dir/?api=1&origin=${this.userCoords.lat},${this.userCoords.lon}&destination=${s.latitude},${s.longitude}&travelmode=walking`;
    });

    this.shelters.sort((a, b) => a.distance_km - b.distance_km);
  }

  requestUserLocation() {
    if (!('geolocation' in navigator)) {
      alert('Perangkat Anda tidak mendukung fitur Geolocation.');
      return;
    }

    const btn = document.getElementById('btn-get-user-loc');
    if (btn) {
      btn.textContent = 'Mengambil GPS...';
      btn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        if (btn) {
          btn.textContent = '✓ Lokasi Terdeteksi';
          btn.classList.add('active');
          btn.disabled = false;
        }

        const locLabel = document.getElementById('user-loc-display');
        if (locLabel) {
          locLabel.textContent = `Koordinat: ${this.userCoords.lat.toFixed(4)}, ${this.userCoords.lon.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`;
        }

        if (window.emergencyService) {
          window.emergencyService.userCoords = this.userCoords;
        }

        if (window.mapService) {
          window.mapService.updateUserLocation(this.userCoords.lat, this.userCoords.lon);
        }

        this.recalculateDistances();
        this.renderSheltersUI();
        if (window.mapService) {
          window.mapService.plotShelters(this.getFilteredShelters());
        }

        window.notificationManager?.showNormalToast(
          'Lokasi GPS Aktif',
          `Rute evakuasi terdekat telah dihitung dari posisi Anda (${this.userCoords.lat.toFixed(4)}, ${this.userCoords.lon.toFixed(4)}).`,
          0
        );
      },
      (err) => {
        if (btn) {
          btn.textContent = '🧭 Gunakan Lokasi Saya';
          btn.disabled = false;
        }
        let msg = 'Izin lokasi tidak dapat diakses. Anda dapat memilih wilayah secara manual.';
        if (err.code === 1) {
          msg = 'Izin lokasi (GPS) ditolak browser. Silakan aktifkan di pengaturan situs atau pilih lokasi manual.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  setManualLocation(cityName) {
    const cityCoords = {
      'banda_aceh': { lat: 5.5483, lon: 95.3238, name: 'Banda Aceh (Pusat Kota)' },
      'meuraxa': { lat: 5.5460, lon: 95.2950, name: 'Meuraxa (Pesisir Pantai Ulee Lheue)' },
      'syiah_kuala': { lat: 5.5750, lon: 95.3500, name: 'Syiah Kuala / Darussalam' },
      'aceh_besar': { lat: 5.4000, lon: 95.4500, name: 'Aceh Besar (Jantho)' },
      'sabang': { lat: 5.8900, lon: 95.3200, name: 'Kota Sabang (Pulau Weh)' },
      'meulaboh': { lat: 4.1400, lon: 96.1300, name: 'Meulaboh (Aceh Barat)' }
    };

    const target = cityCoords[cityName];
    if (!target) return;

    this.userCoords = { lat: target.lat, lon: target.lon, accuracy: 100 };

    const locLabel = document.getElementById('user-loc-display');
    if (locLabel) {
      locLabel.textContent = `Lokasi: ${target.name} (${target.lat.toFixed(4)}, ${target.lon.toFixed(4)})`;
    }

    if (window.mapService) {
      window.mapService.updateUserLocation(target.lat, target.lon);
    }

    this.recalculateDistances();
    this.renderSheltersUI();
    if (window.mapService) {
      window.mapService.plotShelters(this.getFilteredShelters());
    }
  }

  filterShelters(type) {
    this.selectedType = type;
    document.querySelectorAll('.shelter-filter-btn').forEach(btn => {
      if (btn.getAttribute('data-type') === type) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderSheltersUI();
    if (window.mapService) {
      window.mapService.plotShelters(this.getFilteredShelters());
    }
  }

  getFilteredShelters() {
    if (this.selectedType === 'all') return this.shelters;
    return this.shelters.filter(s => s.type === this.selectedType);
  }

  renderSheltersUI() {
    const listEl = document.getElementById('shelter-cards-list');
    if (!listEl) return;

    const items = this.getFilteredShelters();

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column:1/-1; padding:24px; text-align:center; color:#64748b; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
          Tidak ada shelter yang cocok dengan kategori yang dipilih.
        </div>
      `;
      return;
    }

    const latestEq = window.earthquakeService?.latestEarthquake;
    const isTsunamiThreat = latestEq && (
      latestEq.tsunami_alert_state === 'active_warning' ||
      ((latestEq.tsunami || '').toLowerCase().includes('tsunami') && !(latestEq.tsunami || '').toLowerCase().includes('tidak'))
    );

    let displayItems = [...items];
    if (isTsunamiThreat) {
      displayItems.sort((a, b) => {
        if (a.is_tsunami_safe && !b.is_tsunami_safe) return -1;
        if (!a.is_tsunami_safe && b.is_tsunami_safe) return 1;
        return (a.distance_km || 999) - (b.distance_km || 999);
      });
    }

    const threatBanner = isTsunamiThreat ? `
      <div class="evac-threat-alert-box" style="grid-column: 1 / -1; background:#fef2f2; border:2px solid #ef4444; border-radius:12px; padding:12px 16px; margin-bottom:12px; color:#991b1b; display:flex; align-items:center; gap:12px;">
        <span style="font-size:22px;">🚨</span>
        <div>
          <strong style="font-size:13.5px; display:block;">ARAHAN EVAKUASI TSUNAMI AKTIF BMKG</strong>
          <span style="font-size:12px; line-height:1.4;">Prioritaskan Gedung Evakuasi Vertikal Tsunami (TES) atau Dataran Tinggi. Hindari garis pantai dan area datar rendah.</span>
        </div>
      </div>
    ` : '';

    listEl.innerHTML = threatBanner + displayItems.map((s, idx) => {
      let badgeBg = '#0d9488';
      let typeIcon = '🏢';
      if (s.type === 'gedung_tsunami') {
        badgeBg = '#0284c7';
        typeIcon = '🏢';
      } else if (s.type === 'tempat_tinggi') {
        badgeBg = '#16a34a';
        typeIcon = '⛰️';
      } else {
        badgeBg = '#64748b';
        typeIcon = '📍';
      }

      const walkUrl = this.userCoords
        ? `https://www.google.com/maps/dir/?api=1&origin=${this.userCoords.lat},${this.userCoords.lon}&destination=${s.latitude},${s.longitude}&travelmode=walking`
        : `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}&travelmode=walking`;

      const driveUrl = this.userCoords
        ? `https://www.google.com/maps/dir/?api=1&origin=${this.userCoords.lat},${this.userCoords.lon}&destination=${s.latitude},${s.longitude}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}&travelmode=driving`;

      return `
        <div class="shelter-info-card ${idx === 0 && this.userCoords ? 'nearest-card' : ''}">
          <div class="shelter-card-top">
            <span class="shelter-type-pill" style="background:${badgeBg}; color:#fff;">
              ${typeIcon} ${s.type_label}
            </span>
            ${s.is_tsunami_safe
              ? '<span class="shelter-tsunami-safe-badge">✓ Aman Tsunami</span>'
              : '<span class="shelter-warning-badge">⚠️ Khusus Gempa Darat</span>'}
          </div>

          <h4 class="shelter-title">${s.name}</h4>
          <p class="shelter-address">${s.address}</p>

          <div class="shelter-specs-grid">
            <div class="shelter-spec-pill">
              <span class="spec-k">Ketinggian</span>
              <span class="spec-v">${s.elevation_meters} m dpl</span>
            </div>
            <div class="shelter-spec-pill">
              <span class="spec-k">Kapasitas</span>
              <span class="spec-v">${s.capacity.toLocaleString()} jiwa</span>
            </div>
            ${s.distance_km !== null && s.distance_km !== undefined ? `
              <div class="shelter-spec-pill spec-dist">
                <span class="spec-k">Jarak</span>
                <span class="spec-v">${s.distance_km} km</span>
              </div>
            ` : ''}
          </div>

          ${s.walking_time_min ? `
            <div class="shelter-est-line">
              <span>🚶 ~${s.walking_time_min} mnt jalan kaki</span>
              <span>🚗 ~${s.driving_time_min} mnt mobil</span>
            </div>
          ` : ''}

          <div class="shelter-verified-meta">
            <span>✓ Terverifikasi <strong>${s.verified_by}</strong></span>
          </div>

          <div class="shelter-compact-actions">
            <a href="${walkUrl}" target="_blank" rel="noopener noreferrer" class="btn-shelter-compact btn-route-walk" title="Rute Jalan Kaki Google Maps">
              🚶 Jalan Kaki
            </a>
            <a href="${driveUrl}" target="_blank" rel="noopener noreferrer" class="btn-shelter-compact btn-route-drive" title="Rute Berkendara Google Maps">
              🚗 Berkendara
            </a>
            <button type="button" class="btn-shelter-compact btn-preview-map" onclick="window.evacuationService?.focusShelterMap(${s.latitude}, ${s.longitude})" title="Fokuskan Peta ke Shelter Ini">
              📍 Peta
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  focusShelterMap(lat, lon) {
    if (window.mapService) {
      window.mapService.panTo(lat, lon, 15);
      const mapEl = document.getElementById('map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  openSayaAmanModal() {
    const modal = document.getElementById('saya-aman-modal');
    if (!modal) return;

    const eq = window.earthquakeService?.latestEarthquake;
    const eqLabel = document.getElementById('saya-aman-eq-info');
    if (eqLabel && eq) {
      eqLabel.textContent = `Terkait gempa M ${eq.magnitude.toFixed(1)} di ${eq.location}`;
    }

    this.updateSayaAmanPreview();
    modal.classList.add('active');
  }

  closeSayaAmanModal() {
    const modal = document.getElementById('saya-aman-modal');
    if (modal) modal.classList.remove('active');
  }

  updateSayaAmanPreview() {
    const previewEl = document.getElementById('saya-aman-msg-preview');
    if (!previewEl) return;

    const includeLoc = document.getElementById('saya-aman-include-loc')?.checked;
    const customNote = document.getElementById('saya-aman-note')?.value?.trim();
    const eq = window.earthquakeService?.latestEarthquake;

    let text = 'Alhamdulillah, saya dalam keadaan aman dan selamat';
    if (eq) {
      text += ` setelah guncangan gempa (M ${eq.magnitude.toFixed(1)} - ${eq.location}).`;
    } else {
      text += ' setelah gempa baru saja terjadi.';
    }

    if (customNote) {
      text += ` Keterangan: ${customNote}.`;
    }

    if (includeLoc && this.userCoords) {
      text += ` Lokasi saya saat ini: https://maps.google.com/?q=${this.userCoords.lat},${this.userCoords.lon}`;
    }

    previewEl.value = text;
  }

  sendSayaAmanWhatsApp() {
    this.updateSayaAmanPreview();
    const msg = document.getElementById('saya-aman-msg-preview')?.value || '';
    const phoneInput = document.getElementById('saya-aman-phone')?.value || '';
    let cleanPhone = phoneInput.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    this.closeSayaAmanModal();
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  sendSayaAmanSMS() {
    this.updateSayaAmanPreview();
    const msg = document.getElementById('saya-aman-msg-preview')?.value || '';
    const phoneInput = document.getElementById('saya-aman-phone')?.value || '';
    const cleanPhone = phoneInput.replace(/[^0-9+]/g, '');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delimiter = isIOS ? '&' : '?';
    const smsUrl = cleanPhone
      ? `sms:${cleanPhone}${delimiter}body=${encodeURIComponent(msg)}`
      : `sms:${delimiter}body=${encodeURIComponent(msg)}`;

    this.closeSayaAmanModal();
    window.location.href = smsUrl;
  }

  initChecklistState() {
    const saved = localStorage.getItem('siagagempa_checklist');
    if (!saved) return;
    try {
      const checkedIds = JSON.parse(saved);
      if (Array.isArray(checkedIds)) {
        document.addEventListener('DOMContentLoaded', () => {
          checkedIds.forEach(id => {
            const cb = document.getElementById(id);
            if (cb) cb.checked = true;
          });
          this.updateChecklistProgress();
        });
      }
    } catch (e) {}
  }

  toggleChecklistItem(checkboxEl) {
    const checkboxes = document.querySelectorAll('.checklist-item-cb');
    const checkedIds = [];
    checkboxes.forEach(cb => {
      if (cb.checked) checkedIds.push(cb.id);
    });
    localStorage.setItem('siagagempa_checklist', JSON.stringify(checkedIds));
    this.updateChecklistProgress();
  }

  updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.checklist-item-cb');
    if (checkboxes.length === 0) return;
    let checkedCount = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) checkedCount++;
    });

    const percent = Math.round((checkedCount / checkboxes.length) * 100);
    const bar = document.getElementById('checklist-progress-bar');
    const text = document.getElementById('checklist-progress-text');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${checkedCount} dari ${checkboxes.length} perlengkapan siap (${percent}%)`;
  }
}

window.evacuationService = new EvacuationService();

document.addEventListener('DOMContentLoaded', () => {
  window.evacuationService.loadSheltersFromApi();
});
