import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { getNotifications, markAllNotificationsRead } from '../api';
import '../styles/Navbar.css';

const roleLabels = {
  admin: 'Admin',
  public: 'Public',
  volunteer: 'Volunteer',
  veterinarian: 'Vet',
  shelter_staff: 'Shelter',
};

const dashRoutes = {
  admin: '/admin',
  public: '/public',
  volunteer: '/volunteer',
  veterinarian: '/vet',
  shelter_staff: '/shelter',
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const fetchNotifications = () => {
    getNotifications().then(res => setNotifications(res.data)).catch(() => {});
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // ── Poll every 30 seconds ──
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.notif-wrapper')) setShowNotif(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <nav className="navbar">
      <Link to={dashRoutes[user?.role] || '/'} className="navbar-brand">
        🐾 Animal Rescue
      </Link>

      <div className="navbar-right">
        {user?.role !== 'admin' && (
          <Link to="/report" className="navbar-report-btn">+ Report Animal</Link>
        )}

        <div className="notif-wrapper">
          <button className="notif-btn" onClick={() => {
            setShowNotif(!showNotif);
            if (!showNotif) fetchNotifications(); // ← refresh when opening
          }}>
            🔔
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {unread > 0 && (
                  <button className="notif-mark-all" onClick={handleMarkAll}>Mark all read</button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                      <p>{n.message}</p>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="navbar-user-info">
            <span className="navbar-name">{user?.name}</span>
            <span className="navbar-role">{roleLabels[user?.role]}</span>
          </div>
        </div>

        <button className="navbar-logout" onClick={() => { logoutUser(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </nav>
  );
}