/**
 * Siaga Gempa - Notification & Alarm Audio Synthesizer
 * Handles Full-Screen Emergency Takeover (Level 3 & Tsunami Aceh)
 * and gentle Toast Notifications for outside/mild earthquakes.
 */

class NotificationManager {
  constructor() {
    this.audioCtx = null;
    this.isAlarmPlaying = false;
    this.alarmInterval = null;
    this.activeOscillators = [];
    this.vibrateInterval = null;

    this.initAudioContext();
    this.bindEvents();
  }

  initAudioContext() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureAudioReady() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  bindEvents() {
    document.getElementById('btn-stop-alarm')?.addEventListener('click', () => {
      this.closeEmergencyModal();
    });
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return { supported: false, granted: false };
    }
    try {
      const permission = await Notification.requestPermission();
      return { supported: true, granted: permission === 'granted' };
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return { supported: true, granted: false };
    }
  }

  isPermissionGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  sendBrowserNotification(title, options = {}) {
    if (!this.isPermissionGranted()) return;

    const defaultOptions = {
      icon: 'icons/logo.svg',
      badge: 'icons/logo.svg',
      vibrate: [500, 200, 500, 200, 1000],
      tag: 'siaga-gempa-alert',
      renotify: true,
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, defaultOptions);
      });
    } else {
      try {
        new Notification(title, defaultOptions);
      } catch (e) {
        console.warn('Direct notification error:', e);
      }
    }
  }

  /**
   * Play a short gentle tone (for non-disruptive alerts)
   */
  playTone(freq = 520, type = 'sine', duration = 0.35) {
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Tone error:', e);
    }
  }

  /**
   * Start Loud Emergency Siren Audio Loop (Web Audio API Synthesizer)
   */
  startEmergencySiren() {
    if (this.isAlarmPlaying) return;
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    this.isAlarmPlaying = true;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.45, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

      let toggle = false;
      this.alarmInterval = setInterval(() => {
        if (!this.isAlarmPlaying) {
          clearInterval(this.alarmInterval);
          return;
        }
        const now = this.audioCtx.currentTime;
        const targetFreq = toggle ? 700 : 1300;
        osc.frequency.linearRampToValueAtTime(targetFreq, now + 0.45);
        toggle = !toggle;
      }, 480);

      this.activeOscillators.push({ osc, gain });
    } catch (e) {
      console.error('Failed to start siren audio:', e);
    }

    // Heavy continuous vibration loop
    if ('vibrate' in navigator) {
      navigator.vibrate([1000, 300, 1000, 300, 1500]);
      this.vibrateInterval = setInterval(() => {
        if (!this.isAlarmPlaying) {
          clearInterval(this.vibrateInterval);
          navigator.vibrate(0);
          return;
        }
        navigator.vibrate([1000, 300, 1000, 300, 1500]);
      }, 4500);
    }
  }

  stopEmergencySiren() {
    this.isAlarmPlaying = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }

    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        setTimeout(() => osc.stop(), 120);
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  /**
   * KONDISI 1: FULL-SCREEN ALARM TAKEOVER
   * Khusus Gempa Level 3 & Tsunami di Sumatra / Aceh!
   */
  triggerEmergencyModal(data) {
    const overlay = document.getElementById('alarm-overlay');
    if (!overlay) return;

    const mag = data.magnitude || 7.4;
    const loc = data.location || 'Banda Aceh - Sumatra';
    const tsunami = data.tsunami || 'POTENSI TSUNAMI NAIK KE DARATAN';

    const magEl = document.getElementById('alarm-mag-text');
    const locEl = document.getElementById('alarm-loc-text');
    const tsuEl = document.getElementById('alarm-tsunami-text');
    const badgeEl = document.getElementById('alarm-region-badge');
    const mapsBtn = document.getElementById('btn-alarm-maps-route');

    if (magEl) magEl.textContent = `Magnitudo: ${mag} SR`;
    if (locEl) locEl.textContent = `Episentrum: ${loc}`;
    if (tsuEl) tsuEl.textContent = `Status: ${tsunami.toUpperCase()}`;
    if (badgeEl) badgeEl.textContent = `ZONA DARURAT: SUMATRA - ACEH (LEVEL 3)`;

    if (mapsBtn) {
      mapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=Lapangan+Blang+Padang+Banda+Aceh`;
    }

    // Aktifkan tampilan layar penuh
    overlay.classList.add('active');

    // Bunyikan sirine darurat & getar
    this.startEmergencySiren();

    // Kirim notifikasi sistem
    this.sendBrowserNotification(`🚨 PERINGATAN TSUNAMI & GEMPA M ${mag}!`, {
      body: `Wilayah Sumatra-Aceh: ${loc}. ${tsunami}. Segera evakuasi ke tempat tinggi!`,
      requireInteraction: true
    });
  }

  closeEmergencyModal() {
    const overlay = document.getElementById('alarm-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    this.stopEmergencySiren();
  }

  /**
   * KONDISI 2: NOTIFIKASI BIASA (TOAST & PUSH)
   * Untuk Gempa Ringan / Luar Daerah Sumatra-Aceh.
   * TIDAK mengunci layar dan TIDAK menyalakan sirine panik!
   */
  showNormalToast(title, message, magnitude = 4.5) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Mainkan nada bip halus
    this.playTone(580, 'sine', 0.25);

    const toast = document.createElement('div');
    toast.className = 'toast-card';
    toast.innerHTML = `
      <div class="toast-card-icon">ℹ️</div>
      <div class="toast-card-content">
        <h4>${title} (M ${magnitude})</h4>
        <p>${message}</p>
      </div>
      <button class="toast-card-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Kirim notifikasi browser lembut jika diizinkan
    this.sendBrowserNotification(title, {
      body: message,
      requireInteraction: false
    });

    // Otomatis hilang setelah 6 detik
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 250);
      }
    }, 6000);
  }
}

window.notificationManager = new NotificationManager();
