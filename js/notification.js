document.addEventListener('DOMContentLoaded', () => {
    updateNotificationUI();
});

function updateNotificationUI() {
    const statusEl = document.getElementById('notif-status');
    const btnEl = document.getElementById('btn-enable-notif');
    
    if (!statusEl || !btnEl) return;

    if (!('Notification' in window)) {
        statusEl.textContent = 'Browser tidak mendukung notifikasi';
        statusEl.className = 'status-badge-off';
        btnEl.disabled = true;
        return;
    }

    if (Notification.permission === 'granted') {
        statusEl.textContent = 'Aktif (Diizinkan)';
        statusEl.className = 'status-badge-on';
        btnEl.textContent = '🔔 Notifikasi Aktif';
        btnEl.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (Notification.permission === 'denied') {
        statusEl.textContent = 'Ditolak (Ubah izin di setting browser)';
        statusEl.className = 'status-badge-off';
        btnEl.textContent = '❌ Izin Ditolak';
        btnEl.disabled = true;
        btnEl.style.opacity = '0.6';
    } else {
        statusEl.textContent = 'Belum diaktifkan';
        statusEl.className = 'status-badge-off';
        btnEl.textContent = '⚡ Aktifkan Notifikasi';
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Browser Anda tidak mendukung Web Push Notification.');
        return;
    }

    if (Notification.permission === 'denied') {
        alert('Izin notifikasi sebelumnya telah ditolak. Silakan aktifkan kembali secara manual melalui pengaturan ikon gembok/site settings di address bar browser Anda.');
        updateNotificationUI();
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                console.log('Service Worker siap untuk push notification.');
            }
            new Notification('SiagaGempa Berhasil Diaktifkan', {
                body: 'Anda akan menerima pemberitahuan darurat gempa bumi.',
                icon: 'icons/icon-192.png'
            });
        }
        updateNotificationUI();
    } catch (error) {
        console.error('Gagal meminta izin notifikasi:', error);
    }
}


function triggerEarthquakeNotification(eqData) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const eqId = `${eqData.Tanggal}-${eqData.Jam}-${eqData.Wilayah}`.replace(/\s+/g, '_');
    const lastNotifiedId = localStorage.getItem('last_notified_eq');

    if (lastNotifiedId === eqId) {
        return; 
    }


    localStorage.setItem('last_notified_eq', eqId);

    const title = '⚠️ Gempa Terdeteksi';
    const options = {
        body: `M ${eqData.Magnitude} • ${eqData.Wilayah} • Kedalaman ${eqData.Kedalaman}`,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: eqId,
        data: {
            url: `detail.html?id=${encodeURIComponent(eqId)}`,
            earthquake: eqData
        }
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
        });
    } else {
        const notification = new Notification(title, options);
        notification.onclick = () => {
            window.focus();
            window.location.href = `detail.html`;
        };
    }
}