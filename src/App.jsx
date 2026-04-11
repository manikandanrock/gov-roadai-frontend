import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import CitizenApp from "./CitizenApp";

import "./index.css";
import "./App.css";

/* ════════════════════════════════════════════════════════════════
   MOBILE-FIRST LANDING PAGE
════════════════════════════════════════════════════════════════ */
function LandingPage() {
  return (
    <div className="landing-root" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main 
        className="landing-body" 
        role="main" 
        style={{ flex: 1, justifyContent: 'space-between', padding: '2rem 1rem 1rem' }}
      >
        {/* Top Section: Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '2vh' }}>
          <div className="landing-eyebrow" style={{ fontSize: '0.65rem', padding: '0.25rem 0.75rem' }}>
            <span className="landing-eyebrow-dot" />
            GovRoadAI Platform
          </div>

          <div className="landing-hero" style={{ gap: '0.5rem' }}>
            <h1 className="landing-wordmark" style={{ fontSize: 'clamp(2.5rem, 10vw, 3.5rem)' }}>
              Gov-Road<em>AI</em>
            </h1>
            <p className="landing-tagline" style={{ fontSize: '0.9rem', padding: '0 1rem' }}>
              Vision-powered road defect detection & civic infrastructure management.
            </p>
          </div>
        </div>

        {/* Bottom Section: Navigation Portals (Thumb Reachable) */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <section className="landing-portals" aria-label="Open a portal" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link to="/report" className="portal-link">
              <div className="portal-card portal-citizen" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="portal-icon-wrap" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>📱</div>
                  <div style={{ flex: 1 }}>
                    <div className="portal-label" style={{ fontSize: '1.1rem' }}>Field Reporter</div>
                    <p className="portal-desc" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                      Capture AI-analyzed defects.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/admin" className="portal-link">
              <div className="portal-card portal-admin" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="portal-icon-wrap" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>🏛️</div>
                  <div style={{ flex: 1 }}>
                    <div className="portal-label" style={{ fontSize: '1.1rem' }}>Command Center</div>
                    <p className="portal-desc" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                      Live defect map & analytics.
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          {/* Compact Footer */}
          <footer style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-dim)' }}>
            <div className="dev-footer" style={{ gap: '0.2rem' }}>
              <div className="dev-names" style={{ fontSize: '0.8rem' }}>By: Manikandan, Dhinesh, Dr. Revathy</div>
              <div className="dev-institute" style={{ fontSize: '0.65rem' }}>VISTAS, Chennai</div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   APP ROUTER
════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/report" element={<CitizenApp />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
