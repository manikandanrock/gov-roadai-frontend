import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './Citizen.css';

const API_BASE = "https://maniiiikk-roadgovai.hf.space/api/v1"; 

const CitizenApp = () => {
  const [activeMode, setActiveMode] = useState('photo'); // 'photo' | 'dashcam'

  // --- STATES ---
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [dashcamStatus, setDashcamStatus] = useState("Idle");
  const [currentGps, setCurrentGps] = useState({ lat: 13.0827, lng: 80.2707 }); // Default Chennai

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const telemetryData = useRef([]);
  const timerInterval = useRef(null);
  const startTimeRef = useRef(null);

  // --- GPS Tracking ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("GPS access denied, using defaults."),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // --- DASHCAM LOGIC ---
  useEffect(() => {
    if (activeMode === 'dashcam') startCameraFeed();
    else stopCameraFeed();
    return () => stopCameraFeed();
  }, [activeMode]);

  const startCameraFeed = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { setDashcamStatus("Camera Access Denied"); }
  };

  const stopCameraFeed = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (isRecording) stopRecording();
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunks.current = [];
    telemetryData.current = [];
    startTimeRef.current = Date.now();
    
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
    mediaRecorderRef.current.onstop = handleDashcamUpload;
    mediaRecorderRef.current.start(1000);

    setIsRecording(true);
    setDashcamStatus("Recording...");

    timerInterval.current = setInterval(() => {
      telemetryData.current.push({
        timeOffset: Date.now() - startTimeRef.current,
        lat: currentGps.lat,
        lng: currentGps.lng
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    clearInterval(timerInterval.current);
    setIsRecording(false);
    setDashcamStatus("Uploading to Command Center...");
  };

  const handleDashcamUpload = async () => {
    const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
    const file = new File([blob], `dashcam_${Date.now()}.mp4`, { type: 'video/webm' });
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("telemetry", JSON.stringify(telemetryData.current));

    try {
      const res = await fetch(`${API_BASE}/analyze-infrastructure`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") setDashcamStatus(`Success! Logged ${data.logged} defects.`);
      else setDashcamStatus("Upload Failed.");
    } catch (err) { setDashcamStatus("Network Error."); }
    setTimeout(() => setDashcamStatus("Idle"), 4000);
  };

  // --- PHOTO MODE LOGIC ---
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
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const res = await fetch(`${API_BASE}/analyze-pothole`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") {
        setAiResults(data);
        setPreviewUrl(data.annotated_image); // Show bounding boxes
      } else alert("AI Analysis failed.");
    } catch (err) { alert("Cannot connect to AI server."); } 
    finally { setIsProcessing(false); }
  };

  const submitFinalReport = async () => {
    setIsProcessing(true);
    try {
      // Must match Pydantic SingleReport Model exactly
      const payload = {
        lat: currentGps.lat,
        lng: currentGps.lng,
        image_data: previewUrl, 
        depth_cm: aiResults.max_depth,
        cost_inr: aiResults.total_cost,
        risk_level: aiResults.severity,
        source: "citizen_app"
      };

      const res = await fetch(`${API_BASE}/submit-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === "success") setStep(3);
      else alert("Database save failed.");
    } catch (err) { alert("Network Error."); } 
    finally { setIsProcessing(false); }
  };

  const resetPhotoApp = () => { setPhotoFile(null); setPreviewUrl(null); setAiResults(null); setStep(1); };

  return (
    <div className="citizen-flow-container">
      <header className="mobile-header" style={{flexDirection: 'column', alignItems: 'stretch', gap: '1rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Link to="/" style={{textDecoration: 'none', fontSize: '1.5rem', color: 'var(--text-main)'}}>←</Link>
          <h2 style={{fontSize: '1.2rem', margin: 0}}>Citizen Reporter</h2>
        </div>
        <div className="mode-toggle">
          <button className={`toggle-btn ${activeMode === 'photo' ? 'active' : ''}`} onClick={() => setActiveMode('photo')}>📸 Photo Mode</button>
          <button className={`toggle-btn ${activeMode === 'dashcam' ? 'active' : ''}`} onClick={() => setActiveMode('dashcam')}>📹 Dashcam Mode</button>
        </div>
      </header>

      <main className="main-content">
        {/* --- PHOTO MODE VIEW --- */}
        {activeMode === 'photo' && (
          <>
            {step === 1 && (
              <div className="capture-card card-modern">
                <div className="icon-hero">📸</div>
                <h2>Capture Road Issue</h2>
                <label className="btn-modern btn-primary btn-massive" style={{marginTop: '1rem'}}>
                  Open Camera
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="card-modern" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <img src={previewUrl} alt="Hazard" className="ai-preview" />
                {aiResults ? (
                  <>
                    <div className="results-grid">
                      <div className="res-item"><span className="res-label">Severity</span><span className="badge badge-high">{aiResults.severity}</span></div>
                      <div className="res-item"><span className="res-label">Depth</span><span className="res-value">{aiResults.max_depth} cm</span></div>
                      <div className="res-item" style={{gridColumn: 'span 2'}}><span className="res-label">Repair Cost</span><span className="res-value">₹{aiResults.total_cost}</span></div>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                      <button onClick={resetPhotoApp} className="btn-modern btn-secondary" style={{flex: 1}} disabled={isProcessing}>Retake</button>
                      <button onClick={submitFinalReport} className="btn-modern btn-primary" style={{flex: 2}} disabled={isProcessing}>
                        {isProcessing ? "Saving..." : "Submit to DB"}
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={runAIAnalysis} disabled={isProcessing} className="btn-modern btn-primary btn-massive">
                    {isProcessing ? "Scanning Image..." : "🔍 Run AI Analysis"}
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="capture-card card-modern">
                <div className="icon-hero">✅</div>
                <h2>Report Logged!</h2>
                <button onClick={resetPhotoApp} className="btn-modern btn-primary btn-massive" style={{marginTop: '1rem'}}>Report Another</button>
              </div>
            )}
          </>
        )}

        {/* --- DASHCAM MODE VIEW --- */}
        {activeMode === 'dashcam' && (
          <div className="dashcam-container card-modern">
            <div className="video-wrapper">
              <video ref={videoRef} autoPlay playsInline muted className="live-video" />
              <div className="hud-overlay">
                <div className={`rec-indicator ${isRecording ? 'pulse-red' : ''}`}>{isRecording ? "REC" : "STANDBY"}</div>
                <div className="gps-data">GPS: {currentGps.lat.toFixed(4)}, {currentGps.lng.toFixed(4)}</div>
              </div>
            </div>
            <div className="dashcam-controls" style={{textAlign: 'center'}}>
              <p className="res-label" style={{marginBottom: '1rem'}}>{dashcamStatus}</p>
              {!isRecording ? (
                <button onClick={startRecording} className="btn-modern btn-massive" style={{background: 'var(--danger)', color: 'white'}}>⏺ Start Drive</button>
              ) : (
                <button onClick={stopRecording} className="btn-modern btn-massive" style={{background: '#0f172a', color: 'white'}}>⏹ Stop & Upload</button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenApp;
