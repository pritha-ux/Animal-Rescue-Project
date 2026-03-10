import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportCase } from '../api';
import Navbar from '../components/Navbar';
import '../styles/Cases.css';

export default function ReportCase() {
  const [form, setForm] = useState({ animalName: '', animalType: '', description: '', address: '', lat: '', lng: '' });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          <div className="case-id-box">
            <span>{success}</span>
          </div>
          <p className="success-hint">Save this ID to track your case status anytime.</p>
          <div className="success-actions">
            <button className="btn btn-green" onClick={() => navigate(`/track/${success}`)}>
              Track Case
            </button>
            <button className="btn btn-gray" onClick={() => navigate('/public')}>
              Dashboard
            </button>
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
            <textarea required rows={4} placeholder="Describe the animal's condition, injuries, behavior..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Location Address *</label>
            <input type="text" required placeholder="e.g. Near Ratna Park, Kathmandu"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude (optional)</label>
              <input type="number" step="any" placeholder="27.7172"
                value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Longitude (optional)</label>
              <input type="number" step="any" placeholder="85.3240"
                value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
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
