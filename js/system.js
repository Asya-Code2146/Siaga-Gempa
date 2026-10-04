/**
 * Siaga Gempa - System, PWA Installation & Permissions Onboarding Manager
 */

class SystemManager {
  constructor() {
    this.deferredPrompt = null;
    this.initPwaHandlers();
    this.initModalTriggers();
    this.checkInitialPermissions();
    this.checkFirstVisitPrompt();
  }

  isAppInstalled() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator.standalone === true;
    const isAndroidTwa = document.referrer.includes('android-app://');
    const isFlagged = localStorage.getItem('siagagempa_installed') === 'true';

    return isStandalone || isIosStandalone || isAndroidTwa || isFlagged;
  }

  updateInstallButtonsVisibility() {
    const installed = this.isAppInstalled();
    const installBtns = document.querySelectorAll('.btn-install-pwa');
    const installedBadges = document.querySelectorAll('.badge-app-installed');

    if (installed) {
      installBtns.forEach(btn => {
        btn.style.setProperty('display', 'none', 'important');
      });
      installedBadges.forEach(badge => {
        badge.style.setProperty('display', 'inline-flex', 'important');
      });
      console.log('📱 Siaga Gempa berjalan dalam mode aplikasi terpasang (PWA / Standalone). Tombol pasang disembunyikan.');
    } else {
      installBtns.forEach(btn => {
        btn.style.display = '';
      });
      installedBadges.forEach(badge => {
        badge.style.display = 'none';
      });
    }
  }

  initPwaHandlers() {
    this.updateInstallButtonsVisibility();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('✅ Browser native install prompt siap digunakan.');
      this.updateInstallButtonsVisibility();
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 Siaga Gempa berhasil dipasang sebagai aplikasi!');
      this.deferredPrompt = null;
      localStorage.setItem('siagagempa_installed', 'true');
      this.updateInstallButtonsVisibility();

      window.notificationManager?.showNormalToast(
        'Aplikasi Berhasil Dipasang',
        'Siaga Gempa telah terpasang di layar utama Anda. Ikon pasang aplikasi telah disembunyikan.',
        0
      );
    });

    const handleInstallClick = () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Pengguna menyetujui instalasi PWA.');
            localStorage.setItem('siagagempa_installed', 'true');
            this.updateInstallButtonsVisibility();
          }
          this.deferredPrompt = null;
        });
      } else {
        this.openInstallModal();
      }
    };

    document.getElementById('btn-header-install')?.addEventListener('click', handleInstallClick);
    document.getElementById('btn-hero-install')?.addEventListener('click', handleInstallClick);
  }

  initModalTriggers() {
    document.querySelectorAll('.custom-modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }

  openInstallModal() {
    const modal = document.getElementById('install-guide-modal');
    if (modal) {
      modal.classList.add('active');
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        this.switchInstallTab(/ipad/.test(ua) ? 'tablet' : 'iphone');
      } else if (/android/.test(ua)) {
        this.switchInstallTab('android');
      } else if (/macintosh|mac os x/.test(ua)) {
        this.switchInstallTab('macos');
      } else {
        this.switchInstallTab('pc');
      }
    }
  }

  closeInstallModal() {
    document.getElementById('install-guide-modal')?.classList.remove('active');
  }

  switchInstallTab(tabId) {
    document.querySelectorAll('.install-tabs-nav .tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.install-tab-pane').forEach(pane => {
      if (pane.id === `tab-pane-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  openPermissionModal() {
    this.updatePermissionStatuses();
    document.getElementById('permission-modal')?.classList.add('active');
  }

  closePermissionModal() {
    document.getElementById('permission-modal')?.classList.remove('active');
    localStorage.setItem('siagagempa_perm_prompted', 'true');
  }

  checkFirstVisitPrompt() {
    const prompted = localStorage.getItem('siagagempa_perm_prompted');
    if (!prompted) {
      setTimeout(() => {
        this.openPermissionModal();
      }, 1500);
    }
  }

  /**
   * Perbarui status semua tombol izin di Hero Section dan Modal Pengaturan
   */
  updatePermissionStatuses() {
    // 1. Cek Konteks Keamanan (HTTPS vs HTTP)
    const isHttps = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const httpWarn = document.getElementById('insecure-http-warning');
    if (httpWarn) {
      httpWarn.style.display = isHttps ? 'none' : 'block';
    }

    // 2. Status Izin Notifikasi
    const notifPill = document.getElementById('pill-perm-notif');
    const notifTxt = document.getElementById('txt-perm-notif');
    const notifBtn = document.getElementById('btn-perm-notif');

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        if (notifPill) { notifPill.className = 'perm-status-pill pill-success'; }
        if (notifTxt) { notifTxt.textContent = '✓ Aktif'; }
        if (notifBtn) {
          notifBtn.textContent = '✓ Diizinkan';
          notifBtn.classList.add('granted');
        }
      } else if (Notification.permission === 'denied') {
        if (notifPill) { notifPill.className = 'perm-status-pill pill-danger'; }
        if (notifTxt) { notifTxt.textContent = '❌ Ditolak'; }
        if (notifBtn) {
          notifBtn.textContent = '❌ Ditolak (Buka Setting)';
          notifBtn.classList.remove('granted');
        }
      } else {
        if (notifPill) { notifPill.className = 'perm-status-pill pill-warning'; }
        if (notifTxt) { notifTxt.textContent = 'Aktifkan'; }
        if (notifBtn) {
          notifBtn.textContent = 'Izinkan';
          notifBtn.classList.remove('granted');
        }
      }
    } else {
      if (notifPill) { notifPill.className = 'perm-status-pill pill-neutral'; }
      if (notifTxt) { notifTxt.textContent = 'Tidak Didukung'; }
    }

    // 3. Status Izin GPS Lokasi
    const locPill = document.getElementById('pill-perm-loc');
    const locTxt = document.getElementById('txt-perm-loc');
    const locBtn = document.getElementById('btn-perm-loc');

    if (window.emergencyService?.userCoords) {
      if (locPill) { locPill.className = 'perm-status-pill pill-success'; }
      if (locTxt) { locTxt.textContent = '✓ Aktif'; }
      if (locBtn) {
        locBtn.textContent = '✓ GPS Aktif';
        locBtn.classList.add('granted');
      }
    } else {
      if (locPill) { locPill.className = 'perm-status-pill pill-warning'; }
      if (locTxt) { locTxt.textContent = 'Aktifkan'; }
    }

    // 4. Status Kontak SOS
    const contactPill = document.getElementById('pill-perm-contact');
    const contactTxt = document.getElementById('txt-perm-contact');
    const contactBtn = document.getElementById('btn-perm-contacts');
    const contacts = window.emergencyService ? window.emergencyService._getContacts() : [];

    if (contacts.length > 0) {
      if (contactPill) { contactPill.className = 'perm-status-pill pill-success'; }
      if (contactTxt) { contactTxt.textContent = `✓ ${contacts.length} Kontak`; }
      if (contactBtn) {
        contactBtn.textContent = `✓ ${contacts.length} kontak`;
        contactBtn.classList.add('granted');
      }
    } else {
      if (contactPill) { contactPill.className = 'perm-status-pill pill-neutral'; }
      if (contactTxt) { contactTxt.textContent = '0 Kontak'; }
      if (contactBtn) {
        contactBtn.textContent = 'Atur Kontak';
        contactBtn.classList.remove('granted');
      }
    }
  }

  checkInitialPermissions() {
    this.updatePermissionStatuses();
  }

  async requestNotificationPermission() {
    // 1. Cek browser support
    if (!('Notification' in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('ℹ️ Pada iPhone/iPad (iOS):\nFitur notifikasi Web Push memerlukan aplikasi dipasang ke Layar Utama (Home Screen).\n\nLangkah: Ketuk ikon Bagikan (Share) di Safari -> "Tambahkan ke Layar Utama" (Add to Home Screen).');
      } else {
        alert('Browser ponsel Anda tidak mendukung fitur Notifikasi Web Push.');
      }
      return;
    }

    // 2. Cek jika sudah pernah ditolak
    if (Notification.permission === 'denied') {
      alert('⚠️ Izin notifikasi sebelumnya telah ditolak di browser HP Anda.\n\nCara mengaktifkan kembali:\n1. Ketuk ikon gembok / pengaturan situs di bilah alamat browser HP.\n2. Masuk ke "Izin" (Permissions) -> "Notifikasi".\n3. Pilih "Izinkan" (Allow), lalu segarkan halaman ini.');
      this.updatePermissionStatuses();
      return;
    }

    // 3. Minta izin ke browser
    const res = await window.notificationManager?.requestPermission();
    this.updatePermissionStatuses();

    if (res?.granted) {
      window.notificationManager?.showNormalToast(
        'Notifikasi Berhasil Diaktifkan',
        'Ponsel Anda kini siap menerima notifikasi peringatan gempa & potensi tsunami secara otomatis!',
        0
      );
      // Kirim contoh notifikasi browser sistem
      window.notificationManager?.sendBrowserNotification('🔔 Siaga Gempa Aktif', {
        body: 'Sistem peringatan dini gempa bumi & tsunami aktif di ponsel Anda.',
        vibrate: [300, 100, 300]
      });
    } else {
      alert('Izin notifikasi belum diberikan. Anda dapat mengaktifkannya kapan saja untuk mendapatkan peringatan dini.');
    }
  }

  /**
   * Uji coba simulasi bunyi alarm & notifikasi gempa agar pengguna yakin HP-nya berfungsi
   */
  testEarthquakeNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      alert('⚠️ Izin notifikasi belum aktif di HP Anda. Silakan ketuk tombol "Aktifkan" pada Notifikasi terlebih dahulu.');
      this.requestNotificationPermission();
      return;
    }

    // Play tone & Show in-app Toast
    window.notificationManager?.showNormalToast(
      '🧪 Uji Coba: Gempa Simulasi',
      'M 5.4 SR • Laut Banda Aceh • Ini adalah uji coba notifikasi Siaga Gempa.',
      5.4
    );

    // Kirim notifikasi sistem browser ponsel
    window.notificationManager?.sendBrowserNotification('🧪 Tes Siaga Gempa: Gempa M 5.4', {
      body: 'Pusat gempa 35 km Barat Daya Banda Aceh. Notifikasi sistem dan getar berfungsi normal di ponsel Anda!',
      vibrate: [500, 200, 500],
      requireInteraction: false
    });
  }

  async requestAllPermissions() {
    await this.requestNotificationPermission();
    window.emergencyService?.startLocationTracking();
    this.updatePermissionStatuses();
  }
}

window.systemManager = new SystemManager();
