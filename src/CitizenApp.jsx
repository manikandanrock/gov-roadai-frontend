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

  // ================== UTIL ==================
  const updateStatus = (type, text) => setStatus({ type, text });

  const resetApp = () => {
    setPhotoData(null);
    setLocation(null);
    setAddress("");
    setAiResults(null);
    setIsSubmitted(false);
    setStatus({ type: "", text: "" });
  };

  // ================== LOCATION ==================
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setAddress(data.display_name || "Address unavailable");
    } catch {
      setAddress("Address lookup failed");
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy);

          setLocation({ lat, lng, accuracy });
          fetchAddress(lat, lng);
          resolve();
        },
        () => reject(),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // ================== PHOTO ==================
  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setPhotoData({ file, preview: URL.createObjectURL(file) });

    updateStatus("info", "Getting location...");
    try {
      await getLocation();
      updateStatus("", "");
    } catch {
      updateStatus("error", "Location failed. Enable GPS.");
    }
  };

  // AUTO AI RUN
  useEffect(() => {
    if (photoData && location && !aiResults) {
      runAIAnalysis();
    }
  }, [photoData, location]);

  const runAIAnalysis = async () => {
    setLoading(true);
    updateStatus("info", "Analyzing image...");

    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze-pothole`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        setAiResults(data);
        updateStatus("", "");
      } else {
        updateStatus("error", "AI failed");
      }
    } catch {
      updateStatus("error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  const submitFinalReport = async () => {
    setLoading(true);
    updateStatus("info", "Submitting report...");

    const formData = new FormData();
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);

    try {
      const res = await fetch(`${API_BASE_URL}/submit-citizen-report`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        setIsSubmitted(true);
        updateStatus("success", "Report submitted!");
      }
    } catch {
      updateStatus("error", "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // ================== CAMERA ==================
  const startCamera = async () => {
    resetApp();
    updateStatus("info", "Starting camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      updateStatus("", "");
    } catch {
      updateStatus("error", "Camera permission denied");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
    setIsRecording(false);
  };

  // ================== UI ==================
  return (
    <div className="app-wrapper">
      <div className="citizen-container">

        <nav className="top-nav">
          <Link to="/" className="back-link">← Back</Link>
        </nav>

        <header className="brand-header">
          <div className="brand-icon">🛣️</div>
          <h2>Gov-RoadAI</h2>
          <p>Citizen Reporting Portal</p>
        </header>

        {/* MODE SWITCH */}
        <div className="segmented-control">
          <button
            className={`segment ${mode === "photo" ? "active" : ""}`}
            onClick={() => { setMode("photo"); resetApp(); }}
          >
            Photo
          </button>
          <button
            className={`segment ${mode === "video" ? "active" : ""}`}
            onClick={() => { setMode("video"); resetApp(); }}
          >
            Video
          </button>
        </div>

        <main className="upload-card">

          {/* PHOTO MODE */}
          {mode === "photo" && (
            <>
              {!photoData ? (
                <>
                  <h3>Capture Road Issue</h3>
                  <label className="btn btn-primary full-width">
                    Take Photo
                    <input type="file" hidden onChange={handlePhotoCapture} />
                  </label>
                </>
              ) : (
                <>
                  <img
                    src={aiResults?.annotated_image || photoData.preview}
                    className="preview-image"
                    alt="preview"
                  />

                  <div className="info-box">
                    <p>{address || "Fetching address..."}</p>
                    {location && <small>±{location.accuracy}m accuracy</small>}
                  </div>

                  {aiResults && (
                    <div className="result-box">
                      <p>Severity: <b>{aiResults.severity}</b></p>
                      <p>Cost: ₹{aiResults.total_cost}</p>
                    </div>
                  )}

                  <div className="action-group">
                    {!aiResults ? (
                      <button className="btn btn-disabled full-width">
                        Processing...
                      </button>
                    ) : isSubmitted ? (
                      <button onClick={resetApp} className="btn btn-success full-width">
                        New Report
                      </button>
                    ) : (
                      <button onClick={submitFinalReport} className="btn btn-accent full-width">
                        Submit
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* VIDEO MODE */}
          {mode === "video" && (
            <>
              <h3>Live Scan</h3>

              <video ref={videoRef} autoPlay className="live-video" />

              {!cameraActive ? (
                <button onClick={startCamera} className="btn btn-primary full-width">
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="btn btn-danger full-width">
                  Stop
                </button>
              )}
            </>
          )}

        </main>

        {/* LOADER */}
        {loading && (
          <div className="overlay-loader">
            <div className="spinner"></div>
            <p>{status.text}</p>
          </div>
        )}

        {/* STATUS */}
        {status.text && !loading && (
          <div className={`status-toast ${status.type}`}>
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenApp;
