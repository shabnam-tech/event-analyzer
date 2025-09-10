import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ReportsPage.css";


export default function ReportsPage() {
  const { clubName } = useParams();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [numPages, setNumPages] = useState(null);

  // fetch reports
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/reports/${clubName}`)
      .then((res) => res.json())
      .then((data) => {
        const uniqueReports = data.filter(
          (r, index, self) =>
            index === self.findIndex((t) => t.pdf_path === r.pdf_path)
        );
        setReports(uniqueReports);
      })
      .catch(console.error);
  }, [clubName]);

  const handleDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handleDeleteReport = (pdfPath) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    fetch(`http://127.0.0.1:8000/api/reports/${pdfPath}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete");
        setReports((prev) => prev.filter((r) => r.pdf_path !== pdfPath));
      })
      .catch(console.error);
  };

  return (
    <main className="reports-page">
      <div className="card">
        <div className="card__head">
          <h1>{clubName} — Past Reports</h1>
        </div>

        {reports.length === 0 ? (
          <p>No reports found for this club yet.</p>
        ) : (
          <div className="report-grid">
            {reports.map((r, idx) => (
              <div
                key={idx}
                className="report-card"
                onClick={() => setSelectedReport(r.pdf_path)}
              >
                <img src="/pdf-icon.png" alt="PDF" className="pdf-icon" />
                <span>{r.event}</span>
                <small>{r.date}</small>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent opening PDF
                    handleDeleteReport(r.pdf_path);
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div
          className="pdf-viewer-overlay"
          onClick={() => setSelectedReport(null)}
        >
          <div className="pdf-viewer" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedReport(null)}
            >
              ✖ Close
            </button>

            <iframe
              src={`http://127.0.0.1:8000/reports/${selectedReport}`}
              width="100%"
              height="600px"
              style={{ border: "none" }}
            ></iframe>

            <a
              href={`http://127.0.0.1:8000/reports/${selectedReport}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              ⬇ Download
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
