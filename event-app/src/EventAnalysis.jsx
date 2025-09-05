import React from "react";
import "./EventAnalysis.css";
import { useLocation } from "react-router-dom";

export default function EventAnalysis() {
  const location = useLocation();
  const { analysis, event, club, pdfPath } = location.state || {};

  if (!analysis) return <p className="no-data">No analysis data found.</p>;

  return (
    <div className="analysis-page">
      <div className="analysis-card">
        <header className="analysis-header">
          <h1>{event} — {club} Analysis</h1>
          <p>Dive into the insights collected from your event feedback</p>
        </header>

        {/* Sentiment Counts */}
        <section className="analysis-section">
          <h2>Sentiment Counts</h2>
          <div className="sentiment-counts">
            {analysis.sentimentCounts &&
              Object.entries(analysis.sentimentCounts).map(([key, value]) => (
                <div key={key} className="sentiment-box">
                  <span className="count">{value}</span>
                  <span className="label">{key}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Summary */}
        <section className="analysis-section">
        <h2>Summary</h2>
        {analysis.summary.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
        ))}
        </section>

        {/* Charts */}
        <section className="analysis-section charts-grid">
          {analysis.pieChart && (
            <div className="chart-box">
              <h2>Sentiment Distribution</h2>
              <img
                src={`data:image/png;base64,${analysis.pieChart}`}
                alt="Pie Chart"
              />
            </div>
          )}
          {analysis.wordCloud && (
            <div className="chart-box">
              <h2>Word Cloud</h2>
              <img
                src={`data:image/png;base64,${analysis.wordCloud}`}
                alt="Word Cloud"
              />
            </div>
          )}
        </section>

        {/* Positive vs Negative Keywords */}
        <section className="analysis-section">
          <h2>Positive vs Negative Keywords</h2>
          <div className="keywords-split">
            <div>
              <h3>Positive</h3>
              {analysis.positiveKeywords ? (
                <img
                  src={`data:image/png;base64,${analysis.positiveKeywords}`}
                  alt="Positive Keywords"
                  style={{ maxWidth: "300px" }}
                />
              ) : (
                <p>None</p>
              )}
            </div>
            <div>
              <h3>Negative</h3>
              {analysis.negativeKeywords ? (
                <img
                  src={`data:image/png;base64,${analysis.negativeKeywords}`}
                  alt="Negative Keywords"
                  style={{ maxWidth: "300px" }}
                />
              ) : (
                <p>None</p>
              )}
            </div>
          </div>
        </section>

        {/* Trending Topics */}
        <section className="analysis-section">
          <h2>Trending Topics</h2>
          {analysis.trendingTopics && analysis.trendingTopics.length > 0 ? (
            <ul>
              {analysis.trendingTopics.map((topic, i) => <li key={i}>{topic}</li>)}
            </ul>
          ) : (
            <p>No trending topics found.</p>
          )}
        </section>

        {/* Sample Feedback */}
        <section className="analysis-section">
          <h2>Sample Feedback</h2>
          {analysis.sampleFeedback && analysis.sampleFeedback.length > 0 ? (
            <ul>
              {analysis.sampleFeedback.slice(0, 5).map((fb, i) => <li key={i}>{fb}</li>)}
            </ul>
          ) : (
            <p>No feedback samples available.</p>
          )}
        </section>

        {/* Engagement Score */}
        {analysis.engagementScore !== undefined && (
          <section className="analysis-section">
            <h2>Engagement Score</h2>
            <p>
              This event scored <strong>{analysis.engagementScore}%</strong> participation
            </p>
          </section>
        )}

        {/* PDF Download */}
        {pdfPath && (
          <div className="actions">
            <a
              href={`http://localhost:8000/reports/${pdfPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Download Full PDF Report
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
