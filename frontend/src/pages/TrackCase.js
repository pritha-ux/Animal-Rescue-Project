import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackCase } from '../api';
import StatusBadge from '../components/StatusBadge';
import '../styles/Cases.css';
import '../styles/Modal.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const truncateAddress = (addr) => {
  if (!addr) return '—';
  const parts = addr.split(',');
  return parts.slice(0, 2).join(',').trim();
};

const groupHistory = (history) => {
  if (!history?.length) return [];
  const groups = [];
  history.forEach(h => {
    const last = groups[groups.length - 1];
    if (last && last.status === h.status) {
      last.events.push(h);
    } else {
      groups.push({ status: h.status, events: [h] });
    }
  });
  return groups;
};

export default function TrackCase() {
  const { caseId: paramId } = useParams();
  const [caseId, setCaseId] = useState(paramId || '');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await trackCase(caseId.toUpperCase());
      setCaseData(res.data);
    } catch {
      setError('Case not found. Please check the Case ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupedHistory = groupHistory(caseData?.statusHistory);

  return (
    <div className="track-page">
      <div className="track-container">
        <div className="track-header">
          <div className="track-icon">🐾</div>
          <h1>Track Your Case</h1>
          <p>Enter your Case ID to see the current status</p>
        </div>

        <div className="track-search-box">
          <form onSubmit={handleTrack}>
            <div className="track-search-row">
              <input
                className="track-input"
                type="text"
                value={caseId}
                onChange={e => setCaseId(e.target.value)}
                required
                placeholder="CASE-0001"
              />
              <button type="submit" className="track-btn" disabled={loading}>
                {loading ? '...' : 'Track'}
              </button>
            </div>
            {error && <p className="track-error">{error}</p>}
          </form>
        </div>

        {caseData && (
          <div className="track-results">

            {/* Case Info */}
            <div className="track-card">
              <div className="track-card-header">
                <div>
                  <div className="track-card-id">{caseData.caseId}</div>
                  <div className="track-card-animal">{caseData.animalType} • {caseData.animalName}</div>
                </div>
                <StatusBadge status={caseData.status} />
              </div>
              <p className="track-card-desc">{caseData.description}</p>
              <p className="track-card-meta">📍 {truncateAddress(caseData.location?.address)}</p>
              <p className="track-card-meta">📅 Reported: {formatDateTime(caseData.createdAt)}</p>
            </div>

            {/* Assigned Team */}
            <div className="track-card">
              <div className="team-section">
                <h3>👥 Assigned Team</h3>
                {caseData?.assignedVolunteer ? (
                  <div className="team-row">
                    🙋 Volunteer: {caseData.assignedVolunteer.name} • {caseData.assignedVolunteer.phone || 'No phone'}
                  </div>
                ) : (
                  <div className="team-row muted">🙋 Volunteer: Not assigned yet</div>
                )}
                {caseData?.assignedVet ? (
                  <div className="team-row">
                    🩺 Veterinarian: {caseData.assignedVet.name} • {caseData.assignedVet.phone || 'No phone'}
                  </div>
                ) : (
                  <div className="team-row muted">🩺 Veterinarian: Not assigned yet</div>
                )}
                {caseData?.assignedShelter ? (
                  <div className="team-row">
                    🏠 Shelter: {caseData.assignedShelter.name} • {caseData.assignedShelter.phone || 'No phone'}
                  </div>
                ) : (
                  <div className="team-row muted">🏠 Shelter: Not assigned yet</div>
                )}
              </div>
            </div>

            {/* ── Status History — compact + modal ── */}
            <div className="track-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>📋 Status History</h3>
                {groupedHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    style={{
                      fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                      background: '#ea580c', border: 'none', borderRadius: 8,
                      padding: '6px 14px', cursor: 'pointer',
                    }}>
                    View All ({groupedHistory.length})
                  </button>
                )}
              </div>

              {groupedHistory.length === 0 && (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No status updates yet.</p>
              )}

              {/* Show only latest 2 inline */}
              {groupedHistory.slice(-2).reverse().map((group, i, arr) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot-col">
                    <div className="timeline-dot" />
                    {i < arr.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <StatusBadge status={group.status} />
                    {group.events.slice(-1).map((ev, j) => (
                      <div key={j} style={{ marginTop: 6 }}>
                        {ev.note && <p className="timeline-note">{ev.note}</p>}
                        <p className="timeline-time">{formatDateTime(ev.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {groupedHistory.length > 2 && (
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 10, fontStyle: 'italic' }}>
                  +{groupedHistory.length - 2} more updates — click "View All" to see full history
                </p>
              )}
            </div>

            {/* Medical Records */}
            {caseData.medicalRecords?.length > 0 && (
              <div className="track-card">
                <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🩺 Medical Records</h3>
                {caseData.medicalRecords.map((m, i) => (
                  <div key={i} className="medical-item">
                    <strong>{m.diagnosis}</strong>
                    <p>Treatment: {m.treatment}</p>
                    {m.medications && <p>Medications: {m.medications}</p>}
                    {m.notes && <p>{m.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Shelter Care Details */}
            {caseData?.shelterDetails && (
              <div className="track-card">
                <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🏠 Shelter Care Details</h3>
                {caseData.shelterDetails.cage_number && <p>Cage: {caseData.shelterDetails.cage_number}</p>}
                {caseData.shelterDetails.diet && <p>Diet: {caseData.shelterDetails.diet}</p>}
                {caseData.shelterDetails.health_status && <p>Health: {caseData.shelterDetails.health_status}</p>}
                {caseData.shelterDetails.notes && <p>Notes: {caseData.shelterDetails.notes}</p>}
              </div>
            )}

            {/* Outcome */}
            {caseData.outcome && (
              <div className="outcome-card">
                <h3>🎉 {caseData.outcome.replace(/_/g, ' ').toUpperCase()}</h3>
                {caseData.outcomeDetails?.adopterName && <p>Adopted by: {caseData.outcomeDetails.adopterName}</p>}
                {caseData.outcomeDetails?.ownerName && <p>Returned to: {caseData.outcomeDetails.ownerName}</p>}
              </div>
            )}
          </div>
        )}

        <div className="track-back">
          <button onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* ── Full History Modal ── */}
        {showHistory && caseData && (
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal history-modal" onClick={e => e.stopPropagation()}>
              <div className="history-modal-header">
                <div>
                  <h3 className="modal-title">Case Timeline</h3>
                  <p className="modal-subtitle">
                    <span className="case-id">{caseData.caseId}</span> — {caseData.animalName || 'Unknown'} ({caseData.animalType})
                  </p>
                </div>
                <button className="history-modal-close" onClick={() => setShowHistory(false)}>✕</button>
              </div>
              <div className="timeline-wrapper">
                {groupedHistory.map((group, i) => (
                  <div key={i} className="timeline-row">
                    <div className="timeline-left">
                      <div className={`timeline-dot ${i === groupedHistory.length - 1 ? 'active' : ''}`} />
                      {i < groupedHistory.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-top">
                        <StatusBadge status={group.status} />
                        <span className="timeline-time">{formatDateTime(group.events[0].timestamp)}</span>
                      </div>
                      {group.events.map((ev, j) => (
                        <div key={j} style={{
                          marginTop: j === 0 ? 4 : 8,
                          paddingLeft: j > 0 ? 10 : 0,
                          borderLeft: j > 0 ? '2px solid #f3f4f6' : 'none'
                        }}>
                          {ev.note && <p className="timeline-note">{ev.note}</p>}
                          {j > 0 && <p className="timeline-time">{formatDateTime(ev.timestamp)}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setShowHistory(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}