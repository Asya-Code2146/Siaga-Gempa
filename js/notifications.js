class NotificationManager {
  constructor() {
    this.audioCtx = null;
    this.isAlarmPlaying = false;
    this.alarmOscillators = [];
    this.isMuted = localStorage.getItem('siagagempa_muted') === 'true';
    this.lastAlertTime = 0;
    
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API tidak didukung:', e);
    }
  }

  ensureAudioReady() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('siagagempa_muted', this.isMuted.toString());
    return this.isMuted;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return { supported: false, granted: false };
    }
    try {
      const permission = await Notification.requestPermission();
      return { supported: true, granted: permission === 'granted' };
    } catch (err) {
      console.error('Error saat meminta izin notifikasi:', err);
      return { supported: true, granted: false };
    }
  }

  isPermissionGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  showNotification(title, options = {}) {
    if (!this.isPermissionGranted()) return;

    const defaultOptions = {
      icon: 'icons/logo.svg',
      badge: 'icons/logo.svg',
      vibrate: [300, 100, 300, 100, 600],
      tag: 'siagagempa-alert',
      renotify: true,
      requireInteraction: options.level === 3,
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, defaultOptions);
      });
    } else {
      new Notification(title, defaultOptions);
    }
  }

  playTone(frequency = 880, type = 'sine', duration = 0.4) {
    if (this.isMuted) return;
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (err) {
      console.warn('Audio tone error:', err);
    }
  }

  startEmergencySiren() {
    if (this.isAlarmPlaying || this.isMuted) return;
    this.ensureAudioReady();
    if (!this.audioCtx) return;

    this.isAlarmPlaying = true;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

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
    }
  }

  stopEmergencySiren() {
    this.isAlarmPlaying = false;
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
    });
  }

  closeEmergencyModal() {
    const overlay = document.getElementById('alarm-overlay');
    if (overlay) overlay.classList.remove('active');
    this.stopEmergencySiren();
  }
}

window.notificationManager = new NotificationManager();
