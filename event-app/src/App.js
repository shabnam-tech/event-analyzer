import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import ClubSelection from "./ClubSelection";
import EventForm from "./EventForm";
import About from "./About";
import ReportsPage from "./ReportsPage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/clubs" element={<ClubSelection />} />
        <Route path="/event-form/:clubName" element={<EventForm />} />
        <Route path="/reports/:clubName" element={<ReportsPage />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;