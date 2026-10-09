class SystemManager {
  constructor() {
    this.deferredPrompt = null;
    this.initPwaHandlers();
    this.initModalTriggers();
    this.initNetworkStatus();
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

  initNetworkStatus() {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      const badge = document.getElementById('network-status-badge');
      if (badge) {
        if (isOnline) {
          badge.className = 'network-badge online';
          badge.innerHTML = '<span class="status-indicator-dot"></span> Online';
        } else {
          badge.className = 'network-badge offline';
          badge.innerHTML = '<span class="status-indicator-dot"></span> Offline (Mode Darurat)';
        }
      }
      const banner = document.getElementById('offline-alert-banner');
      if (banner) {
        banner.style.display = isOnline ? 'none' : 'flex';
      }
    };

    window.addEventListener('online', () => {
      updateStatus();
      window.notificationManager?.showNormalToast(
        'Koneksi Internet Kembali Aktif',
        'Data gempa dan peta BMKG disinkronkan kembali secara real-time.',
        0
      );
    });

    window.addEventListener('offline', () => {
      updateStatus();
      window.notificationManager?.showNormalToast(
        'Mode Darurat Offline Aktif',
        'Koneksi internet terputus. Panduan keselamatan, checklist siaga, dan kontak darurat tetap siap digunakan.',
        0
      );
    });

    updateStatus();
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
      this.updateInstallButtonsVisibility();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      localStorage.setItem('siagagempa_installed', 'true');
      this.updateInstallButtonsVisibility();

      window.notificationManager?.showNormalToast(
        'Aplikasi Berhasil Dipasang',
        'Siaga Gempa telah terpasang di layar utama perangkat Anda.',
        0
      );
    });

    const handleInstallClick = () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
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

  updatePermissionStatuses() {
    const isHttps = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const httpWarn = document.getElementById('insecure-http-warning');
    if (httpWarn) {
      httpWarn.style.display = isHttps ? 'none' : 'block';
    }

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
    if (!('Notification' in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Pada iPhone/iPad:\nFitur notifikasi Web Push memerlukan aplikasi dipasang ke Layar Utama (Home Screen).\n\nLangkah: Ketuk ikon Bagikan di Safari -> Tambah ke Layar Utama.');
      } else {
        alert('Browser ponsel Anda tidak mendukung fitur Notifikasi Web Push.');
      }
      return;
    }

    if (Notification.permission === 'denied') {
      alert('Izin notifikasi sebelumnya telah ditolak.\n\nCara mengaktifkan kembali:\n1. Ketuk ikon gembok di bilah alamat browser.\n2. Buka Izin Situs -> Notifikasi.\n3. Pilih Izinkan, lalu muat ulang halaman ini.');
      this.updatePermissionStatuses();
      return;
    }

    const res = await window.notificationManager?.requestPermission();
    this.updatePermissionStatuses();

    if (res?.granted) {
      window.notificationManager?.showNormalToast(
        'Notifikasi Berhasil Diaktifkan',
        'Ponsel Anda kini siap menerima notifikasi peringatan gempa & potensi tsunami secara otomatis.',
        0
      );
      window.notificationManager?.sendBrowserNotification('Siaga Gempa Aktif', {
        body: 'Sistem peringatan dini gempa bumi & tsunami aktif di ponsel Anda.',
        vibrate: [300, 100, 300]
      });
    } else {
      alert('Izin notifikasi belum diberikan. Anda dapat mengaktifkannya kapan saja untuk mendapatkan peringatan dini.');
    }
  }

  testEarthquakeNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      alert('Izin notifikasi belum aktif di perangkat Anda. Silakan ketuk tombol Aktifkan pada Notifikasi terlebih dahulu.');
      this.requestNotificationPermission();
      return;
    }

    window.notificationManager?.showNormalToast(
      'Uji Coba: Gempa Simulasi',
      'M 5.4 SR • Laut Banda Aceh • Ini adalah uji coba notifikasi Siaga Gempa.',
      5.4
    );

    window.notificationManager?.sendBrowserNotification('Tes Siaga Gempa: Gempa M 5.4', {
      body: 'Pusat gempa 35 km Barat Daya Banda Aceh. Notifikasi sistem dan getar berfungsi normal di ponsel Anda.',
      vibrate: [500, 200, 500],
      requireInteraction: false
    });
  }

  async requestAllPermissions() {
    await this.requestNotificationPermission();
    window.emergencyService?.startLocationTracking();
    this.updatePermissionStatuses();
  }

  openHakiModal(tab = 'haki') {
    const modal = document.getElementById('haki-modal');
    if (!modal) return;
    this.switchHakiTab(tab);
    modal.classList.add('active');
  }

  closeHakiModal() {
    const modal = document.getElementById('haki-modal');
    if (modal) modal.classList.remove('active');
  }

  switchHakiTab(tabName) {
    document.querySelectorAll('.haki-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-haki-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.haki-tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`haki-pane-${tabName}`);
    if (activePane) activePane.classList.add('active');
  }
}

window.systemManager = new SystemManager();

