import { useState, useEffect } from 'react';
import { getVetCases, markAtVet, addMedicalRecord, markTreatmentDone, getMyCases, acceptVetCase, declineVetCase, updateVetLocation } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import LocationPickerModal from '../components/LocationPickerModal';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

const CASES_PER_PAGE = 2;

const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('uploads/')) return `http://localhost:5000/${img}`;
  return `http://localhost:5000/uploads/${img}`;
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
  const latestTimestamp = statusHistory?.length > 0 ? statusHistory[statusHistory.length - 1].timestamp : null;
  return (
    <div className="case-card-dates">
      <span className="case-card-date"><span className="date-label">Reported:</span> {formatDateTime(createdAt)}</span>
      {latestTimestamp && latestTimestamp !== createdAt && (
        <span className="case-card-date"><span className="date-label">Updated:</span> {formatDateTime(latestTimestamp)}</span>
      )}
    </div>
  );
};

const CaseImages = ({ images }) => {
  if (!images?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '8px 0 4px', paddingBottom: 4 }}>
      {images.map((img, i) => (
        <img key={i} src={getImageUrl(img)} alt={`animal-${i}`}
          onClick={() => window.open(getImageUrl(img), '_blank')}
          style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'pointer', border: '2px solid #e5e7eb' }} />
      ))}
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPrev, onNext }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <button className="pagination-btn" onClick={onPrev} disabled={currentPage === 1}>← Prev</button>
      <span className="pagination-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
      <button className="pagination-btn" onClick={onNext} disabled={currentPage === totalPages}>Next →</button>
    </div>
  );
};

export default function VetDashboard() {
  const [cases, setCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [medModal, setMedModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [locationUpdateModal, setLocationUpdateModal] = useState(null);
  const [medData, setMedData] = useState({ diagnosis: '', treatment: '', medications: '', notes: '' });
  const [medFiles, setMedFiles] = useState([]);
  const [view, setView] = useState('dashboard');
  const [assignedPage, setAssignedPage] = useState(1);
  const [reportedPage, setReportedPage] = useState(1);

  const sortedCases = [...cases].sort((a, b) => {
    const aTime = a.statusHistory?.length > 0 ? new Date(a.statusHistory[a.statusHistory.length - 1].timestamp) : new Date(a.createdAt);
    const bTime = b.statusHistory?.length > 0 ? new Date(b.statusHistory[b.statusHistory.length - 1].timestamp) : new Date(b.createdAt);
    return bTime - aTime;
  });

  const sortedMyCases = [...myCases].sort((a, b) => {
    const aTime = a.statusHistory?.length > 0 ? new Date(a.statusHistory[a.statusHistory.length - 1].timestamp) : new Date(a.createdAt);
    const bTime = b.statusHistory?.length > 0 ? new Date(b.statusHistory[b.statusHistory.length - 1].timestamp) : new Date(b.createdAt);
    return bTime - aTime;
  });

  const assignedTotalPages = Math.ceil(sortedCases.length / CASES_PER_PAGE);
  const reportedTotalPages = Math.ceil(sortedMyCases.length / CASES_PER_PAGE);
  const pagedAssigned = sortedCases.slice((assignedPage - 1) * CASES_PER_PAGE, assignedPage * CASES_PER_PAGE);
  const pagedReported = sortedMyCases.slice((reportedPage - 1) * CASES_PER_PAGE, reportedPage * CASES_PER_PAGE);

  const load = () => {
    setLoading(true);
    getVetCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getMyCases().then(r => setMyCases(r.data)).catch(() => {});
  }, []);

  const goToView = (v) => { setView(v); setAssignedPage(1); setReportedPage(1); };

  const handle = async (fn, successMsg) => {
    await fn();
    setMsg(successMsg);
    load();
  };

  const handleVetAccept = async (caseId) => {
    try {
      await acceptVetCase(caseId);
      setMsg('Case accepted! Now pin your clinic location.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to accept case.');
    }
  };

  const handleUpdateLocation = async (location) => {
    try {
      await updateVetLocation(locationUpdateModal._id, { location });
      setMsg('Clinic location pinned!');
      setLocationUpdateModal(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update location.');
      setLocationUpdateModal(null);
    }
  };

  const handleAddMedical = async () => {
    if (!medData.diagnosis || !medData.treatment) return;
    const formData = new FormData();
    Object.entries(medData).forEach(([k, v]) => formData.append(k, v));
    medFiles.forEach(f => formData.append('documents', f));
    await addMedicalRecord(medModal, formData);
    setMsg('Medical record added!');
    setMedModal(null);
    setMedData({ diagnosis: '', treatment: '', medications: '', notes: '' });
    setMedFiles([]);
    load();
  };

  const pendingCases = sortedCases.filter(c => ['in_transit', 'volunteer_accepted', 'assigned'].includes(c.status));
  const activeCases = sortedCases.filter(c => ['vet_accepted', 'at_vet'].includes(c.status));

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
      <CaseImages images={c.images} />
      <p className="case-card-meta">📍 {c.location?.address}</p>
      {c.reportedBy && <p className="case-card-meta">👤 {c.reportedBy.name} • {c.reportedBy.phone}</p>}

      <div className="case-card-actions">
        {['in_transit', 'volunteer_accepted', 'assigned'].includes(c.status) && (
          <>
            <button className="btn btn-green" onClick={() => handleVetAccept(c._id)}>Accept Case</button>
            <button className="btn btn-red" onClick={() => handle(() => declineVetCase(c._id, { reason: 'Unavailable' }), 'Case declined')}>Decline</button>
          </>
        )}
        {['vet_accepted', 'at_vet'].includes(c.status) && (
          <button className="btn btn-green" onClick={() => setLocationUpdateModal(c)}>
            📍 {c.vetLocation?.lat ? 'Update Clinic Location' : 'Pin My Clinic Location'}
          </button>
        )}
        {c.status === 'vet_accepted' && (
          <button className="btn btn-orange" onClick={() => handle(() => markAtVet(c._id), 'Animal marked arrived!')}>Mark Animal Arrived</button>
        )}
        {['vet_accepted', 'at_vet'].includes(c.status) && (
          <button className="btn btn-blue" onClick={() => { setMedModal(c._id); setMedFiles([]); }}>Add Medical Record</button>
        )}
        {c.status === 'at_vet' && (
          <button className="btn btn-green" onClick={() => handle(() => markTreatmentDone(c._id), 'Treatment complete!')}>Treatment Complete</button>
        )}
      </div>

      {c.vetLocation?.lat && (
        <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📍 Your Pinned Clinic Location</p>
          <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>{c.vetLocation.address}</p>
          <a href={`https://www.openstreetmap.org/?mlat=${c.vetLocation.lat}&mlon=${c.vetLocation.lng}#map=17/${c.vetLocation.lat}/${c.vetLocation.lng}`}
            target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>🗺 View on Map</a>
        </div>
      )}

      {c.medicalRecords?.length > 0 && (
        <div style={{ marginTop: 12, background: '#fff7ed', borderRadius: 12, padding: '12px 16px', border: '1px solid #fed7aa' }}>
          <p style={{ fontWeight: 700, fontSize: '0.78rem', color: '#c2410c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medical Records ({c.medicalRecords.length})
          </p>
          {c.medicalRecords.map((m, i) => (
            <div key={i} className="medical-item">
              <strong>{m.diagnosis}</strong>
              <p>Treatment: {m.treatment}</p>
              {m.medications && <p>Medications: {m.medications}</p>}
              {m.notes && <p>{m.notes}</p>}
              {m.documents?.length > 0 && m.documents.map((doc, j) => (
                <a key={j} href={getImageUrl(doc)} target="_blank" rel="noreferrer"
                  style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600, marginRight: 8 }}>📄 Document {j + 1}</a>
              ))}
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{formatDateTime(m.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="case-summary-row">
        <div className="case-latest-status">
          <span className="summary-label">Latest:</span>
          <span className="summary-note">
            {c.statusHistory?.length > 0 ? c.statusHistory[c.statusHistory.length - 1].note || 'Status updated' : 'No updates yet'}
          </span>
        </div>
        {c.statusHistory?.length > 0 && (
          <button className="history-chip" onClick={() => setHistoryModal(c)}>History ({c.statusHistory.length})</button>
        )}
      </div>
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
      <CaseImages images={c.images} />
      <p className="case-card-meta">📍 {c.location?.address}</p>
      <div className="case-summary-row">
        <div className="case-latest-status">
          <span className="summary-label">Latest:</span>
          <span className="summary-note">
            {c.statusHistory?.length > 0 ? c.statusHistory[c.statusHistory.length - 1].note || 'Status updated' : 'No updates yet'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {c.statusHistory?.length > 0 && (
            <button className="history-chip" onClick={() => setHistoryModal(c)}>History ({c.statusHistory.length})</button>
          )}
          <button className="history-chip" style={{ background: '#eff6ff', color: '#3b82f6', borderColor: '#bfdbfe' }}
            onClick={() => window.open(`/track/${c.caseId}`, '_blank')}>
            🔍 Track
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Veterinarian Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: 4 }}>Welcome back! Here's your overview.</p>
          </div>
        </div>

        {msg && <div className="alert-success">{msg}<button className="alert-close" onClick={() => setMsg('')}>✕</button></div>}

        {view === 'dashboard' && (
          <>
            <div className="dash-stats-row">
              <div className="dash-stat-box blue"><span className="dash-stat-num">{cases.length}</span><span className="dash-stat-label">Assigned Cases</span></div>
              <div className="dash-stat-box orange"><span className="dash-stat-num">{pendingCases.length}</span><span className="dash-stat-label">Pending Accept</span></div>
              <div className="dash-stat-box teal"><span className="dash-stat-num">{activeCases.length}</span><span className="dash-stat-label">Active / At Clinic</span></div>
              <div className="dash-stat-box purple"><span className="dash-stat-num">{myCases.length}</span><span className="dash-stat-label">I Reported</span></div>
            </div>
            <div className="quick-action-grid">
              <div className="quick-action-card" onClick={() => goToView('assigned')}>
                <div className="quick-action-icon" style={{ background: '#fff7ed' }}>🩺</div>
                <div className="quick-action-info"><p className="quick-action-title">Assigned Cases</p><p className="quick-action-sub">{cases.length} cases assigned to you</p></div>
                <span className="quick-action-arrow">→</span>
              </div>
              <div className="quick-action-card" onClick={() => goToView('reported')}>
                <div className="quick-action-icon" style={{ background: '#faf5ff' }}>🐾</div>
                <div className="quick-action-info"><p className="quick-action-title">Cases I Reported</p><p className="quick-action-sub">{myCases.length} cases you reported</p></div>
                <span className="quick-action-arrow">→</span>
              </div>
            </div>
            {sortedCases.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 28 }}>
                  <div><h2 className="section-title">Recent Assigned Cases</h2><p className="section-subtitle">Showing latest 2 cases</p></div>
                  <button className="view-all-btn" onClick={() => goToView('assigned')}>View All ({sortedCases.length})</button>
                </div>
                <div className="case-list">{sortedCases.slice(0, 2).map(c => <CaseCard key={c._id} c={c} />)}</div>
              </>
            )}
            {sortedMyCases.length > 0 && (
              <>
                <div className="section-header" style={{ marginTop: 28 }}>
                  <div><h2 className="section-title">Recently Reported by Me</h2><p className="section-subtitle">Showing latest 2 cases</p></div>
                  <button className="view-all-btn" onClick={() => goToView('reported')}>View All ({sortedMyCases.length})</button>
                </div>
                <div className="case-list">{sortedMyCases.slice(0, 2).map(c => <ReportedCard key={c._id} c={c} />)}</div>
              </>
            )}
            {cases.length === 0 && myCases.length === 0 && !loading && (
              <div className="empty-state"><div className="empty-icon">🩺</div><h3>No activity yet</h3><p>Cases assigned to you will appear here.</p></div>
            )}
          </>
        )}

        {view === 'assigned' && (
          <>
            <div className="section-header">
              <div>
                <button className="back-btn" onClick={() => goToView('dashboard')}>← Back</button>
                <h2 className="section-title" style={{ marginTop: 8 }}>All Assigned Cases</h2>
                <p className="section-subtitle">{sortedCases.length} cases · Page {assignedPage} of {assignedTotalPages || 1}</p>
              </div>
            </div>
            {loading ? <div className="loading">Loading...</div> : sortedCases.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🩺</div><h3>No assigned cases</h3></div>
            ) : (
              <>
                <div className="case-list">{pagedAssigned.map(c => <CaseCard key={c._id} c={c} />)}</div>
                <Pagination currentPage={assignedPage} totalPages={assignedTotalPages}
                  onPrev={() => setAssignedPage(p => Math.max(1, p - 1))}
                  onNext={() => setAssignedPage(p => Math.min(assignedTotalPages, p + 1))} />
              </>
            )}
          </>
        )}

        {view === 'reported' && (
          <>
            <div className="section-header">
              <div>
                <button className="back-btn" onClick={() => goToView('dashboard')}>← Back</button>
                <h2 className="section-title" style={{ marginTop: 8 }}>Cases I Reported</h2>
                <p className="section-subtitle">{sortedMyCases.length} cases · Page {reportedPage} of {reportedTotalPages || 1}</p>
              </div>
            </div>
            {loading ? <div className="loading">Loading...</div> : sortedMyCases.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🐾</div><h3>No reported cases</h3></div>
            ) : (
              <>
                <div className="case-list">{pagedReported.map(c => <ReportedCard key={c._id} c={c} />)}</div>
                <Pagination currentPage={reportedPage} totalPages={reportedTotalPages}
                  onPrev={() => setReportedPage(p => Math.max(1, p - 1))}
                  onNext={() => setReportedPage(p => Math.min(reportedTotalPages, p + 1))} />
              </>
            )}
          </>
        )}

        {/* Medical Record Modal */}
        {medModal && (
          <div className="modal-overlay" onClick={() => setMedModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Add Medical Record</h3>
              <p className="modal-subtitle">Fill in the medical details for this case.</p>
              <div className="modal-form">
                <div>
                  <p className="modal-section-label">Diagnosis *</p>
                  <input type="text" placeholder="e.g. Fractured leg" value={medData.diagnosis}
                    onChange={e => setMedData({ ...medData, diagnosis: e.target.value })} />
                </div>
                <div>
                  <p className="modal-section-label">Treatment *</p>
                  <input type="text" placeholder="e.g. Splint applied" value={medData.treatment}
                    onChange={e => setMedData({ ...medData, treatment: e.target.value })} />
                </div>
                <div>
                  <p className="modal-section-label">Medications</p>
                  <input type="text" placeholder="e.g. Amoxicillin 250mg" value={medData.medications}
                    onChange={e => setMedData({ ...medData, medications: e.target.value })} />
                </div>
                <div>
                  <p className="modal-section-label">Additional Notes</p>
                  <textarea placeholder="Any additional observations..." rows={3} value={medData.notes}
                    onChange={e => setMedData({ ...medData, notes: e.target.value })} />
                </div>
                <div>
                  <p className="modal-section-label">Upload Documents (optional)</p>
                  <input type="file" multiple accept="image/*,.pdf,.doc,.docx"
                    onChange={e => setMedFiles([...e.target.files])}
                    style={{ border: '1.5px dashed #fed7aa', borderRadius: 10, padding: '10px 14px', background: '#fff7ed', width: '100%', cursor: 'pointer' }} />
                  {medFiles.length > 0 && <p style={{ fontSize: '0.8rem', color: '#ea580c', marginTop: 6, fontWeight: 600 }}>{medFiles.length} file(s) selected</p>}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-orange" onClick={handleAddMedical}>Save Record</button>
                <button className="btn btn-gray" onClick={() => { setMedModal(null); setMedFiles([]); }}>Cancel</button>
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
              {historyModal.images?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
                  {historyModal.images.map((img, i) => (
                    <img key={i} src={getImageUrl(img)} alt={`animal-${i}`}
                      onClick={() => window.open(getImageUrl(img), '_blank')}
                      style={{ height: 70, width: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'pointer', border: '2px solid #e5e7eb' }} />
                  ))}
                </div>
              )}
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

        {locationUpdateModal && (
          <LocationPickerModal
            title={locationUpdateModal.vetLocation?.lat ? 'Update Clinic Location' : 'Pin Your Clinic Location'}
            onConfirm={handleUpdateLocation}
            onCancel={() => setLocationUpdateModal(null)}
          />
        )}
      </div>
    </div>
  );
}