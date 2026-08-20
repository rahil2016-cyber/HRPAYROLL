import React, { useEffect, useRef } from 'react';

export default function LeafletMap({ officeLat, officeLng, employeeLat, employeeLng, radiusMeters = 150 }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Check if L is loaded from index.html CDN
    if (!window.L || !mapContainerRef.current) return;

    const L = window.L;

    // Define color markers matching corporate themes
    const officeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const employeeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Reset previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const oLat = parseFloat(officeLat || 12.9716);
      const oLng = parseFloat(officeLng || 77.5946);
      const eLat = employeeLat ? parseFloat(employeeLat) : null;
      const eLng = employeeLng ? parseFloat(employeeLng) : null;

      const map = L.map(mapContainerRef.current).setView([oLat, oLng], 15);
      mapInstanceRef.current = map;

      // Render Map Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Office Target Marker
      L.marker([oLat, oLng], { icon: officeIcon })
        .addTo(map)
        .bindPopup('<b>Office Branch Location</b><br/>Geofence focal point.')
        .openPopup();

      // Geofence Circle
      L.circle([oLat, oLng], {
        color: '#0047B8',
        fillColor: '#0047B8',
        fillOpacity: 0.12,
        radius: parseInt(radiusMeters)
      }).addTo(map);

      // Employee Marker (if checked in and valid coords)
      if (eLat !== null && eLng !== null) {
        L.marker([eLat, eLng], { icon: employeeIcon })
          .addTo(map)
          .bindPopup('<b>Clocking Location</b><br/>Verified coordinate checkpoint.')
          .openPopup();

        // Connector line
        L.polyline([[oLat, oLng], [eLat, eLng]], {
          color: '#E30613',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.8
        }).addTo(map);

        // Adjust bounds
        const bounds = L.latLngBounds([[oLat, oLng], [eLat, eLng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.error("Map initialization failed:", err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [officeLat, officeLng, employeeLat, employeeLng, radiusMeters]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {!window.L && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem', zIndex: 10 }}>
          Loading Leaflet mapping layers...
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '300px', zIndex: 1 }} />
    </div>
  );
}
