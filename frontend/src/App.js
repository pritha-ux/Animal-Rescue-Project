import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import PublicDashboard from './pages/PublicDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VetDashboard from './pages/VetDashboard';
import ShelterDashboard from './pages/ShelterDashboard';
import TrackCase from './pages/TrackCase';
import ReportCase from './pages/ReportCase';

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#9ca3af' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = { admin: '/admin', public: '/public', volunteer: '/volunteer', veterinarian: '/vet', shelter_staff: '/shelter' };
  return <Navigate to={routes[user.role] || '/login'} />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track/:caseId" element={<TrackCase />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          <Route path="/admin/*" element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/public/*" element={<RoleRoute roles={['public', 'admin']}><PublicDashboard /></RoleRoute>} />
          <Route path="/volunteer/*" element={<RoleRoute roles={['volunteer']}><VolunteerDashboard /></RoleRoute>} />
          <Route path="/vet/*" element={<RoleRoute roles={['veterinarian']}><VetDashboard /></RoleRoute>} />
          <Route path="/shelter/*" element={<RoleRoute roles={['shelter_staff']}><ShelterDashboard /></RoleRoute>} />
          <Route path="/report" element={<RoleRoute roles={['public', 'admin']}><ReportCase /></RoleRoute>} />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
