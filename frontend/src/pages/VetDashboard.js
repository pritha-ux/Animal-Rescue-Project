import { useState, useEffect } from 'react';
import { getVetCases, markAtVet, addMedicalRecord, markTreatmentDone } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

export default function VetDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [medModal, setMedModal] = useState(null);
  const [medData, setMedData] = useState({ diagnosis: '', treatment: '', medications: '', notes: '' });

  const load = () => getVetCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handle = async (fn, successMsg) => {
    await fn(); setMsg(successMsg); load();
  };

  const handleAddMedical = async () => {
    const formData = new FormData();
    Object.entries(medData).forEach(([k, v]) => formData.append(k, v));
    await addMedicalRecord(medModal, formData);
    setMsg('Medical record added!');
    setMedModal(null);
    setMedData({ diagnosis: '', treatment: '', medications: '', notes: '' });
    load();
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🩺 Veterinarian Dashboard</h1>
        </div>

        {msg && <div className="alert-success">{msg}<button className="alert-close" onClick={() => setMsg('')}>✕</button></div>}

        {loading ? <div className="loading">Loading cases...</div>
          : cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩺</div>
              <p>No cases assigned to you yet.</p>
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
                    <span className="case-card-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="case-card-title">{c.animalName} ({c.animalType})</p>
                  <p className="case-card-desc">{c.description}</p>
                  <p className="case-card-meta">📍 {c.location?.address}</p>

                  {c.medicalRecords?.length > 0 && (
                    <div style={{ marginTop: 12, background: '#fff7ed', borderRadius: 10, padding: '12px 16px' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c2410c', marginBottom: 8 }}>
                        Medical Records ({c.medicalRecords.length})
                      </p>
                      {c.medicalRecords.map((m, i) => (
                        <div key={i} style={{ borderLeft: '3px solid #f97316', paddingLeft: 12, marginBottom: 8 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.diagnosis}</p>
                          <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>Treatment: {m.treatment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="case-card-actions">
                    {c.status === 'in_transit' && (
                      <button className="btn btn-orange"
                        onClick={() => handle(() => markAtVet(c._id), '🏥 Animal marked arrived at clinic!')}>
                        🏥 Mark Animal Arrived
                      </button>
                    )}
                    {(c.status === 'at_vet' || c.status === 'in_transit') && (
                      <button className="btn btn-blue" onClick={() => setMedModal(c._id)}>
                        ➕ Add Medical Record
                      </button>
                    )}
                    {c.status === 'at_vet' && (
                      <button className="btn btn-green"
                        onClick={() => handle(() => markTreatmentDone(c._id), '✅ Treatment marked complete!')}>
                        ✅ Treatment Complete
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
              <h3 className="modal-title">➕ Add Medical Record</h3>
              <div className="modal-form">
                <input type="text" placeholder="Diagnosis *" value={medData.diagnosis}
                  onChange={e => setMedData({ ...medData, diagnosis: e.target.value })} />
                <input type="text" placeholder="Treatment *" value={medData.treatment}
                  onChange={e => setMedData({ ...medData, treatment: e.target.value })} />
                <input type="text" placeholder="Medications (optional)" value={medData.medications}
                  onChange={e => setMedData({ ...medData, medications: e.target.value })} />
                <textarea placeholder="Additional notes" rows={3} value={medData.notes}
                  onChange={e => setMedData({ ...medData, notes: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-orange" onClick={handleAddMedical}>Save Record</button>
                <button className="btn btn-gray" onClick={() => setMedModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
