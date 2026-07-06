"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Perbaikan ikon Leaflet default yang hilang di Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Komponen pembantu agar peta otomatis geser ke lokasi terbaru
function RecenterAutomatically({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function TrackingMap({ 
  location 
}: { 
  location: { lat: number; lng: number } | null 
}) {
  const centerPosition = location ? [location.lat, location.lng] : [-6.200000, 106.816666];

  return (
    <MapContainer 
      center={centerPosition as L.LatLngExpression} 
      zoom={location ? 16 : 14} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {location && (
        <>
          <Marker position={[location.lat, location.lng]} icon={customIcon} />
          <RecenterAutomatically lat={location.lat} lng={location.lng} />
        </>
      )}
    </MapContainer>
  );
}
