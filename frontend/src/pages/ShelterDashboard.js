import { useState, useEffect } from 'react';
import { getShelterCases, markAtShelter, updateCareDetails, markAdopted, markReturnedToOwner, acceptShelterCase, declineShelterCase } from '../api';
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

export default function ShelterDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});

  const load = () => getShelterCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handle = async (fn, successMsg) => {
    await fn(); setMsg(successMsg); setModal(null); setFormData({}); load();
  };

  const openModal = (type, caseId) => { setModal({ type, caseId }); setFormData({}); };

  const field = (key, placeholder) => (
    <input key={key} type="text" placeholder={placeholder}
      value={formData[key] || ''}
      onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
  );

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🏠 Shelter Dashboard</h1>
        </div>

        {msg && <div className="alert-success">{msg}<button className="alert-close" onClick={() => setMsg('')}>✕</button></div>}

        {loading ? <div className="loading">Loading cases...</div>
          : cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p>No animals assigned to your shelter yet.</p>
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

                  {c.shelterDetails && (
                    <div style={{ marginTop: 12, background: '#f0fdfa', borderRadius: 10, padding: '12px 16px', fontSize: '0.88rem' }}>
                      <p style={{ fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>Shelter Details</p>
                      <p>🏷️ Cage: {c.shelterDetails.cage_number}</p>
                      <p>🥗 Diet: {c.shelterDetails.diet}</p>
                      <p>❤️ Health: {c.shelterDetails.health_status}</p>
                      {c.shelterDetails.notes && <p>📝 {c.shelterDetails.notes}</p>}
                    </div>
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
                      <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.88rem' }}>Case Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              {modal.type === 'admit' && (
                <>
                  <h3 className="modal-title">🏠 Admit to Shelter</h3>
                  <div className="modal-form">
                    {field('cage_number', 'Cage Number')}
                    {field('diet', 'Diet / Food type')}
                    {field('health_status', 'Health Status')}
                    {field('notes', 'Additional Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-teal" onClick={() => handle(() => markAtShelter(modal.caseId, formData), 'Animal admitted to shelter!')}>Admit</button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'care' && (
                <>
                  <h3 className="modal-title">✏️ Update Care Details</h3>
                  <div className="modal-form">
                    {field('diet', 'Diet / Food type')}
                    {field('health_status', 'Health Status')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-blue" onClick={() => handle(() => updateCareDetails(modal.caseId, formData), 'Care details updated!')}>Update</button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'adopt' && (
                <>
                  <h3 className="modal-title">🎉 Mark as Adopted</h3>
                  <div className="modal-form">
                    {field('adopterName', 'Adopter Name *')}
                    {field('adopterContact', 'Adopter Contact / Phone *')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-green" onClick={() => handle(() => markAdopted(modal.caseId, formData), 'Animal adopted! 🎉')}>Confirm Adoption</button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
              {modal.type === 'return' && (
                <>
                  <h3 className="modal-title">🔄 Return to Owner</h3>
                  <div className="modal-form">
                    {field('ownerName', 'Owner Name *')}
                    {field('ownerContact', 'Owner Contact / Phone')}
                    {field('notes', 'Notes')}
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-purple" onClick={() => handle(() => markReturnedToOwner(modal.caseId, formData), 'Animal returned to owner!')}>Confirm Return</button>
                    <button className="btn btn-gray" onClick={() => setModal(null)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}