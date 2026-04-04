import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCases } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Cases.css';

const truncateAddress = (addr) => {
  if (!addr) return '—';
  const parts = addr.split(',');
  return parts.slice(0, 2).join(',').trim();
};

const PREVIEW_COUNT = 3;

export default function PublicDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackId, setTrackId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCases().then(res => setCases(res.data)).finally(() => setLoading(false));
  }, []);

  const displayedCases = showAll ? cases : cases.slice(0, PREVIEW_COUNT);

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
            <input
              className="track-input" type="text" value={trackId}
              onChange={e => setTrackId(e.target.value)}
              placeholder="Enter Case ID e.g. CASE-0001"
              style={{ fontFamily: 'monospace', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '10px 14px', fontSize: '0.92rem', flex: 1 }}
            />
            <button className="track-btn"
              onClick={() => trackId && navigate(`/track/${trackId.toUpperCase()}`)}>
              Track
            </button>
          </div>
        </div>

        {/* Cases */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="card-title" style={{ margin: 0 }}>📋 My Reported Cases</h2>
          {cases.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer' }}>
              {showAll ? 'Show Less ↑' : `View All (${cases.length}) ↓`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading your cases...</div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <p>No cases reported yet.</p>
            <button className="btn btn-green" onClick={() => navigate('/report')}>Report an Animal</button>
          </div>
        ) : (
          <>
            <div className="case-list">
              {displayedCases.map(c => (
                <div key={c._id} className="case-card"
                  onClick={() => navigate(`/track/${c.caseId}`)}
                  style={{ cursor: 'pointer' }}>
                  <div className="case-card-header">
                    <div className="case-card-id-row">
                      <span className="case-id">{c.caseId}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="case-card-date">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="case-card-title">{c.animalName || 'Unknown'} ({c.animalType})</p>
                  <p className="case-card-desc">{c.description}</p>
                  <p className="case-card-meta">📍 {truncateAddress(c.location?.address)}</p>
                </div>
              ))}
            </div>

            {!showAll && cases.length > PREVIEW_COUNT && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => setShowAll(true)}
                  style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '9px 20px', cursor: 'pointer' }}>
                  View All {cases.length} Cases ↓
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}