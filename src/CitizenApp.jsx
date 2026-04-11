import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import Global and Mobile-specific styles
import './index.css';
import './Citizen.css';

const CitizenApp = () => {
  const [step, setStep] = useState(1); // 1: Capture, 2: Analyze, 3: Success
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState(null);

  // Attempt to fetch user's GPS coordinates immediately
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Location access denied")
      );
    }
  }, []);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStep(2); // Move to Analysis step
    }
  };

  const runAIAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate API/AI processing delay for visual effect
    setTimeout(() => {
      setAiResults({
        severity: "High",
        depth: "12 cm",
        total_cost: "15,000",
        hazard_type: "Deep Pothole"
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const submitReport = () => {
    // In production, your API call goes here
    setStep(3);
  };

  const resetApp = () => {
    setPreviewUrl(null);
    setAiResults(null);
    setStep(1);
  };

  return (
    <div className="citizen-flow-container">
      <header className="mobile-header">
        <Link to="/" style={{textDecoration: 'none', fontSize: '1.5rem', color: 'var(--text-main)'}}>←</Link>
        <h2 style={{fontSize: '1.2rem', margin: 0}}>Report Defect</h2>
      </header>

      {/* Wizard Progress Indicator */}
      <div className="progress-stepper">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
      </div>

      <main className="main-content">
        {/* STEP 1: CAPTURE */}
        {step === 1 && (
          <div className="capture-card card-modern">
            <div className="icon-hero">📸</div>
            <h2 style={{fontSize: '1.5rem'}}>Capture Road Issue</h2>
            <p className="text-muted">Take a clear photo of the pothole or damage. AI will estimate the repair needs instantly.</p>
            
            <label className="btn-modern btn-primary btn-massive" style={{marginTop: '1rem'}}>
              Open Camera
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
            </label>
          </div>
        )}

        {/* STEP 2: ANALYZE & CONFIRM */}
        {step === 2 && (
          <div className="card-modern" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <img src={previewUrl} alt="Captured hazard" className="ai-preview" />
            
            {aiResults ? (
              <>
                <div className="results-grid">
                  <div className="res-item">
                    <span className="res-label">Hazard Type</span>
                    <span className="res-value">{aiResults.hazard_type}</span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Severity</span>
                    <span className="res-value badge badge-high" style={{width: 'max-content'}}>{aiResults.severity}</span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Est. Depth</span>
                    <span className="res-value">{aiResults.depth}</span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Repair Cost</span>
                    <span className="res-value">₹{aiResults.total_cost}</span>
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                  <button onClick={resetApp} className="btn-modern btn-secondary" style={{flex: 1}}>Retake</button>
                  <button onClick={submitReport} className="btn-modern btn-primary" style={{flex: 2}}>Send Report</button>
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', padding: '2rem 0'}}>
                <button onClick={runAIAnalysis} disabled={isAnalyzing} className="btn-modern btn-primary btn-massive">
                  {isAnalyzing ? "Scanning Image..." : "🔍 Run AI Analysis"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="capture-card card-modern" style={{textAlign: 'center'}}>
            <div className="icon-hero">✅</div>
            <h2>Report Submitted!</h2>
            <p className="text-muted">Thank you. Your report has been securely sent to the local authority dashboard for prioritization.</p>
            <button onClick={resetApp} className="btn-modern btn-primary btn-massive" style={{marginTop: '2rem'}}>
              Report Another Issue
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenApp;
