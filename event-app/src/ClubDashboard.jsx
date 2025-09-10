import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";
import "./ClubDashboard.css";

export default function ClubDashboard() {
  const { clubName } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [sentimentSummary, setSentimentSummary] = useState({ Positive: 0, Neutral: 0, Negative: 0 });
  const [topPositive, setTopPositive] = useState([]);
  const [topNegative, setTopNegative] = useState([]);
  const [totalParticipation, setTotalParticipation] = useState(0);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/reports/${clubName}`)
      .then(res => res.json())
      .then(data => {
        setReports(data);

        let sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0 };
        let positiveFeedbacks = [];
        let negativeFeedbacks = [];
        let participation = 0;

        data.forEach(event => {
  participation += parseInt(event.strength) || 0;

  const feedback = event.top_feedback || { Positive: [], Negative: [] }; // ✅ fallback
  positiveFeedbacks.push(...feedback.Positive);
  negativeFeedbacks.push(...feedback.Negative);

  if (event.sentiment_counts) {
    sentimentCounts.Positive += event.sentiment_counts.Positive || 0;
    sentimentCounts.Neutral += event.sentiment_counts.Neutral || 0;
    sentimentCounts.Negative += event.sentiment_counts.Negative || 0;
  }
});


        setSentimentSummary(sentimentCounts);
        setTopPositive(positiveFeedbacks.slice(0, 5));
        setTopNegative(negativeFeedbacks.slice(0, 5));
        setTotalParticipation(participation);
      })
      .catch(err => console.error(err));
  }, [clubName]);

  const sentimentData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        label: "Sentiment Count",
        data: [sentimentSummary.Positive, sentimentSummary.Neutral, sentimentSummary.Negative],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
      },
    ],
  };

  const handleUpload = () => navigate(`/event-form/${encodeURIComponent(clubName)}`);
  const handleReports = () => navigate(`/reports/${encodeURIComponent(clubName)}`);

  return (
    <main className="dashboard-page">
      <div className="dashboard-card">
        <header>
          <h1>{clubName} — Dashboard</h1>
        </header>

        <section className="dashboard-section charts">
          <div className="chart-container">
            <h2>Overall Sentiment</h2>
            <Pie data={sentimentData} />
          </div>
        </section>

        <section className="dashboard-section events">
  <h2>Events Conducted</h2>
  {reports.length ? (
    <table>
      <thead>
        <tr>
          <th>Event</th>
          <th>Date</th>
          <th>Participation</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r, idx) => (
          <tr key={idx}>
            <td>{r.event}</td>
            <td>{r.date}</td>
            <td>{r.strength}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>No events conducted</p>
  )}
</section>


        <section className="dashboard-section feedbacks">
          <div className="feedback-column">
            <h2>Top Positive Feedback</h2>
            <ul>
              {topPositive.length ? topPositive.map((f, idx) => <li key={idx}>{f}</li>) : <li>No data</li>}
            </ul>
          </div>
          <div className="feedback-column">
            <h2>Top Negative Feedback</h2>
            <ul>
              {topNegative.length ? topNegative.map((f, idx) => <li key={idx}>{f}</li>) : <li>No data</li>}
            </ul>
          </div>
        </section>

        <section className="dashboard-section overall">
          <h2>Overall Participation: {totalParticipation}</h2>
        </section>

        <footer className="dashboard-actions">
          <button className="btn" onClick={handleUpload}>Upload Feedback</button>
          <button className="btn secondary" onClick={handleReports}>Past Reports</button>
        </footer>
      </div>
    </main>
  );
}