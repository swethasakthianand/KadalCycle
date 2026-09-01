import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Map Marker Pin Icon
const packageIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div style="
      background: linear-gradient(135deg, #f59e0b, #d97706);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <span style="font-size: 16px;">📦</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export const MapView = ({ pickups = [], center = [13.128, 80.298], zoom = 12, height = "400px" }) => {
  // Default mock pickups if backend yields empty list during demo
  const displayPickups = pickups.length > 0 ? pickups : [
    {
      id: 'PKP-101',
      harbour_name: 'Kasimedu Fishing Harbour',
      waste_type: 'Fish Guts & Offal (மீன் கழிவு)',
      actual_weight_kg: 45,
      status: 'COMPLETED',
      coords: { lat: 13.128, lng: 80.298 }
    },
    {
      id: 'PKP-102',
      harbour_name: 'Royapuram Pier 2',
      waste_type: 'Ghost Nets & Plastics (பிளாஸ்டிக்)',
      actual_weight_kg: 120,
      status: 'IN TRANSIT',
      coords: { lat: 13.115, lng: 80.292 }
    }
  ];

  return (
    <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {displayPickups.map((pickup, idx) => {
          const lat = pickup.coords?.lat || pickup.latitude || (13.128 + idx * 0.008);
          const lng = pickup.coords?.lng || pickup.longitude || (80.298 - idx * 0.005);
          const status = (pickup.status || 'REQUESTED').toUpperCase();
          const statusStyles = {
            COMPLETED: { backgroundColor: '#dcfce7', color: '#166534' },
            'IN TRANSIT': { backgroundColor: '#dbeafe', color: '#1d4ed8' },
            REQUESTED: { backgroundColor: '#fef3c7', color: '#92400e' }
          }[status] || { backgroundColor: '#f1f5f9', color: '#475569' };
          const weight = pickup.actual_weight_kg ?? pickup.estimated_weight_kg ?? 0;
          const wasteType = pickup.waste_type || pickup.waste_classification || 'Fish Guts & Offal (மீன் கழிவு)';

          return (
            <Marker key={pickup.id || idx} position={[lat, lng]} icon={packageIcon}>
              <Popup className="custom-popup">
                <div style={{ padding: '4px', minWidth: '210px', fontFamily: 'sans-serif' }}>
                  {/* Title & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px' }}>📦</span>
                    <strong style={{ color: '#854d0e', fontSize: '14px', lineHeight: '1.2' }}>
                      {pickup.harbour_name || 'Kasimedu Fishing Harbour'}
                    </strong>
                  </div>

                  {/* Waste Type & Quantity */}
                  <div style={{ color: '#334155', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                    {wasteType} • {weight} kg
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    ...statusStyles,
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '0.5px'
                  }}>
                    Status: {status}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};