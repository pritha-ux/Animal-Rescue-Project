import { useState } from "react";
import "../styles/ReportAnimal.css";

function ReportAnimal() {
  const [animalName, setAnimalName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [caseId, setCaseId] = useState("");

  // handle image selection
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!animalName || !description || !location || !image) {
      alert("Please fill all fields and upload an image.");
      return;
    }

    // generate a simple case ID
    const newCaseId = "CASE-" + Date.now();
    setCaseId(newCaseId);

    // save report temporarily in localStorage (replace with backend later)
    const report = {
      caseId: newCaseId,
      animalName,
      description,
      location,
      image: image.name,
      status: "Reported"
    };

    const savedReports = JSON.parse(localStorage.getItem("reports")) || [];
    savedReports.push(report);
    localStorage.setItem("reports", JSON.stringify(savedReports));

    alert(`Animal reported successfully! Case ID: ${newCaseId}`);

    // reset form
    setAnimalName("");
    setDescription("");
    setLocation("");
    setImage(null);
  };

  return (
    <div className="report-container">
      <form className="report-box" onSubmit={handleSubmit}>
        <h2>🐾 Report Injured/Abandoned Animal</h2>

        <label>Animal Name</label>
        <input
          type="text"
          value={animalName}
          onChange={(e) => setAnimalName(e.target.value)}
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <label>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        <button type="submit">Report Animal</button>

        {caseId && (
          <p className="case-id">Your Case ID: <strong>{caseId}</strong></p>
        )}
      </form>
    </div>
  );
}

export default ReportAnimal;