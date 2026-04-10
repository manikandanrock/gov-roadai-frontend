import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Citizen.css';

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

const CitizenApp = () => {
  const [mode, setMode] = useState("photo"); // "photo" or "video"
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
  
  // Refs for Live Tracking & Video
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const watchIdRef = useRef(null);
  
  // Refs for Dashcam Telemetry Sync
  const recordingStartTimeRef = useRef(null);
  const telemetryLogRef = useRef([]);
  const isRecordingRef = useRef(false);

  // --- Clean up streams when changing modes or unmounting ---
  useEffect(() => {
    if (mode !== 'video') {
      stopCameraAndGPS();
    }
    return () => stopCameraAndGPS();
  }, [mode]);

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
      } else {
        setAddress("Address lookup unavailable.");
      }
    } catch (err) {
      setAddress("Could not connect to map server.");
    }
  };

  // --- LIVE VIDEO & GPS LOGIC ---
  const startLiveCamera = async () => {
    resetApp();
    try {
      setStatus({ type: "info", text: "Requesting camera and GPS access..." });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setStatus({ type: "", text: "" });

      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = Math.round(pos.coords.accuracy);
            
            setLocation({ lat: lat.toFixed(6), lng: lng.toFixed(6), accuracy });
            if (!address) fetchAddress(lat, lng);

            if (isRecordingRef.current && recordingStartTimeRef.current) {
              const timeOffset = Date.now() - recordingStartTimeRef.current;
              telemetryLogRef.current.push({ timeOffset, lat, lng, accuracy });
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
    chunksRef.current = [];
    telemetryLogRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    
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
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false; 
      mediaRecorderRef.current.stop(); 
      setIsRecording(false);
      setLoading(true);
      setStatus({ type: "info", text: "Syncing Telemetry & Analyzing Dashcam..." });
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
        setStatus({ type: "success", text: `Scan complete! Logged ${data.defects_logged || 0} defects with precision GPS.` });
        setIsSubmitted(true);
      } else {
        setStatus({ type: "error", text: "Video processing failed." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Connection failed during upload." });
    } finally {
      setLoading(false);
    }
  };

  // --- PHOTO LOGIC ---
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setStatus({ type: "info", text: "Acquiring GPS Lock (Please allow location)..." });
    setPhotoData({ file: file, previewUrl: URL.createObjectURL(file) });

    if ("geolocation" in navigator) {
      const geoOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat: lat.toFixed(6), lng: lng.toFixed(6), accuracy: Math.round(position.coords.accuracy) });
          fetchAddress(lat, lng);
          setStatus({ type: "", text: "" }); 
        },
        (error) => {
          let errorMsg = "Could not get your location.";
          switch(error.code) {
            case error.PERMISSION_DENIED: errorMsg = "GPS Denied. Please enable location permissions."; break;
            case error.POSITION_UNAVAILABLE: errorMsg = "Location unavailable. Ensure GPS is on."; break;
            case error.TIMEOUT: errorMsg = "GPS request timed out. Please step outside."; break;
            default: break;
          }
          setStatus({ type: "error", text: errorMsg });
          setPhotoData(null); 
        },
        geoOptions
      );
    } else {
      setStatus({ type: "error", text: "Geolocation is not supported by your browser." });
      setPhotoData(null);
    }
  };

  const runAIAnalysis = async () => {
    if (!photoData || !location) return;
    setLoading(true);
    setStatus({ type: "info", text: "Running YOLO Detection & Depth Estimation..." });
    
    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-pothole`, { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.status === "success") {
        setAiResults(data);
        setStatus({ type: "", text: "" });
      } else {
        setStatus({ type: "error", text: "AI Engine returned an error." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "AI Engine connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const submitFinalReport = async () => {
    setLoading(true);
    setStatus({ type: "info", text: "Compressing & Submitting Report..." });

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
        setIsSubmitted(true);
        setStatus({ type: "success", text: data.message || "Report submitted successfully." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Submission failed. Payload might be too large." });
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
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
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </Link>
        </nav>

        {/* Header */}
        <header className="brand-header">
          <div className="brand-icon">🛣️</div>
          <h2>Gov-RoadAI</h2>
          <p>Citizen Reporting Portal</p>
        </header>

        {/* Native-style Segmented Control */}
        <div className="segmented-control">
          <button className={`segment ${mode === 'photo' ? 'active' : ''}`} onClick={() => { setMode('photo'); resetApp(); }}>
            📷 Photo Mode
          </button>
          <button className={`segment ${mode === 'video' ? 'active' : ''}`} onClick={() => { setMode('video'); resetApp(); }}>
            📹 Live Dashcam
          </button>
        </div>
        
        {/* Main Card */}
        <main className="upload-card">
          {mode === 'video' ? (
            <div className="mode-content">
              <h3>Live Infrastructure Scan</h3>
              <p className="card-subtitle">Mount your phone or hold it steady. AI will scan your live feed and log defects dynamically.</p>
              
              <div className={`video-container ${cameraActive || isSubmitted ? 'visible' : 'hidden'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="live-video-preview" />
                
                {location && cameraActive && (
                  <div className="live-hud">
                    <div className="hud-header">
                      <div className={`recording-indicator ${isRecording ? 'recording' : 'standby'}`}>
                        <span className="dot"></span> {isRecording ? "RECORDING" : "STANDBY"}
                      </div>
                      <div className="hud-accuracy">±{location.accuracy}m</div>
                    </div>
                    <div className="gps-feed">
                      {location.lat}, {location.lng}
                    </div>
                  </div>
                )}
              </div>

              <div className="action-group-vertical">
                {!cameraActive && !isSubmitted && !loading && (
                  <button onClick={startLiveCamera} className="btn btn-primary btn-large">
                    👁️ Enable Camera & GPS
                  </button>
                )}

                {cameraActive && !isRecording && (
                  <button onClick={startRecording} className="btn btn-success btn-large">
                    ▶️ Start Scanning
                  </button>
                )}

                {isRecording && (
                  <button onClick={stopRecording} className="btn btn-danger btn-large">
                    ⏹️ Stop & Submit Scan
                  </button>
                )}

                {loading && (
                  <button className="btn btn-disabled btn-large">
                    <span className="spinner"></span> Processing AI...
                  </button>
                )}

                {isSubmitted && (
                   <button onClick={() => { resetApp(); startLiveCamera(); }} className="btn btn-success btn-large">
                     Start New Scan
                   </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mode-content">
              {!photoData ? (
                <>
                  <h3>Report a Road Defect</h3>
                  <p className="card-subtitle">Take a clear photo of the pothole. Our AI will analyze the depth and categorize the risk.</p>
                  <label className="btn btn-primary btn-large file-upload-btn">
                    📸 Take Photo
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
                  </label>
                </>
              ) : (
                <>
                  <h3>{aiResults ? "AI Detection Results" : "Review Photo"}</h3>
                  <div className="image-preview-wrapper">
                    <img src={aiResults ? aiResults.annotated_image : photoData.previewUrl} alt="Defect analysis" className="preview-image" />
                  </div>
                  
                  <div className="location-info-card">
                    <div className="card-header">
                      <strong>📍 Verified Location</strong>
                      {location && (
                        <span className={`badge-precision ${location.accuracy <= 25 ? 'high' : 'low'}`}>
                          ±{location.accuracy}m Precision
                        </span>
                      )}
                    </div>
                    <div className="address-text">{address || "Translating GPS to street address..."}</div>
                    <div className="coord-text">{location ? `GPS: ${location.lat}, ${location.lng}` : "Acquiring coordinates..."}</div>
                  </div>

                  {aiResults && !isSubmitted && (
                    <div className="ai-summary-card">
                      <div className="summary-row"><span>Defects Found:</span> <strong>{aiResults.defects_detected}</strong></div>
                      <div className="summary-row"><span>Severity:</span> <strong className={`sev-${aiResults.severity.toLowerCase()}`}>{aiResults.severity}</strong></div>
                      <div className="summary-row"><span>Est. Cost:</span> <strong>₹{aiResults.total_cost}</strong></div>
                    </div>
                  )}

                  <div className="action-group">
                    {isSubmitted ? (
                      <button onClick={resetApp} className="btn btn-success btn-large full-width">Report Another Defect</button>
                    ) : !aiResults ? (
                      <>
                        <button onClick={runAIAnalysis} disabled={loading || !location} className={`btn btn-primary flex-2 ${loading || !location ? 'btn-disabled' : ''}`}>
                          {loading ? <><span className="spinner"></span> Analyzing...</> : "🔍 Run AI Analysis"}
                        </button>
                        <button onClick={resetApp} disabled={loading} className="btn btn-secondary flex-1">Retake</button>
                      </>
                    ) : (
                      <>
                        <button onClick={submitFinalReport} disabled={loading} className={`btn btn-accent flex-2 ${loading ? 'btn-disabled' : ''}`}>
                          {loading ? <><span className="spinner"></span> Sending...</> : "📤 Submit Report"}
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
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenApp;
