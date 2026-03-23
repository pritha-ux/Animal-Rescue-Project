import { useState, useEffect } from 'react';
import { getVolunteerCases, acceptCase, declineCase, markInTransit, getVolunteerStaff, assignVetByVolunteer, assignShelterByVolunteer } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function VolunteerDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [vets, setVets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedShelter, setSelectedShelter] = useState('');
  const [expandedHistory, setExpandedHistory] = useState({});

  const toggleHistory = (id) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const load = () => {
    getVolunteerCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getVolunteerStaff().then(r => {
      setVets(r.data.vets);
      setShelters(r.data.shelters);
    }).catch(() => {});
  }, []);

  const handle = async (fn, successMsg) => {
    await fn();
    setMsg(successMsg);
    load();
  };

  const handleAssignVet = async () => {
    if (!selectedVet) return;
    await assignVetByVolunteer(modal._id, { vetId: selectedVet });
    setMsg('Veterinarian assigned!');
    setModal(null);
    setSelectedVet('');
    load();
  };

  const handleAssignShelter = async () => {
    if (!selectedShelter) return;
    await assignShelterByVolunteer(modal._id, { shelterId: selectedShelter });
    setMsg('Shelter assigned!');
    setModal(null);
    setSelectedShelter('');
    load();
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Volunteer Dashboard</h1>
        </div>

        {msg && (
          <div className="alert-success">
            {msg}
            <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {loading ? <div className="loading">Loading your cases...</div>
          : cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🙋</div>
              <h3>No cases assigned yet</h3>
              <p>Cases assigned to you will appear here.</p>
            </div>
          ) : (
            <div className="case-list">
              {cases.map(c => (
                <div key={c._id} className="case-card">
                  <div className="case-card-header">
                    <div className="case-card-id-row">
                      <span className="case-id">{c.caseId}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="case-card-date">{formatDateTime(c.createdAt)}</span>
                  </div>

                  <p className="case-card-title">{c.animalName || 'Unknown'} ({c.animalType})</p>
                  <p className="case-card-desc">{c.description}</p>
                  <p className="case-card-meta">📍 {c.location?.address}</p>
                  {c.reportedBy && (
                    <p className="case-card-meta">👤 {c.reportedBy.name} • {c.reportedBy.phone}</p>
                  )}

                  {/* Assigned team info */}
                  <div className="case-assign-info">
                    <p className="case-card-meta">
                      🩺 Vet: {c.assignedVet
                        ? <strong>{c.assignedVet.name}</strong>
                        : <span style={{ color: '#ea580c' }}>Not assigned</span>}
                    </p>
                    <p className="case-card-meta">
                      🏠 Shelter: {c.assignedShelter
                        ? <strong>{c.assignedShelter.name}</strong>
                        : <span style={{ color: '#ea580c' }}>Not assigned</span>}
                    </p>
                  </div>

                  {/* Collapsible Status History */}
                  {c.statusHistory?.length > 0 && (
                    <div className="history-wrapper">
                      <button
                        className="history-toggle"
                        onClick={() => toggleHistory(c._id)}>
                        <span>Status History ({c.statusHistory.length})</span>
                        <span className="history-arrow">
                          {expandedHistory[c._id] ? '▲' : '▼'}
                        </span>
                      </button>

                      {expandedHistory[c._id] && (
                        <div className="history-content">
                          {c.statusHistory.map((h, i) => (
                            <div key={i} className="history-item">
                              <StatusBadge status={h.status} />
                              <span className="history-time">{formatDateTime(h.timestamp)}</span>
                              {h.note && <span className="history-note">— {h.note}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="case-card-actions">
                    {c.status === 'assigned' && (
                      <>
                        <button className="btn btn-green"
                          onClick={() => handle(() => acceptCase(c._id), 'Case accepted!')}>
                          Accept Case
                        </button>
                        <button className="btn btn-red"
                          onClick={() => handle(() => declineCase(c._id, { reason: 'Cannot attend' }), 'Case declined')}>
                          Decline
                        </button>
                      </>
                    )}

                    {c.status === 'volunteer_accepted' && (
                      <button className="btn btn-purple"
                        onClick={() => handle(() => markInTransit(c._id), 'Marked as in transit!')}>
                        Mark In Transit
                      </button>
                    )}

                    {c.status === 'in_transit' && (
                      <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.88rem' }}>
                        Currently in transit to vet...
                      </span>
                    )}

                    {['volunteer_accepted', 'in_transit', 'at_vet', 'treatment_done'].includes(c.status) && (
                      <button className="btn btn-orange"
                        onClick={() => { setModal(c); setSelectedVet(''); setSelectedShelter(''); }}>
                        Assign Vet & Shelter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Assign Modal */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Assign Vet & Shelter</h3>
              <p className="modal-subtitle">
                Case: <strong>{modal.caseId}</strong> — {modal.animalType} at {modal.location?.address}
              </p>

              <div className="modal-form">
                <div>
                  {modal.assignedVet ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Veterinarian Assigned</p>
                      <p style={{ fontWeight: 700, color: '#1a1a2e' }}>✅ {modal.assignedVet.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="modal-section-label">Assign Veterinarian</p>
                      <div className="modal-assign-row">
                        <select value={selectedVet} onChange={e => setSelectedVet(e.target.value)}>
                          <option value="">Select veterinarian...</option>
                          {vets.map(v => (
                            <option key={v._id} value={v._id}>{v.name} — {v.phone || v.email}</option>
                          ))}
                        </select>
                        <button className="btn btn-orange" onClick={handleAssignVet}>Assign</button>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="modal-divider" />

                <div>
                  {modal.assignedShelter ? (
                    <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '12px 16px' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Shelter Assigned</p>
                      <p style={{ fontWeight: 700, color: '#1a1a2e' }}>✅ {modal.assignedShelter.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="modal-section-label">Assign Shelter</p>
                      <div className="modal-assign-row">
                        <select value={selectedShelter} onChange={e => setSelectedShelter(e.target.value)}>
                          <option value="">Select shelter...</option>
                          {shelters.map(s => (
                            <option key={s._id} value={s._id}>{s.name} — {s.phone || s.email}</option>
                          ))}
                        </select>
                        <button className="btn btn-teal" onClick={handleAssignShelter}>Assign</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}