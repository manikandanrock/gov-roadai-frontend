import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, CheckCircle, Video, Camera, UploadCloud, 
  AlertCircle, X, Square, ArrowLeft, RefreshCw, Info
} from 'lucide-react';
import './Citizen.css';
import './App.css';

const API_BASE = 'https://maniiiikk-roadgovai.hf.space/api/v1';

// --- Utility: Smart Image Compression ---
async function compressImage(file) {
  const MAX_WIDTH = 1920;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
      };
    };
  });
}

export default function CitizenApp() {
  // --- Core State ---
  const [mode, setMode] = useState('photo'); // 'photo' | 'dashcam'
  const [step, setStep] = useState('capture'); // 'capture' | 'analyzing' | 'review' | 'success'
  const [gps, setGps] = useState({ lat: null, lng: null, accuracy: null, locked: false });
  const [locationName, setLocationName] = useState(null);
  const [error, setError] = useState(() => navigator.geolocation ? null : 'GPS is not supported by your device.');

  // --- Media & Analysis State ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [serverMessage, setServerMessage] = useState(null); // Tracks duplicate/update messages
  const [mounted, setMounted] = useState(false);

  // --- Refs ---
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // --- 1. Live GPS Tracking & Reverse Geocoding ---
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, locked: true }),
      (err) => { console.warn(err); setGps(prev => ({ ...prev, locked: false })); },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!gps.lat || !gps.lng) return;
    const fetchLocationName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gps.lat}&lon=${gps.lng}&format=json&addressdetails=1`);
        const data = await res.json();
        const address = data.address || {};
        const localName = address.suburb || address.neighbourhood || address.city || address.town || address.road;
        if (localName) setLocationName(localName);
      } catch (error) { console.warn(error); }
    };
    const timeoutId = setTimeout(fetchLocationName, 2000);
    return () => clearTimeout(timeoutId);
  }, [gps.lat, gps.lng]);

  // --- 2. Camera Management ---
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Open camera for both photo and dashcam if in capture step
    if (step === 'capture') {
      (async () => {
        if (!navigator.mediaDevices?.getUserMedia) return setError('Camera access denied.');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
            audio: false
          });
          if (!active) return;
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Ensure video plays
            videoRef.current.onloadedmetadata = () => videoRef.current.play();
          }
        } catch (err) { 
          console.error(err);
          if (active) setError('Camera access denied or unavailable.'); 
        }
      })();
    } else {
      stopCameraStream();
    }
    return () => { active = false; stopCameraStream(); };
  }, [step, stopCameraStream]);

  // --- 3. Capture & Recording Logic ---
  const handleStartRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    mediaRecorderRef.current.onstop = handleVideoUpload;
    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setStep('analyzing');
    }
  };

  const handleVideoUpload = async () => {
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const file = new File([blob], 'dashcam_log.webm', { type: 'video/webm' });

    
    const formData = new FormData();
    formData.append('file', file);
    
    const telemetryObj = [{ timeOffset: 0, lat: gps.lat, lng: gps.lng }];
    formData.append('telemetry', JSON.stringify(telemetryObj));

    try {
      const res = await fetch(`${API_BASE}/analyze-infrastructure`, { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysisData(data);
      setStep('review');
    } catch {
      setError("Video analysis failed. Ensure the server is online.");
      setStep('capture');
    }
  };

  const handlePhotoSnap = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    setStep('analyzing');
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' });
      setPreviewUrl(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/analyze-pothole`, { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysisData(data);
      if (data.annotated_image) setPreviewUrl(data.annotated_image);
      setStep('review');
    } catch (err) {
      console.error(err);
      setError("AI Engine offline.");
      setStep('capture');
    }
  };

  // --- 4. Final Submission ---
  const submitFinalReport = async () => {
    if (!gps.lat || !gps.lng) return setError('Waiting for GPS lock.');

    // --- CLIENT-SIDE ZERO-DEFECT GUARD ---
    if (mode === 'photo' && (analysisData.severity === 'None' || analysisData.max_depth <= 0)) {
        setError('Cannot submit: AI detected zero valid defects in this image.');
        return;
    }
    
    setStep('analyzing');
    
    // Dashcam mode is already processed directly in main.py
    if (mode === 'dashcam') {
        setTimeout(() => setStep('success'), 600);
        return;
    }

    const payload = {
      lat: Number(gps.lat),
      lng: Number(gps.lng),
      image_data: analysisData.annotated_image || "",
      depth_cm: Number(analysisData.max_depth || 0),
      cost_inr: Math.round(Number(analysisData.total_cost || 0)),
      risk_level: analysisData.severity || 'Unknown',
      source: 'citizen_app',
      kg_asphalt: Number(analysisData.total_kg || 0)
    };

    try {
      const res = await fetch(`${API_BASE}/submit-report`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // --- SMART ERROR PARSING ---
      if (!res.ok) {
        let errorMsg = 'Failed to sync with Gov servers.';
        try {
            const errorJson = await res.json();
            errorMsg = errorJson.detail || errorMsg;
        } catch {
            errorMsg = await res.text() || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // --- CAPTURE DUPLICATE/SUCCESS MESSAGES ---
      const data = await res.json();
      if (data.message) {
          setServerMessage(data.message);
      }

      setStep('success');
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message);
      setStep('review');
    }
  };

  const resetApp = () => {
    setStep('capture'); setAnalysisData(null); setPreviewUrl(null); 
    setError(null); setRecordTime(0); setServerMessage(null);
  };

  const handleBack = () => {
    if (mode === 'dashcam') stopCameraStream();
    if (step !== 'capture') return resetApp();
    navigate('/');
  };

  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  // --- RENDER ---
  return (
    <div className="landing-root citizen-root">
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      {/* Toast Error Overlay */}
      {error && (
        <div className="error-toast" style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 100 }}>
          <AlertCircle size={16} color="var(--danger)" /> <span style={{ flex: 1, fontSize: '0.85rem' }}>{error}</span>
          <button onClick={() => setError(null)}><X size={16}/></button>
        </div>
      )}

      {/* HEADER - Minimized when in capture mode */}
      <main className={`landing-body ${mounted ? 'fade-in' : ''}`} role="main">
        {step !== 'capture' && (
          <div className="landing-header">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" />
              Field Reporter
            </div>
            <div className="landing-hero">
              <h1 className="landing-wordmark">
                Citizen<em>App</em>
              </h1>
              <p className="landing-tagline">
                Capture defects with photo or dashcam analysis and submit them directly to the command center.
              </p>
            </div>
          </div>
        )}

        {step === 'capture' && (
           <div className="citizen-mini-header">
             <h1 className="mini-wordmark">Citizen<em>App</em></h1>
             <div className="mini-badge">LIVE SCANNER</div>
           </div>
        )}

        <section className="citizen-content">
          <div className="citizen-topbar">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="citizen-location">
              <span className="topbar-title">Field Survey</span>
              <div className="sync-badge">
                <MapPin size={12} /> {gps.locked ? (locationName || 'GPS Locked') : 'Locating...'}
              </div>
            </div>
            <div className="topbar-spacer" />
          </div>
        
        {step === 'capture' && (
          <div className="viewfinder-container">
            <div className="viewfinder-main">
              <video ref={videoRef} autoPlay playsInline muted className="viewfinder-video" />
              
              {/* Vision Glass HUD Overlay */}
              <div className="hud-overlay">
                <div className="hud-corner top-left" />
                <div className="hud-corner top-right" />
                <div className="hud-corner bottom-left" />
                <div className="hud-corner bottom-right" />
                <div className="hud-scanline" />
                
                <div className="hud-telemetry">
                  <div className="hud-status">
                    <span className="status-dot pulsing" /> 
                    {mode === 'dashcam' ? (isRecording ? 'STREAMING' : 'READY') : 'VISION ACTIVE'}
                  </div>
                  <div className="hud-mode-indicator">
                    {mode.toUpperCase()} MODE
                  </div>
                </div>
              </div>

              {isRecording && (
                <div className="rec-overlay">
                  <span className="rec-dot" /> {formatTime(recordTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, marginBottom: '1.5rem' }}></div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Processing Data</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Running Gov-RoadAI infrastructure models...</p>
          </div>
        )}

        {step === 'review' && analysisData && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
              {mode === 'photo' ? (
                <img src={previewUrl} alt="AI Processed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '0.5rem' }}>
                  <Video size={32} opacity={0.8} />
                  <span style={{ fontSize: '0.85rem' }}>Dashcam Session ({formatTime(recordTime)})</span>
                </div>
              )}
            </div>

            <div className="result-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>{mode === 'photo' ? 'Analysis Results' : 'Processing Summary'}</h3>
                {mode === 'photo' && (
                  <span className={`severity-badge ${analysisData.severity?.toLowerCase() || 'medium'}`}>
                    {analysisData.severity || 'Medium'}
                  </span>
                )}
              </div>
              
              {mode === 'photo' ? (
                <>
                  <div className="data-row"><span>Est. Repair Cost</span> <span className="value">₹{analysisData.total_cost?.toLocaleString() || '0'}</span></div>
                  <div className="data-row"><span>Defects Found</span> <span className="value">{analysisData.defects_detected || 0}</span></div>
                  <div className="data-row" style={{ marginBottom: 0 }}><span>Max Depth</span> <span className="value">{analysisData.max_depth || 0} cm</span></div>
                </>
              ) : (
                 <>
                  <div className="data-row"><span>Status</span> <span className="value text-success">Synced to DB</span></div>
                  <div className="data-row" style={{ marginBottom: 0 }}><span>Defects Logged</span> <span className="value">{analysisData.logged || 0}</span></div>
                 </>
              )}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
            <div className="success-icon-wrap" style={{ width: 80, height: 80, marginBottom: '1.5rem', background: serverMessage ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)' }}>
              {serverMessage ? <Info size={40} color="var(--info)" /> : <CheckCircle size={40} className="success-icon" />}
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {serverMessage ? 'Duplicate Handled' : 'Report Submitted'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {serverMessage || 'Local authorities have been notified of the infrastructure defect.'}
            </p>
          </div>
        )}
        </section>
      </main>

      {/* FIXED FOOTER ACTION BAR */}
      <footer className="citizen-footer">
        
        {step === 'capture' && (
          <div className="citizen-footer-actions">
            <div className="capture-controls">
              {mode === 'photo' ? (
                <button className="shutter-button photo" onClick={handlePhotoSnap}>
                  <div className="shutter-inner" />
                </button>
              ) : (
                <button className={`shutter-button video ${isRecording ? 'recording' : ''}`} onClick={isRecording ? handleStopRecording : handleStartRecording}>
                  <div className="shutter-inner">
                    {isRecording ? <Square size={20} color="white" fill="white" /> : <div className="vid-circle" />}
                  </div>
                </button>
              )}
            </div>
            
            <div className="mode-toggle-group">
              <button 
                className={`mode-btn ${mode === 'photo' ? 'active' : ''}`} 
                onClick={() => setMode('photo')}
              >
                <Camera size={16} /> Photo
              </button>
              <button 
                className={`mode-btn ${mode === 'dashcam' ? 'active' : ''}`} 
                onClick={() => setMode('dashcam')}
              >
                <Video size={16} /> Dashcam
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn secondary" onClick={resetApp} style={{ flex: 1, padding: '14px', borderRadius: '12px' }}>
              <RefreshCw size={18} /> Retake
            </button>
            
            {/* Visually disable button if AI found 0 defects */}
            <button 
              className="btn primary" 
              onClick={submitFinalReport} 
              style={{ flex: 2, padding: '14px', borderRadius: '12px', opacity: (mode === 'photo' && analysisData?.severity === 'None') ? 0.5 : 1 }}
            >
              <UploadCloud size={18} /> Submit Report
            </button>
          </div>
        )}

        {step === 'success' && (
          <button className="btn primary block" onClick={resetApp} style={{ margin: 0, padding: '16px', borderRadius: '12px' }}>
            Start New Survey
          </button>
        )}

      </footer>
    </div>
  );
}
