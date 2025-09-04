import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "./ReportsPage.css";

pdfjs.GlobalWorkerOptions.workerSrc = 
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;



export default function ReportsPage() {
  const { clubName } = useParams();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/reports/${clubName}`)
      .then((res) => res.json())
      .then((data) => {
        // ✅ Remove duplicates by pdf_path
        const uniqueReports = data.filter(
          (r, index, self) =>
            index === self.findIndex((t) => t.pdf_path === r.pdf_path)
        );
        setReports(uniqueReports);
      })
      .catch((err) => console.error("Error fetching reports:", err));
  }, [clubName]);

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <main className="page">
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

            <Document
              file={`http://127.0.0.1:8000/reports/${selectedReport}`}
              onLoadSuccess={handleDocumentLoadSuccess}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={600}
                />
              ))}
            </Document>

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
