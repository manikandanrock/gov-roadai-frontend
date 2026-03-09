import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CitizenApp from './CitizenApp';
import './App.css'; 

const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      {/* Abstract background blur blobs for SaaS look */}
      <div style={{position: 'absolute', width: '40vw', height: '40vw', background: 'rgba(79, 70, 229, 0.1)', filter: 'blur(100px)', borderRadius: '50%', top: '-10%', left: '-10%'}}></div>
      <div style={{position: 'absolute', width: '30vw', height: '30vw', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%', bottom: '0', right: '0'}}></div>

      <div className="landing-content" style={{zIndex: 10}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px', justifyContent: 'center' }}>
          <img src="/favicon.svg" alt="logo" style={{ width: '80px', height: '80px', borderRadius: '22px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }} />
          <h1 className="landing-title">Gov-RoadAI</h1>
        </div>
        
        <p className="landing-subtitle">
          An Intelligent Infrastructure Management Command Center utilizing YOLOv8 Computer Vision and MiDaS Monocular Depth Estimation.
        </p>
        
        <div style={{display: 'inline-block', background: 'white', padding: '6px 16px', borderRadius: '12px', fontWeight: '800', color: '#4f46e5', fontSize: '0.8rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem'}}>
           FINAL YEAR B.TECH CSE (AI & ML) PROJECT
        </div>
        
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          <Link to="/report" className="portal-card">
            <div className="portal-icon">📱</div>
            <div style={{textAlign: 'left'}}>
              <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '850', color: '#0f172a' }}>Citizen App</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Crowdsourced AI Reporting</span>
            </div>
          </Link>

          <Link to="/admin" className="portal-card">
            <div className="portal-icon">🏛️</div>
            <div style={{textAlign: 'left'}}>
              <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: '850', color: '#0f172a' }}>Admin Portal</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Spatial Command Dashboard</span>
            </div>
          </Link>
        </div>
      </div>

      <footer className="landing-footer" style={{marginTop: '4rem', zIndex: 10}}>
        <p style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
          Developed by: Manikandan G., Dhinesh Kumar S, Dr. G. Revathy
        </p>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>
          B.Tech Computer Science & Engineering (AI & ML)
        </p>
        <p style={{ margin: '0', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8' }}>
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
