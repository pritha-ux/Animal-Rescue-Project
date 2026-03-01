import { useState } from "react";
import "../styles/ReportAnimal.css";

function ReportAnimal() {
  const username = localStorage.getItem("username");
  const [animalName, setAnimalName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [caseId, setCaseId] = useState("");

  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!animalName || !description || !location || !image) {
      alert("Please fill all fields and upload an image.");
      return;
    }

    const newCaseId = "CASE-" + Date.now();
    setCaseId(newCaseId);

    const reader = new FileReader();
    reader.onloadend = () => {
      const report = {
        caseId: newCaseId,
        animalName,
        description,
        location,
        image: reader.result,
        status: "Reported",
        username
      };

      // save only for this user
      const userReports = JSON.parse(localStorage.getItem(`reports_${username}`)) || [];
      userReports.push(report);
      localStorage.setItem(`reports_${username}`, JSON.stringify(userReports));

      // save for admin to see all
      const allReports = JSON.parse(localStorage.getItem("allReports")) || [];
      allReports.push(report);
      localStorage.setItem("allReports", JSON.stringify(allReports));

      alert(`Animal reported successfully! Case ID: ${newCaseId}`);

      setAnimalName("");
      setDescription("");
      setLocation("");
      setImage(null);
    };

    reader.readAsDataURL(image);
  };

  return (
    <div className="report-container">
      <form className="report-box" onSubmit={handleSubmit}>
        <h2>🐾 Report Injured/Abandoned Animal</h2>

        <label>Animal Name</label>
        <input type="text" value={animalName} onChange={(e) => setAnimalName(e.target.value)} />

        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>

        <label>Location</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />

        <label>Upload Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {image && (
          <div className="image-preview">
            <p>Preview:</p>
            <img src={URL.createObjectURL(image)} alt="Preview" />
          </div>
        )}

        <button type="submit">Report Animal</button>

        {caseId && <p className="case-id">Your Case ID: <strong>{caseId}</strong></p>}
      </form>
    </div>
  );
}

export default ReportAnimal;