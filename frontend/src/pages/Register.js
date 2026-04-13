import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const roles = [
  { value: 'public',        icon: '🌍', label: 'General Public' },
  { value: 'volunteer',     icon: '🙋', label: 'Volunteer'      },
  { value: 'veterinarian',  icon: '🩺', label: 'Veterinarian'   },
  { value: 'shelter_staff', icon: '🏠', label: 'Shelter Staff'  },
];

const dashRoutes = {
  admin: '/admin', public: '/public', volunteer: '/volunteer',
  veterinarian: '/vet', shelter_staff: '/shelter'
};

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'public'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data);
      navigate(dashRoutes[res.data.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🐾</div>
          <h1>Create Account</h1>
          <p>Join the Animal Rescue System</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required placeholder="John Doe"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" placeholder="9800000000"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Register As</label>
            <div className="role-grid">
              {roles.map(r => (
                <div key={r.value}
                  className={`role-option ${form.role === r.value ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, role: r.value })}>
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-label">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}