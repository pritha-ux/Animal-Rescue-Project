import { useState, useEffect } from 'react';
import { getShelterCases, markAtShelter, updateCareDetails, markAdopted, markReturnedToOwner, acceptShelterCase, declineShelterCase, updateShelterLocation } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import LocationPickerModal from '../components/LocationPickerModal';
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

export default function ShelterDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [locationUpdateModal, setLocationUpdateModal] = useState(null); // ← new
  const [formData, setFormData] = useState({});
  const [view, setView] = useState('dashboard');
  const [page, setPage] = useState(1);

  const sortedCases = [...cases].sort((a, b) => {
    const aTime = a.statusHistory?.length > 0
      ? new Date(a.statusHistory[a.statusHistory.length - 1].timestamp)
      : new Date(a.createdAt);
    const bTime = b.statusHistory?.length > 0
      ? new Date(b.statusHistory[b.statusHistory.length - 1].timestamp)
      : new Date(b.createdAt);
    return bTime - aTime;
  });

  const totalPages = Math.ceil(sortedCases.length / CASES_PER_PAGE);
  const pagedCases = sortedCases.slice(
    (page - 1) * CASES_PER_PAGE,
    page * CASES_PER_PAGE
  );

  const load = () => {
    setLoading(true);
    getShelterCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const goToView = (v) => {
    setView(v);
    setPage(1);
  };

  const handle = async (fn, successMsg) => {
    await fn();
    setMsg(successMsg);
    setModal(null);
    setFormData({});
    load();
  };

  const openModal = (type, caseId) => {
    setModal({ type, caseId });
    setFormData({});
  };

  // ── Pin/update shelter location ──
  const handleUpdateLocation = async (location) => {
    try {
      await updateShelterLocation(locationUpdateModal._id, { location });
      setMsg('Shelter location pinned! The volunteer can now see your location.');
      setLocationUpdateModal(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update location.');
      setLocationUpdateModal(null);
    }
  };

  const field = (key, placeholder) => (
    <input key={key} type="text" placeholder={placeholder}
      value={formData[key] || ''}
      onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
  );

  const pendingCases   = sortedCases.filter(c => c.status === 'treatment_done');
  const atShelter      = sortedCases.filter(c => c.status === 'at_shelter');
  const completedCases = sortedCases.filter(c => ['adopted', 'returned_to_owner'].includes(c.status));

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

      <div className="case-card-actions">
        {c.status === 'treatment_done' && (
          <>
            <button className="btn btn-green"
              onClick={() => handle(() => acceptShelterCase(c._id), 'Case accepted!')}>
              Accept Case
            </button>
            <button className="btn btn-red"
              onClick={() => handle(() => declineShelterCase(c._id, { reason: 'No capacity' }), 'Case declined')}>
              Decline
            </button>
          </>
        )}

        {/* ── Pin location after accepting ── */}
        {['shelter_accepted', 'at_shelter'].includes(c.status) && (
          <button className="btn btn-teal" onClick={() => setLocationUpdateModal(c)}>
            📍 {c.shelterLocation?.lat ? 'Update Shelter Location' : 'Pin My Shelter Location'}
          </button>
        )}
        {c.status === 'in_transit_to_shelter' && (
  <button
    className="btn btn-teal"
    onClick={() => handle(() => acceptShelterCase(c._id), 'Animal marked as arrived at shelter!')}
  >
    Mark Animal Arrived
  </button>
)}


        {c.status === 'shelter_accepted' && (
          <button className="btn btn-teal" onClick={() => openModal('admit', c._id)}>
            Admit to Shelter
          </button>
        )}
        {c.status === 'at_shelter' && (
          <>
            <button className="btn btn-blue" onClick={() => openModal('care', c._id)}>Update Care</button>
            <button className="btn btn-green" onClick={() => openModal('adopt', c._id)}>Mark Adopted</button>
            <button className="btn btn-purple" onClick={() => openModal('return', c._id)}>Return to Owner</button>
          </>
        )}
        {['adopted', 'returned_to_owner'].includes(c.status) && (
          <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.88rem' }}>✅ Case Completed</span>
        )}
      </div>

      {/* ── Pinned shelter location display ── */}
      {c.shelterLocation?.lat && (
        <div style={{ marginTop: 10, background: '#f0fdfa', borderRadius: 10, padding: '10px 14px', border: '1px solid #99f6e4' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', marginBottom: 4 }}>
            📍 Your Pinned Shelter Location
          </p>
          <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
            {c.shelterLocation.address}
          </p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${c.shelterLocation.lat}&mlon=${c.shelterLocation.lng}#map=17/${c.shelterLocation.lat}/${c.shelterLocation.lng}`}
            target="_blank" rel="noreferrer"
            style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 700 }}>
            🗺 View on Map
          </a>
        </div>
      )}

      {c.shelterDetails && (
        <div style={{ marginTop: 12, background: '#f0fdfa', borderRadius: 10, padding: '12px 16px', fontSize: '0.88rem', border: '1px solid #99f6e4' }}>
          <p style={{ fontWeight: 700, color: '#0f766e', marginBottom: 6, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shelter Details</p>
          <p>🏷️ Cage: {c.shelterDetails.cage_number}</p>
          <p>🥗 Diet: {c.shelterDetails.diet}</p>
          <p>❤️ Health: {c.shelterDetails.health_status}</p>
          {c.shelterDetails.notes && <p>📝 {c.shelterDetails.notes}</p>}
        </div>
      )}
{c.medicalRecords?.length > 0 && (
  <div style={{
    marginTop: 12,
    background: '#fff7ed',
    borderRadius: 12,
    padding: '12px 16px',
    border: '1px solid #fed7aa'
  }}>
    <p style={{
      fontWeight: 700,
      fontSize: '0.78rem',
      color: '#c2410c',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      Medical Records ({c.medicalRecords.length})
    </p>

    {c.medicalRecords.map((m, i) => (
      <div key={i} style={{ marginBottom: 10 }}>
        <strong>{m.diagnosis}</strong>
        <p>Treatment: {m.treatment}</p>

        {m.medications && <p>Medications: {m.medications}</p>}
        {m.notes && <p>{m.notes}</p>}

        {m.documents?.length > 0 && m.documents.map((doc, j) => (
          <a
            key={j}
            href={`http://localhost:5000/uploads/${doc}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.78rem',
              color: '#ea580c',
              fontWeight: 600,
              marginRight: 8
            }}
          >
            📄 Document {j + 1}
          </a>
        ))}


        <p style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          marginTop: 4
        }}>
          {formatDateTime(m.createdAt)}
        </p>
      </div>
    ))}
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
    </div>
  );

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Shelter Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: 4 }}>
              Welcome back! Here's your overview.
            </p>
          </div>
        </div>

        {msg && (
          <div className="alert-success">
            {msg}
            <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {view === 'dashboard' && (
          <>
            <div className="dash-stats-row">
              <div className="dash-stat-box blue">
                <span className="dash-stat-num">{cases.length}</span>
                <span className="dash-stat-label">Total Cases</span>
              </div>
              <div className="dash-stat-box orange">
                <span className="dash-stat-num">{pendingCases.length}</span>
                <span className="dash-stat-label">Pending Accept</span>
              </div>
              <div className="dash-stat-box teal">
                <span className="dash-stat-num">{atShelter.length}</span>
                <span className="dash-stat-label">At Shelter</span>
              </div>
              <div className="dash-stat-box green">
                <span className="dash-stat-num">{completedCases.length}</span>
                <span className="dash-stat-label">Completed</span>
              </div>
            </div>

            <div className="quick-action-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="quick-action-card" onClick={() => goToView('all')}>
                <div className="quick-action-icon" style={{ background: '#f0fdfa' }}>🏠</div>
                <div className="quick-action-info">
                  <p className="quick-action-title">All Shelter Cases</p>
                  <p className="quick-action-sub">{cases.length} cases assigned to your shelter</p>
                </div>
                <span className="quick-action-arrow">→</span>
              </div>
            </div>

            {sortedCases.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 28 }}>
                  <div>
                    <h2 className="section-title">Recent Cases</h2>
                    <p className="section-subtitle">Showing latest 2 cases</p>
                  </div>
                  <button className="view-all-btn" onClick={() => goToView('all')}>
                    View All ({sortedCases.length})
                  </button>
                </div>
                <div className="case-list">
                  {sortedCases.slice(0, 2).map(c => <CaseCard key={c._id} c={c} />)}
                </div>
              </>
            )}

            {cases.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <h3>No cases yet</h3>
                <p>Animals assigned to your shelter will appear here.</p>
              </div>
            )}
          </>
        )}

        {view === 'all' && (
          <>
            <div className="section-header">
              <div>
                <button className="back-btn" onClick={() => goToView('dashboard')}>← Back</button>
                <h2 className="section-title" style={{ marginTop: 8 }}>All Shelter Cases</h2>
                <p className="section-subtitle">
                  {sortedCases.length} cases · Page {page} of {totalPages || 1}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="loading">Loading cases...</div>
            ) : sortedCases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <h3>No cases yet</h3>
                <p>Animals assigned to your shelter will appear here.</p>
              </div>
            ) : (
              <>
                <div className="case-list">
                  {pagedCases.map(c => <CaseCard key={c._id} c={c} />)}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPrev={() => setPage(p => Math.max(1, p - 1))}
                  onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                />
              </>
            )}
          </>
        )}

        {/* Modals */}
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              {modal.type === 'admit' && (
                <>
                  <h3 className="modal-title">🏠 Admit to Shelter</h3>
                  <p className="modal-subtitle">Fill in the shelter details for this animal.</p>
                  <div className="modal-form">
                    {field('cage_number', 'Cage Number')}
                    {field('diet', 'Diet / Food type')}
                    {field('health_status', 'Health Status')}
                    {field('notes', 'Additional Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-teal"
                      onClick={() => handle(() => markAtShelter(modal.caseId, formData), 'Animal admitted to shelter!')}>
                      Admit
                    </button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'care' && (
                <>
                  <h3 className="modal-title">✏️ Update Care Details</h3>
                  <p className="modal-subtitle">Update the care information for this animal.</p>
                  <div className="modal-form">
                    {field('diet', 'Diet / Food type')}
                    {field('health_status', 'Health Status')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-blue"
                      onClick={() => handle(() => updateCareDetails(modal.caseId, formData), 'Care details updated!')}>
                      Update
                    </button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'adopt' && (
                <>
                  <h3 className="modal-title">🎉 Mark as Adopted</h3>
                  <p className="modal-subtitle">Enter the adopter's details to confirm adoption.</p>
                  <div className="modal-form">
                    {field('adopterName', 'Adopter Name *')}
                    {field('adopterContact', 'Adopter Contact / Phone *')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-green"
                      onClick={() => handle(() => markAdopted(modal.caseId, formData), 'Animal adopted! 🎉')}>
                      Confirm Adoption
                    </button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'return' && (
                <>
                  <h3 className="modal-title">🔄 Return to Owner</h3>
                  <p className="modal-subtitle">Enter the owner's details to confirm return.</p>
                  <div className="modal-form">
                    {field('ownerName', 'Owner Name *')}
                    {field('ownerContact', 'Owner Contact / Phone')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-purple"
                      onClick={() => handle(() => markReturnedToOwner(modal.caseId, formData), 'Animal returned to owner!')}>
                      Confirm Return
                    </button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
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

        {/* ── Pin/Update Shelter Location Modal ── */}
        {locationUpdateModal && (
          <LocationPickerModal
            title={locationUpdateModal.shelterLocation?.lat ? 'Update Shelter Location' : 'Pin Your Shelter Location'}
            onConfirm={handleUpdateLocation}
            onCancel={() => setLocationUpdateModal(null)}
          />
        )}

      </div>
    </div>
  );
}