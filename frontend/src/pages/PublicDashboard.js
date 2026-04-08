import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCases } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Cases.css';
import '../styles/Modal.css';

const truncateAddress = (addr) => {
  if (!addr) return '—';
  const parts = addr.split(',');
  return parts.slice(0, 2).join(',').trim();
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const CardTimestamps = ({ createdAt, statusHistory }) => {
  const latestTimestamp = statusHistory?.length > 0
    ? statusHistory[statusHistory.length - 1].timestamp
    : null;
  return (
    <div className="case-card-dates">
      <span className="case-card-date">
        <span className="date-label">Reported:</span> {formatDateTime(createdAt)}
      </span>
      {latestTimestamp && latestTimestamp !== createdAt && (
        <span className="case-card-date">
          <span className="date-label">Updated:</span> {formatDateTime(latestTimestamp)}
        </span>
      )}
    </div>
  );
};

const CASES_PER_PAGE = 2;

export default function PublicDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackId, setTrackId] = useState('');
  const [page, setPage] = useState(1);
  const [historyModal, setHistoryModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCases().then(res => setCases(res.data)).finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(cases.length / CASES_PER_PAGE);
  const pagedCases = cases.slice((page - 1) * CASES_PER_PAGE, page * CASES_PER_PAGE);

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

        {/* Cases Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="card-title" style={{ margin: 0 }}>📋 My Reported Cases</h2>
          {cases.length > 0 && (
            <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 500 }}>
              {cases.length} case{cases.length !== 1 ? 's' : ''} total
            </span>
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
              {pagedCases.map(c => (
                <div key={c._id} className="case-card"
                  onClick={() => navigate(`/track/${c.caseId}`)}
                  style={{ cursor: 'pointer' }}>
                  <div className="case-card-header">
                    <div className="case-card-id-row">
                      <span className="case-id">{c.caseId}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    {/* ── Same Reported/Updated timestamps ── */}
                    <CardTimestamps createdAt={c.createdAt} statusHistory={c.statusHistory} />
                  </div>
                  <p className="case-card-title">{c.animalName || 'Unknown'} ({c.animalType})</p>
                  <p className="case-card-desc">{c.description}</p>
                  <p className="case-card-meta">📍 {truncateAddress(c.location?.address)}</p>

                  {c.statusHistory?.length > 0 && (
                    <div className="case-summary-row" onClick={e => e.stopPropagation()}>
                      <div className="case-latest-status">
                        <span className="summary-label">Latest:</span>
                        <span className="summary-note">
                          {c.statusHistory[c.statusHistory.length - 1].note || 'Status updated'}
                        </span>
                      </div>
                      <button className="history-chip"
                        onClick={e => { e.stopPropagation(); setHistoryModal(c); }}>
                        History ({c.statusHistory.length})
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <button className="pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}>
                  ← Prev
                </button>
                <span className="pagination-info">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* History Modal */}
        {historyModal && (
          <div className="modal-overlay" onClick={() => setHistoryModal(null)}>
            <div className="modal history-modal" onClick={e => e.stopPropagation()}>
              <div className="history-modal-header">
                <div>
                  <h3 className="modal-title">Case Timeline</h3>
                  <p className="modal-subtitle">
                    <span className="case-id">{historyModal.caseId}</span> — {historyModal.animalName || 'Unknown'} ({historyModal.animalType})
                  </p>
                </div>
                <button className="history-modal-close" onClick={() => setHistoryModal(null)}>✕</button>
              </div>
              <div className="timeline-wrapper">
                {historyModal.statusHistory.map((h, i) => (
                  <div key={i} className="timeline-row">
                    <div className="timeline-left">
                      <div className={`timeline-dot ${i === historyModal.statusHistory.length - 1 ? 'active' : ''}`} />
                      {i < historyModal.statusHistory.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-top">
                        <StatusBadge status={h.status} />
                        <span className="timeline-time">{formatDateTime(h.timestamp)}</span>
                      </div>
                      {h.note && <p className="timeline-note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setHistoryModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}