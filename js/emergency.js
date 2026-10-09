class EmergencyService {
  constructor() {
    this.userCoords = null;
    this.evacDestination = {
      name: 'Lapangan Blang Padang (Titik Kumpul Utama Evakuasi Tsunami Banda Aceh)',
      lat: 5.5526,
      lon: 95.3175
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateHeroContactCount());
    } else {
      setTimeout(() => this.updateHeroContactCount(), 0);
    }
  }

  startLocationTracking() {
    if (!('geolocation' in navigator)) {
      alert('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        const permBtn = document.getElementById('btn-perm-loc');
        if (permBtn) {
          permBtn.textContent = '✓ GPS Aktif';
          permBtn.classList.add('granted');
        }

        window.systemManager?.updatePermissionStatuses();

        window.notificationManager?.showNormalToast(
          'Lokasi GPS Aktif',
          `Koordinat Anda: ${this.userCoords.lat.toFixed(4)}, ${this.userCoords.lon.toFixed(4)}. Integrasi Google Maps siap digunakan.`,
          0
        );
      },
      (err) => {
        let msg = 'Gagal mengambil lokasi GPS: ' + err.message;
        if (err.code === 1) {
          msg = 'Izin lokasi (GPS) ditolak browser. Ketuk ikon gembok di bilah alamat browser HP Anda untuk mengizinkan akses lokasi.';
        } else if (err.code === 2) {
          msg = 'Sinyal GPS tidak ditemukan. Pastikan fitur Lokasi di pengaturan HP Anda sudah dinyalakan.';
        } else if (err.code === 3) {
          msg = 'Waktu permintaan GPS habis. Pastikan HP berada di area terbuka.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  openNearestEvacGoogleMaps() {
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${this.evacDestination.lat},${this.evacDestination.lon}+(${encodeURIComponent(this.evacDestination.name)})`;
    if (this.userCoords) {
      mapsUrl += `&origin=${this.userCoords.lat},${this.userCoords.lon}`;
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }

  async pickOrSetupContacts() {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const picked = await navigator.contacts.select(props, { multiple: false });
        if (picked && picked.length > 0) {
          const c = picked[0];
          const name = c.name ? c.name[0] : 'Kontak Darurat';
          const tel = c.tel ? c.tel[0] : '';
          if (tel) {
            const contactsKey = 'siagagempa_contacts';
            let savedContacts = this._getContacts();
            savedContacts.push({ name, phone: tel });
            localStorage.setItem(contactsKey, JSON.stringify(savedContacts));

            this.updateHeroContactCount();
            this._renderAddContactList();
            window.systemManager?.updatePermissionStatuses();

            window.notificationManager?.showNormalToast(
              'Kontak Terhubung',
              `Kontak darurat berhasil dihubungkan: ${name} (${tel})`,
              0
            );
            return;
          }
        }
      } catch (ex) {}
    }

    this.openAddContactModal();
  }

  downloadEmergencyVCard() {
    const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Panggilan Darurat Nasional
TEL;TYPE=VOICE,PREF:112
NOTE:Layanan Panggilan Darurat Nasional Terpadu Indonesia (Bebas Pulsa)
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:BPBD Aceh Darurat Bencana
TEL;TYPE=VOICE:117
NOTE:Pusat Pengendalian Operasi BPBD Provinsi Aceh
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:BMKG Call Center Gempa
TEL;TYPE=VOICE:196
NOTE:Pusat Peringatan Dini Gempa Bumi & Tsunami BMKG
END:VCARD`;

    const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Kontak-Darurat-Bencana-Aceh.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.notificationManager?.showNormalToast(
      'Kontak Darurat Tersedia',
      'File kontak darurat (112, 117 BPBD, 196 BMKG) telah diunduh.',
      0
    );
  }

  openSOSFlow() {
    const contacts = this._getContacts();
    this._renderSOSModal(contacts);
    this._showSOSModal();

    if (contacts.length === 1) {
      this._openComposeStep(contacts[0]);
    }
  }

  _getContacts() {
    let contacts = [];
    try {
      contacts = JSON.parse(localStorage.getItem('siagagempa_contacts') || '[]');
    } catch (e) {}

    if (contacts.length === 0) {
      const name = localStorage.getItem('siagagempa_contact_name');
      const phone = localStorage.getItem('siagagempa_contact_phone');
      if (phone) contacts = [{ name: name || 'Keluarga', phone }];
    }

    return contacts;
  }

  _renderSOSModal(contacts) {
    const listEl = document.getElementById('sos-contacts-list');
    const noContactEl = document.getElementById('sos-no-contact');
    if (!listEl || !noContactEl) return;

    if (contacts.length === 0) {
      listEl.style.display = 'none';
      noContactEl.style.display = 'block';
      return;
    }

    noContactEl.style.display = 'none';
    listEl.style.display = 'flex';
    listEl.innerHTML = contacts.map((c) => `
      <button class="sos-contact-card" onclick="window.emergencyService?._openComposeStep(${JSON.stringify(c).replace(/"/g, '&quot;')})">
        <span class="sos-contact-avatar">${(c.name || '?')[0].toUpperCase()}</span>
        <span class="sos-contact-info">
          <strong>${c.name || 'Kontak Darurat'}</strong>
          <small>${c.phone}</small>
        </span>
        <span class="sos-contact-arrow">→</span>
      </button>
    `).join('');
  }

  _showSOSModal() {
    const modal = document.getElementById('sos-contact-modal');
    if (modal) modal.classList.add('active');
    this._showStep('pick');
  }

  closeSOSModal() {
    const modal = document.getElementById('sos-contact-modal');
    if (modal) modal.classList.remove('active');
    this._currentContact = null;
  }

  _showStep(step) {
    const pickEl = document.getElementById('sos-step-pick');
    const composeEl = document.getElementById('sos-step-compose');
    if (pickEl) pickEl.style.display = step === 'pick' ? 'block' : 'none';
    if (composeEl) composeEl.style.display = step === 'compose' ? 'block' : 'none';
  }

  async _openComposeStep(contact) {
    this._currentContact = contact;

    const toLabel = document.getElementById('sos-compose-to-label');
    if (toLabel) toLabel.textContent = `Kepada: ${contact.name || 'Kontak Darurat'} (${contact.phone})`;

    const textarea = document.getElementById('sos-message-body');
    if (textarea) textarea.value = '';

    const locTextEl = document.getElementById('sos-loc-text');
    if (locTextEl) locTextEl.textContent = 'Sedang mengambil lokasi GPS...';

    this._showStep('compose');

    if (!this.userCoords) {
      await this._getLocationAsync();
    }

    if (locTextEl) {
      if (this.userCoords) {
        const link = `https://maps.google.com/?q=${this.userCoords.lat},${this.userCoords.lon}`;
        locTextEl.innerHTML = `Lokasi saya: <a href="${link}" target="_blank" rel="noopener" style="color:#0d9488;text-decoration:underline;">${link}</a>`;
      } else {
        locTextEl.textContent = 'Lokasi GPS tidak tersedia (tambahkan manual jika perlu).';
      }
    }
  }

  goBackToContactPick() {
    this._showStep('pick');
  }

  _buildCurrentSOSMessage() {
    const textarea = document.getElementById('sos-message-body');
    const userNote = (textarea ? textarea.value.trim() : '');

    const locLink = this.userCoords
      ? `https://maps.google.com/?q=${this.userCoords.lat},${this.userCoords.lon}`
      : null;

    const locText = locLink
      ? `Lokasi GPS saya: ${locLink}`
      : 'Lokasi GPS: (Belum aktif/tidak terdeteksi)';

    if (userNote) {
      return `🆘 DARURAT GEMPA! ${userNote}\n${locText}`;
    }
    return `🆘 DARURAT! Tolong bantu saya, terjadi gempa bumi!\n${locText}`;
  }

  confirmSendSMS() {
    const contact = this._currentContact;
    if (!contact) {
      alert('Silakan pilih kontak tujuan terlebih dahulu.');
      return;
    }

    const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');
    const msg = this._buildCurrentSOSMessage();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const delimiter = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${delimiter}body=${encodeURIComponent(msg)}`;

    this.closeSOSModal();

    const link = document.createElement('a');
    link.href = smsUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      try { window.location.href = smsUrl; } catch (e) {}
    }, 300);
  }

  confirmSendWhatsApp() {
    const contact = this._currentContact;
    if (!contact) return;

    let cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const msg = this._buildCurrentSOSMessage();
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

    this.closeSOSModal();
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  callCurrentContact() {
    const contact = this._currentContact;
    if (!contact) return;

    const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');
    this.closeSOSModal();
    window.location.href = `tel:${cleanPhone}`;
  }

  _getLocationAsync() {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) { resolve(); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  async sendSOSMessage() {
    this.openSOSFlow();
  }

  openAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    if (!modal) return;

    const pickerSection = document.getElementById('contact-picker-section');
    if (pickerSection) {
      pickerSection.style.display = ('contacts' in navigator && 'ContactsManager' in window)
        ? 'block' : 'none';
    }

    const nameInput = document.getElementById('new-contact-name');
    const phoneInput = document.getElementById('new-contact-phone');
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    this._renderAddContactList();
    modal.classList.add('active');
  }

  closeAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    if (modal) modal.classList.remove('active');
  }

  _renderAddContactList() {
    const listEl = document.getElementById('add-contact-saved-list');
    if (!listEl) return;

    const contacts = this._getContacts();

    if (contacts.length === 0) {
      listEl.innerHTML = `<div class="no-contacts-msg">⚠️ Belum ada kontak SOS tersimpan.</div>`;
      return;
    }

    listEl.innerHTML = contacts.map((c, idx) => `
      <div class="saved-contact-row">
        <div class="saved-contact-avatar">${(c.name || '?')[0].toUpperCase()}</div>
        <div class="saved-contact-info">
          <strong>${c.name || 'Kontak Darurat'}</strong>
          <small>${c.phone}</small>
        </div>
        <button class="btn-delete-contact" title="Hapus kontak ini"
          onclick="window.emergencyService?.deleteContact(${idx})">🗑️</button>
      </div>
    `).join('');
  }

  addPresetContact(name, phone) {
    const contactsKey = 'siagagempa_contacts';
    let savedContacts = this._getContacts();

    if (savedContacts.some(c => c.phone === phone)) {
      alert(`Nomor kontak ${name} (${phone}) sudah ada di daftar SOS Anda.`);
      return;
    }

    savedContacts.push({ name, phone });
    localStorage.setItem(contactsKey, JSON.stringify(savedContacts));

    this._renderAddContactList();
    this.updateHeroContactCount();

    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(savedContacts);
    }

    window.notificationManager?.showNormalToast(
      'Kontak Resmi Ditambahkan',
      `${name} (${phone}) siap digunakan untuk SMS SOS darurat.`,
      0
    );
  }

  saveNewContactFromModal() {
    const nameInput = document.getElementById('new-contact-name');
    const phoneInput = document.getElementById('new-contact-phone');

    const name = (nameInput?.value || '').trim();
    let phone = (phoneInput?.value || '').trim().replace(/[^0-9+]/g, '');

    if (!phone) {
      alert('Masukkan nomor telepon terlebih dahulu!');
      phoneInput?.focus();
      return;
    }

    const contactsKey = 'siagagempa_contacts';
    let savedContacts = this._getContacts();

    if (savedContacts.some(c => c.phone.replace(/[^0-9+]/g, '') === phone)) {
      alert('Nomor ini sudah ada di daftar kontak SOS.');
      return;
    }

    savedContacts.push({ name: name || 'Kontak Darurat', phone });
    localStorage.setItem(contactsKey, JSON.stringify(savedContacts));

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    this._renderAddContactList();
    this.updateHeroContactCount();

    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(savedContacts);
    }

    window.notificationManager?.showNormalToast(
      'Kontak Tersimpan',
      `${name || 'Kontak Darurat'} (${phone}) berhasil ditambahkan ke daftar SOS.`,
      0
    );
  }

  deleteContact(index) {
    let contacts = this._getContacts();
    const removed = contacts.splice(index, 1);
    localStorage.setItem('siagagempa_contacts', JSON.stringify(contacts));

    this._renderAddContactList();
    this.updateHeroContactCount();

    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(contacts);
    }

    if (removed.length > 0) {
      window.notificationManager?.showNormalToast(
        'Kontak Dihapus',
        `${removed[0].name} berhasil dihapus dari daftar SOS.`,
        0
      );
    }
  }

  updateHeroContactCount() {
    const countEl = document.getElementById('hero-contact-count');
    const n = this._getContacts().length;
    if (countEl) {
      countEl.textContent = n === 0
        ? '0 kontak tersimpan'
        : `${n} kontak tersimpan`;
    }
    window.systemManager?.updatePermissionStatuses();
  }
}

window.emergencyService = new EmergencyService();
