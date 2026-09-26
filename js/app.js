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

    // 3. Setup otomatis visibilitas tombol pasang PWA
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
   * Mengubah isi kartu pada layar mockup dengan animasi saat pengguna memilih fase Sebelum, Saat, atau Sesudah
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
    const dots = document.querySelectorAll('#mockup-dots .mockup-dot');

    // Update active dot
    dots.forEach((dot, idx) => {
      dot.classList.remove('active');
      if (phase === 'sebelum' && idx === 0) dot.classList.add('active');
      if (phase === 'saat' && idx === 1) dot.classList.add('active');
      if (phase === 'sesudah' && idx === 2) dot.classList.add('active');
    });

    if (statusTitleEl) {
      statusTitleEl.style.opacity = '0';
      setTimeout(() => {
        if (phase === 'sebelum') {
          if (locLabelEl) locLabelEl.textContent = 'Fase 1 • Sebelum Gempa';
          statusTitleEl.textContent = 'Siapkan tas siaga & petakan 2 jalur evakuasi aman';
        } else if (phase === 'saat') {
          if (locLabelEl) locLabelEl.textContent = 'Fase 2 • Saat Gempa Terjadi';
          statusTitleEl.textContent = 'Drop, Cover, Hold On! Lindungi kepala di bawah meja kokoh';
        } else if (phase === 'sesudah') {
          if (locLabelEl) locLabelEl.textContent = 'Fase 3 • Setelah Gempa';
          statusTitleEl.textContent = 'Waspadai tsunami pesisir & segera ke Lapangan Blang Padang';
        }
        statusTitleEl.style.opacity = '1';
      }, 150);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appController = new AppController();
});