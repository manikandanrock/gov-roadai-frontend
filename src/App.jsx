import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CitizenApp from './CitizenApp';
import './App.css'; 

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      
      <div className="landing-content">
        {/* App Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3256/3256150.png" alt="Logo" style={{ width: '70px', height: '70px' }} />
          <h1 className="landing-title">Gov-RoadAI</h1>
        </div>
        
        <p className="landing-subtitle">
          Next-Generation Smart Road Maintenance & Automated Budgeting System for City Infrastructure.
        </p>
        
        <div className="landing-badge">
          🎓 Final Year Project Submission
        </div>
        
        {/* Navigation Cards */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          
          <Link to="/report" className="portal-card">
            <div className="portal-icon">📱</div>
            <div>
              <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>Citizen App</span>
              <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500' }}>Crowdsourced Pothole Reporting</span>
            </div>
          </Link>

          <Link to="/admin" className="portal-card">
            <div className="portal-icon">🏛️</div>
            <div>
              <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>Admin Portal</span>
              <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500' }}>Dashboard & AI Video Analytics</span>
            </div>
          </Link>

        </div>
      </div>

      <footer className="landing-footer">
        <p style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>
          Developed by: Manikandan G., Dhinesh Kumar S, Dr. G. Revathy
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '500' }}>
          B.Tech Computer Science & Engineering (AI & ML)
        </p>
        <p style={{ margin: '0', fontSize: '0.85rem' }}>
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
