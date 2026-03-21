import { useState, useEffect } from 'react';
import { getVetCases, markAtVet, addMedicalRecord, markTreatmentDone } from '../api';
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

export default function VetDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [medModal, setMedModal] = useState(null);
  const [medData, setMedData] = useState({ diagnosis: '', treatment: '', medications: '', notes: '' });
  const [medFiles, setMedFiles] = useState([]);

  const load = () => getVetCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handle = async (fn, successMsg) => {
    await fn(); setMsg(successMsg); load();
  };

  const handleAddMedical = async () => {
    if (!medData.diagnosis || !medData.treatment) return;
    const formData = new FormData();
    Object.entries(medData).forEach(([k, v]) => formData.append(k, v));
    medFiles.forEach(f => formData.append('files', f));
    await addMedicalRecord(medModal, formData);
    setMsg('Medical record added!');
    setMedModal(null);
    setMedData({ diagnosis: '', treatment: '', medications: '', notes: '' });
    setMedFiles([]);
    load();
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Veterinarian Dashboard</h1>
        </div>

        {msg && (
          <div className="alert-success">
            {msg}
            <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {loading ? <div className="loading">Loading cases...</div>
          : cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
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

                  {/* Status History */}
                  {c.statusHistory?.length > 0 && (
                    <div className="status-history">
                      <p className="history-label">Status History</p>
                      {c.statusHistory.map((h, i) => (
                        <div key={i} className="history-item">
                          <StatusBadge status={h.status} />
                          <span className="history-time">{formatDateTime(h.timestamp)}</span>
                          {h.note && <span className="history-note">— {h.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Medical Records */}
                  {c.medicalRecords?.length > 0 && (
                    <div style={{ marginTop: 14, background: '#fff7ed', borderRadius: 12, padding: '14px 18px', border: '1px solid #fed7aa' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.78rem', color: '#c2410c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Medical Records ({c.medicalRecords.length})
                      </p>
                      {c.medicalRecords.map((m, i) => (
                        <div key={i} className="medical-item">
                          <strong>{m.diagnosis}</strong>
                          <p>Treatment: {m.treatment}</p>
                          {m.medications && <p>Medications: {m.medications}</p>}
                          {m.notes && <p>{m.notes}</p>}
                          {m.documents?.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {m.documents.map((doc, j) => (
                                <a key={j} href={`http://localhost:5000/uploads/${doc}`} target="_blank" rel="noreferrer"
                                  style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600, marginRight: 8 }}>
                                  📄 Document {j + 1}
                                </a>
                              ))}
                            </div>
                          )}
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{formatDateTime(m.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="case-card-actions">
                    {c.status === 'in_transit' && (
                      <button className="btn btn-orange"
                        onClick={() => handle(() => markAtVet(c._id), 'Animal marked arrived at clinic!')}>
                        Mark Animal Arrived
                      </button>
                    )}
                    {(c.status === 'at_vet' || c.status === 'in_transit') && (
                      <button className="btn btn-blue" onClick={() => { setMedModal(c._id); setMedFiles([]); }}>
                        Add Medical Record
                      </button>
                    )}
                    {c.status === 'at_vet' && (
                      <button className="btn btn-green"
                        onClick={() => handle(() => markTreatmentDone(c._id), 'Treatment marked complete!')}>
                        Treatment Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  <input type="text" placeholder="e.g. Splint applied, rest required" value={medData.treatment}
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
                  {medFiles.length > 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#ea580c', marginTop: 6, fontWeight: 600 }}>
                      {medFiles.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-orange" onClick={handleAddMedical}>Save Record</button>
                <button className="btn btn-gray" onClick={() => { setMedModal(null); setMedFiles([]); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
