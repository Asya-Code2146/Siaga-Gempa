<<<<<<< HEAD
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
      // Sembunyikan semua tombol pasang aplikasi karena sudah terpasang di HP/komputer!
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
    // 1. Cek status terpasang saat awal muat
    this.updateInstallButtonsVisibility();

    // 2. Tangkap event beforeinstallprompt dari browser (Android & Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('✅ Browser native install prompt siap digunakan.');
      this.updateInstallButtonsVisibility();
    });

    // 3. Tangkap event ketika aplikasi selesai diinstal
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

    // 4. Hubungkan tombol pasang di header & hero
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
        // Tampilkan modal panduan tata cara instalasi lengkap
        this.openInstallModal();
      }
    };

    document.getElementById('btn-header-install')?.addEventListener('click', handleInstallClick);
    document.getElementById('btn-hero-install')?.addEventListener('click', handleInstallClick);
  }

  initModalTriggers() {
    // Tutup modal jika klik di luar box
    document.querySelectorAll('.custom-modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
=======
class SystemManager {
  constructor() {
    this.deferredInstallPrompt = null;
    this.currentLatency = 0;
    this.initNetworkListeners();
    this.initPwaInstallPrompt();
  }

  initNetworkListeners() {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
    this.handleNetworkChange(navigator.onLine);

    setInterval(() => this.measureLatency(), 20000);
    this.measureLatency();
  }

  handleNetworkChange(isOnline) {
    const headerPill = document.getElementById('header-conn-status');
    const systemStatusText = document.getElementById('sys-conn-metric');
    const offlineAlertBar = document.getElementById('offline-notice-bar');

    if (isOnline) {
      if (headerPill) {
        headerPill.innerHTML = `<span class="pill-dot dot-green"></span><span>Online</span>`;
      }
      if (systemStatusText) {
        systemStatusText.innerHTML = `<span style="color:#10b981;">Online (Terhubung)</span>`;
      }
      if (offlineAlertBar) {
        offlineAlertBar.style.display = 'none';
      }
    } else {
      if (headerPill) {
        headerPill.innerHTML = `<span class="pill-dot dot-red"></span><span>Offline (Lokal)</span>`;
      }
      if (systemStatusText) {
        systemStatusText.innerHTML = `<span style="color:#ef4444;">Offline (Mode Darurat)</span>`;
      }
      if (offlineAlertBar) {
        offlineAlertBar.style.display = 'flex';
      }
    }
  }

  async measureLatency() {
    if (!navigator.onLine) {
      this.currentLatency = -1;
      this.updateLatencyUI('Offline');
      return;
    }

    const start = performance.now();
    try {
      // Ping timestamp ringan
      await fetch(`api/earthquake.php?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      this.currentLatency = Math.round(performance.now() - start);
      this.updateLatencyUI(`${this.currentLatency} ms`);
    } catch (e) {
     
      try {
        await fetch(`icons/logo.svg?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        this.currentLatency = Math.round(performance.now() - start);
        this.updateLatencyUI(`${this.currentLatency} ms`);
      } catch (err) {
        this.updateLatencyUI('Timeout');
      }
    }
  }

  updateLatencyUI(text) {
    const latEl = document.getElementById('sys-latency-metric');
    if (latEl) {
      latEl.textContent = text;
    }
  }

  initPwaInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      console.log('✅ Browser PWA install prompt ready!');
    });

    window.addEventListener('appinstalled', () => {
      console.log('SiagaGempa PWA berhasil terinstal di sistem pengguna.');
      this.deferredInstallPrompt = null;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.textContent = '✅ Terpasang';
        installBtn.style.opacity = '0.7';
      }
    });

   
    document.getElementById('btn-close-pwa-modal')?.addEventListener('click', () => {
      this.closeInstallModal();
    });

    document.getElementById('btn-trigger-native-prompt')?.addEventListener('click', () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        this.closeInstallModal();
      } else {
        alert('Dialog otomatis belum tersedia dari browser. Silakan ikuti petunjuk manual di atas sesuai perangkat Anda (Chrome, Safari, atau Desktop).');
      }
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    });
  }

  openInstallModal() {
<<<<<<< HEAD
    const modal = document.getElementById('install-guide-modal');
    if (modal) {
      modal.classList.add('active');
      // Deteksi OS otomatis untuk memilih tab yang paling sesuai
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
    this.checkInitialPermissions();
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
      }, 1200);
    }
  }

  checkInitialPermissions() {
    // Cek status izin notifikasi
    if ('Notification' in window) {
      const notifBtn = document.getElementById('btn-perm-notif');
      if (Notification.permission === 'granted') {
        if (notifBtn) {
          notifBtn.textContent = '✓ Diizinkan';
          notifBtn.classList.add('granted');
        }
      }
    }

    // Cek kontak darurat tersimpan
    const savedContact = localStorage.getItem('siagagempa_contact_name');
    if (savedContact) {
      const cBtn = document.getElementById('btn-perm-contacts');
      if (cBtn) {
        cBtn.textContent = `✓ ${savedContact}`;
        cBtn.classList.add('granted');
      }
    }
  }

  async requestNotificationPermission() {
    const res = await window.notificationManager?.requestPermission();
    const btn = document.getElementById('btn-perm-notif');
    if (res?.granted) {
      if (btn) {
        btn.textContent = '✓ Diizinkan';
        btn.classList.add('granted');
      }
      window.notificationManager?.showNormalToast(
        'Notifikasi Aktif',
        'Pemberitahuan peringatan dini gempa & tsunami telah diizinkan.',
        0
      );
    } else {
      alert('Izin notifikasi belum diberikan. Anda dapat mengaktifkannya melalui pengaturan browser.');
    }
  }

  async requestAllPermissions() {
    // 1. Izin Notifikasi
    await this.requestNotificationPermission();

    // 2. Izin Lokasi GPS & Google Maps
    window.emergencyService?.startLocationTracking();

    // 3. Akses Kontak Darurat
    await window.emergencyService?.pickOrSetupContacts();

    // Tutup modal
    setTimeout(() => {
      this.closePermissionModal();
    }, 1000);
  }

  toggleTestBenchMenu() {
    const menu = document.getElementById('test-bench-menu');
    menu?.classList.toggle('active');
=======
    const modal = document.getElementById('pwa-modal-overlay');
    if (modal) modal.style.display = 'flex';
  }

  closeInstallModal() {
    const modal = document.getElementById('pwa-modal-overlay');
    if (modal) modal.style.display = 'none';
  }

  async promptPwaInstall() {
    if (this.deferredInstallPrompt) {
      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;
      console.log(`Pilihan user instalasi PWA: ${outcome}`);
      if (outcome === 'accepted') {
        this.deferredInstallPrompt = null;
      }
    } else {
      this.openInstallModal();
    }
  }

  async auditPermissionsMatrix() {
    const listEl = document.getElementById('permissions-matrix-list');
    if (!listEl) return;

    const notifStatus = 'Notification' in window ? Notification.permission : 'not_supported';
    let geoStatus = 'prompt';

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const geoQuery = await navigator.permissions.query({ name: 'geolocation' });
        geoStatus = geoQuery.state;
      } catch (e) {}
    }

    const swStatus = 'serviceWorker' in navigator && navigator.serviceWorker.controller ? 'Aktif (Ready)' : 'Terdaftar';
    const audioStatus = !!(window.AudioContext || window.webkitAudioContext) ? 'Didukung' : 'Tidak Didukung';
    const vibStatus = 'vibrate' in navigator ? 'Didukung' : 'Tidak Didukung';

    listEl.innerHTML = `
      <div class="guide-pill"><span>🔔 Izin Notifikasi:</span> <strong>${notifStatus.toUpperCase()}</strong></div>
      <div class="guide-pill"><span>📍 Izin Geolocation GPS:</span> <strong>${geoStatus.toUpperCase()}</strong></div>
      <div class="guide-pill"><span>⚡ PWA Service Worker:</span> <strong>${swStatus}</strong></div>
      <div class="guide-pill"><span>🔊 Web Audio Synthesizer:</span> <strong>${audioStatus}</strong></div>
      <div class="guide-pill"><span>📳 Getar Perangkat (Vibrate):</span> <strong>${vibStatus}</strong></div>
    `;
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
  }
}

window.systemManager = new SystemManager();
