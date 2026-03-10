import { useState, useEffect } from 'react';
import { getDashboardStats, getAllCases, getUsersByRole, assignVolunteer, assignVet, assignShelter, closeCase } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import '../styles/Dashboard.css';
import '../styles/Modal.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [vets, setVets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      getDashboardStats(), getAllCases(),
      getUsersByRole('volunteer'), getUsersByRole('veterinarian'), getUsersByRole('shelter_staff'),
    ]).then(([s, c, v, vet, sh]) => {
      setStats(s.data); setCases(c.data.cases);
      setVolunteers(v.data); setVets(vet.data); setShelters(sh.data);
    }).finally(() => setLoading(false));
  }, []);

  const refreshCases = () => getAllCases({ status: statusFilter }).then(r => setCases(r.data.cases));

  const doAssign = async (fn, successMsg) => {
    await fn();
    setMsg(successMsg);
    setSelectedCase(null);
    refreshCases();
  };

  const statCards = stats ? [
    { label: 'Total Cases', value: stats.totalCases, cls: 'blue', icon: '📋' },
    { label: 'Reported', value: stats.statusBreakdown.reported, cls: 'yellow', icon: '🆕' },
    { label: 'In Transit', value: stats.statusBreakdown.inTransit, cls: 'purple', icon: '🚗' },
    { label: 'At Vet', value: stats.statusBreakdown.atVet, cls: 'orange', icon: '🩺' },
    { label: 'At Shelter', value: stats.statusBreakdown.atShelter, cls: 'teal', icon: '🏠' },
    { label: 'Adopted', value: stats.statusBreakdown.adopted, cls: 'green', icon: '🎉' },
  ] : [];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🛡️ Admin Dashboard</h1>
        </div>

        {msg && (
          <div className="alert-success">
            {msg}
            <button className="alert-close" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        <div className="tabs">
          {['dashboard', 'cases', 'staff'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              {statCards.map((s, i) => (
                <div key={i} className={`stat-card ${s.cls}`}>
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mini-stats">
              <div className="mini-stat blue">
                <div className="mini-stat-value">{stats.staff.totalVolunteers}</div>
                <div className="mini-stat-label">🙋 Volunteers</div>
              </div>
              <div className="mini-stat orange">
                <div className="mini-stat-value">{stats.staff.totalVets}</div>
                <div className="mini-stat-label">🩺 Veterinarians</div>
              </div>
              <div className="mini-stat teal">
                <div className="mini-stat-value">{stats.staff.totalShelterStaff}</div>
                <div className="mini-stat-label">🏠 Shelter Staff</div>
              </div>
            </div>

            <h3 className="card-title">Recent Cases</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case ID</th><th>Animal</th><th>Location</th><th>Status</th><th>Reported By</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCases.map(c => (
                    <tr key={c._id}>
                      <td><span className="case-id">{c.caseId}</span></td>
                      <td>{c.animalName} ({c.animalType})</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location?.address}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.reportedBy?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CASES TAB */}
        {tab === 'cases' && (
          <>
            <div className="filter-row">
              <select className="filter-select" value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); getAllCases({ status: e.target.value }).then(r => setCases(r.data.cases)); }}>
                <option value="">All Status</option>
                {['reported','assigned','volunteer_accepted','volunteer_declined','in_transit','at_vet','at_shelter','adopted','returned_to_owner','closed'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Case ID</th><th>Animal</th><th>Location</th><th>Status</th><th>Volunteer</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c._id}>
                      <td><span className="case-id">{c.caseId}</span></td>
                      <td>{c.animalName} ({c.animalType})</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location?.address}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.assignedVolunteer?.name || '—'}</td>
                      <td>
                        <button className="action-link blue" onClick={() => setSelectedCase(c)}>Assign</button>
                        {!['closed','adopted','returned_to_owner'].includes(c.status) && (
                          <button className="action-link red" style={{ marginLeft: 8 }}
                            onClick={() => closeCase(c._id, { note: 'Closed by admin' }).then(() => { setMsg('Case closed!'); refreshCases(); })}>
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* STAFF TAB */}
        {tab === 'staff' && (
          <div className="staff-grid">
            {[
              { title: '🙋 Volunteers', list: volunteers },
              { title: '🩺 Veterinarians', list: vets },
              { title: '🏠 Shelter Staff', list: shelters },
            ].map(({ title, list }) => (
              <div key={title} className="staff-card">
                <p className="staff-card-title">{title} ({list.length})</p>
                {list.length === 0
                  ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None registered yet</p>
                  : list.map(u => (
                    <div key={u._id} className="staff-member">
                      <div className="staff-avatar">{u.name[0]}</div>
                      <div className="staff-info">
                        <p>{u.name}</p>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        )}

        {/* ASSIGN MODAL */}
        {selectedCase && (
          <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Assign Team — {selectedCase.caseId}</h3>

              <div className="modal-form">
                <p className="modal-section-label">Assign Volunteer</p>
                <div className="modal-assign-row">
                  <select id="vol-sel">
                    <option value="">Select volunteer</option>
                    {volunteers.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                  <button className="btn btn-blue"
                    onClick={() => { const v = document.getElementById('vol-sel').value; if(v) doAssign(() => assignVolunteer(selectedCase._id, { volunteerId: v }), 'Volunteer assigned!'); }}>
                    Assign
                  </button>
                </div>

                <hr className="modal-divider" />
                <p className="modal-section-label">Assign Veterinarian</p>
                <div className="modal-assign-row">
                  <select id="vet-sel">
                    <option value="">Select vet</option>
                    {vets.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                  <button className="btn btn-orange"
                    onClick={() => { const v = document.getElementById('vet-sel').value; if(v) doAssign(() => assignVet(selectedCase._id, { vetId: v }), 'Vet assigned!'); }}>
                    Assign
                  </button>
                </div>

                <hr className="modal-divider" />
                <p className="modal-section-label">Assign Shelter</p>
                <div className="modal-assign-row">
                  <select id="shl-sel">
                    <option value="">Select shelter</option>
                    {shelters.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                  <button className="btn btn-teal"
                    onClick={() => { const v = document.getElementById('shl-sel').value; if(v) doAssign(() => assignShelter(selectedCase._id, { shelterId: v }), 'Shelter assigned!'); }}>
                    Assign
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-gray" onClick={() => setSelectedCase(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
