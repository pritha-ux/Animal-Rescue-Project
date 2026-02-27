import { useState, useEffect } from "react";
import "../styles/TrackingPage.css";

function TrackingPage() {
  const [reports, setReports] = useState([]);
  const username = JSON.parse(localStorage.getItem("user"))?.username;

  useEffect(() => {
    // fetch only reports for the current user
    const savedReports = JSON.parse(localStorage.getItem(`reports_${username}`)) || [];
    setReports(savedReports);
  }, [username]);

  return (
    <div className="tracking-container">
      <h2>Tracked Reports</h2>
      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Animal Name</th>
              <th>Description</th>
              <th>Location</th>
              <th>Image</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.caseId}>
                <td>{r.caseId}</td>
                <td>{r.animalName}</td>
                <td>{r.description}</td>
                <td>{r.location}</td>
                <td>
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.animalName}
                      style={{ width: "80px", height: "60px", objectFit: "cover" }}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrackingPage;