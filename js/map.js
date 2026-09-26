class MapService {
  constructor() {
    this.map = null;
    this.epicenterMarker = null;
    this.epicenterCircles = [];
    this.userMarker = null;
    this.distanceLine = null;
    this.currentEpicenterCoords = null;
  }

  initMap(containerId = 'map') {
    if (this.map) return;

    const el = document.getElementById(containerId);
    if (!el) return;

    this.map = L.map(containerId, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: true,
      attributionControl: false
    });

    const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const fallbackOsmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const baseTile = L.tileLayer(darkTileUrl, {
      maxZoom: 19,
      subdomains: 'abcd'
    });

    baseTile.on('tileerror', () => {
      console.warn('Gagal memuat Carto dark tile, fallback ke OSM...');
      L.tileLayer(fallbackOsmUrl, { maxZoom: 18 }).addTo(this.map);
    });

    baseTile.addTo(this.map);

    L.control.attribution({ position: 'bottomright' })
      .addAttribution('&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap')
      .addTo(this.map);

    this.map.on('contextmenu', (e) => {
      const { lat, lng } = e.latlng;
      if (confirm(`Buka koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)}) di Google Maps?`)) {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
      }
    });
  }

  updateEpicenter(lat, lon, magnitude, locationName, tsunamiPotential = '') {
    if (!this.map) this.initMap();
    if (!this.map) return;

    this.currentEpicenterCoords = { lat, lon };

    if (this.epicenterMarker) {
      this.map.removeLayer(this.epicenterMarker);
    }
    this.epicenterCircles.forEach(circle => this.map.removeLayer(circle));
    this.epicenterCircles = [];

   
    const pulseIcon = L.divIcon({
      className: 'pulse-epicenter-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const gmapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

    this.epicenterMarker = L.marker([lat, lon], { icon: pulseIcon }).addTo(this.map);
    

    const popupContent = `
      <div style="font-family:'Segoe UI',sans-serif; text-align:center; padding: 4px;">
        <span style="background:#ef4444; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px; text-transform:uppercase;">
          EPISENTRUM GEMPA
        </span>
        <h3 style="margin: 6px 0 2px; font-size:18px; color:#facc15;">M ${magnitude} SR</h3>
        <p style="margin: 0; font-size:12px; color:#e2e8f0; font-weight:600;">${locationName}</p>
        <p style="margin: 4px 0 8px; font-size:11px; color:#94a3b8;">${tsunamiPotential}</p>
        <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" 
           style="display:inline-block; background:#3b82f6; color:#fff; text-decoration:none; padding:5px 12px; border-radius:6px; font-size:11px; font-weight:700;">
          📍 Buka di Google Maps
        </a>
      </div>
    `;
    this.epicenterMarker.bindPopup(popupContent).openPopup();

    const radiusKm = Math.max(magnitude * 25, 40); 
    const circle1 = L.circle([lat, lon], {
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.15,
      weight: 1.5,
      radius: radiusKm * 1000
    }).addTo(this.map);

    const circle2 = L.circle([lat, lon], {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.08,
      weight: 1,
      dashArray: '4, 6',
      radius: (radiusKm * 1.8) * 1000
    }).addTo(this.map);

    this.epicenterCircles.push(circle1, circle2);

    this.map.setView([lat, lon], magnitude > 6.0 ? 6 : 7);
  }

  updateUserLocation(lat, lon, accuracy = 0) {
    if (!this.map) this.initMap();
    if (!this.map) return;

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    if (this.distanceLine) {
      this.map.removeLayer(this.distanceLine);
    }

    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `<div style="width:16px;height:16px;background:#06b6d4;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 12px #06b6d4;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const gmapsUserUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    this.userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(this.map);
    this.userMarker.bindPopup(`
      <div style="font-family:'Segoe UI',sans-serif; text-align:center; padding: 4px;">
        <span style="color:#06b6d4; font-weight:800; font-size:12px;">📍 Lokasi Anda</span><br>
        <span style="font-size:11px; color:#cbd5e1;">(${lat.toFixed(4)}, ${lon.toFixed(4)})</span><br>
        <a href="${gmapsUserUrl}" target="_blank" style="display:inline-block; margin-top:5px; color:#38bdf8; font-size:11px; text-decoration:none; font-weight:700;">
          Lihat di Google Maps
        </a>
      </div>
    `);

    if (this.currentEpicenterCoords) {
      const epLat = this.currentEpicenterCoords.lat;
      const epLon = this.currentEpicenterCoords.lon;

      this.distanceLine = L.polyline([[lat, lon], [epLat, epLon]], {
        color: '#06b6d4',
        weight: 2,
        opacity: 0.8,
        dashArray: '6, 8'
      }).addTo(this.map);

      const bounds = L.latLngBounds([[lat, lon], [epLat, epLon]]);
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }

  panTo(lat, lon, zoom = 7) {
    if (this.map) {
      this.map.flyTo([lat, lon], zoom, { duration: 1.2 });
    }
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
    }
  }
}

window.mapService = new MapService();
