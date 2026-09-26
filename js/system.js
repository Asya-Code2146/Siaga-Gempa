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
      }, 1500);
    }
  }

  checkInitialPermissions() {
    if ('Notification' in window) {
      const notifBtn = document.getElementById('btn-perm-notif');
      if (Notification.permission === 'granted') {
        if (notifBtn) {
          notifBtn.textContent = '✓ Diizinkan';
          notifBtn.classList.add('granted');
        }
      }
    }

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
    await this.requestNotificationPermission();
    window.emergencyService?.startLocationTracking();
    await window.emergencyService?.pickOrSetupContacts();

    setTimeout(() => {
      this.closePermissionModal();
    }, 1000);
  }
}

window.systemManager = new SystemManager();
