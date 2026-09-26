<<<<<<< HEAD
/**
 * Siaga Gempa - Notification & Alarm Audio Synthesizer
 * Handles Full-Screen Emergency Takeover (Level 3 & Tsunami Aceh)
 * and gentle Toast Notifications for outside/mild earthquakes.
 */

=======
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
class NotificationManager {
  constructor() {
    this.audioCtx = null;
    this.isAlarmPlaying = false;
<<<<<<< HEAD
    this.alarmInterval = null;
    this.activeOscillators = [];
    this.vibrateInterval = null;

    this.initAudioContext();
    this.bindEvents();
=======
    this.alarmOscillators = [];
    this.isMuted = localStorage.getItem('siagagempa_muted') === 'true';
    this.lastAlertTime = 0;
    
    this.initAudioContext();
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
  }

  initAudioContext() {
    try {
<<<<<<< HEAD
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
=======
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API tidak didukung:', e);
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    }
  }

  ensureAudioReady() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

<<<<<<< HEAD
  bindEvents() {
    document.getElementById('btn-stop-alarm')?.addEventListener('click', () => {
      this.closeEmergencyModal();
    });
=======
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('siagagempa_muted', this.isMuted.toString());
    return this.isMuted;
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return { supported: false, granted: false };
    }
    try {
      const permission = await Notification.requestPermission();
      return { supported: true, granted: permission === 'granted' };
    } catch (err) {
<<<<<<< HEAD
      console.error('Error requesting notification permission:', err);
=======
      console.error('Error saat meminta izin notifikasi:', err);
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
      return { supported: true, granted: false };
    }
  }

  isPermissionGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

<<<<<<< HEAD
  sendBrowserNotification(title, options = {}) {
=======
  showNotification(title, options = {}) {
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    if (!this.isPermissionGranted()) return;

    const defaultOptions = {
      icon: 'icons/logo.svg',
      badge: 'icons/logo.svg',
<<<<<<< HEAD
      vibrate: [500, 200, 500, 200, 1000],
      tag: 'siaga-gempa-alert',
      renotify: true,
=======
      vibrate: [300, 100, 300, 100, 600],
      tag: 'siagagempa-alert',
      renotify: true,
      requireInteraction: options.level === 3,
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, defaultOptions);
      });
    } else {
<<<<<<< HEAD
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
=======
      new Notification(title, defaultOptions);
    }
  }

  playTone(frequency = 880, type = 'sine', duration = 0.4) {
    if (this.isMuted) return;
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
<<<<<<< HEAD
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
=======
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
<<<<<<< HEAD
    } catch (e) {
      console.warn('Tone error:', e);
    }
  }

  /**
   * Start Loud Emergency Siren Audio Loop (Web Audio API Synthesizer)
   */
  startEmergencySiren() {
    if (this.isAlarmPlaying) return;
=======
    } catch (err) {
      console.warn('Audio tone error:', err);
    }
  }

  startEmergencySiren() {
    if (this.isAlarmPlaying || this.isMuted) return;
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    this.isAlarmPlaying = true;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
<<<<<<< HEAD
      gain.gain.setValueAtTime(0.45, this.audioCtx.currentTime);
=======
      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

<<<<<<< HEAD
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
=======
      let isHigh = false;
      const sirenLoop = () => {
        if (!this.isAlarmPlaying) {
          try { osc.stop(); } catch(e){}
          return;
        }
        const targetFreq = isHigh ? 500 : 1200;
        osc.frequency.linearRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.45);
        isHigh = !isHigh;
        setTimeout(sirenLoop, 450);
      };

      sirenLoop();
      this.alarmOscillators.push({ osc, gain });
    } catch (err) {
      console.error('Error starting siren:', err);
    }

    // Trigger Device Vibration (Mobile PWA)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 1000]);
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    }
  }

  stopEmergencySiren() {
    this.isAlarmPlaying = false;
<<<<<<< HEAD
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
=======
    this.alarmOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        setTimeout(() => osc.stop(), 100);
      } catch (e) {}
    });
    this.alarmOscillators = [];
    if ('vibrate' in navigator) {
      navigator.vibrate(0); // Stop vibration
    }
  }

  triggerEmergencyModal(earthquakeData) {
    const overlay = document.getElementById('alarm-overlay');
    if (!overlay) return;

    const mag = earthquakeData.magnitude;
    const loc = earthquakeData.location;
    const tsunami = earthquakeData.tsunami;

    document.getElementById('alarm-mag-text').textContent = `Magnitudo: ${mag} SR`;
    document.getElementById('alarm-loc-text').textContent = loc;
    document.getElementById('alarm-tsunami-text').textContent = `Status: ${tsunami}`;

    overlay.classList.add('active');
    this.startEmergencySiren();

    this.showNotification(`⚠️ PERINGATAN DARURAT: GEMPA M ${mag}!`, {
      body: `Episentrum: ${loc}. ${tsunami}. Segera cari perlindungan!`,
      level: 3
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
    });
  }

  closeEmergencyModal() {
    const overlay = document.getElementById('alarm-overlay');
<<<<<<< HEAD
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
=======
    if (overlay) overlay.classList.remove('active');
    this.stopEmergencySiren();
  }
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
}

window.notificationManager = new NotificationManager();
