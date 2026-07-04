"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const iconOn = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconOff = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A component to automatically fit the map bounds to all markers
function FitBounds({ markers }: { markers: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  return null;
}

export type DashcamVehicle = {
  device_sn: string;
  car_name: string;
  online_state: number;
  latitude: number | null;
  longitude: number | null;
  speed: string;
  acc_state: string;
  signal_strength: string;
  satellite_count: string;
  // Tambahan dari matching database
  dbId?: number;
  nopol?: string;
};

export default function FleetMap({ vehicles }: { vehicles: DashcamVehicle[] }) {
  // Filter vehicles that have valid coordinates
  const validVehicles = vehicles.filter(v => v.latitude !== null && v.longitude !== null && (v.latitude !== 0 || v.longitude !== 0));
  const markers = validVehicles.map(v => ({ lat: v.latitude!, lng: v.longitude! }));

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '1rem', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
      <MapContainer 
        center={[-7.250445, 112.768845]} // Default center (Surabaya)
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validVehicles.map((vehicle, index) => (
          <Marker key={vehicle.device_sn || index} position={[vehicle.latitude!, vehicle.longitude!]} icon={vehicle.acc_state?.toUpperCase() === 'ON' ? iconOn : iconOff}>
            <Tooltip direction="top" offset={[0, -30]} opacity={0.9}>
              <div className="font-sans text-center">
                <p className="font-bold text-slate-800">{vehicle.car_name}</p>
                {vehicle.nopol && <p className="text-xs font-semibold text-indigo-600">{vehicle.nopol}</p>}
              </div>
            </Tooltip>
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-sm mb-1">{vehicle.car_name}</h3>
                {vehicle.nopol && (
                  <p className="text-xs text-indigo-600 font-semibold mb-2">No. Polisi: {vehicle.nopol}</p>
                )}
                <div className="text-xs space-y-1">
                  <p><b>Status Mesin:</b> {vehicle.acc_state}</p>
                  <p><b>Kecepatan:</b> {vehicle.speed}</p>
                  <p><b>Sinyal:</b> {vehicle.signal_strength}</p>
                  <p><b>Satelit:</b> {vehicle.satellite_count}</p>
                  <p><b>Koordinat:</b> {vehicle.latitude}, {vehicle.longitude}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {markers.length > 0 && <FitBounds markers={markers} />}
      </MapContainer>
    </div>
  );
}
