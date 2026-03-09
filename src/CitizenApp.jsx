import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Citizen.css';

const CitizenApp = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  
  const [photoData, setPhotoData] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(""); 
  const [aiResults, setAiResults] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchAddress = async (lat, lng) => {
    try {
      // Added zoom=18 for street-level precision and accept-language=en for English
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=en`);
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.neighbourhood || "";
        const area = addr.suburb || addr.city_district || addr.town || addr.city || "";
        
        let preciseAddress = "";
        if (street && area && street !== area) {
          preciseAddress = `${street}, ${area}`;
        } else if (street || area) {
          preciseAddress = street || area;
        } else {
          preciseAddress = data.display_name.split(',').slice(0, 2).join(', ');
        }
        
        setAddress(preciseAddress);
      } else {
        setAddress("Address lookup unavailable. Using raw GPS.");
      }
    } catch (err) {
      setAddress("Could not connect to map server.");
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetApp();
    setStatus({ type: "info", text: "Acquiring High-Precision GPS Lock..." });
    setPhotoData({ file: file, previewUrl: URL.createObjectURL(file) });

    if ("geolocation" in navigator) {
      const geoOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy; 
          
          setLocation({
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            accuracy: Math.round(accuracy) 
          });
          
          fetchAddress(lat, lng);
          setStatus({ type: "", text: "" }); 
        },
        (error) => {
          let errorMessage = "GPS is required to report road defects.";
          if (error.code === error.TIMEOUT) errorMessage = "GPS signal timed out. Please step outside.";
          setStatus({ type: "error", text: errorMessage });
        },
        geoOptions
      );
    } else {
      setStatus({ type: "error", text: "Geolocation is not supported by your browser." });
    }
  };

  const runAIAnalysis = async () => {
    if (!photoData || !location) return;
    setLoading(true);
    setStatus({ type: "info", text: "Running YOLO Detection & Depth Estimation..." });
    
    const formData = new FormData();
    formData.append("file", photoData.file);

    try {
      const response = await fetch("http://localhost:8000/api/v1/analyze-pothole", {
        method: "POST", body: formData,
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setAiResults(data);
        setStatus({ type: "", text: "" });
      }
    } catch (err) {
      setStatus({ type: "error", text: "AI Engine connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const submitFinalReport = async () => {
    setLoading(true);
    setStatus({ type: "info", text: "Submitting to Govt Database..." });

    const formData = new FormData();
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);
    formData.append("depth_cm", aiResults.max_depth);
    formData.append("kg_asphalt", aiResults.total_kg);
    formData.append("cost_inr", aiResults.total_cost);
    formData.append("risk_level", aiResults.severity);

    try {
      const response = await fetch("http://localhost:8000/api/v1/submit-citizen-report", {
        method: "POST", body: formData,
      });
      const data = await response.json();
      
      if (data.status === "success") {
        setIsSubmitted(true);
        setStatus({ type: "success", text: data.message });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Database connection failed." });
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
      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 'bold' }}>⬅️ Back Home</Link>
      </div>

      <div className="brand-header">
        <h2>Gov-RoadAI</h2>
        <p>Citizen Reporting Portal</p>
      </div>
      
      <div className="upload-card">
        {!photoData ? (
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
              style={{ width: '100%', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0' }} 
            />
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ color: '#0f172a' }}>📍 Verified Location</strong>
                {location && (
                  <span style={{ 
                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold',
                    backgroundColor: location.accuracy <= 10 ? '#d1fae5' : '#fef3c7',
                    color: location.accuracy <= 10 ? '#065f46' : '#b45309' 
                  }}>
                    ±{location.accuracy}m Precision
                  </span>
                )}
              </div>
              
              {address ? (
                <div style={{ color: '#0f172a', fontWeight: '500', marginBottom: '4px', fontSize: '0.95rem' }}>
                  {address}
                </div>
              ) : (
                <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Translating GPS to street address...
                </div>
              )}
              
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
              <button onClick={resetApp} className="capture-btn" style={{ backgroundColor: '#10b981', border: 'none' }}>
                Report Another Defect
              </button>
            ) : !aiResults ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={runAIAnalysis} disabled={loading || !location} className={`capture-btn ${loading || !location ? 'disabled' : ''}`} style={{ flex: 2, border: 'none' }}>
                  {loading ? "Analyzing..." : "🔍 Run AI Analysis"}
                </button>
                <button onClick={resetApp} disabled={loading} className="capture-btn" style={{ flex: 1, backgroundColor: '#64748b', border: 'none' }}>
                  Retake
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={submitFinalReport} disabled={loading} className={`capture-btn ${loading ? 'disabled' : ''}`} style={{ flex: 2, border: 'none', backgroundColor: '#8b5cf6' }}>
                  {loading ? "Sending..." : "📤 Submit Report"}
                </button>
                <button onClick={resetApp} disabled={loading} className="capture-btn" style={{ flex: 1, backgroundColor: '#64748b', border: 'none' }}>
                  Cancel
                </button>
              </div>
            )}
          </>
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