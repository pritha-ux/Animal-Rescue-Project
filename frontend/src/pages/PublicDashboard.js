import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCases } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Cases.css';

export default function PublicDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackId, setTrackId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMyCases().then(res => setCases(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Dashboard</h1>
          <button className="btn btn-green" onClick={() => navigate('/report')}>+ Report Animal</button>
        </div>

        {/* Quick Track */}
        <div className="card">
          <h2 className="card-title">🔍 Quick Track</h2>
          <div className="track-search-row">
            <input className="track-input" type="text" value={trackId}
              onChange={e => setTrackId(e.target.value)}
              placeholder="Enter Case ID e.g. CASE-0001"
              style={{ fontFamily: 'monospace', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: '0.92rem', flex: 1 }}
            />
            <button className="track-btn" onClick={() => trackId && navigate(`/track/${trackId.toUpperCase()}`)}>
              Track
            </button>
          </div>
        </div>

        {/* Cases */}
        <h2 className="card-title" style={{ marginBottom: 12 }}>📋 My Reported Cases</h2>
        {loading ? (
          <div className="loading">Loading your cases...</div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <p>No cases reported yet.</p>
            <button className="btn btn-green" onClick={() => navigate('/report')}>Report an Animal</button>
          </div>
        ) : (
          <div className="case-list">
            {cases.map(c => (
              <div key={c._id} className="case-card" onClick={() => navigate(`/track/${c.caseId}`)}
                style={{ cursor: 'pointer' }}>
                <div className="case-card-header">
                  <div className="case-card-id-row">
                    <span className="case-id">{c.caseId}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <span className="case-card-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="case-card-title">{c.animalName} ({c.animalType})</p>
                <p className="case-card-desc">{c.description}</p>
                <p className="case-card-meta">📍 {c.location?.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
