import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reportCase } from '../api';
import Navbar from '../components/Navbar';
import '../styles/Cases.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

export default function ReportCase() {
  const [form, setForm] = useState({ animalName: '', animalType: '', description: '', address: '', lat: '', lng: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [marker, setMarker] = useState(null);
  const [locating, setLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]);
  const navigate = useNavigate();

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const handleMapClick = async (lat, lng) => {
    setMarker([lat, lng]);
    const address = await reverseGeocode(lat, lng);
    setForm(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6), address }));
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarker([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        const address = await reverseGeocode(latitude, longitude);
        setForm(prev => ({ ...prev, lat: latitude.toFixed(6), lng: longitude.toFixed(6), address }));
        setLocating(false);
      },
      () => { alert('Unable to get location. Click on map instead.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach(img => formData.append('images', img));
      const res = await reportCase(formData);
      setSuccess(res.data.case.caseId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="report-page">
        <Navbar />
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Case Reported!</h2>
          <p>Your case ID is:</p>
          <div className="case-id-box"><span>{success}</span></div>
          <p className="success-hint">Save this ID to track your case status anytime.</p>
          <div className="success-actions">
            <button className="btn btn-orange" onClick={() => navigate(`/track/${success}`)}>Track Case</button>
            <button className="btn btn-gray" onClick={() => navigate('/public')}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <Navbar />
      <div className="report-container">
        <h1 className="report-title">🐾 Report an Animal</h1>
        {error && <div className="alert-error">{error}</div>}

        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Animal Name (optional)</label>
              <input type="text" placeholder="e.g. Buddy"
                value={form.animalName} onChange={e => setForm({ ...form, animalName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Animal Type *</label>
              <select required value={form.animalType} onChange={e => setForm({ ...form, animalType: e.target.value })}>
                <option value="">Select type</option>
                {['dog','cat','bird','cow','horse','rabbit','other'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea required rows={3} placeholder="Describe the animal's condition..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-group">
            <label>📍 Pin Location on Map *</label>
            <p className="map-hint">Click anywhere on the map to drop a pin, or use your current location.</p>
            <button type="button" className="locate-btn" onClick={handleMyLocation} disabled={locating}>
              {locating ? '📡 Getting location...' : '📡 Use My Current Location'}
            </button>
            <div className="map-wrapper">
              <MapContainer center={mapCenter} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '10px' }} key={mapCenter.toString()}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker onLocationSelect={handleMapClick} />
                {marker && <Marker position={marker} />}
              </MapContainer>
            </div>
          </div>

          <div className="form-group">
            <label>Location Address *</label>
            <input type="text" required placeholder="Click on map to auto-fill address"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="text" readOnly placeholder="Auto-filled" value={form.lat} style={{ background: '#f9fafb' }} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="text" readOnly placeholder="Auto-filled" value={form.lng} style={{ background: '#f9fafb' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Upload Photos</label>
            <input type="file" multiple accept="image/*" onChange={e => setImages([...e.target.files])} />
            {images.length > 0 && <p className="file-hint">{images.length} photo(s) selected</p>}
          </div>

          <button type="submit" className="report-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : '🐾 Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
