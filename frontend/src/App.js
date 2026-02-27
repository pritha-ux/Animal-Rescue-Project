import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import VetDashboard from "./pages/VetDashboard";
import ShelterDashboard from "./pages/ShelterDashboard";
import ReportAnimal from "./pages/ReportAnimal";
import TrackingPage from "./pages/TrackingPage";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role-based protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["user", "reporter"]}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute allowedRoles={["volunteer"]}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vet-dashboard"
          element={
            <ProtectedRoute allowedRoles={["vet"]}>
              <VetDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shelter-dashboard"
          element={
            <ProtectedRoute allowedRoles={["shelter"]}>
              <ShelterDashboard />
            </ProtectedRoute>
          }
        />


<Route
  path="/report"
  element={
    <ProtectedRoute allowedRoles={["user"]}>
      <ReportAnimal />
    </ProtectedRoute>
  }
/>
<Route
  path="/tracking"
  element={
    <ProtectedRoute allowedRoles={["user"]}>
      <TrackingPage />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;