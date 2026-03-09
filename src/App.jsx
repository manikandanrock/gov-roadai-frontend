import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CitizenApp from './CitizenApp';
import './App.css'; 

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      <div className="landing-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <img 
            src="/favicon.svg" 
            alt="Gov-RoadAI Logo" 
            style={{ width: '80px', height: '80px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }} 
          />
          <h1 className="landing-title">Gov-RoadAI</h1>
        </div>
        
        <p className="landing-subtitle">
          An Intelligent Infrastructure Management System using YOLOv8 and MiDaS for 
          Automated Road Defect Detection and Budget Optimization.
        </p>
        
        <div className="landing-badge">🎓 Final Year Project Submission</div>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
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
        <p style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '700' }}>
          Developed by: Manikandan G., Dhinesh Kumar S, Dr. G. Revathy
        </p>
        <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '500' }}>
          B.Tech Computer Science & Engineering (AI & ML)
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem' }}>
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
