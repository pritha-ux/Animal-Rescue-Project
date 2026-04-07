import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onSelect(lat, lng);
    },
  });
  return null;
}

export default function LocationPickerModal({ title, onConfirm, onCancel }) {
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [mapCenter] = useState([27.7172, 85.3240]); // default Kathmandu

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const handleMapClick = async (lat, lng) => {
    setMarker([lat, lng]);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarker([latitude, longitude]);
        const addr = await reverseGeocode(latitude, longitude);
        setAddress(addr);
        setLocating(false);
      },
      () => { alert('Unable to get location. Click on the map instead.'); setLocating(false); }
    );
  };

  const handleConfirm = () => {
    if (!marker) { alert('Please pin your location on the map first.'); return; }
    onConfirm({ lat: marker[0], lng: marker[1], address });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">📍 {title}</h3>
        <p className="modal-subtitle">
          Click on the map to pin your exact location. This will be shared with the volunteer.
        </p>

        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          style={{
            marginBottom: 12, background: '#eff6ff', color: '#2563eb',
            border: '1.5px solid #bfdbfe', borderRadius: 10,
            padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          }}>
          {locating ? '📡 Getting location...' : '📡 Use My Current Location'}
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '280px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onSelect={handleMapClick} />
            {marker && <Marker position={marker} />}
          </MapContainer>
        </div>

        {address && (
          <p style={{
            fontSize: '0.82rem', color: '#374151', background: '#f9fafb',
            borderRadius: 8, padding: '8px 12px', border: '1px solid #e5e7eb', marginBottom: 12,
          }}>
            📍 <strong>Pinned:</strong> {address}
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn-orange" onClick={handleConfirm} disabled={!marker}>
            Confirm Location
          </button>
          <button className="btn btn-gray" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}