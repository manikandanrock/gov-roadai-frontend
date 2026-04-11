import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import './Citizen.css';

const API_BASE = "https://maniiiikk-roadgovai.hf.space/api/v1";

const CitizenApp = () => {
  const [activeMode, setActiveMode] = useState('photo'); // 'photo' | 'dashcam'

  // --- PHOTO MODE STATES ---
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- DASHCAM MODE STATES ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dashcamStatus, setDashcamStatus] = useState("Idle"); // Idle, Recording, Uploading, Success
  const [currentGps, setCurrentGps] = useState({ lat: 0, lng: 0 });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const telemetryData = useRef([]);
  const timerInterval = useRef(null);
  const startTimeRef = useRef(null);

  // ==========================================
  // CAMERA & CLEANUP LOGIC
  // ==========================================
  useEffect(() => {
    if (activeMode === 'dashcam') {
      startCameraFeed();
    } else {
      stopCameraFeed();
    }
    return () => stopCameraFeed(); // Cleanup on unmount
  }, [activeMode]);

  const startCameraFeed = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setDashcamStatus("Camera Access Denied");
    }
  };

  const stopCameraFeed = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (isRecording) stopRecording();
  };

  // ==========================================
  // DASHCAM RECORDING LOGIC
  // ==========================================
  const startRecording = () => {
    if (!streamRef.current) return;
    
    recordedChunks.current = [];
    telemetryData.current = [];
    startTimeRef.current = Date.now();
    
    // Initialize MediaRecorder
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = handleDashcamUpload;
    mediaRecorderRef.current.start(1000); // Capture in 1-second chunks

    setIsRecording(true);
    setDashcamStatus("Recording...");
    setRecordingTime(0);

    // Start GPS Telemetry & Timer Loop
    timerInterval.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentGps({ lat, lng });
          
          telemetryData.current.push({
            timeOffset: Date.now() - startTimeRef.current,
            lat: lat,
            lng: lng
          });
        });
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
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
      const res = await fetch(`${API_BASE}/analyze-infrastructure`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setDashcamStatus(`Success! Logged ${data.logged} defects.`);
      } else {
        setDashcamStatus("Upload Failed.");
      }
    } catch (err) {
      setDashcamStatus("Network Error during upload.");
    }
    
    // Reset after 3 seconds
    setTimeout(() => setDashcamStatus("Idle"), 4000);
  };

  // ==========================================
  // PHOTO MODE LOGIC
  // ==========================================
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
      const res = await fetch(`${API_BASE}/analyze-pothole`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") {
        setAiResults(data);
        setPreviewUrl(data.annotated_image); 
      }
    } catch (err) {
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetPhotoApp = () => {
    setPhotoFile(null); setPreviewUrl(null); setAiResults(null); setStep(1);
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="citizen-flow-container">
      {/* Header & Mode Toggle */}
      <header className="mobile-header" style={{flexDirection: 'column', alignItems: 'stretch', gap: '1rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Link to="/" style={{textDecoration: 'none', fontSize: '1.5rem', color: 'var(--text-main)'}}>←</Link>
          <h2 style={{fontSize: '1.2rem', margin: 0}}>Citizen Reporter</h2>
        </div>
        
        <div className="mode-toggle">
          <button 
            className={`toggle-btn ${activeMode === 'photo' ? 'active' : ''}`} 
            onClick={() => setActiveMode('photo')}
          >
            📸 Photo Report
          </button>
          <button 
            className={`toggle-btn ${activeMode === 'dashcam' ? 'active' : ''}`} 
            onClick={() => setActiveMode('dashcam')}
          >
            📹 Live Dashcam
          </button>
        </div>
      </header>

      <main className="main-content">
        
        {/* --- PHOTO MODE VIEW --- */}
        {activeMode === 'photo' && (
          <>
            <div className="progress-stepper" style={{padding: '0 0 1rem 0'}}>
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
              <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
            </div>

            {step === 1 && (
              <div className="capture-card card-modern">
                <div className="icon-hero">📸</div>
                <h2>Capture Road Issue</h2>
                <p className="text-muted">Take a clear photo of the pothole. AI will estimate depth and repair volume instantly.</p>
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
                      <div className="res-item"><span className="res-label">Defects</span><span className="res-value">{aiResults.defects_detected}</span></div>
                      <div className="res-item"><span className="res-label">Severity</span><span className="badge badge-high">{aiResults.severity}</span></div>
                      <div className="res-item" style={{gridColumn: 'span 2', background: 'var(--bg-card)', padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '8px'}}>
                        <span className="res-label">Est. Repair Cost</span><span className="res-value" style={{fontSize: '1.5rem'}}>₹{aiResults.total_cost}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                      <button onClick={resetPhotoApp} className="btn-modern btn-secondary" style={{flex: 1}}>Retake</button>
                      <button onClick={() => setStep(3)} className="btn-modern btn-primary" style={{flex: 2}}>Submit</button>
                    </div>
                  </>
                ) : (
                  <button onClick={runAIAnalysis} disabled={isAnalyzing} className="btn-modern btn-primary btn-massive">
                    {isAnalyzing ? "Processing..." : "🔍 Run AI Analysis"}
                  </button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="capture-card card-modern">
                <div className="icon-hero">✅</div>
                <h2>Submitted!</h2>
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
              
              {/* Dashcam HUD Overlay */}
              <div className="hud-overlay">
                <div className={`rec-indicator ${isRecording ? 'pulse-red' : ''}`}>
                  {isRecording ? `REC ${Math.floor(recordingTime/60)}:${(recordingTime%60).toString().padStart(2, '0')}` : "STANDBY"}
                </div>
                <div className="gps-data">
                  GPS: {currentGps.lat.toFixed(4)}, {currentGps.lng.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="dashcam-controls">
              <p className="res-label" style={{textAlign: 'center', marginBottom: '1rem'}}>{dashcamStatus}</p>
              
              {!isRecording ? (
                <button onClick={startRecording} className="btn-modern btn-massive" style={{background: 'var(--danger)', color: 'white'}}>
                  ⏺ Start Mapping Drive
                </button>
              ) : (
                <button onClick={stopRecording} className="btn-modern btn-massive" style={{background: '#0f172a', color: 'white'}}>
                  ⏹ Stop & Upload
                </button>
              )}
              <p className="text-muted" style={{fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem'}}>
                Mount your phone to your dashboard. AI will process the video and map defects automatically.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default CitizenApp;
