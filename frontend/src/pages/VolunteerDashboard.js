import { useState, useEffect } from 'react';
import { getVolunteerCases, acceptCase, declineCase, markInTransit } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';

export default function VolunteerDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () => getVolunteerCases().then(r => setCases(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handle = async (fn, successMsg) => {
    await fn();
    setMsg(successMsg);
    load();
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🙋 Volunteer Dashboard</h1>
        </div>

        {msg && (
          <div className="alert-success">
            {msg} <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {loading ? <div className="loading">Loading your cases...</div>
          : cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🙋</div>
              <p>No cases assigned to you yet. Check back later!</p>
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
                  {c.reportedBy && (
                    <p className="case-card-meta">👤 Reported by: {c.reportedBy.name} • {c.reportedBy.phone}</p>
                  )}

                  <div className="case-card-actions">
                    {c.status === 'assigned' && (
                      <>
                        <button className="btn btn-green"
                          onClick={() => handle(() => acceptCase(c._id), '✅ Case accepted!')}>
                          ✅ Accept Case
                        </button>
                        <button className="btn btn-red"
                          onClick={() => handle(() => declineCase(c._id, { reason: 'Cannot attend' }), 'Case declined')}>
                          ❌ Decline
                        </button>
                      </>
                    )}
                    {c.status === 'volunteer_accepted' && (
                      <button className="btn btn-purple"
                        onClick={() => handle(() => markInTransit(c._id), '🚗 Marked as in transit!')}>
                        🚗 Mark In Transit (Animal Picked Up)
                      </button>
                    )}
                    {c.status === 'in_transit' && (
                      <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.88rem' }}>🚗 Currently in transit to vet...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
