import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Citizen.css';

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

const CitizenApp = () => {
  const [mode, setMode] = useState("photo");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(""); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const watchIdRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const telemetryLogRef = useRef([]);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (mode !== 'video') stopCameraAndGPS();
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
        const street = addr.road || addr.pedestrian || "";
        const area = addr.suburb || addr.city || "";
        setAddress(street && area ? `${street}, ${area}` : data.display_name.split(',').slice(0, 2).join(', '));
      }
    } catch (err) { setAddress("Location pinned."); }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resetApp();
    setStatus({ type: "info", text: "Acquiring GPS Lock..." });
    setPhotoData({ file, previewUrl: URL.createObjectURL(file) });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setLocation({ lat: latitude.toFixed(6), lng: longitude.toFixed(6), accuracy: Math.round(accuracy) });
          fetchAddress(latitude, longitude);
          setStatus({ type: "", text: "" }); 
        },
        () => setStatus({ type: "error", text: "GPS failed. Check permissions." }),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const runAIAnalysis = async () => {
    if (!photoData || !location) return;
    setLoading(true);
    setStatus({ type: "info", text: "Running AI Analysis..." });
    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-pothole`, { method: "POST", body: formData });
      const data = await response.json();
      if (data.status === "success") {
        setAiResults(data);
        setStatus({ type: "", text: "" });
      }
    } catch (err) { setStatus({ type: "error", text: "AI Engine connection failed." }); }
    finally { setLoading(false); }
  };

  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640; // Reduced for faster upload [cite: 108]
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Lower quality for smaller payload [cite: 109]
      };
    });
  };

  const submitFinalReport = async () => {
    setLoading(true);
    setStatus({ type: "info", text: "Sending report..." });

    try {
      const compressedImg = await compressImage(aiResults.annotated_image);
      const formData = new FormData();
      formData.append("lat", location.lat);
      formData.append("lng", location.lng);
      formData.append("depth_cm", aiResults.max_depth);
      formData.append("kg_asphalt", aiResults.total_kg);
      formData.append("cost_inr", aiResults.total_cost);
      formData.append("risk_level", aiResults.severity);
      formData.append("image_data", compressedImg);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const response = await fetch(`${API_BASE_URL}/submit-citizen-report`, { 
        method: "POST", 
        body: formData,
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.status === "success") {
        setIsSubmitted(true);
        setStatus({ type: "success", text: "Report submitted to Govt!" });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Submission timed out. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setPhotoData(null); setLocation(null); setAddress("");
    setAiResults(null); setIsSubmitted(false); setStatus({ type: "", text: "" });
  };

  return (
    <div className="app-wrapper">
      <div className="citizen-container">
        <nav className="top-nav"><Link to="/" className="back-link">Back</Link></nav>
        <header className="brand-header">
          <div className="brand-icon">🛣️</div>
          <h2>Gov-RoadAI</h2>
          <p>Citizen Reporting Portal</p>
        </header>

        <div className="segmented-control">
          <button className={`segment ${mode === 'photo' ? 'active' : ''}`} onClick={() => { setMode('photo'); resetApp(); }}>📸 Photo</button>
          <button className={`segment ${mode === 'video' ? 'active' : ''}`} onClick={() => { setMode('video'); resetApp(); }}>📹 Video</button>
        </div>
        
        <main className="upload-card">
          {!photoData ? (
            <div className="mode-content">
              <h3>Report Road Defect</h3>
              <p className="card-subtitle">Take a clear photo of the pothole for AI analysis.</p>
              <label className="btn btn-primary btn-large">
                📸 Take Photo
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} hidden />
              </label>
            </div>
          ) : (
            <div className="mode-content">
              <div className="image-preview-wrapper">
                <img src={aiResults ? aiResults.annotated_image : photoData.previewUrl} className="preview-image" alt="preview" />
              </div>
              
              {location && (
                <div className="location-info-card">
                  <strong>📍 {address || "Locating..."}</strong>
                  <div className="coord-text">GPS: {location.lat}, {location.lng}</div>
                </div>
              )}

              {aiResults && !isSubmitted && (
                <div className="ai-summary-card">
                  <div className="summary-row"><span>Severity:</span> <strong className={`sev-${aiResults.severity.toLowerCase()}`}>{aiResults.severity}</strong></div>
                  <div className="summary-row"><span>Est. Cost:</span> <strong>₹{aiResults.total_cost}</strong></div>
                </div>
              )}

              <div className="action-group">
                {isSubmitted ? (
                  <button onClick={resetApp} className="btn btn-success btn-large full-width">Report Another</button>
                ) : !aiResults ? (
                  <button onClick={runAIAnalysis} disabled={loading || !location} className="btn btn-primary flex-2">
                    {loading ? "Analyzing..." : "🔍 Run AI Analysis"}
                  </button>
                ) : (
                  <button onClick={submitFinalReport} disabled={loading} className="btn btn-accent flex-2">
                    {loading ? "Sending..." : "📤 Submit Report"}
                  </button>
                )}
                {!isSubmitted && <button onClick={resetApp} className="btn btn-secondary flex-1">Cancel</button>}
              </div>
            </div>
          )}
        </main>
        {status.text && <div className={`status-toast ${status.type}`}>{status.text}</div>}
      </div>
    </div>
  );
};

export default CitizenApp;
