import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './Citizen.css';

const API_BASE = "http://localhost:8000/api/v1"; // Update to your backend URL

const CitizenApp = () => {
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep(2); 
    }
  };

  const runAIAnalysis = async () => {
    if (!photoFile) return;
    setIsAnalyzing(true);
    
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const res = await fetch(`${API_BASE}/analyze-pothole`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setAiResults(data);
        // Replace preview with the YOLO-annotated image returned from backend
        setPreviewUrl(data.annotated_image); 
      } else {
        alert("AI Analysis failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Cannot connect to AI server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitReport = () => {
    // For a real deployment, you would push this data + GPS to your Supabase DB here.
    // Since the backend 'analyze-infrastructure' handles bulk, you might need a new 
    // endpoint for single citizen submissions like `/submit-report`
    setStep(3);
  };

  const resetApp = () => {
    setPhotoFile(null);
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

      <div className="progress-stepper">
        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
      </div>

      <main className="main-content">
        {step === 1 && (
          <div className="capture-card card-modern">
            <div className="icon-hero">📸</div>
            <h2 style={{fontSize: '1.5rem'}}>Capture Road Issue</h2>
            <p className="text-muted">Take a clear photo of the pothole. Our MiDaS AI will estimate depth and repair volume.</p>
            
            <label className="btn-modern btn-primary btn-massive" style={{marginTop: '1rem'}}>
              Open Camera
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="card-modern" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <img src={previewUrl} alt="Hazard" className="ai-preview" />
            
            {aiResults ? (
              <>
                <div className="results-grid">
                  <div className="res-item">
                    <span className="res-label">Defects Found</span>
                    <span className="res-value">{aiResults.defects_detected}</span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Severity</span>
                    <span className={`badge ${aiResults.severity === 'High' ? 'badge-high' : 'badge-medium'}`} style={{width: 'max-content'}}>
                      {aiResults.severity}
                    </span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Max Depth</span>
                    <span className="res-value">{aiResults.max_depth} cm</span>
                  </div>
                  <div className="res-item">
                    <span className="res-label">Asphalt Needed</span>
                    <span className="res-value">{aiResults.total_kg} kg</span>
                  </div>
                  <div className="res-item" style={{gridColumn: 'span 2', background: 'var(--bg-card)', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '8px'}}>
                    <span className="res-label">Est. Repair Cost</span>
                    <span className="res-value" style={{fontSize: '1.5rem'}}>₹{aiResults.total_cost.toLocaleString()}</span>
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
                  {isAnalyzing ? "Processing with YOLO..." : "🔍 Run AI Analysis"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="capture-card card-modern" style={{textAlign: 'center'}}>
            <div className="icon-hero">✅</div>
            <h2>Report Submitted!</h2>
            <p className="text-muted">Thank you. The data has been sent to the GovRoadAI Command Center.</p>
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
