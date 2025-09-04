import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { useParams } from "react-router-dom";
import "./EventForm.css";

export default function EventUploadForm() {
  const { clubName } = useParams();
  const [form, setForm] = useState({
    eventName: "",
    club: clubName || "",
    description: "",
    date: "",
    strength: "",
    file: null,
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onFileSelect = (file) => {
    if (!file) return;
    setForm((p) => ({ ...p, file }));
  };

  const onFileInput = (e) => {
    const file = e.target.files?.[0];
    onFileSelect(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    onFileSelect(file);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (
      !form.eventName ||
      !form.club ||
      !form.description ||
      !form.date ||
      !form.strength ||
      !form.file
    ) {
      alert("Please complete all fields and upload the feedback file.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("file", form.file);
      payload.append("eventName", form.eventName);
      payload.append("club", form.club);
      payload.append("description", form.description);
      payload.append("date", form.date);
      payload.append("strength", form.strength);

      const res = await fetch("http://127.0.0.1:8000/analyze/", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) throw new Error("Upload failed");

      // Expecting backend to return JSON with pdfPath
      const data = await res.json();
      alert(`Feedback analyzed successfully. Report saved as ${data.pdfPath}`);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to reports page for the entered club
  const goToReports = () => {
    if (!form.club) {
      alert("Please enter/select a club name first.");
      return;
    }
    navigate(`/reports/${form.club}`);
  };

  return (
    <main className="page">
      <section className="card" role="region" aria-labelledby="form-title">
        <header className="card__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 id="form-title">Event Feedback Analyzer — Upload Portal</h1>
            <p>
              Enter event details and upload the collective feedback file to start
              analysis.
            </p>
          </div>
          <button className="btn secondary" onClick={goToReports}>
            📂 Past Reports
          </button>
        </header>

        <form className="form" onSubmit={submit} noValidate>
          <div className="grid">
            <div className="field">
              <label htmlFor="eventName">Event Name</label>
              <input
                id="eventName"
                name="eventName"
                type="text"
                placeholder="eg. Tech Fest 2025"
                required
                value={form.eventName}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label htmlFor="club">Organizing Club</label>
              <input
                id="club"
                name="club"
                type="text"
                placeholder="eg. CodeX Club"
                required
                value={form.club}
                onChange={onChange}
              />
            </div>

            <div className="field field--full">
              <label htmlFor="description">Event Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Brief overview, goals, highlights…"
                required
                value={form.description}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label htmlFor="date">Date of the Event</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={form.date}
                onChange={onChange}
              />
            </div>

            <div className="field">
              <label htmlFor="strength">Participation Strength</label>
              <input
                id="strength"
                name="strength"
                type="number"
                min="1"
                placeholder="eg. 250"
                required
                value={form.strength}
                onChange={onChange}
              />
            </div>

            <div className="field field--full">
              <label>Upload Feedback File</label>
              <div
                className={`dropzone ${dragActive ? "dropzone--active" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload feedback file"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-input"
                  onChange={onFileInput}
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                />
                <div className="dropzone__content">
                  Drag & drop feedback file here, or click to browse.
                  <div className="sub">CSV, TXT, XLSX formats supported.</div>
                </div>
              </div>

              {form.file && (
                <div className="file-info" aria-live="polite">
                  <div className="file-name">{form.file.name}</div>
                  <div className="file-meta">
                    {(form.file.size / 1024).toFixed(1)} KB •{" "}
                    {form.file.type || "unknown"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="actions">
            <button
              type="submit"
              className="btn"
              disabled={
                loading ||
                !form.eventName ||
                !form.club ||
                !form.description ||
                !form.date ||
                !form.strength ||
                !form.file
              }
            >
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </button>
          </footer>
        </form>
      </section>
    </main>
  );
}
