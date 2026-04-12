import { useState, useEffect } from 'react';
import { getDashboardStats, getAllCases, getUsersByRole, assignVolunteer, closeCase } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

const IMAGE_BASE = 'http://localhost:5000';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const STATUS_COLORS = {
  reported: '#f59e0b', assigned: '#3b82f6', volunteer_accepted: '#6366f1',
  in_transit: '#8b5cf6', vet_accepted: '#0d9488', at_vet: '#ea580c',
  treatment_done: '#f97316', shelter_accepted: '#14b8a6', at_shelter: '#06b6d4',
  adopted: '#16a34a', returned_to_owner: '#84cc16', closed: '#6b7280',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedVol, setSelectedVol] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState('');
  const [historyModal, setHistoryModal] = useState(null);

  useEffect(() => {
    Promise.all([
      getDashboardStats(), getAllCases(),
      getUsersByRole('volunteer'), getUsersByRole('veterinarian'), getUsersByRole('shelter_staff'),
    ]).then(([s, c, v]) => {
      setStats(s.data);
      setCases(c.data.cases);
      setVolunteers(v.data);
    }).finally(() => setLoading(false));
  }, []);

  const refreshCases = async () => {
    const [casesRes, statsRes] = await Promise.all([getAllCases({ status: statusFilter }), getDashboardStats()]);
    setCases(casesRes.data.cases);
    setStats(statsRes.data);
  };

  const doAssignVolunteer = async () => {
    if (!selectedVol) return;
    setAssigning(true);
    try {
      await assignVolunteer(selectedCase._id, { volunteerId: selectedVol });
      setMsg('Volunteer assigned successfully!');
      setSelectedCase(null);
      setSelectedVol('');
      await refreshCases();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to assign volunteer.');
    } finally {
      setAssigning(false);
    }
  };

  const generatePDF = async (c) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(234, 88, 12);
    doc.text('Animal Rescue Case Report', 14, 20);
    doc.setFontSize(11); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.setDrawColor(234, 88, 12); doc.line(14, 32, 196, 32);
    doc.setFontSize(14); doc.setTextColor(0);
    doc.text(`Case ID: ${c.caseId}`, 14, 44);
    doc.setFontSize(11);
    doc.text(`Animal Name: ${c.animalName || 'Unknown'}`, 14, 56);
    doc.text(`Animal Type: ${c.animalType || 'Unknown'}`, 14, 64);
    doc.text(`Status: ${c.status.replace(/_/g, ' ')}`, 14, 72);
    doc.text(`Volunteer: ${c.assignedVolunteer?.name || 'Not assigned'}`, 14, 82);
    doc.text(`Veterinarian: ${c.assignedVet?.name || 'Not assigned'}`, 14, 90);
    doc.text(`Shelter Staff: ${c.assignedShelter?.name || 'Not assigned'}`, 14, 98);
    doc.text(`Location: ${c.location?.address || 'No location available'}`, 14, 108);
    doc.text(`Reported At: ${formatDateTime(c.createdAt)}`, 14, 116);
    doc.setFontSize(13); doc.setTextColor(234, 88, 12);
    doc.text('Case History', 14, 132);
    let y = 144;
    if (c.statusHistory?.length > 0) {
      c.statusHistory.forEach((h) => {
        doc.setFontSize(10); doc.setTextColor(0);
        doc.text(`• ${h.status.replace(/_/g, ' ')} - ${formatDateTime(h.timestamp)}`, 18, y);
        if (h.note) { y += 8; doc.setFontSize(9); doc.setTextColor(100); doc.text(`Note: ${h.note}`, 24, y); }
        y += 12;
      });
    } else {
      doc.setFontSize(10); doc.setTextColor(120); doc.text('No history available', 18, y);
    }
    doc.setFontSize(8); doc.setTextColor(150); doc.text('Animal Rescue System', 14, 287);
    doc.save(`${c.caseId}.pdf`);
  };

  const donutData = stats ? Object.entries(stats.statusBreakdown).filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: key.replace(/_/g, ' '), value, color: STATUS_COLORS[key] || '#9ca3af' })) : [];

  const lineData = (() => {
    if (!cases.length) return [];
    const counts = {};
    cases.forEach(c => { const day = formatDateShort(c.createdAt); counts[day] = (counts[day] || 0) + 1; });
    return Object.entries(counts).slice(-10).map(([date, count]) => ({ date, count }));
  })();

  const statCards = stats ? [
    { label: 'Total Cases', value: stats.totalCases, cls: 'blue' },
    { label: 'Reported', value: stats.statusBreakdown.reported, cls: 'yellow' },
    { label: 'In Transit', value: stats.statusBreakdown.inTransit, cls: 'purple' },
    { label: 'At Vet', value: stats.statusBreakdown.atVet, cls: 'orange' },
    { label: 'At Shelter', value: stats.statusBreakdown.atShelter, cls: 'teal' },
    { label: 'Adopted', value: stats.statusBreakdown.adopted, cls: 'green' },
  ] : [];

  const noReassignStatuses = ['volunteer_accepted', 'in_transit', 'vet_accepted', 'vet_declined', 'at_vet', 'treatment_done', 'shelter_accepted', 'shelter_declined', 'at_shelter', 'adopted', 'returned_to_owner', 'closed'];
  const completedStatuses = ['adopted', 'returned_to_owner'];
  const closedStatus = ['closed'];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: 4 }}>System overview and case management.</p>
          </div>
        </div>

        {msg && <div className="alert-success">{msg}<button className="alert-close" onClick={() => setMsg('')}>✕</button></div>}

        <div className="tabs">
          {['dashboard', 'cases', 'staff'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              {statCards.map((s, i) => (
                <div key={i} className={`stat-card ${s.cls}`}>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mini-stats">
              <div className="mini-stat blue"><div className="mini-stat-value">{stats.staff.totalVolunteers}</div><div className="mini-stat-label">Volunteers</div></div>
              <div className="mini-stat orange"><div className="mini-stat-value">{stats.staff.totalVets}</div><div className="mini-stat-label">Veterinarians</div></div>
              <div className="mini-stat teal"><div className="mini-stat-value">{stats.staff.totalShelterStaff}</div><div className="mini-stat-label">Shelter Staff</div></div>
            </div>
            <div className="charts-row">
              <div className="chart-card">
                <p className="chart-title">Cases by Status</p>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: 10, fontSize: '0.82rem', border: '1px solid #f3f4f6' }} />
                      <Legend iconType="circle" iconSize={8} formatter={(value) => (
                        <span style={{ fontSize: '0.75rem', color: '#374151', textTransform: 'capitalize' }}>{value}</span>
                      )} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>No data yet</div>}
              </div>
              <div className="chart-card">
                <p className="chart-title">Cases Over Time</p>
                {lineData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lineData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: '0.82rem', border: '1px solid #f3f4f6' }} formatter={(v) => [v, 'Cases']} />
                      <Line type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={2.5} dot={{ fill: '#ea580c', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Not enough data yet</div>}
              </div>
            </div>
            <h3 className="card-title" style={{ marginTop: 24 }}>Recent Cases</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Case ID</th><th>Animal</th><th>Location</th><th>Status</th><th>Reported By</th><th>Date & Time</th></tr></thead>
                <tbody>
                  {stats.recentCases.map(c => (
                    <tr key={c._id}>
                      <td><span className="case-id">{c.caseId}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.images?.[0] && (
                            <img src={`${IMAGE_BASE}/${c.images[0]}`} alt="animal"
                              onClick={() => window.open(`${IMAGE_BASE}/${c.images[0]}`, '_blank')}
                              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                          )}
                          <span>{c.animalName} ({c.animalType})</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location?.address}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.reportedBy?.name}</td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDateTime(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'cases' && (
          <>
            <div className="filter-row">
              <select className="filter-select" value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); getAllCases({ status: e.target.value }).then(r => setCases(r.data.cases)); }}>
                <option value="">All Status</option>
                {['reported', 'assigned', 'volunteer_accepted', 'volunteer_declined', 'in_transit', 'vet_accepted', 'vet_declined', 'at_vet', 'treatment_done', 'shelter_accepted', 'shelter_declined', 'at_shelter', 'adopted', 'returned_to_owner', 'closed']
                  .map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Case ID</th><th>Animal</th><th>Location</th><th>Status</th><th>Volunteer</th><th>Reported At</th><th>Actions</th></tr></thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c._id}>
                      <td><span className="case-id">{c.caseId}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.images?.[0] && (
                            <img src={`${IMAGE_BASE}/${c.images[0]}`} alt="animal"
                              onClick={() => window.open(`${IMAGE_BASE}/${c.images[0]}`, '_blank')}
                              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                          )}
                          <span>{c.animalName} ({c.animalType})</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location?.address}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.assignedVolunteer?.name || <span style={{ color: '#d1d5db' }}>Not assigned</span>}</td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDateTime(c.createdAt)}</td>
                      <td>
                        <button className="action-link blue" onClick={() => setHistoryModal(c)}>History</button>
                        <button className="action-link" style={{ marginLeft: 8, color: '#ea580c' }} onClick={() => generatePDF(c)}>PDF</button>
                        {!noReassignStatuses.includes(c.status) && (
                          <button className="action-link blue" style={{ marginLeft: 8 }} onClick={() => { setSelectedCase(c); setSelectedVol(''); }}>Assign</button>
                        )}
                        {![...completedStatuses, ...closedStatus].includes(c.status) && (
                          <button className="action-link red" style={{ marginLeft: 8 }}
                            onClick={async () => { await closeCase(c._id, { note: 'Closed by admin' }); setMsg('Case closed!'); await refreshCases(); }}>Close</button>
                        )}
                        {completedStatuses.includes(c.status) && <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', marginLeft: 8 }}>✅ Completed</span>}
                        {closedStatus.includes(c.status) && <span style={{ color: '#6b7280', fontWeight: 700, fontSize: '0.82rem', marginLeft: 8 }}>🔒 Closed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Assign Volunteer Modal */}
        {selectedCase && (
          <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Assign Volunteer</h3>
              <p className="modal-subtitle">Case: <strong>{selectedCase.caseId}</strong> — {selectedCase.animalType}</p>
              <div className="modal-form">
                <p className="modal-section-label">Select Volunteer</p>
                <div className="modal-assign-row">
                  <select value={selectedVol} onChange={e => setSelectedVol(e.target.value)}>
                    <option value="">Choose a volunteer...</option>
                    {volunteers.map(v => <option key={v._id} value={v._id}>{v.name} — {v.phone || v.email}</option>)}
                  </select>
                  <button className="btn btn-orange" onClick={doAssignVolunteer} disabled={assigning}>
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setSelectedCase(null)}>Cancel</button>
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
                    <img key={i} src={`${IMAGE_BASE}/${img}`} alt={`animal-${i}`}
                      onClick={() => window.open(`${IMAGE_BASE}/${img}`, '_blank')}
                      style={{ height: 70, width: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0, cursor: 'pointer', border: '2px solid #e5e7eb' }} />
                  ))}
                </div>
              )}
              <div className="timeline-wrapper">
                {historyModal.statusHistory?.length > 0 ? historyModal.statusHistory.map((h, i) => (
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
                )) : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No history available.</p>}
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