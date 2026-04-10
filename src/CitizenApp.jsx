import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Citizen.css';

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

const CitizenApp = () => {

  // ---------------- STATE ----------------
  const [mode, setMode] = useState("photo");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const [photoData, setPhotoData] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const [aiResults, setAiResults] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // VIDEO + GPS
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [gpsPath, setGpsPath] = useState([]);
  const [tracking, setTracking] = useState(false);

  // ---------------- LOCATION ----------------
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

  // ---------------- PHOTO ----------------
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setPhotoData({ file, previewUrl: URL.createObjectURL(file) });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        fetchAddress(lat, lng);
      },
      () => setStatus({ type: "error", text: "Location denied" })
    );
  };

  const runAIAnalysis = async () => {
    setLoading(true);
    setStatus({ type: "info", text: "Running AI..." });

    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze-pothole`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      setAiResults(data);
      setStatus({ type: "success", text: "AI completed" });
    } catch {
      setStatus({ type: "error", text: "AI failed" });
    }

    setLoading(false);
  };

  const submitFinalReport = async () => {
    setLoading(true);

    const formData = new FormData();
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);
    formData.append("depth_cm", aiResults.max_depth);
    formData.append("kg_asphalt", aiResults.total_kg);
    formData.append("cost_inr", aiResults.total_cost);
    formData.append("risk_level", aiResults.severity);
    formData.append("image_data", aiResults.annotated_image);

    try {
      await fetch(`${API_BASE_URL}/submit-citizen-report`, {
        method: "POST",
        body: formData
      });

      setIsSubmitted(true);
      setStatus({ type: "success", text: "Report submitted!" });
    } catch {
      setStatus({ type: "error", text: "Submission failed" });
    }

    setLoading(false);
  };

  // ---------------- GPS TRACKING ----------------
  const startGPSTracking = () => {
    if (!navigator.geolocation) return;

    setTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: new Date().toISOString()
        };

        setGpsPath((prev) => [...prev, point]);
      },
      () => setStatus({ type: "error", text: "GPS tracking failed" }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return watchId;
  };

  const stopGPSTracking = (watchId) => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
  };

  // ---------------- VIDEO ----------------
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setVideoFile(file);

    const watchId = startGPSTracking();
    uploadVideo(file, watchId);
  };

  const uploadVideo = async (file, watchId) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/analyze-infrastructure`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      setJobId(data.job_id);
      setStatus({ type: "info", text: "Processing video..." });

      stopGPSTracking(watchId);

      // send GPS path
      await fetch(`${API_BASE_URL}/upload-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: data.job_id, path: gpsPath })
      });

      pollJobStatus(data.job_id);

    } catch {
      setStatus({ type: "error", text: "Upload failed" });
      stopGPSTracking(watchId);
    }
  };

  const pollJobStatus = (jobId) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/job-status/${jobId}`);
      const data = await res.json();

      setJobStatus(data.status);

      if (data.status === "completed") {
        clearInterval(interval);
        setStatus({ type: "success", text: "Video processed!" });
      }

      if (data.status === "failed") {
        clearInterval(interval);
        setStatus({ type: "error", text: "Processing failed" });
      }
    }, 3000);
  };

  // ---------------- RESET ----------------
  const resetApp = () => {
    setPhotoData(null);
    setVideoFile(null);
    setLocation(null);
    setAddress("");
    setAiResults(null);
    setIsSubmitted(false);
    setJobId(null);
    setJobStatus(null);
    setGpsPath([]);
    setTracking(false);
    setStatus({ type: "", text: "" });
  };

  // ---------------- UI ----------------
  return (
    <div className="citizen-container">

      <Link to="/">⬅ Back</Link>

      <h2>Citizen Portal</h2>

      {/* MODE SWITCH */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button onClick={() => setMode("photo")}>📸 Photo</button>
        <button onClick={() => setMode("video")}>🎥 Video</button>
      </div>

      {/* PHOTO MODE */}
      {mode === "photo" && (
        <>
          {!photoData ? (
            <input type="file" accept="image/*" onChange={handlePhotoCapture} />
          ) : (
            <>
              <img src={photoData.previewUrl} alt="preview" width="100%" />
              <p>{address}</p>

              {!aiResults ? (
                <button onClick={runAIAnalysis}>
                  {loading ? "Analyzing..." : "Run AI"}
                </button>
              ) : (
                <>
                  <p>Severity: {aiResults.severity}</p>
                  <p>Cost: ₹{aiResults.total_cost}</p>

                  {!isSubmitted ? (
                    <button onClick={submitFinalReport}>Submit</button>
                  ) : (
                    <button onClick={resetApp}>New Report</button>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* VIDEO MODE */}
      {mode === "video" && (
        <>
          {!videoFile ? (
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
          ) : (
            <>
              <p>🎬 {videoFile.name}</p>
              <p>Status: {jobStatus || "Uploading..."}</p>

              {tracking && (
                <p style={{ color: "green" }}>
                  📍 Tracking... ({gpsPath.length} points)
                </p>
              )}

              {gpsPath.length > 0 && (
                <p style={{ fontSize: "12px" }}>
                  Last: {gpsPath[gpsPath.length - 1].lat.toFixed(5)},{" "}
                  {gpsPath[gpsPath.length - 1].lng.toFixed(5)}
                </p>
              )}
            </>
          )}
        </>
      )}

      {/* STATUS */}
      {status.text && <p>{status.text}</p>}

    </div>
  );
};

export default CitizenApp;
