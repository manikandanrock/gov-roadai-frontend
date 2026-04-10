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
      
      // Start Video Stream (Prefer rear camera on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setStatus({ type: "", text: "" });

      // Start Continuous GPS Tracking
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = Math.round(pos.coords.accuracy);
            
            setLocation({ 
              lat: lat.toFixed(6), 
              lng: lng.toFixed(6), 
              accuracy: accuracy 
            });
            
            // Only fetch street address occasionally to save API calls
            if (!address) fetchAddress(lat, lng);

            // Log Exact Telemetry if recording is active
            if (isRecordingRef.current && recordingStartTimeRef.current) {
              const timeOffset = Date.now() - recordingStartTimeRef.current;
              telemetryLogRef.current.push({
                timeOffset: timeOffset,
                lat: lat,
                lng: lng,
                accuracy: accuracy
              });
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
    telemetryLogRef.current = []; // Clear old logs
    
    const recorder = new MediaRecorder(streamRef.current);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.onstop = handleLiveVideoUpload;
    
    // Set recording state BEFORE starting to ensure we catch frame 0
    isRecordingRef.current = true;
    setIsRecording(true);
    recordingStartTimeRef.current = Date.now();
    
    recorder.start();
    mediaRecorderRef.current = recorder;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false; // Stop logging GPS instantly
      mediaRecorderRef.current.stop(); // Triggers the onstop event
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
      const response = await fetch(`${API_BASE_URL}/analyze-infrastructure`, {
        method: "POST",
        body: formData
      });
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

    // Compress Image
    const compressImage = (base64Str) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Optimal width for database storage
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Exporting at 0.7 quality to stay under backend payload limits
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
      });
    };

    try {
      // Compress the base64 AI result image before appending to FormData
      const compressedImg = await compressImage(aiResults.annotated_image);
      formData.append("image_data", compressedImg); 

      const response = await fetch(`${API_BASE_URL}/submit-citizen-report`, { 
        method: "POST", 
        body: formData 
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setIsSubmitted(true);
        setStatus({ type: "success", text: data.message || "Report submitted successfully." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Submission failed. Image payload might be too large." });
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
    <div className="citizen-container">
      <div className="top-nav">
        <Link to="/" className="back-link">⬅️ Back</Link>
      </div>

      <div className="brand-header">
        <h2>Gov-RoadAI</h2>
        <p>Citizen Reporting Portal</p>
      </div>

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
          onClick={() => { setMode('photo'); resetApp(); }} 
        >
          📷 Photo
        </button>
        <button 
          className={`mode-btn ${mode === 'video' ? 'active' : ''}`}
          onClick={() => { setMode('video'); resetApp(); }} 
        >
          📹 Live Dashcam
        </button>
      </div>
      
      <div className="upload-card">
        {mode === 'video' ? (
          <>
            <h3>Live Infrastructure Scan</h3>
            <p>Drive or walk. AI will scan your live feed and log defects dynamically.</p>
            
            {/* Live Video Viewer */}
            <div className="video-container" style={{ display: (cameraActive || isSubmitted) ? 'block' : 'none' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="live-video-preview"
              />
              
              {/* Overlay GPS Feed */}
              {location && cameraActive && (
                <div className="live-hud">
                  <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
                    {isRecording ? "🔴 RECORDING" : "🟢 STANDBY"}
                  </div>
                  <div className="gps-feed">
                    GPS: {location.lat}, {location.lng} (±{location.accuracy}m)
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            {!cameraActive && !isSubmitted && !loading && (
              <button onClick={startLiveCamera} className="capture-btn">
                👁️ Enable Camera & GPS
              </button>
            )}

            {cameraActive && !isRecording && (
              <button onClick={startRecording} className="capture-btn success">
                ▶️ Start Scan
              </button>
            )}

            {isRecording && (
              <button onClick={stopRecording} className="capture-btn accent">
                ⏹️ Stop & Submit Scan
              </button>
            )}

            {loading && (
              <button className="capture-btn disabled">
                <div className="spinner"></div> Processing...
              </button>
            )}

            {isSubmitted && (
               <button onClick={() => { resetApp(); startLiveCamera(); }} className="capture-btn success">
                 Start New Scan
               </button>
            )}
          </>
        ) : (
          /* PHOTO MODE RENDER */
          !photoData ? (
            <>
              <h3>Report a Road Defect</h3>
              <p>Take a clear photo of the pothole. Our AI will analyze the depth and identify it.</p>
              <label className="capture-btn">
                📸 Take Photo
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
              </label>
            </>
          ) : (
            <>
              <h3>{aiResults ? "AI Detection Results" : "Review Photo"}</h3>
              <img 
                src={aiResults ? aiResults.annotated_image : photoData.previewUrl} 
                alt="Defect analysis" 
                style={{ width: '100%', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0', objectFit: 'cover', maxHeight: '300px' }} 
              />
              
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#0f172a' }}>📍 Verified Location</strong>
                  {location && (
                    <span style={{ 
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', 
                      backgroundColor: location.accuracy <= 25 ? '#d1fae5' : '#fef3c7', 
                      color: location.accuracy <= 25 ? '#065f46' : '#b45309' 
                    }}>
                      ±{location.accuracy}m Precision
                    </span>
                  )}
                </div>
                
                <div style={{ color: '#0f172a', fontWeight: '500', marginBottom: '4px', fontSize: '0.95rem' }}>
                  {address || "Translating GPS to street address..."}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {location ? `GPS: ${location.lat}, ${location.lng}` : "Acquiring coordinates..."}
                </div>
              </div>

              {aiResults && !isSubmitted && (
                <div style={{ background: '#e0e7ff', padding: '15px', borderRadius: '8px', textAlign: 'left', border: '1px solid #c7d2fe', marginBottom: '15px' }}>
                  <p style={{ margin: '4px 0', color: '#0f172a' }}><strong>Defects Found:</strong> {aiResults.defects_detected}</p>
                  <p style={{ margin: '4px 0', color: '#0f172a' }}><strong>Severity:</strong> {aiResults.severity}</p>
                  <p style={{ margin: '4px 0', color: '#0f172a' }}><strong>Est. Cost:</strong> ₹{aiResults.total_cost}</p>
                </div>
              )}

              {isSubmitted ? (
                <button onClick={resetApp} className="capture-btn" style={{ backgroundColor: '#10b981', border: 'none' }}>Report Another Defect</button>
              ) : !aiResults ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={runAIAnalysis} disabled={loading || !location} className={`capture-btn ${loading || !location ? 'disabled' : ''}`} style={{ flex: 2, border: 'none' }}>
                    {loading ? "Analyzing..." : "🔍 Run AI Analysis"}
                  </button>
                  <button onClick={resetApp} disabled={loading} className="capture-btn" style={{ flex: 1, backgroundColor: '#64748b', border: 'none' }}>Retake</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={submitFinalReport} disabled={loading} className={`capture-btn ${loading ? 'disabled' : ''}`} style={{ flex: 2, border: 'none', backgroundColor: '#8b5cf6' }}>
                    {loading ? "Sending..." : "📤 Submit Report"}
                  </button>
                  <button onClick={resetApp} disabled={loading} className="capture-btn" style={{ flex: 1, backgroundColor: '#64748b', border: 'none' }}>Cancel</button>
                </div>
              )}
            </>
          )
        )}
      </div>

      {status.text && (
        <div className={`status-message ${status.type}`}>
          {status.text}
        </div>
      )}
    </div>
  );
};

export default CitizenApp;
