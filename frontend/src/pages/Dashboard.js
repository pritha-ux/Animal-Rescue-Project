import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/");
    else setUser(storedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Home</h2>
        <li onClick={() => navigate("/report-animal")}>Report Animal</li>
        <li onClick={() => navigate("/notifications")}>My Reports</li>
        <li onClick={() => navigate("/admin-assignments")}>Admin Assignments</li>
        <li onClick={() => navigate("/volunteer-status")}>Volunteer Status</li>
        <li onClick={() => navigate("/volunteer-status")}>Vet Records</li>
        <li onClick={() => navigate("/volunteer-status")}>Shelter Tracking</li>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="welcome-text">
          Welcome, {user.username || user.email}!
        </div>

        <img
          className="dashboard-image"
         src="https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=60"
  alt="Saving injured animal"
        />

        <div className="dashboard-quote">
          "Saving one animal won’t change the world, but it will change the world for that one animal."
        </div>
      </div>
    </div>
  );
};

export default Dashboard;