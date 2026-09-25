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
    });
  }

  openInstallModal() {
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
  }
}

window.systemManager = new SystemManager();
