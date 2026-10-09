class MapService {
  constructor() {
    this.map = null;
    this.epicenterMarker = null;
    this.epicenterCircles = [];
    this.userMarker = null;
    this.distanceLine = null;
    this.shelterMarkers = [];
    this.currentEpicenterCoords = null;
  }

  initMap(containerId = 'map') {
    if (this.map) return;

    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return;

    this.map = L.map(containerId, {
      center: [5.55, 95.32],
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    const osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const baseTile = L.tileLayer(osmTileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    baseTile.addTo(this.map);
  }

  updateEpicenter(lat, lon, magnitude, locationName, tsunamiPotential = '', depth = 10, time = '') {
    if (!this.map) this.initMap();
    if (!this.map) return;

    if (typeof lat !== 'number' || isNaN(lat) || typeof lon !== 'number' || isNaN(lon)) return;

    this.currentEpicenterCoords = { lat, lon };

    if (this.epicenterMarker) {
      this.map.removeLayer(this.epicenterMarker);
    }
    this.epicenterCircles.forEach(circle => this.map.removeLayer(circle));
    this.epicenterCircles = [];

    const isTsunami = tsunamiPotential.toLowerCase().includes('tsunami') && !tsunamiPotential.toLowerCase().includes('tidak berpotensi');
    const color = isTsunami ? '#dc2626' : (magnitude >= 6.0 ? '#ea580c' : (magnitude >= 5.0 ? '#ca8a04' : '#16a34a'));

    const pulseIcon = L.divIcon({
      className: 'pulse-epicenter-marker',
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #ffffff;box-shadow:0 0 16px ${color};"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const gmapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

    this.epicenterMarker = L.marker([lat, lon], { icon: pulseIcon }).addTo(this.map);

    const popupContent = `
      <div style="font-family:'Plus Jakarta Sans',sans-serif; text-align:center; padding: 4px; min-width: 180px;">
        <span style="background:${color}; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px; text-transform:uppercase;">
          ${isTsunami ? 'Waspada Tsunami' : 'Episentrum Gempa'}
        </span>
        <h3 style="margin: 6px 0 2px; font-size:18px; color:#0f172a; font-weight:800;">M ${magnitude.toFixed(1)} SR</h3>
        <p style="margin: 0; font-size:12px; color:#334155; font-weight:600;">${locationName}</p>
        <p style="margin: 4px 0 2px; font-size:11px; color:#64748b;">Kedalaman: ${depth} km • ${time}</p>
        <p style="margin: 2px 0 8px; font-size:11px; font-weight:700; color:${color};">${tsunamiPotential}</p>
        <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" 
           style="display:inline-block; background:#0284c7; color:#fff; text-decoration:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:700;">
          Buka di Google Maps
        </a>
      </div>
    `;
    this.epicenterMarker.bindPopup(popupContent);

    const radiusKm = Math.max(magnitude * 20, 30);
    const circle1 = L.circle([lat, lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 1.5,
      radius: radiusKm * 1000
    }).addTo(this.map);

    const circle2 = L.circle([lat, lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '4, 6',
      radius: (radiusKm * 1.8) * 1000
    }).addTo(this.map);

    this.epicenterCircles.push(circle1, circle2);
    this.map.setView([lat, lon], magnitude > 6.0 ? 6 : 7);
  }

  updateUserLocation(lat, lon) {
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
      html: `<div style="width:18px;height:18px;background:#0284c7;border:3px solid #ffffff;border-radius:50%;box-shadow:0 0 14px #0284c7;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const gmapsUserUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    this.userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(this.map);
    this.userMarker.bindPopup(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif; text-align:center; padding: 4px;">
        <span style="color:#0284c7; font-weight:800; font-size:12px;">Posisi Anda Saat Ini</span><br>
        <span style="font-size:11px; color:#64748b;">(${lat.toFixed(4)}, ${lon.toFixed(4)})</span><br>
        <a href="${gmapsUserUrl}" target="_blank" style="display:inline-block; margin-top:5px; color:#0284c7; font-size:11px; text-decoration:none; font-weight:700;">
          Buka di Google Maps
        </a>
      </div>
    `);

    if (this.currentEpicenterCoords) {
      const epLat = this.currentEpicenterCoords.lat;
      const epLon = this.currentEpicenterCoords.lon;

      this.distanceLine = L.polyline([[lat, lon], [epLat, epLon]], {
        color: '#0284c7',
        weight: 2,
        opacity: 0.8,
        dashArray: '6, 8'
      }).addTo(this.map);

      const bounds = L.latLngBounds([[lat, lon], [epLat, epLon]]);
      this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    } else {
      this.map.setView([lat, lon], 12);
    }
  }

  plotShelters(shelters = []) {
    if (!this.map) this.initMap();
    if (!this.map) return;

    this.shelterMarkers.forEach(m => this.map.removeLayer(m));
    this.shelterMarkers = [];

    shelters.forEach(s => {
      let iconColor = '#0d9488';
      let iconSymbol = '🏛️';
      if (s.type === 'gedung_tsunami') {
        iconColor = '#0284c7';
        iconSymbol = '🏢';
      } else if (s.type === 'tempat_tinggi') {
        iconColor = '#16a34a';
        iconSymbol = '⛰️';
      }

      const shelterIcon = L.divIcon({
        className: 'shelter-marker-pin',
        html: `<div style="background:${iconColor};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${iconSymbol}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const routeUrl = s.google_maps_route_url || `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;

      const marker = L.marker([s.latitude, s.longitude], { icon: shelterIcon }).addTo(this.map);
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif; padding:4px; max-width:220px;">
          <span style="background:${iconColor}; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:6px;">
            ${s.type_label || 'Titik Evakuasi'}
          </span>
          <h4 style="margin:6px 0 2px; font-size:13px; color:#0f172a; font-weight:700;">${s.name}</h4>
          <p style="margin:0 0 4px; font-size:11px; color:#475569;">${s.address}</p>
          ${s.distance_km ? `<p style="margin:0 0 6px; font-size:11px; font-weight:700; color:#0284c7;">Jarak: ${s.distance_km} km (~${s.walking_time_min} mnt jalan)</p>` : ''}
          <a href="${routeUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block; width:100%; text-align:center; background:#0d9488; color:#fff; text-decoration:none; padding:5px 8px; border-radius:6px; font-size:11px; font-weight:700;">
            Navigasi Google Maps
          </a>
        </div>
      `);
      this.shelterMarkers.push(marker);
    });
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
