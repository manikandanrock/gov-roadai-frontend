import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import CitizenApp from "./CitizenApp";
import "./App.css";

const LandingPage = () => {
  return (
    <div className="landing-wrapper">

      <div className="blur-bg blur-1"></div>
      <div className="blur-bg blur-2"></div>

      <div className="landing-content">

        <div className="landing-header">
          <img src="/favicon.svg" alt="logo" className="landing-logo"/>
          <h1 className="landing-title">Gov-RoadAI</h1>
        </div>

        <p className="landing-subtitle">
          Intelligent Infrastructure Management Command Center powered by
          YOLOv8 Computer Vision and MiDaS Depth Estimation.
        </p>

        <div className="project-badge">
          FINAL YEAR B.TECH CSE (AI & ML) PROJECT
        </div>

        <div className="portal-container">

          <Link to="/report" className="portal-card">
            <div className="portal-icon">📱</div>
            <div>
              <span className="portal-title">Citizen App</span>
              <span className="portal-sub">
                Crowdsourced AI Reporting
              </span>
            </div>
          </Link>

          <Link to="/admin" className="portal-card">
            <div className="portal-icon">🏛️</div>
            <div>
              <span className="portal-title">Admin Portal</span>
              <span className="portal-sub">
                Spatial Command Dashboard
              </span>
            </div>
          </Link>

        </div>
      </div>

      <footer className="landing-footer">
        <p className="dev-name">
          Developed by: Manikandan G., Dhinesh Kumar S, Dr. G. Revathy
        </p>
        <p className="dev-course">
          B.Tech Computer Science & Engineering (AI & ML)
        </p>
        <p className="dev-college">
          Vels Institute of Science, Technology and Advanced Studies (VISTAS), Chennai
        </p>
      </footer>

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
