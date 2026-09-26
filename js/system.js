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
    });
  }

  openInstallModal() {
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
  }
}

window.systemManager = new SystemManager();
