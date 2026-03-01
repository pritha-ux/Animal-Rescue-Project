import { useState, useEffect } from "react";
import "../styles/Dashboard.css";

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    // ✅ load ALL reports (from all users)
    const savedReports = JSON.parse(localStorage.getItem("allReports")) || [];
    setReports(savedReports);

    // load registered users
    const allUsers = Object.keys(localStorage)
      .filter(key => key.startsWith("user_"))
      .map(key => JSON.parse(localStorage.getItem(key)));

    // filter volunteers only
    const registeredVolunteers = allUsers
      .filter(u => u.role === "volunteer")
      .map(v => v.username);

    setVolunteers(registeredVolunteers);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  const assignVolunteer = (caseId, volunteer) => {
    const updatedReports = reports.map(report => {
      if (report.caseId === caseId) {
        return {
          ...report,
          volunteer: volunteer,
          assignmentStatus: "Pending"
        };
      }
      return report;
    });

    // ✅ save back to ALL reports (not "reports")
    localStorage.setItem("allReports", JSON.stringify(updatedReports));
    setReports(updatedReports);

    alert(`Case ${caseId} assigned to ${volunteer}`);
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <div className="brand">🐾 Animal Rescue System - Admin</div>
        <div className="links">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-box">
        <h1>Admin Dashboard</h1>
        <p>Assign reported cases to volunteers</p>

        {reports.length === 0 ? (
          <p>No cases reported yet.</p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Animal Name</th>
                <th>Description</th>
                <th>Location</th>
                <th>Status</th>
                <th>Volunteer</th>
                <th>Assign</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.caseId}>
                  <td>{report.caseId}</td>
                  <td>{report.animalName}</td>
                  <td>{report.description}</td>
                  <td>{report.location}</td>
                  <td>{report.status}</td>
                  <td>{report.volunteer || "Unassigned"}</td>

                  <td>
                    {report.assignmentStatus === "Pending" ? (
                      "Pending"
                    ) : (
                      <select
                        onChange={(e) =>
                          assignVolunteer(report.caseId, e.target.value)
                        }
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Assign Volunteer
                        </option>

                        {volunteers.map((vol) => (
                          <option key={vol} value={vol}>
                            {vol}
                          </option>
                        ))}
                      </select>
                    )}
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

export default AdminDashboard;