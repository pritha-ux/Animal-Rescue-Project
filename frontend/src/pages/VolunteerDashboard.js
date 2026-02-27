import "../styles/Dashboard.css";

function VolunteerDashboard() {
  const username = JSON.parse(localStorage.getItem("user"))?.username;

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <div className="brand">🐾 Animal Rescue System</div>
        <div className="links">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-box">
        <h1>Welcome, {username}!</h1>
        <p>This is your Volunteer Dashboard. You can report animals and track cases here.</p>
      </div>
    </div>
  );
}

export default VolunteerDashboard;