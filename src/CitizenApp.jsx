import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Citizen.css';

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

// --- High Precision Speed Utility ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const CitizenApp = () => {
  const [mode, setMode] = useState("photo"); 
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  
  // Shared State
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(""); 
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Photo State
  const [photoData, setPhotoData] = useState(null);
  const [aiResults, setAiResults] = useState(null);

  // Live Video State
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); 
  
  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const watchIdRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const telemetryLogRef = useRef([]);
  const isRecordingRef = useRef(false);

  // Advanced Speed Tracking Refs
  const lastPosRef = useRef(null);

  // --- Utility: Native Haptic Feedback ---
  const triggerHaptic = (type = 'light') => {
    if (!navigator.vibrate) return;
    if (type === 'light') navigator.vibrate(40);
    if (type === 'heavy') navigator.vibrate([60, 50, 60]);
    if (type === 'success') navigator.vibrate([30, 40, 30, 40, 50]);
  };

  useEffect(() => {
    if (mode !== 'video') stopCameraAndGPS();
    return () => stopCameraAndGPS();
  }, [mode]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stopCameraAndGPS = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    lastPosRef.current = null; // Reset speed tracker
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`);
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.neighbourhood || "";
        const area = addr.suburb || addr.city_district || addr.town || addr.city || "";
        
        let preciseAddress = "";
        if (street && area && street !== area) preciseAddress = `${street}, ${area}`;
        else if (street || area) preciseAddress = street || area;
        else preciseAddress = data.display_name.split(',').slice(0, 2).join(', ');
        
        setAddress(preciseAddress);
      }
    } catch (err) {
      // Fail silently, keep current address if network drops
    }
  };

  // --- LIVE VIDEO & ADVANCED GPS LOGIC ---
  const startLiveCamera = async () => {
    triggerHaptic();
    resetApp();
    try {
      setStatus({ type: "info", text: "Initializing Live AI Vision & GPS..." });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 } }, 
        audio: false 
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setStatus({ type: "", text: "" });

      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = Math.round(pos.coords.accuracy);
            
            // --- Custom High-Precision Speed Calculation ---
            let currentSpeedKmh = 0;
            
            if (lastPosRef.current) {
              const timeDiff = (now - lastPosRef.current.time) / 1000; // in seconds
              
              if (timeDiff > 0) {
                const distanceMeters = calculateDistance(
                  lastPosRef.current.lat, lastPosRef.current.lng, 
                  lat, lng
                );
                
                // Only calculate if accuracy is decent, else assume standing still/coasting
                if (accuracy < 30) {
                  currentSpeedKmh = (distanceMeters / timeDiff) * 3.6; 
                }
              }
            }

            // Exponential Moving Average (Smoothing)
            // 30% new reading, 70% old reading. Prevents wild jumping.
            const smoothedSpeed = lastPosRef.current 
              ? (0.3 * currentSpeedKmh) + (0.7 * lastPosRef.current.rawSpeed)
              : currentSpeedKmh;

            // Deadzone: If moving less than 3km/h, assume we are stopped at a light (GPS drift)
            const displaySpeed = smoothedSpeed < 3.0 ? 0 : Math.round(smoothedSpeed);

            lastPosRef.current = { lat, lng, time: now, rawSpeed: smoothedSpeed };

            setLocation({ lat: lat.toFixed(6), lng: lng.toFixed(6), accuracy, speed: displaySpeed });
            
            if (!address) fetchAddress(lat, lng);

            if (isRecordingRef.current && recordingStartTimeRef.current) {
              const timeOffset = now - recordingStartTimeRef.current;
              telemetryLogRef.current.push({ timeOffset, lat, lng, accuracy, speed: displaySpeed });
            }
          },
          (err) => console.error("GPS Watch Error:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      } else {
        setStatus({ type: "error", text: "Geolocation is not supported by your browser." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Camera/GPS access denied. Please check device permissions." });
    }
  };

  const startRecording = () => {
    triggerHaptic('heavy');
    chunksRef.current = [];
    telemetryLogRef.current = [];
    
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/mp4' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = handleLiveVideoUpload;
    
    isRecordingRef.current = true;
    setIsRecording(true);
    recordingStartTimeRef.current = Date.now();
    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    triggerHaptic('light');
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false; 
      mediaRecorderRef.current.stop(); 
      setIsRecording(false);
      setLoading(true);
      setStatus({ type: "info", text: "Syncing Telemetry & Running AI Analysis..." });
      stopCameraAndGPS();
    }
  };

  const handleLiveVideoUpload = async () => {
    const videoBlob = new Blob(chunksRef.current, { type: 'video/mp4' });
    const file = new File([videoBlob], "live_dashcam.mp4", { type: "video/mp4" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("telemetry", JSON.stringify(telemetryLogRef.current));

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-infrastructure`, { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.status === "success") {
        triggerHaptic('success');
        setStatus({ type: "success", text: `AI Scan Complete! Successfully logged ${data.defects_logged || 0} defects.` });
        setIsSubmitted(true);
      } else {
        setStatus({ type: "error", text: "Video processing failed on server." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Network connection failed during upload." });
    } finally {
      setLoading(false);
    }
  };

  // --- PHOTO LOGIC ---
  const handlePhotoCapture = (e) => {
    triggerHaptic('heavy');
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setStatus({ type: "info", text: "Acquiring precision GPS lock..." });
    setPhotoData({ file: file, previewUrl: URL.createObjectURL(file) });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat: lat.toFixed(6), lng: lng.toFixed(6), accuracy: Math.round(position.coords.accuracy) });
          fetchAddress(lat, lng);
          setStatus({ type: "", text: "" }); 
        },
        (error) => {
          setStatus({ type: "error", text: "Could not get your location. Please check GPS settings." });
          setPhotoData(null); 
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }
  };

  const runAIAnalysis = async () => {
    triggerHaptic();
    if (!photoData || !location) return;
    setLoading(true);
    setStatus({ type: "info", text: "AI Engine analyzing depth and severity..." });
    
    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-pothole`, { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.status === "success") {
        triggerHaptic('success');
        setAiResults(data);
        setStatus({ type: "", text: "" });
      } else {
        setStatus({ type: "error", text: "AI Engine returned an error." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "AI connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const submitFinalReport = async () => {
    triggerHaptic();
    setLoading(true);
    setStatus({ type: "info", text: "Submitting report to authorities..." });

    const formData = new FormData();
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);
    formData.append("depth_cm", aiResults.max_depth);
    formData.append("kg_asphalt", aiResults.total_kg);
    formData.append("cost_inr", aiResults.total_cost);
    formData.append("risk_level", aiResults.severity);

    const compressImage = (base64Str) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
      });
    };

    try {
      const compressedImg = await compressImage(aiResults.annotated_image);
      formData.append("image_data", compressedImg); 

      const response = await fetch(`${API_BASE_URL}/submit-citizen-report`, { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.status === "success") {
        triggerHaptic('success');
        setIsSubmitted(true);
        setStatus({ type: "success", text: data.message || "Report verified and submitted." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Submission failed." });
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    triggerHaptic();
    setPhotoData(null);
    setLocation(null);
    setAddress("");
    setAiResults(null);
    setIsSubmitted(false);
    setStatus({ type: "", text: "" });
  };

  return (
    <div className="app-wrapper">
      <div className="citizen-container">
        
        {/* Top Navigation */}
        <nav className="top-nav">
          <Link to="/" className="back-link" onClick={() => triggerHaptic()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Exit to Portal
          </Link>
        </nav>

        {/* Header */}
        <header className="brand-header">
          <div className="brand-icon pulse-soft">🛣️</div>
          <h2>GovRoad AI</h2>
          <p>Citizen Sentinel Portal</p>
        </header>

        {/* Native-style Segmented Control */}
        <div className="segmented-control">
          <button className={`segment ${mode === 'photo' ? 'active' : ''}`} onClick={() => { setMode('photo'); resetApp(); }}>
            <span className="segment-icon">📸</span> Single Photo
          </button>
          <button className={`segment ${mode === 'video' ? 'active' : ''}`} onClick={() => { setMode('video'); resetApp(); }}>
            <span className="segment-icon">📹</span> Live Dashcam
          </button>
        </div>
        
        {/* Main Card */}
        <main className="upload-card">
          {mode === 'video' ? (
            <div className="mode-content fade-in">
              <div className="card-header-text">
                <h3>Live Dashcam Scanner</h3>
                <p>Mount your phone on the dashboard. AI will automatically scan the road and log defects dynamically.</p>
              </div>
              
              <div className={`video-container ${cameraActive || isSubmitted ? 'visible' : 'hidden'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="live-video-preview" />
                
                {/* Advanced Dashcam HUD */}
                {location && cameraActive && (
                  <div className="advanced-hud">
                    <div className="hud-top-bar">
                      <div className={`recording-badge ${isRecording ? 'recording' : 'standby'}`}>
                        <span className="rec-dot"></span> {isRecording ? formatTime(recordingTime) : "STANDBY"}
                      </div>
                      <div className="speed-badge">
                        <span className="speed-val">{location.speed || 0}</span>
                        <span className="speed-unit">km/h</span>
                      </div>
                    </div>
                    
                    <div className="hud-bottom-bar">
                      <div className="crosshair"></div>
                      <div className="telemetry-data">
                        <span>LAT: {location.lat}</span>
                        <span>LNG: {location.lng}</span>
                        <span className="accuracy">GPS ±{location.accuracy}m</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="action-group-vertical">
                {!cameraActive && !isSubmitted && !loading && (
                  <button onClick={startLiveCamera} className="btn btn-primary btn-massive">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    Enable AI Camera
                  </button>
                )}

                {cameraActive && !isRecording && (
                  <button onClick={startRecording} className="btn btn-success btn-massive pulse-button">
                    Start AI Scan
                  </button>
                )}

                {isRecording && (
                  <button onClick={stopRecording} className="btn btn-danger btn-massive">
                    <div className="stop-square"></div> Stop & Analyze Log
                  </button>
                )}

                {loading && (
                  <button className="btn btn-disabled btn-massive">
                    <span className="spinner-modern"></span> Running AI Models...
                  </button>
                )}

                {isSubmitted && (
                   <button onClick={() => { resetApp(); startLiveCamera(); }} className="btn btn-primary btn-massive">
                     Start New Route Scan
                   </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mode-content fade-in">
              {!photoData ? (
                <>
                  <div className="card-header-text">
                    <h3>Report Road Defect</h3>
                    <p>Take a clear picture of the pothole. Our AI evaluates depth, severity, and repair cost instantly.</p>
                  </div>
                  
                  <div className="camera-placeholder">
                     <div className="camera-icon-bg">📸</div>
                  </div>

                  <label className="btn btn-primary btn-massive file-upload-btn">
                    Open Camera
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
                  </label>
                </>
              ) : (
                <>
                  <div className="card-header-text">
                    <h3>{aiResults ? "AI Detection Results" : "Review Evidence"}</h3>
                  </div>

                  <div className="image-preview-wrapper glass-panel">
                    <img src={aiResults ? aiResults.annotated_image : photoData.previewUrl} alt="Defect analysis" className="preview-image" />
                    {!aiResults && <div className="scanning-overlay">Pending Analysis</div>}
                  </div>
                  
                  <div className="location-info-card glass-panel">
                    <div className="card-header">
                      <div className="flex-align">
                        <span className="pin-icon">📍</span>
                        <strong>Verified Location</strong>
                      </div>
                      {location && (
                        <span className={`badge-precision ${location.accuracy <= 25 ? 'high' : 'low'}`}>
                          ±{location.accuracy}m
                        </span>
                      )}
                    </div>
                    <div className="address-text">{address || "Translating GPS..."}</div>
                    <div className="coord-text">{location ? `${location.lat}, ${location.lng}` : "Acquiring coordinates..."}</div>
                  </div>

                  {aiResults && !isSubmitted && (
                    <div className="ai-summary-card slide-up">
                      <div className="summary-row">
                        <span className="label">Defects Detected</span> 
                        <span className="value badge-neutral">{aiResults.defects_detected}</span>
                      </div>
                      <div className="summary-row">
                        <span className="label">AI Severity Score</span> 
                        <span className={`value badge-sev sev-${aiResults.severity.toLowerCase()}`}>{aiResults.severity}</span>
                      </div>
                      <div className="summary-row">
                        <span className="label">Est. Repair Cost</span> 
                        <span className="value cost">₹{aiResults.total_cost}</span>
                      </div>
                    </div>
                  )}

                  <div className="action-group">
                    {isSubmitted ? (
                      <button onClick={resetApp} className="btn btn-success btn-large full-width">Report Another Defect</button>
                    ) : !aiResults ? (
                      <>
                        <button onClick={runAIAnalysis} disabled={loading || !location} className={`btn btn-primary flex-2 ${loading || !location ? 'btn-disabled' : ''}`}>
                          {loading ? <><span className="spinner-modern"></span> Analyzing</> : "Run AI Engine"}
                        </button>
                        <button onClick={resetApp} disabled={loading} className="btn btn-secondary flex-1">Retake</button>
                      </>
                    ) : (
                      <>
                        <button onClick={submitFinalReport} disabled={loading} className={`btn btn-accent flex-2 ${loading ? 'btn-disabled' : ''}`}>
                          {loading ? <><span className="spinner-modern"></span> Submitting</> : "Submit to Govt"}
                        </button>
                        <button onClick={resetApp} disabled={loading} className="btn btn-secondary flex-1">Cancel</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Global Status Toast */}
        {status.text && (
          <div className={`status-toast ${status.type}`}>
            {status.type === 'success' && '✅ '}
            {status.type === 'error' && '⚠️ '}
            {status.type === 'info' && '🔄 '}
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenApp;
