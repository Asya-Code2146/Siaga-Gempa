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

        window.notificationManager?.showNormalToast(
          'Lokasi GPS Aktif',
          `Koordinat Anda: ${this.userCoords.lat.toFixed(4)}, ${this.userCoords.lon.toFixed(4)}. Integrasi Google Maps siap digunakan.`,
          0
        );
      },
      (err) => {
        console.warn('GPS error:', err.message);
        alert('Gagal mengambil lokasi GPS: ' + err.message + '. Pastikan izin lokasi browser diaktifkan.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
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
   * atau menyediakan input penyimpanan kontak darurat keluarga.
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
          // Store contacts in multi-contact array
          const contactsKey = 'siagagempa_contacts';
          let savedContacts = [];
          try {
            savedContacts = JSON.parse(localStorage.getItem(contactsKey) || '[]');
          } catch (e) {}
          savedContacts.push({ name, phone: tel });
          localStorage.setItem(contactsKey, JSON.stringify(savedContacts));
          const permBtn = document.getElementById('btn-perm-contacts');
          if (permBtn) {
            permBtn.textContent = `✓ ${savedContacts.length} kontak`;
            permBtn.classList.add('granted');
          }

          alert(`✅ Kontak darurat berhasil dihubungkan:\n${name} (${tel})`);
          return;
        }
      } catch (ex) {
        console.warn('Contact picker dibatalkan atau tidak didukung:', ex);
      }
    }

    // Fallback: Dialog input kontak darurat keluarga
    const curName = localStorage.getItem('siagagempa_contact_name') || '';
    const curPhone = localStorage.getItem('siagagempa_contact_phone') || '';
    const newPhone = prompt('Masukkan Nomor Telepon Kontak Darurat Keluarga Anda (misal: 081234567890):', curPhone);
    
    if (newPhone) {
      const newName = prompt('Nama Kerabat / Kontak Darurat:', curName || 'Keluarga');
      localStorage.setItem('siagagempa_contact_name', newName || 'Keluarga');
      localStorage.setItem('siagagempa_contact_phone', newPhone);

      const permBtn = document.getElementById('btn-perm-contacts');
      if (permBtn) {
        permBtn.textContent = `✓ ${newName || 'Tersimpan'}`;
        permBtn.classList.add('granted');
      }

      alert(`✅ Nomor kontak darurat ${newName} (${newPhone}) tersimpan aman di aplikasi!`);
    }
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
   * Konfirmasi kirim SMS: susun pesan dari textarea + lokasi, buka SMS app.
   */
  confirmSendSMS() {
    const contact = this._currentContact;
    if (!contact) return;

    const textarea = document.getElementById('sos-message-body');
    const userNote = (textarea ? textarea.value.trim() : '');

    const locLink = this.userCoords
      ? `https://maps.google.com/?q=${this.userCoords.lat},${this.userCoords.lon}`
      : null;

    const locText = locLink
      ? `Lokasi saya: ${locLink}`
      : 'Lokasi GPS tidak tersedia.';

    // Susun pesan: keterangan user (jika ada) + lokasi GPS
    let msg = `🆘 DARURAT! Tolong bantu saya!\n${locText}`;
    if (userNote) {
      msg = `🆘 DARURAT! ${userNote}\n${locText}`;
    }

    const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(msg)}`;
    this.closeSOSModal();
    window.open(smsUrl, '_self');
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
}


window.emergencyService = new EmergencyService();

