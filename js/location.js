function getUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                document.getElementById('user-coords').innerText = `Koordinat: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([lat, lon]).addTo(map)
                    .bindPopup('Lokasi Anda').openPopup();

                calculateDistance(lat, lon);
            },
            (error) => {
                alert('Gagal mendapatkan lokasi. Pastikan Anda memberikan izin akses lokasi.');
                console.error('Geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        alert('Browser Anda tidak mendukung Geolocation API.');
    }
}

function calculateDistance(userLat, userLon) {
    if (!window.currentEarthquakeData) {
        document.getElementById('distance-info').innerText = 'Jarak ke episentrum: Menunggu data gempa...';
        return;
    }

    const eq = window.currentEarthquakeData;
    const distance = getDistanceFromLatLonInKm(userLat, userLon, eq.latitude, eq.longitude);
    document.getElementById('distance-info').innerText = `Jarak ke episentrum: ${distance.toFixed(2)} km`;


    L.polyline([[userLat, userLon], [eq.latitude, eq.longitude]], {color: 'red', dashArray: '5,5'}).addTo(map);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2-lat1);  
    const dLon = deg2rad(lon2-lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}