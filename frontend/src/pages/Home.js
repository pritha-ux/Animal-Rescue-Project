import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  // redirect to login if not logged in
  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
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
        <p>This is your Reporter Dashboard. You can report animals and track cases here.</p>

        <div className="dashboard-buttons">
          <button onClick={() => navigate("/report")}>Report Animal</button>
          <button onClick={() => navigate("/tracking")}>Track Cases</button>
        </div>
      </div>
    </div>
  );
}

export default Home;