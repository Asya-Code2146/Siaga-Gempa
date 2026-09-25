class EmergencyService {
  constructor() {
    this.userCoords = null;
    this.isTrackingLocation = false;
    this.watchId = null;
    this.contactsKey = 'siagagempa_contacts';
    this.checklistKey = 'siagagempa_gobag_checklist';
    this.onLocationChangeCallbacks = [];
  }

  onLocationChange(cb) {
    this.onLocationChangeCallbacks.push(cb);
  }

  startLocationTracking() {
    if (!('geolocation' in navigator)) {
      alert('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => this.handleLocationSuccess(pos),
      (err) => this.handleLocationError(err),
      options
    );

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleLocationSuccess(pos),
      (err) => console.warn('GPS Watch error:', err.message),
      options
    );
    this.isTrackingLocation = true;
  }

  handleLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    this.userCoords = { lat, lon, accuracy };

  
    window.mapService?.updateUserLocation(lat, lon, accuracy);

 
    this.onLocationChangeCallbacks.forEach(cb => cb(this.userCoords));

   
    const coordsEl = document.getElementById('user-coords-text');
    if (coordsEl) {
      coordsEl.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)} (±${Math.round(accuracy)}m)`;
    }

    this.recalculateDistanceToEpicenter();
  }

  handleLocationError(error) {
    let msg = 'Gagal mengakses GPS: ';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        msg += 'Izin lokasi ditolak oleh pengguna.';
        break;
      case error.POSITION_UNAVAILABLE:
        msg += 'Informasi lokasi tidak tersedia saat ini.';
        break;
      case error.TIMEOUT:
        msg += 'Permintaan lokasi melebihi batas waktu.';
        break;
      default:
        msg += error.message;
    }
    alert(msg);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  recalculateDistanceToEpicenter() {
    const latest = window.earthquakeService?.latestEarthquake;
    if (!this.userCoords || !latest) return;

    const dist = this.calculateDistance(
      this.userCoords.lat,
      this.userCoords.lon,
      latest.latitude,
      latest.longitude
    );

    const distEl = document.getElementById('user-dist-text');
    if (distEl) {
      distEl.textContent = `${dist.toFixed(1)} km`;
    }

    const distStatusEl = document.getElementById('user-dist-status');
    if (distStatusEl) {
      if (dist < 50) {
        distStatusEl.innerHTML = `<span style="color:#ef4444; font-weight:800;">⚠️ ZONA KRITIS (&lt; 50 km)!</span>`;
      } else if (dist < 150) {
        distStatusEl.innerHTML = `<span style="color:#f59e0b; font-weight:700;">🟡 Radius Sedang (&lt; 150 km)</span>`;
      } else {
        distStatusEl.innerHTML = `<span style="color:#10b981;">🟢 Radius Aman (&gt; 150 km)</span>`;
      }
    }
  }


  async shareMyLocation() {
    if (!this.userCoords) {
      alert('Sedang mendeteksi lokasi GPS Anda... Silakan coba sebentar lagi atau klik "Aktifkan GPS".');
      this.startLocationTracking();
      return;
    }

    const lat = this.userCoords.lat;
    const lon = this.userCoords.lon;
    const gmapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    const timeNow = new Date().toLocaleString('id-ID');

    const shareData = {
      title: 'SOS SiagaGempa - Lokasi Terkini Saya',
      text: `[SIAGA DARURAT GEMPA] Saya berada di koordinat ${lat.toFixed(5)}, ${lon.toFixed(5)} pada ${timeNow}. Buka lokasi saya di peta:`,
      url: gmapsUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
    
      const waText = encodeURIComponent(`${shareData.text} ${shareData.url}`);
      const waUrl = `https://api.whatsapp.com/send?text=${waText}`;
      
      const copySuccess = await this.copyToClipboard(`${shareData.text} ${shareData.url}`);
      if (copySuccess) {
        const openWa = confirm('Tautan koordinat Google Maps Anda berhasil disalin ke Clipboard!\n\nIngin membukanya langsung di WhatsApp sekarang?');
        if (openWa) {
          window.open(waUrl, '_blank');
        }
      }
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      prompt('Salin pesan koordinat darurat Anda:', text);
      return false;
    }
  }

  
  dispatchEmergencySMS() {
    const contacts = this.getContacts();
    if (contacts.length === 0) {
      alert('Peringatan: Belum ada kontak darurat yang didaftarkan!\nSilakan masukkan nomor telepon keluarga/kerabat Anda di menu "Kontak Darurat".');
      window.app?.navigateToTab('emergency');
      return;
    }

    const eq = window.earthquakeService?.latestEarthquake;
    let locStr = 'Lokasi GPS belum terdeteksi';
    let gmapsUrl = '';

    if (this.userCoords) {
      const { lat, lon } = this.userCoords;
      locStr = `Koordinat: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      gmapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    }

    const userName = localStorage.getItem('siagagempa_username') || 'Saya';
    const timeStr = new Date().toLocaleTimeString('id-ID');

   
    let sosMessage = `[DARURAT GEMPA] ${userName} memerlukan pertolongan segera! Waktu: ${timeStr}.`;
    if (eq) {
      sosMessage += ` Terdeteksi gempa M ${eq.magnitude} (${eq.location}).`;
    }
    if (gmapsUrl) {
      sosMessage += ` Posisi saya: ${gmapsUrl}`;
    } else {
      sosMessage += ` ${locStr}.`;
    }

    const phoneNumbers = contacts.map(c => c.phone).join(',');

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const bodySeparator = isIOS ? '&body=' : '?body=';
    const smsUri = `sms:${phoneNumbers}${bodySeparator}${encodeURIComponent(sosMessage)}`;

    window.location.href = smsUri;

    this.sendSmsViaBackend(contacts, sosMessage);
  }

  async sendSmsViaBackend(contacts, message) {
    if (!navigator.onLine) return;

    for (const c of contacts) {
      try {
        await fetch(`api/sms.php?phone=${encodeURIComponent(c.phone)}&message=${encodeURIComponent(message)}`);
      } catch (err) {
        console.warn('Gagal kirim via backend SMS API:', err);
      }
    }
  }

  /**
   * Manajemen Kontak Darurat (CRUD di LocalStorage)
   */
  getContacts() {
    try {
      const data = localStorage.getItem(this.contactsKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}

    // Default template kontak jika belum ada
    return [
      { id: 1, name: 'Orang Tua / Keluarga', phone: '081234567890', relation: 'Keluarga Inti' },
      { id: 2, name: 'Basarnas Indonesia', phone: '115', relation: 'Layanan SAR' }
    ];
  }

  saveContacts(contacts) {
    localStorage.setItem(this.contactsKey, JSON.stringify(contacts));
    this.renderContactsList();
  }

  addContact(name, phone, relation = 'Kerabat') {
    if (!name || !phone) return false;
    const contacts = this.getContacts();
    contacts.push({
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim()
    });
    this.saveContacts(contacts);
    return true;
  }

  deleteContact(id) {
    let contacts = this.getContacts();
    contacts = contacts.filter(c => c.id !== id);
    this.saveContacts(contacts);
  }

  renderContactsList() {
    const listEl = document.getElementById('saved-contacts-container');
    if (!listEl) return;

    const contacts = this.getContacts();
    if (contacts.length === 0) {
      listEl.innerHTML = `<li style="text-align:center; color:#94a3b8; padding:1rem;">Belum ada kontak tersimpan. Tambahkan nomor keluarga Anda.</li>`;
      return;
    }

    listEl.innerHTML = contacts.map(c => `
      <li class="contact-card-item">
        <div>
          <strong style="color:#ffffff;">${c.name}</strong> 
          <span style="font-size:0.75rem; color:#06b6d4; background:rgba(6,182,212,0.15); padding:2px 6px; border-radius:4px; margin-left:6px;">${c.relation}</span>
          <div style="font-size:0.85rem; color:#94a3b8; margin-top:2px;">📞 ${c.phone}</div>
        </div>
        <button class="btn-contact-action" onclick="window.emergencyService.deleteContact(${c.id})" title="Hapus kontak">
          🗑️
        </button>
      </li>
    `).join('');

    this.updateSmsPreview();
  }

  updateSmsPreview() {
    const previewEl = document.getElementById('sms-preview-content');
    if (!previewEl) return;

    const userName = localStorage.getItem('siagagempa_username') || 'Saya';
    const eq = window.earthquakeService?.latestEarthquake;
    let locStr = this.userCoords 
      ? `https://maps.google.com/?q=${this.userCoords.lat.toFixed(5)},${this.userCoords.lon.toFixed(5)}`
      : 'Koordinat GPS...';

    const msg = `[DARURAT GEMPA] ${userName} memerlukan bantuan! Waktu: ${new Date().toLocaleTimeString('id-ID')}. Gempa: ${eq ? `M ${eq.magnitude} (${eq.location})` : 'Besar'}. Posisi saya: ${locStr}`;
    previewEl.textContent = msg;
  }

  /**
   * Tas Siaga Bencana Checklist
   */
  getChecklistState() {
    try {
      return JSON.parse(localStorage.getItem(this.checklistKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  toggleChecklistItem(id) {
    const state = this.getChecklistState();
    state[id] = !state[id];
    localStorage.setItem(this.checklistKey, JSON.stringify(state));
    this.updateChecklistProgress();
  }

  updateChecklistProgress() {
    const state = this.getChecklistState();
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    let checkedCount = 0;

    checkboxes.forEach(cb => {
      const itemId = cb.getAttribute('data-id');
      cb.checked = !!state[itemId];
      if (cb.checked) checkedCount++;
    });

    const progEl = document.getElementById('gobag-progress-text');
    if (progEl && checkboxes.length > 0) {
      const pct = Math.round((checkedCount / checkboxes.length) * 100);
      progEl.textContent = `${checkedCount} / ${checkboxes.length} Barang (${pct}%) Siap`;
    }
  }
}

// Instance global
window.emergencyService = new EmergencyService();
