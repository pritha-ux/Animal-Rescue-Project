import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const username = JSON.parse(localStorage.getItem("user"))?.username;
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem("reports")) || [];
    // only show cases assigned to this volunteer and pending
    const myCases = savedReports.filter(
      (report) => report.volunteer === username && report.assignmentStatus === "Pending"
    );
    setReports(myCases);
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  const respondToCase = (caseId, response) => {
    const savedReports = JSON.parse(localStorage.getItem("reports")) || [];
    const updatedReports = savedReports.map((report) => {
      if (report.caseId === caseId) {
        return {
          ...report,
          assignmentStatus: response === "accept" ? "Accepted" : "Declined",
          status: response === "accept" ? "In Progress" : "Reported",
          volunteer: response === "accept" ? username : null, // remove volunteer if declined
        };
      }
      return report;
    });

    localStorage.setItem("reports", JSON.stringify(updatedReports));
    setReports(updatedReports.filter(r => r.volunteer === username && r.assignmentStatus === "Pending"));
    alert(`You have ${response === "accept" ? "accepted" : "declined"} case ${caseId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <div className="brand">🐾 Animal Rescue System - Volunteer</div>
        <div className="links">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-box">
        <h1>Welcome, {username}!</h1>
        <p>Here are the cases assigned to you:</p>

        {reports.length === 0 ? (
          <p>No pending cases at the moment.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Animal Name</th>
                <th>Description</th>
                <th>Location</th>
                <th>Image</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.caseId}>
                  <td>{report.caseId}</td>
                  <td>{report.animalName}</td>
                  <td>{report.description}</td>
                  <td>{report.location}</td>
                  <td>
                    {report.image ? (
                      <img
                        src={report.image}
                        alt={report.animalName}
                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      />
                    ) : (
                      "No image"
                    )}
                  </td>
                  <td>
                    <button onClick={() => respondToCase(report.caseId, "accept")}>
                      Accept
                    </button>
                    <button onClick={() => respondToCase(report.caseId, "decline")}>
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default VolunteerDashboard;