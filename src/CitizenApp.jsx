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
            setLocation({ 
              lat: lat.toFixed(6), 
              lng: lng.toFixed(6), 
              accuracy: Math.round(pos.coords.accuracy) 
            });
            // Only fetch street address occasionally to save API calls
            if (!address) fetchAddress(lat, lng);
          },
          (err) => console.error("GPS Watch Error:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
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
    const recorder = new MediaRecorder(streamRef.current);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.onstop = handleLiveVideoUpload;
    recorder.start();
    
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop(); // Triggers the onstop event
      setIsRecording(false);
      setLoading(true);
      setStatus({ type: "info", text: "Analyzing Dashcam Footage..." });
      stopCameraAndGPS();
    }
  };

  const handleLiveVideoUpload = async () => {
    const videoBlob = new Blob(chunksRef.current, { type: 'video/mp4' });
    const file = new File([videoBlob], "live_dashcam.mp4", { type: "video/mp4" });
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-infrastructure`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setStatus({ type: "success", text: "Footage processed! Defects plotted on Command Center Map." });
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

  // --- PHOTO LOGIC (Unchanged) ---
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setStatus({ type: "info", text: "Acquiring GPS Lock..." });
    setPhotoData({ file: file, previewUrl: URL.createObjectURL(file) });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), accuracy: Math.round(pos.coords.accuracy) });
          fetchAddress(pos.coords.latitude, pos.coords.longitude);
          setStatus({ type: "", text: "" }); 
        },
        () => setStatus({ type: "error", text: "Could not get location." }),
        { enableHighAccuracy: true }
      );
    }
  };

  const runAIAnalysis = async () => { /* ... existing code ... */ };
  const submitFinalReport = async () => { /* ... existing code ... */ };

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
           /* ... Existing Photo JSX Render stays exactly the same ... */
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
            /* ... Rest of existing photo logic UI ... */
            <p>Photo loaded. <i>(Keep existing photo code here)</i></p>
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
