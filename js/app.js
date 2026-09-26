/**
 * Siaga Gempa - Main Application Orchestrator
 */

class AppController {
  constructor() {
    this.init();
  }

  async init() {
    console.log('⚡ Siaga Gempa PWA Engine Initializing...');

    // 1. Registrasi Service Worker untuk kapabilitas offline
    this.registerServiceWorker();

    // 2. Ambil data gempa awal dari BMKG
    await window.earthquakeService?.fetchLiveEarthquakeData();

    // 3. Setup otomatis PWA install visibility
    window.systemManager?.updateInstallButtonsVisibility();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
          .then(reg => {
            console.log('✅ Service Worker terdaftar dengan scope:', reg.scope);
          })
          .catch(err => {
            console.warn('⚠️ Registrasi Service Worker gagal:', err);
          });
      });
    }
  }

  /**
   * Interaktivitas Mockup Smartphone pada Hero Section:
   * Mengubah isi tampilan pada layar mockup saat pengguna memilih fase Sebelum, Saat, atau Sesudah
   */
  selectMockupPhase(phase) {
    document.querySelectorAll('.mockup-action-box').forEach(btn => {
      if (btn.getAttribute('data-fase') === phase) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const statusTitleEl = document.getElementById('mockup-status-title');
    const locLabelEl = document.getElementById('mockup-loc-label');

    if (phase === 'sebelum') {
      if (locLabelEl) locLabelEl.textContent = 'Fase 1 • Sebelum Gempa';
      if (statusTitleEl) statusTitleEl.textContent = 'Siapkan tas siaga & kenali jalur keluar';
    } else if (phase === 'saat') {
      if (locLabelEl) locLabelEl.textContent = 'Fase 2 • Saat Gempa Terjadi';
      if (statusTitleEl) statusTitleEl.textContent = 'Jatuhkan diri & lindungi kepala di bawah meja';
    } else if (phase === 'sesudah') {
      if (locLabelEl) locLabelEl.textContent = 'Fase 3 • Setelah Gempa';
      if (statusTitleEl) statusTitleEl.textContent = 'Waspadai tsunami pesisir & ikuti titik kumpul';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});