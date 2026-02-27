import { useEffect, useState } from "react";

function Tracking() {
  const username = JSON.parse(localStorage.getItem("user"))?.username;
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // fetch reports for this user
    fetch(`http://localhost:5000/api/reports?user=${username}`)
      .then(res => res.json())
      .then(data => setReports(data));
  }, [username]);

  return (
    <div>
      <h2>Your Reported Cases</h2>
      {reports.length === 0 ? (
        <p>No reports yet.</p>
      ) : (
        <ul>
          {reports.map(r => (
            <li key={r.caseId}>
              Case ID: {r.caseId} | Animal: {r.animalType} | Status: {r.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Tracking;