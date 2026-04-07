import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackCase } from '../api';
import StatusBadge from '../components/StatusBadge';
import '../styles/Cases.css';

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

// Group consecutive same-status events
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
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowAll(false);
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
  const displayedGroups = showAll ? groupedHistory : groupedHistory.slice(-4).reverse();

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
              <input className="track-input" type="text" value={caseId}
                onChange={e => setCaseId(e.target.value)} required placeholder="CASE-0001" />
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

    {/* Volunteer */}
    {caseData?.assignedVolunteer ? (
      <p>🙋 Volunteer: {caseData.assignedVolunteer.name} • {caseData.assignedVolunteer.phone || 'No phone'}</p>
    ) : (
      <p className="muted">🙋 Volunteer: Not assigned yet</p>
    )}

    {/* Veterinarian */}
    {caseData?.assignedVet ? (
      <p>🩺 Veterinarian: {caseData.assignedVet.name} • {caseData.assignedVet.phone || 'No phone'}</p>
    ) : (
      <p className="muted">🩺 Veterinarian: Not assigned yet</p>
    )}

    {/* Shelter */}
    {caseData?.assignedShelter ? (
      <p>🏠 Shelter: {caseData.assignedShelter.name} • {caseData.assignedShelter.phone || 'No phone'}</p>
    ) : (
      <p className="muted">🏠 Shelter: Not assigned yet</p>
    )}

  </div>
</div>
            {/* Timeline */}
            <div className="track-card">
              <div className="timeline">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ margin: 0 }}>📋 Status History</h3>
                  {groupedHistory.length > 4 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showAll ? 'Show Less ↑' : `Show All (${groupedHistory.length}) ↓`}
                    </button>
                  )}
                </div>

                {!showAll && groupedHistory.length > 4 && (
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 12, fontStyle: 'italic' }}>
                    Showing latest 4 updates
                  </p>
                )}

                {displayedGroups.map((group, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot-col">
                      <div className="timeline-dot" />
                      {i < displayedGroups.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                      <StatusBadge status={group.status} />
                      {group.events.map((ev, j) => (
                        <div key={j} style={{ marginTop: j === 0 ? 6 : 8, paddingLeft: j > 0 ? 8 : 0, borderLeft: j > 0 ? '2px solid #f3f4f6' : 'none' }}>
                          {ev.note && <p className="timeline-note">{ev.note}</p>}
                          <p className="timeline-time">{formatDateTime(ev.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
      </div>
    </div>
  );
}