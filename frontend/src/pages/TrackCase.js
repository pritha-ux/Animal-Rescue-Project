import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trackCase } from '../api';
import StatusBadge from '../components/StatusBadge';
import '../styles/Cases.css';

export default function TrackCase() {
  const { caseId: paramId } = useParams();
  const [caseId, setCaseId] = useState(paramId || '');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
              <p className="track-card-meta">📍 {caseData.location?.address}</p>
              <p className="track-card-meta">📅 Reported: {new Date(caseData.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Assigned Team */}
            <div className="track-card">
              <div className="team-section">
                <h3>👥 Assigned Team</h3>
                <p className={`team-row ${caseData.assignedVolunteer ? '' : 'muted'}`}>
                  🙋 Volunteer: {caseData.assignedVolunteer ? `${caseData.assignedVolunteer.name} • ${caseData.assignedVolunteer.phone}` : 'Not assigned yet'}
                </p>
                <p className={`team-row ${caseData.assignedVet ? '' : 'muted'}`}>
                  🩺 Veterinarian: {caseData.assignedVet ? caseData.assignedVet.name : 'Not assigned yet'}
                </p>
                <p className={`team-row ${caseData.assignedShelter ? '' : 'muted'}`}>
                  🏠 Shelter: {caseData.assignedShelter ? caseData.assignedShelter.name : 'Not assigned yet'}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="track-card">
              <div className="timeline">
                <h3>📋 Status History</h3>
                {caseData.statusHistory?.map((h, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot-col">
                      <div className="timeline-dot" />
                      {i < caseData.statusHistory.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                      <StatusBadge status={h.status} />
                      <p className="timeline-note">{h.note}</p>
                      <p className="timeline-time">{new Date(h.timestamp).toLocaleString()}</p>
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
