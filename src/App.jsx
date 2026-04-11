import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import CitizenApp from "./CitizenApp";

// Import Global and App-specific styles
import "./index.css"; 
import "./App.css";

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      <div className="landing-header">
        <h1>Gov-RoadAI</h1>
      </div>

      <p className="landing-subtitle">
        Intelligent Infrastructure Management Command Center powered by
        Computer Vision and Spatial Intelligence.
      </p>

      <div className="portal-container">
        <Link to="/report" className="portal-card card-modern">
          <div className="portal-icon">📱</div>
          <span className="portal-title">Citizen Portal</span>
          <span className="text-muted">Report issues instantly using AI on your mobile device.</span>
        </Link>

        <Link to="/admin" className="portal-card card-modern">
          <div className="portal-icon">🏛️</div>
          <span className="portal-title">Command Center</span>
          <span className="text-muted">Analyze, prioritize, and manage city-wide infrastructure.</span>
        </Link>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/report" element={<CitizenApp />} />
      </Routes>
    </Router>
  );
};

export default App;
