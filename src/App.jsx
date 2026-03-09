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
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', color: '#0f172a', marginBottom: '10px' }}>🛣️ Gov-RoadAI</h1>
        <p style={{ color: '#64748b', fontSize: '1.2rem', marginBottom: '5px', maxWidth: '600px', fontWeight: '500' }}>
          Smart Road Maintenance & Budgeting System for Smart Cities
        </p>
        
        {/* Project Badge */}
        <div style={{ 
          backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 16px', 
          borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '40px',
          border: '1px solid #c7d2fe'
        }}>
          🎓 Final Year Project
        </div>
        
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <Link to="/report" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            padding: '2rem 3rem', backgroundColor: '#ffffff', color: '#0f172a', 
            textDecoration: 'none', borderRadius: '16px', fontSize: '1.25rem', 
            fontWeight: 'bold', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '2.5rem' }}>📱</span>
            Citizen App
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>Crowdsourced Reporting</span>
          </Link>

          <Link to="/admin" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            padding: '2rem 3rem', backgroundColor: '#ffffff', color: '#0f172a', 
            textDecoration: 'none', borderRadius: '16px', fontSize: '1.25rem', 
            fontWeight: 'bold', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '2.5rem' }}>🏛️</span>
            Admin Portal
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>Dashboard & AI Analytics</span>
          </Link>
        </div>
      </div>

      {/* Academic Footer */}
      <footer style={{ 
        marginTop: 'auto', paddingTop: '2rem', width: '100%', 
        borderTop: '1px solid #e2e8f0', color: '#64748b' 
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>
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