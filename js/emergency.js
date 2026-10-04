/**
 * Siaga Gempa - Emergency Service, Geolocation & Contacts Manager
 */

class EmergencyService {
  constructor() {
    this.userCoords = null;
    this.evacDestination = {
      name: 'Lapangan Blang Padang (Titik Kumpul Utama Evakuasi Tsunami Banda Aceh)',
      lat: 5.5526,
      lon: 95.3175
    };

    // Update count di hero button saat service ready
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
        console.log('✅ Lokasi GPS pengguna berhasil didapatkan:', this.userCoords);
        
        // Update button permission state
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
        console.warn('GPS error:', err.message);
        let msg = 'Gagal mengambil lokasi GPS: ' + err.message;
        if (err.code === 1) { // PERMISSION_DENIED
          msg = 'Izin lokasi (GPS) ditolak browser. Ketuk ikon gembok / pengaturan situs di bilah alamat browser HP Anda untuk mengizinkan akses lokasi.';
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          msg = 'Sinyal GPS tidak ditemukan. Pastikan fitur Lokasi / GPS di pengaturan HP Anda sudah dinyalakan.';
        } else if (err.code === 3) { // TIMEOUT
          msg = 'Waktu permintaan GPS habis. Coba pastikan HP berada di area terbuka.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  /**
   * Buka Navigasi Rute Evakuasi ke Google Maps
   */
  openNearestEvacGoogleMaps() {
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${this.evacDestination.lat},${this.evacDestination.lon}+(${encodeURIComponent(this.evacDestination.name)})`;
    if (this.userCoords) {
      mapsUrl += `&origin=${this.userCoords.lat},${this.userCoords.lon}`;
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Akses Kontak Darurat:
   * Menggunakan Contact Picker API modern (navigator.contacts.select) jika didukung,
   * atau langsung membuka modal formulir tambah kontak darurat.
   */
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
              `✅ Kontak darurat berhasil dihubungkan: ${name} (${tel})`,
              0
            );
            return;
          }
        }
      } catch (ex) {
        console.warn('Contact picker dibatalkan atau tidak didukung:', ex);
      }
    }

    // Fallback ramah: Langsung buka modal formulir Tambah Kontak (tanpa browser prompt)
    this.openAddContactModal();
  }

  /**
   * Unduh file vCard (.vcf) resmi untuk nomor tanggap darurat Aceh
   * Sehingga pengguna bisa langsung menyimpan 112, 117, BMKG ke kontak HP dengan sekali tap!
   */
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
      'File kontak darurat (112, 117 BPBD, 196 BMKG) telah diunduh. Ketuk file untuk menyimpannya ke buku telepon ponsel Anda.',
      0
    );
  }
  /**
   * Buka alur SOS: selalu tampilkan modal pilih kontak dulu (step 1).
   * Jika hanya 1 kontak, langsung lanjut ke step compose.
   */
  openSOSFlow() {
    const contacts = this._getContacts();

    this._renderSOSModal(contacts);
    this._showSOSModal();

    if (contacts.length === 1) {
      // Hanya 1 kontak → langsung lanjut ke step compose
      this._openComposeStep(contacts[0]);
    }
  }

  /** Ambil semua kontak dari localStorage (support format lama & baru) */
  _getContacts() {
    let contacts = [];
    try {
      contacts = JSON.parse(localStorage.getItem('siagagempa_contacts') || '[]');
    } catch (e) {}

    // Fallback: format lama (nama + nomor terpisah)
    if (contacts.length === 0) {
      const name = localStorage.getItem('siagagempa_contact_name');
      const phone = localStorage.getItem('siagagempa_contact_phone');
      if (phone) contacts = [{ name: name || 'Keluarga', phone }];
    }

    return contacts;
  }

  /** Render daftar kontak ke dalam modal step 1 */
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

  /** Tampilkan modal SOS */
  _showSOSModal() {
    const modal = document.getElementById('sos-contact-modal');
    if (modal) modal.classList.add('active');
    // Selalu mulai di step 1
    this._showStep('pick');
  }

  /** Tutup modal SOS */
  closeSOSModal() {
    const modal = document.getElementById('sos-contact-modal');
    if (modal) modal.classList.remove('active');
    this._currentContact = null;
  }

  /** Ganti step yang ditampilkan: 'pick' | 'compose' */
  _showStep(step) {
    const pickEl = document.getElementById('sos-step-pick');
    const composeEl = document.getElementById('sos-step-compose');
    if (pickEl) pickEl.style.display = step === 'pick' ? 'block' : 'none';
    if (composeEl) composeEl.style.display = step === 'compose' ? 'block' : 'none';
  }

  /**
   * Buka step 2 compose pesan untuk kontak tertentu.
   * Lokasi GPS diambil secara async dan langsung terisi di preview.
   */
  async _openComposeStep(contact) {
    this._currentContact = contact;

    // Update label tujuan
    const toLabel = document.getElementById('sos-compose-to-label');
    if (toLabel) toLabel.textContent = `Kepada: ${contact.name || 'Kontak Darurat'} (${contact.phone})`;

    // Reset textarea
    const textarea = document.getElementById('sos-message-body');
    if (textarea) textarea.value = '';

    // Update preview lokasi → "sedang mengambil"
    const locTextEl = document.getElementById('sos-loc-text');
    if (locTextEl) locTextEl.textContent = 'Sedang mengambil lokasi GPS...';

    // Pindah ke step compose
    this._showStep('compose');

    // Ambil lokasi secara async (tidak blokir UI)
    if (!this.userCoords) {
      await this._getLocationAsync();
    }

    // Isi preview lokasi
    if (locTextEl) {
      if (this.userCoords) {
        const link = `https://maps.google.com/?q=${this.userCoords.lat},${this.userCoords.lon}`;
        locTextEl.innerHTML = `Lokasi saya: <a href="${link}" target="_blank" rel="noopener" style="color:#0d9488;text-decoration:underline;">${link}</a>`;
      } else {
        locTextEl.textContent = 'Lokasi GPS tidak tersedia (tambahkan manual jika perlu).';
      }
    }
  }

  /** Kembali ke step pilih kontak */
  goBackToContactPick() {
    this._showStep('pick');
  }

  /**
   * Susun teks pesan darurat lengkap dengan tautan koordinat Google Maps
   */
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

  /**
   * Konfirmasi kirim SMS: susun pesan dari textarea + lokasi, buka aplikasi SMS ponsel
   */
  confirmSendSMS() {
    const contact = this._currentContact;
    if (!contact) {
      alert('Silakan pilih kontak tujuan terlebih dahulu.');
      return;
    }

    const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');
    const msg = this._buildCurrentSOSMessage();

    // Deteksi iOS (iPhone / iPad) vs Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const delimiter = isIOS ? '&' : '?';
    const smsUrl = `sms:${cleanPhone}${delimiter}body=${encodeURIComponent(msg)}`;

    this.closeSOSModal();

    // Trigger menggunakan click link buatan (paling andal di semua browser HP)
    const link = document.createElement('a');
    link.href = smsUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      // Fallback jika belum terbuka
      try { window.location.href = smsUrl; } catch (e) {}
    }, 300);
  }

  /**
   * Kirim pesan darurat via WhatsApp (sangat andal di Indonesia & gratis kuota internet)
   */
  confirmSendWhatsApp() {
    const contact = this._currentContact;
    if (!contact) return;

    let cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
    // Konversi nomor lokal 08xxx ke format internasional 628xxx
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const msg = this._buildCurrentSOSMessage();
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

    this.closeSOSModal();
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Panggil Telepon Langsung (khusus untuk nomor darurat seperti 112, 117, 196, atau keluarga)
   */
  callCurrentContact() {
    const contact = this._currentContact;
    if (!contact) return;

    const cleanPhone = (contact.phone || '').replace(/[^0-9+]/g, '');
    this.closeSOSModal();
    window.location.href = `tel:${cleanPhone}`;
  }

  /** Ambil lokasi GPS secara async (Promise) */
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

  /**
   * @deprecated Gunakan openSOSFlow() sebagai gantinya.
   * Dipertahankan agar tombol lama di modal izin tetap berfungsi.
   */
  async sendSOSMessage() {
    this.openSOSFlow();
  }

  /** =====================================================
   *  FITUR KELOLA KONTAK SOS (Modal Tambah Kontak)
   *  ===================================================== */

  /** Buka modal kelola kontak dari hero section */
  openAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    if (!modal) return;

    // Tampilkan opsi Contact Picker API jika tersedia
    const pickerSection = document.getElementById('contact-picker-section');
    if (pickerSection) {
      pickerSection.style.display = ('contacts' in navigator && 'ContactsManager' in window)
        ? 'block' : 'none';
    }

    // Kosongkan input
    const nameInput = document.getElementById('new-contact-name');
    const phoneInput = document.getElementById('new-contact-phone');
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    this._renderAddContactList();
    modal.classList.add('active');
  }

  /** Tutup modal kelola kontak */
  closeAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    if (modal) modal.classList.remove('active');
  }

  /** Render daftar kontak tersimpan di modal kelola kontak */
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

  /**
   * Tambahkan preset kontak resmi darurat bencana (BPBD 117, 112, BMKG 196)
   */
  addPresetContact(name, phone) {
    const contactsKey = 'siagagempa_contacts';
    let savedContacts = this._getContacts();

    // Cek jika nomor sudah tersimpan
    if (savedContacts.some(c => c.phone === phone)) {
      alert(`⚠️ Nomor kontak ${name} (${phone}) sudah ada di daftar SOS Anda.`);
      return;
    }

    savedContacts.push({ name, phone });
    localStorage.setItem(contactsKey, JSON.stringify(savedContacts));

    this._renderAddContactList();
    this.updateHeroContactCount();

    // Sinkronkan juga ke modal SOS jika sedang aktif
    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(savedContacts);
    }

    window.notificationManager?.showNormalToast(
      'Kontak Resmi Ditambahkan',
      `✅ ${name} (${phone}) siap digunakan untuk SMS SOS darurat.`,
      0
    );
  }

  /** Simpan kontak baru dari form di modal */
  saveNewContactFromModal() {
    const nameInput = document.getElementById('new-contact-name');
    const phoneInput = document.getElementById('new-contact-phone');

    const name = (nameInput?.value || '').trim();
    let phone = (phoneInput?.value || '').trim().replace(/[^0-9+]/g, '');

    if (!phone) {
      alert('⚠️ Masukkan nomor telepon terlebih dahulu!');
      phoneInput?.focus();
      return;
    }

    const contactsKey = 'siagagempa_contacts';
    let savedContacts = this._getContacts();

    // Cek duplikat nomor
    if (savedContacts.some(c => c.phone.replace(/[^0-9+]/g, '') === phone)) {
      alert('⚠️ Nomor ini sudah ada di daftar kontak SOS.');
      return;
    }

    savedContacts.push({ name: name || 'Kontak Darurat', phone });
    localStorage.setItem(contactsKey, JSON.stringify(savedContacts));

    // Kosongkan input
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';

    this._renderAddContactList();
    this.updateHeroContactCount();

    // Sinkronkan juga ke modal SOS jika sedang aktif
    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(savedContacts);
    }

    window.notificationManager?.showNormalToast(
      'Kontak Tersimpan',
      `✅ ${name || 'Kontak Darurat'} (${phone}) berhasil ditambahkan ke daftar SOS.`,
      0
    );
  }

  /** Hapus kontak berdasarkan index */
  deleteContact(index) {
    let contacts = this._getContacts();
    const removed = contacts.splice(index, 1);
    localStorage.setItem('siagagempa_contacts', JSON.stringify(contacts));

    this._renderAddContactList();
    this.updateHeroContactCount();

    // Sinkronkan juga ke modal SOS jika sedang aktif
    const sosModal = document.getElementById('sos-contact-modal');
    if (sosModal && sosModal.classList.contains('active')) {
      this._renderSOSModal(contacts);
    }

    if (removed.length > 0) {
      window.notificationManager?.showNormalToast(
        'Kontak Dihapus',
        `🗑️ ${removed[0].name} berhasil dihapus dari daftar SOS.`,
        0
      );
    }
  }

  /** Perbarui label jumlah kontak di hero section */
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

