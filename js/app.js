/**
<<<<<<< HEAD
 * Siaga Gempa - Main Application Orchestrator
=======
 * SiagaGempa - Main Application Orchestrator
 * High-performance Modular Controller & Single-Page PWA Router
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
 */

class AppController {
  constructor() {
<<<<<<< HEAD
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
=======
    this.refreshIntervalSec = 30;
    this.countdownSec = 30;
    this.countdownTimer = null;
    this.activeTab = 'dashboard';
  }

  async init() {
    console.log('⚡ SiagaGempa PWA Engine Initializing...');

    // 1. Inisialisasi PWA Service Worker
    this.registerServiceWorker();

    // 2. Inisialisasi Peta
    window.mapService?.initMap('map');

    // 3. Muat Data Kontak & Checklist Tas Siaga
    window.emergencyService?.renderContactsList();
    window.emergencyService?.updateChecklistProgress();

    // 4. Hubungkan Event Listener Gempa
    window.earthquakeService?.onUpdate((latest, history) => {
      this.renderDashboard(latest);
      this.renderEarthquakeList(history);
      if (latest) {
        window.mapService?.updateEpicenter(
          latest.latitude,
          latest.longitude,
          latest.magnitude,
          latest.location,
          latest.tsunami
        );
        window.emergencyService?.recalculateDistanceToEpicenter();
      }
    });

    // 5. Setup Router Tab
    this.setupNavigation();

    // 6. Setup Form & Action Handlers
    this.bindActionEvents();

    // 7. Ambil Data Gempa Pertama & Jalankan Timer
    await window.earthquakeService?.fetchLiveEarthquakeData();
    this.startAutoRefreshLoop();

    // 8. Cek Matrix Izin Sistem
    window.systemManager?.auditPermissionsMatrix();

    // 9. Jalankan GPS jika sudah pernah diizinkan sebelumnya
    if (localStorage.getItem('siagagempa_gps_enabled') === 'true') {
      window.emergencyService?.startLocationTracking();
    }
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
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

<<<<<<< HEAD
  /**
   * Interaktivitas Mockup Smartphone pada Hero Section:
   * Mengubah isi tampilan pada layar mockup saat pengguna memilih fase Sebelum, Saat, atau Sesudah
   */
  selectMockupPhase(phase) {
    document.querySelectorAll('.mockup-action-box').forEach(btn => {
      if (btn.getAttribute('data-fase') === phase) {
=======
  setupNavigation() {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigateToTab(hash);
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    // Event click sidebar nav items
    document.querySelectorAll('[data-target-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target-tab');
        window.location.hash = target;
      });
    });
  }

  navigateToTab(tabId) {
    this.activeTab = tabId;

    // Sembunyikan semua tab & aktifkan tab tujuan
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update active class di navigasi desktop & mobile
    document.querySelectorAll('[data-target-tab]').forEach(btn => {
      if (btn.getAttribute('data-target-tab') === tabId) {
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

<<<<<<< HEAD
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
=======
    // Jika tab peta dibuka, invalidate size Leaflet agar render mulus
    if (tabId === 'dashboard') {
      window.mapService?.invalidateSize();
    }
    if (tabId === 'system') {
      window.systemManager?.auditPermissionsMatrix();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderDashboard(latest) {
    if (!latest) return;

    const classification = window.earthquakeService?.classifyLevel(latest.magnitude, latest.tsunami);

    // Hero Banner Elements (Matching Image 3 & Image 1)
    const magValEl = document.getElementById('hero-val-mag');
    const locValEl = document.getElementById('hero-val-loc');
    const depthValEl = document.getElementById('hero-val-depth');
    const timeValEl = document.getElementById('hero-val-time');
    const coordsValEl = document.getElementById('hero-val-coords');
    const tsunamiBadge = document.getElementById('hero-tsunami-badge');
    const gmapsBtn = document.getElementById('hero-btn-gmaps');

    if (magValEl) magValEl.textContent = latest.magnitude.toFixed(1);
    if (locValEl) locValEl.textContent = latest.location;
    if (depthValEl) depthValEl.textContent = `${latest.depth} km`;
    if (timeValEl) timeValEl.textContent = latest.time;
    if (coordsValEl) coordsValEl.textContent = `${latest.latitude.toFixed(2)}, ${latest.longitude.toFixed(2)}`;

    if (tsunamiBadge) {
      const isDanger = classification.level === 3 && latest.tsunami.toLowerCase().includes('tsunami') && !latest.tsunami.toLowerCase().includes('tidak');
      tsunamiBadge.className = `badge-tsunami-status ${isDanger ? 'tsunami-danger' : 'tsunami-safe'}`;
      tsunamiBadge.innerHTML = isDanger ? `🚨 ${latest.tsunami}` : `🛡️ ${latest.tsunami}`;
    }

    if (gmapsBtn) {
      gmapsBtn.href = `https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`;
    }

    // Update Status Pill di Header
    const sysPill = document.getElementById('header-sys-status');
    if (sysPill) {
      if (classification.level === 3) {
        sysPill.innerHTML = `<span class="pill-dot dot-red"></span><span style="color:#ef4444; font-weight:800;">DARURAT BAHAYA</span>`;
      } else {
        sysPill.innerHTML = `<span class="pill-dot dot-green"></span><span>Sistem: Normal</span>`;
      }
    }

    // Dynamic 3-Level Cards Highlighting (Matching Reference Image 1 & 4)
    document.querySelectorAll('.level-card').forEach(card => card.style.opacity = '0.7');
    const activeLvlCard = document.querySelector(`.level-card.lvl-${classification.level}`);
    if (activeLvlCard) {
      activeLvlCard.style.opacity = '1';
      activeLvlCard.style.transform = 'scale(1.02)';
    }
  }

  renderEarthquakeList(history) {
    const container = document.getElementById('earthquake-history-list');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:#94a3b8;">Tidak ada data gempa yang cocok dengan filter.</div>`;
      return;
    }

    container.innerHTML = history.map(eq => {
      const cls = window.earthquakeService.classifyLevel(eq.magnitude, eq.tsunami);
      const gmapsLink = `https://www.google.com/maps?q=${eq.latitude},${eq.longitude}`;

      return `
        <div class="eq-item-card ${cls.badgeClass}">
          <div class="eq-card-top">
            <div class="eq-info-main">
              <div class="eq-location-text">${eq.location}</div>
              <div class="eq-meta-row">
                <span>🕒 ${eq.time}</span>
                <span>📏 Kedalaman: ${eq.depth} km</span>
              </div>
            </div>
            <div class="eq-mag-badge ${cls.badgeClass}">
              ${eq.magnitude.toFixed(1)}
            </div>
          </div>
          <div class="eq-card-bottom">
            <span style="color:${cls.color}; font-weight:700;">${cls.shortLabel}</span>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-card-map" onclick="window.app.viewEarthquakeOnMap(${eq.latitude}, ${eq.longitude}, ${eq.magnitude}, '${eq.location.replace(/'/g, "\\'")}', '${eq.tsunami}')">
                Peta
              </button>
              <a href="${gmapsLink}" target="_blank" class="btn-card-map" style="text-decoration:none;">
                Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  viewEarthquakeOnMap(lat, lon, mag, loc, tsunami) {
    this.navigateToTab('dashboard');
    window.mapService?.updateEpicenter(lat, lon, mag, loc, tsunami);
  }

  startAutoRefreshLoop() {
    this.countdownSec = this.refreshIntervalSec;

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownSec--;
      const timerEl = document.getElementById('auto-refresh-timer');
      if (timerEl) {
        timerEl.textContent = `${this.countdownSec}s`;
      }

      if (this.countdownSec <= 0) {
        this.countdownSec = this.refreshIntervalSec;
        window.earthquakeService?.fetchLiveEarthquakeData();
      }
    }, 1000);
  }

  bindActionEvents() {
    // 1. Tombol Aktifkan GPS / Lokasi Saya
    document.getElementById('btn-activate-gps')?.addEventListener('click', () => {
      localStorage.setItem('siagagempa_gps_enabled', 'true');
      window.emergencyService?.startLocationTracking();
    });

    // 2. Tombol Bagikan Lokasi Saya
    document.getElementById('btn-share-location')?.addEventListener('click', () => {
      window.emergencyService?.shareMyLocation();
    });

    // 3. Tombol Kirim SOS SMS (Header, Quick Action & Tab SMS)
    document.querySelectorAll('.btn-trigger-sos-sms').forEach(btn => {
      btn.addEventListener('click', () => {
        window.emergencyService?.dispatchEmergencySMS();
      });
    });

    // 4. Tombol Mute / Unmute Suara Alarm
    const muteBtn = document.getElementById('btn-toggle-sound');
    if (muteBtn) {
      const isMuted = localStorage.getItem('siagagempa_muted') === 'true';
      muteBtn.textContent = isMuted ? '🔇' : '🔊';

      muteBtn.addEventListener('click', () => {
        const muted = window.notificationManager?.toggleMute();
        muteBtn.textContent = muted ? '🔇' : '🔊';
      });
    }

    // 5. Tombol Pengaturan Izin Notifikasi
    document.getElementById('btn-request-notif')?.addEventListener('click', async () => {
      const res = await window.notificationManager?.requestPermission();
      if (res.granted) {
        alert('✅ Notifikasi SiagaGempa berhasil diaktifkan!');
        window.notificationManager?.showNotification('SiagaGempa Aktif', {
          body: 'Anda akan menerima notifikasi otomatis saat terjadi gempa bumi di Indonesia.'
        });
      } else {
        alert('Izin notifikasi tidak diaktifkan. Anda dapat mengizinkannya di pengaturan browser.');
      }
      window.systemManager?.auditPermissionsMatrix();
    });

    // 6. Tombol Install PWA
    document.getElementById('btn-pwa-install')?.addEventListener('click', () => {
      window.systemManager?.promptPwaInstall();
    });

    // 7. Tombol Matikan Alarm di Modal Darurat
    document.getElementById('btn-stop-alarm')?.addEventListener('click', () => {
      window.notificationManager?.closeEmergencyModal();
    });

    // 8. Form Tambah Kontak Darurat
    document.getElementById('form-add-contact')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('input-contact-name').value;
      const phone = document.getElementById('input-contact-phone').value;
      const relation = document.getElementById('input-contact-relation').value;

      if (window.emergencyService?.addContact(name, phone, relation)) {
        document.getElementById('input-contact-name').value = '';
        document.getElementById('input-contact-phone').value = '';
        alert('✅ Kontak darurat berhasil ditambahkan!');
      }
    });

    // 9. Input Nama Pengguna untuk Pesan SOS
    const nameInput = document.getElementById('input-user-sos-name');
    if (nameInput) {
      nameInput.value = localStorage.getItem('siagagempa_username') || '';
      nameInput.addEventListener('input', (e) => {
        localStorage.setItem('siagagempa_username', e.target.value);
        window.emergencyService?.updateSmsPreview();
      });
    }

    // 10. Checklist Tas Siaga Bencana Items
    document.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        window.emergencyService?.toggleChecklistItem(id);
      });
    });

    // 11. Tombol Simulator Gempa (Level 1, 2, 3, Reset)
    document.getElementById('btn-sim-lvl1')?.addEventListener('click', () => {
      window.earthquakeService?.simulateEarthquake(1);
    });
    document.getElementById('btn-sim-lvl2')?.addEventListener('click', () => {
      window.earthquakeService?.simulateEarthquake(2);
    });
    document.getElementById('btn-sim-lvl3')?.addEventListener('click', () => {
      window.earthquakeService?.simulateEarthquake(3);
    });
    document.getElementById('btn-sim-reset')?.addEventListener('click', () => {
      window.earthquakeService?.resetSimulation();
      alert('🔄 Simulasi dihentikan. Memuat kembali data resmi live BMKG.');
    });

    // 12. Tombol Manual Refresh BMKG
    document.getElementById('btn-manual-refresh')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-manual-refresh');
      btn.style.transform = 'rotate(360deg)';
      btn.style.transition = 'transform 0.6s ease';
      await window.earthquakeService?.fetchLiveEarthquakeData();
      setTimeout(() => { btn.style.transform = 'none'; }, 600);
    });

    // 13. Filter Tabs di Halaman Data Gempa
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.filterEarthquakeList(filter);
      });
    });
  }

  filterEarthquakeList(filter) {
    const history = window.earthquakeService?.historyList || [];
    let filtered = history;

    if (filter === 'm5') {
      filtered = history.filter(eq => eq.magnitude >= 5.0);
    } else if (filter === 'dirasakan') {
      filtered = history.filter(eq => eq.dirasakan && eq.dirasakan !== '-');
    } else if (filter === 'tsunami') {
      filtered = history.filter(eq => eq.tsunami && !eq.tsunami.toLowerCase().includes('tidak'));
    }

    this.renderEarthquakeList(filtered);
  }
}

// Inisialisasi Aplikasi Saat Dokumen Siap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
});