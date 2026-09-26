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
        const contacts = await navigator.contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const c = contacts[0];
          const name = c.name ? c.name[0] : 'Kontak Darurat';
          const tel = c.tel ? c.tel[0] : '';
          localStorage.setItem('siagagempa_contact_name', name);
          localStorage.setItem('siagagempa_contact_phone', tel);

          const permBtn = document.getElementById('btn-perm-contacts');
          if (permBtn) {
            permBtn.textContent = `✓ ${name}`;
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
}

window.emergencyService = new EmergencyService();
