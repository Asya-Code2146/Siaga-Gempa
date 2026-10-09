function getUserLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coordsEl = document.getElementById('user-coords');
        if (coordsEl) {
          coordsEl.innerText = `Koordinat: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
        if (window.mapService) {
          window.mapService.updateUserLocation(lat, lon);
        }
        calculateDistance(lat, lon);
      },
      (error) => {
        alert('Gagal mendapatkan lokasi. Pastikan Anda memberikan izin akses lokasi.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    alert('Browser Anda tidak mendukung Geolocation API.');
  }
}

function calculateDistance(userLat, userLon) {
  const eq = window.earthquakeService?.latestEarthquake;
  const distEl = document.getElementById('distance-info');
  if (!eq) {
    if (distEl) distEl.innerText = 'Jarak ke episentrum: Menunggu data gempa...';
    return;
  }

  const distance = getDistanceFromLatLonInKm(userLat, userLon, eq.latitude, eq.longitude);
  if (distEl) {
    distEl.innerText = `Jarak ke episentrum: ${distance.toFixed(2)} km`;
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);  
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}