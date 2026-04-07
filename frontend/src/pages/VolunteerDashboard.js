import { useState, useEffect } from 'react';
import { getVolunteerCases, acceptCase, declineCase, markInTransit, getVolunteerStaff, assignVetByVolunteer, assignShelterByVolunteer, getMyCases } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

const CASES_PER_PAGE = 2;

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

const Pagination = ({ currentPage, totalPages, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <button className="pagination-btn" onClick={onPrev} disabled={currentPage === 1}>
        ← Prev
      </button>
      <span className="pagination-info">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>
      <button className="pagination-btn" onClick={onNext} disabled={currentPage === totalPages}>
        Next →
      </button>
    </div>
  );
};

export default function VolunteerDashboard() {
  const [cases, setCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [vets, setVets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [modal, setModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [selectedVet, setSelectedVet] = useState('');
  const [selectedShelter, setSelectedShelter] = useState('');
  const [view, setView] = useState('dashboard');

  const [assignedPage, setAssignedPage] = useState(1);
  const [reportedPage, setReportedPage] = useState(1);

  const assignedTotalPages = Math.ceil(cases.length / CASES_PER_PAGE);
  const reportedTotalPages = Math.ceil(myCases.length / CASES_PER_PAGE);

  const pagedAssigned = cases.slice(
    (assignedPage - 1) * CASES_PER_PAGE,
    assignedPage * CASES_PER_PAGE
  );
  const pagedReported = myCases.slice(
    (reportedPage - 1) * CASES_PER_PAGE,
    reportedPage * CASES_PER_PAGE
  );

  const load = async () => {
    setLoading(true);
    try {
      const [assignedRes, myRes] = await Promise.all([
        getVolunteerCases(),
        getMyCases(),
      ]);
      setCases(assignedRes.data);
      setMyCases(myRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getVolunteerStaff().then(r => {
      setVets(r.data.vets || []);
      setShelters(r.data.shelters || []);
    }).catch(() => {});
  }, []);

  const goToView = (v) => {
    setView(v);
    setAssignedPage(1);
    setReportedPage(1);
  };

  const handle = async (fn, successMsg) => {
    try {
      await fn();
      setMsg(successMsg);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleAssignVet = async () => {
    if (!selectedVet || !modal?._id) return;
    try {
      await assignVetByVolunteer(modal._id, { vetId: selectedVet });
      setMsg('Veterinarian assigned!');
      setModal(null);
      setSelectedVet('');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to assign vet.');
    }
  };

  const handleAssignShelter = async () => {
    if (!selectedShelter || !modal?._id) return;
    try {
      await assignShelterByVolunteer(modal._id, { shelterId: selectedShelter });
      setMsg('Shelter assigned!');
      setModal(null);
      setSelectedShelter('');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to assign shelter.');
    }
  };

  const CaseCard = ({ c }) => (
  <div className="case-card">
    <div className="case-card-header">
      <div className="case-card-id-row">
        <span className="case-id">{c.caseId}</span>
        <StatusBadge status={c.status} />
      </div>
      <CardTimestamps createdAt={c.createdAt} statusHistory={c.statusHistory} />
    </div>
    <p className="case-card-title">{c.animalName || 'Unknown'} ({c.animalType})</p>
    <p className="case-card-desc">{c.description}</p>
    <p className="case-card-meta">📍 {c.location?.address}</p>
    {c.reportedBy && (
      <p className="case-card-meta">👤 {c.reportedBy.name} • {c.reportedBy.phone}</p>
    )}
    <div className="case-assign-info">
      <p className="case-card-meta">
        🩺 Vet: {c.assignedVet ? <strong>{c.assignedVet.name}</strong> : <span style={{ color: '#ea580c' }}>Not assigned</span>}
      </p>
      <p className="case-card-meta">
        🏠 Shelter: {c.assignedShelter ? <strong>{c.assignedShelter.name}</strong> : <span style={{ color: '#ea580c' }}>Not assigned</span>}
      </p>
    </div>

    {/* ── Vet Clinic Location (shown after vet accepts) ── */}
    {c.vetLocation?.lat && (
      <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1px solid #bbf7d0' }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
          📍 Vet Clinic Location
        </p>
        <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
          {c.vetLocation.address}
        </p>
        <a
          href={`https://www.openstreetmap.org/?mlat=${c.vetLocation.lat}&mlon=${c.vetLocation.lng}#map=17/${c.vetLocation.lat}/${c.vetLocation.lng}`}
          target="_blank" rel="noreferrer"
          style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
          🗺 View on Map
        </a>
      </div>
    )}

    <div className="case-summary-row">
      <div className="case-latest-status">
        <span className="summary-label">Latest:</span>
        <span className="summary-note">
          {c.statusHistory?.length > 0
            ? c.statusHistory[c.statusHistory.length - 1].note || 'Status updated'
            : 'No updates yet'}
        </span>
      </div>
      {c.statusHistory?.length > 0 && (
        <button className="history-chip" onClick={() => setHistoryModal(c)}>
          History ({c.statusHistory.length})
        </button>
      )}
    </div>

    {view === 'assigned' && (
      <div className="case-card-actions">
        {c.status === 'assigned' && (
          <>
            <button className="btn btn-green" onClick={() => handle(() => acceptCase(c._id), 'Case accepted!')}>Accept Case</button>
            <button className="btn btn-red" onClick={() => handle(() => declineCase(c._id, { reason: 'Cannot attend' }), 'Case declined')}>Decline</button>
          </>
        )}
        {/* ── FIX: include vet_accepted so button survives after vet accepts ── */}
        {['volunteer_accepted', 'vet_accepted'].includes(c.status) && (
          <button className="btn btn-purple" onClick={() => handle(() => markInTransit(c._id), 'Marked as in transit!')}>
            Mark In Transit
          </button>
        )}
        {c.status === 'in_transit' && (
          <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.88rem' }}>Currently in transit...</span>
        )}
        {['volunteer_accepted', 'vet_accepted', 'in_transit', 'at_vet', 'vet_declined', 'treatment_done', 'shelter_declined'].includes(c.status) && (
          <button className="btn btn-orange" onClick={() => { setModal(c); setSelectedVet(''); setSelectedShelter(''); }}>
            Assign Vet & Shelter
          </button>
        )}
      </div>
    )}
  </div>
);

  const ReportedCard = ({ c }) => (
    <div className="case-card" style={{ borderLeftColor: '#7c3aed' }}>
      <div className="case-card-header">
        <div className="case-card-id-row">
          <span className="case-id">{c.caseId}</span>
          <StatusBadge status={c.status} />
        </div>
        <CardTimestamps createdAt={c.createdAt} statusHistory={c.statusHistory} />
      </div>
      <p className="case-card-title">{c.animalName || 'Unknown'} ({c.animalType})</p>
      <p className="case-card-desc">{c.description}</p>
      <p className="case-card-meta">📍 {c.location?.address}</p>
      <div className="case-summary-row">
        <div className="case-latest-status">
          <span className="summary-label">Latest:</span>
          <span className="summary-note">
            {c.statusHistory?.length > 0
              ? c.statusHistory[c.statusHistory.length - 1].note || 'Status updated'
              : 'No updates yet'}
          </span>
        </div>
        {c.statusHistory?.length > 0 && (
          <button className="history-chip" onClick={() => setHistoryModal(c)}>
            History ({c.statusHistory.length})
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Volunteer Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: 4 }}>
              Welcome back! Here's your overview.
            </p>
          </div>
        </div>

        {msg && (
          <div className="alert-success">
            {msg} <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <>
            <div className="dash-stats-row">
              <div className="dash-stat-box blue">
                <span className="dash-stat-num">{cases.length}</span>
                <span className="dash-stat-label">Assigned Cases</span>
              </div>
              <div className="dash-stat-box purple">
                <span className="dash-stat-num">{cases.filter(c => c.status === 'assigned').length}</span>
                <span className="dash-stat-label">Pending Accept</span>
              </div>
              <div className="dash-stat-box orange">
                <span className="dash-stat-num">{cases.filter(c => c.status === 'in_transit').length}</span>
                <span className="dash-stat-label">In Transit</span>
              </div>
              <div className="dash-stat-box green">
                <span className="dash-stat-num">{myCases.length}</span>
                <span className="dash-stat-label">I Reported</span>
              </div>
            </div>

            <div className="quick-action-grid">
              <div className="quick-action-card" onClick={() => goToView('assigned')}>
                <div className="quick-action-icon" style={{ background: '#eff6ff' }}>📋</div>
                <div className="quick-action-info">
                  <p className="quick-action-title">Assigned Cases</p>
                  <p className="quick-action-sub">{cases.length} cases assigned to you</p>
                </div>
                <span className="quick-action-arrow">→</span>
              </div>
              <div className="quick-action-card" onClick={() => goToView('reported')}>
                <div className="quick-action-icon" style={{ background: '#faf5ff' }}>🐾</div>
                <div className="quick-action-info">
                  <p className="quick-action-title">Cases I Reported</p>
                  <p className="quick-action-sub">{myCases.length} cases you reported</p>
                </div>
                <span className="quick-action-arrow">→</span>
              </div>
            </div>

            {cases.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 28 }}>
                  <div>
                    <h2 className="section-title">Recent Assigned Cases</h2>
                    <p className="section-subtitle">Showing latest 2 cases</p>
                  </div>
                  <button className="view-all-btn" onClick={() => goToView('assigned')}>
                    View All ({cases.length})
                  </button>
                </div>
                <div className="case-list">
                  {cases.slice(0, 2).map(c => <CaseCard key={c._id} c={c} />)}
                </div>
              </>
            )}

            {myCases.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 28 }}>
                  <div>
                    <h2 className="section-title">Recently Reported by Me</h2>
                    <p className="section-subtitle">Showing latest 2 cases</p>
                  </div>
                  <button className="view-all-btn" onClick={() => goToView('reported')}>
                    View All ({myCases.length})
                  </button>
                </div>
                <div className="case-list">
                  {myCases.slice(0, 2).map(c => <ReportedCard key={c._id} c={c} />)}
                </div>
              </>
            )}

            {cases.length === 0 && myCases.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🙋</div>
                <h3>No activity yet</h3>
                <p>Cases assigned to you will appear here.</p>
              </div>
            )}
          </>
        )}

        {/* ASSIGNED CASES VIEW */}
        {view === 'assigned' && (
          <>
            <div className="section-header">
              <div>
                <button className="back-btn" onClick={() => goToView('dashboard')}>← Back</button>
                <h2 className="section-title" style={{ marginTop: 8 }}>All Assigned Cases</h2>
                <p className="section-subtitle">
                  {cases.length} cases · Page {assignedPage} of {assignedTotalPages || 1}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : cases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No assigned cases</h3>
                <p>Cases assigned to you will appear here.</p>
              </div>
            ) : (
              <>
                <div className="case-list">
                  {pagedAssigned.map(c => <CaseCard key={c._id} c={c} />)}
                </div>
                <Pagination
                  currentPage={assignedPage}
                  totalPages={assignedTotalPages}
                  onPrev={() => setAssignedPage(p => Math.max(1, p - 1))}
                  onNext={() => setAssignedPage(p => Math.min(assignedTotalPages, p + 1))}
                />
              </>
            )}
          </>
        )}

        {/* REPORTED CASES VIEW */}
        {view === 'reported' && (
          <>
            <div className="section-header">
              <div>
                <button className="back-btn" onClick={() => goToView('dashboard')}>← Back</button>
                <h2 className="section-title" style={{ marginTop: 8 }}>Cases I Reported</h2>
                <p className="section-subtitle">
                  {myCases.length} cases · Page {reportedPage} of {reportedTotalPages || 1}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : myCases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🐾</div>
                <h3>No reported cases</h3>
                <p>Cases you report will appear here.</p>
              </div>
            ) : (
              <>
                <div className="case-list">
                  {pagedReported.map(c => <ReportedCard key={c._id} c={c} />)}
                </div>
                <Pagination
                  currentPage={reportedPage}
                  totalPages={reportedTotalPages}
                  onPrev={() => setReportedPage(p => Math.max(1, p - 1))}
                  onNext={() => setReportedPage(p => Math.min(reportedTotalPages, p + 1))}
                />
              </>
            )}
          </>
        )}

        {/* Assign Modal */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Assign Vet & Shelter</h3>
              <p className="modal-subtitle">Case: <strong>{modal.caseId}</strong> — {modal.animalType}</p>
              <div className="modal-form">
                {modal.assignedVet ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: 4 }}>Veterinarian Assigned</p>
                    <p style={{ fontWeight: 700 }}>✅ {modal.assignedVet.name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="modal-section-label">Assign Veterinarian</p>
                    <div className="modal-assign-row">
                      <select value={selectedVet} onChange={e => setSelectedVet(e.target.value)}>
                        <option value="">Select veterinarian...</option>
                        {vets.map(v => <option key={v._id} value={v._id}>{v.name} — {v.phone || v.email}</option>)}
                      </select>
                      <button className="btn btn-orange" onClick={handleAssignVet}>Assign</button>
                    </div>
                  </div>
                )}
                <hr className="modal-divider" />
                {modal.assignedShelter ? (
                  <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', marginBottom: 4 }}>Shelter Assigned</p>
                    <p style={{ fontWeight: 700 }}>✅ {modal.assignedShelter.name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="modal-section-label">Assign Shelter</p>
                    <div className="modal-assign-row">
                      <select value={selectedShelter} onChange={e => setSelectedShelter(e.target.value)}>
                        <option value="">Select shelter...</option>
                        {shelters.map(s => <option key={s._id} value={s._id}>{s.name} — {s.phone || s.email}</option>)}
                      </select>
                      <button className="btn btn-teal" onClick={handleAssignShelter}>Assign</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
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