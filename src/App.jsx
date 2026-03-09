import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import CitizenApp from "./CitizenApp";
import "./App.css";

const LandingPage = () => {
  return (
    <div className="landing-container">

      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3256/3256150.png"
            alt="Gov-RoadAI Logo"
            className="brand-logo"
          />
          <h1 className="brand-title">Gov-RoadAI</h1>
        </div>

        <p className="brand-subtitle">
          Smart Road Maintenance & Budgeting System for Smart Cities
        </p>

        <div className="project-badge">
          🎓 Final Year Project
        </div>
      </header>

      {/* Navigation Cards */}
      <main className="portal-container">

        <Link to="/report" className="portal-card">
          <div className="portal-icon">📱</div>

          <div className="portal-content">
            <h3>Citizen App</h3>
            <p>Crowdsourced pothole reporting using mobile devices</p>
          </div>
        </Link>

        <Link to="/admin" className="portal-card">
          <div className="portal-icon">🏛️</div>

          <div className="portal-content">
            <h3>Admin Portal</h3>
            <p>Infrastructure monitoring & AI analytics dashboard</p>
          </div>
        </Link>

      </main>

      {/* Footer */}
      <footer className="landing-footer">

        <p className="dev-names">
          Developed by: <strong>Manikandan G.</strong>, Dhinesh Kumar S, Dr. G. Revathy
        </p>

        <p className="dept">
          B.Tech Computer Science & Engineering (AI & ML)
        </p>

        <p className="college">
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
