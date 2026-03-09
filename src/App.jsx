import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CitizenApp from './CitizenApp';
import './App.css'; 

const LandingPage = () => {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      minHeight: '100vh', backgroundColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '20px'
    }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* App Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <img src="https://cdn-icons-png.flaticon.com/512/3256/3256150.png" alt="Logo" style={{ width: '60px', height: '60px' }} />
          <h1 style={{ fontSize: '3.5rem', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Gov-RoadAI</h1>
        </div>
        
        <p style={{ color: '#64748b', fontSize: '1.3rem', marginBottom: '15px', maxWidth: '600px' }}>
          Smart Road Maintenance & Budgeting System for Smart Cities
        </p>
        
        <div style={{ 
          backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 16px', 
          borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '50px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          🎓 Final Year Project
        </div>
        
        {/* Navigation Cards */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/report" className="portal-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', padding: '1.5rem 2rem', width: '350px', justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '2.5rem' }}>📱</span>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>Citizen App</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Crowdsourced Reporting</span>
            </div>
          </Link>

          <Link to="/admin" className="portal-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', padding: '1.5rem 2rem', width: '350px', justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '2.5rem' }}>🏛️</span>
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>Admin Portal</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Dashboard & AI Analytics</span>
            </div>
          </Link>
        </div>
      </div>

      <footer style={{ marginTop: 'auto', paddingTop: '2rem', width: '100%', borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
          Developed by: Manikandan G., Dhinesh Kumar S, Dr. G. Revathy
        </p>
        <p style={{ margin: '0', fontSize: '0.85rem' }}>
          B.Tech Computer Science & Engineering (AI & ML)
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: '500' }}>
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
