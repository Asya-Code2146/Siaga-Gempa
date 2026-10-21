class AppController {
  constructor() {
    this.init();
  }

  async init() {
    this.registerServiceWorker();

    if (window.mapService) {
      window.mapService.initMap('map');
    }

    await window.earthquakeService?.fetchLiveEarthquakeData();

    if (window.evacuationService) {
      window.evacuationService.loadSheltersFromApi();
    }

    window.systemManager?.updateInstallButtonsVisibility();
    this.initAntiTamperingProtection();
  }

  initAntiTamperingProtection() {
    console.log(
      '%cPERINGATAN SISTEM KEAMANAN SIAGA GEMPA\n%cPlatform ini dilindungi oleh mekanisme anti-tampering dan verifikasi integritas data.\nModifikasi lokal melalui Developer Tools diisolasi hanya pada peramban Anda dan tidak berpengaruh pada basis data atau sistem backend.',
      'color: #dc2626; font-size: 15px; font-weight: 800; font-family: sans-serif;',
      'color: #334155; font-size: 12px; line-height: 1.5; font-family: sans-serif;'
    );

    const serviceKeys = ['appController', 'earthquakeService', 'evacuationService', 'mapService', 'notificationManager', 'systemManager', 'emergencyService', 'aiAnalyst'];
    serviceKeys.forEach(key => {
      try {
        if (window[key]) {
          Object.defineProperty(window, key, {
            configurable: false,
            writable: false
          });
        }
      } catch (err) {}
    });

    try {
      const targetNode = document.getElementById('shelter-cards-list');
      if (targetNode && window.MutationObserver) {
        let isRestoring = false;
        const observer = new MutationObserver(() => {
          if (isRestoring) return;
          if (!targetNode.children.length) {
            isRestoring = true;
            setTimeout(() => {
              window.evacuationService?.renderSheltersUI();
              isRestoring = false;
            }, 100);
          }
        });
        observer.observe(targetNode, { childList: true });
      }
    } catch (e) {}
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
  }

  toggleMobileNav(forceClose = false) {
    const nav = document.getElementById('mobile-nav-drawer');
    const btn = document.getElementById('btn-mobile-nav');
    if (!nav) return;
    if (forceClose) {
      nav.classList.remove('active');
      if (btn) btn.classList.remove('active');
    } else {
      nav.classList.toggle('active');
      if (btn) btn.classList.toggle('active');
    }
  }

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
  window.toggleMobileNav = (force) => window.appController?.toggleMobileNav(force);
});