import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCases } from '../api';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';
import '../styles/Cases.css';

export default function PublicDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyCases().then(res => setCases(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Dashboard</h1>
          <button className="btn btn-green" onClick={() => navigate('/report')}>+ Report Animal</button>
        </div>

        {/* Cases List */}
        <h2 className="card-title">📋 My Reported Cases</h2>
        {loading ? (
          <div className="loading">Loading your cases...</div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <p>No cases reported yet.</p>
            <button className="btn btn-green" onClick={() => navigate('/report')}>Report an Animal</button>
          </div>
        ) : (
          <div className="cases-container">
            {/* Timeline */}
            <div className="timeline">
              {cases.map(c => (
                <div
                  key={c._id}
                  className={`timeline-item ${selectedCase?._id === c._id ? 'active' : ''}`}
                  onClick={() => setSelectedCase(c)}
                >
                  <h4>{c.animalName} ({c.animalType})</h4>
                  <p>{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            {/* Medical Records */}
            <div className="records">
              {selectedCase ? (
                selectedCase.medicalRecords.length === 0 ? (
                  <p>No medical records available for this case.</p>
                ) : (
                  selectedCase.medicalRecords.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`record-card ${rec.expanded ? 'expanded' : ''}`}
                      onClick={() => {
                        selectedCase.medicalRecords[idx].expanded = !rec.expanded;
                        setSelectedCase({ ...selectedCase });
                      }}
                    >
                      <h5>{rec.title} - {rec.date}</h5>
                      <div className="details">
                        <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                        <p><strong>Treatment:</strong> {rec.treatment}</p>
                        <p><strong>Medications:</strong> {rec.medications}</p>
                        {rec.notes && <p><strong>Notes:</strong> {rec.notes}</p>}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p>Select a case from the timeline to see medical records.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}