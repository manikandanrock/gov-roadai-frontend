import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

/* Map auto focus */
const MapFix = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.setView([13.0827, 80.2707], 14);
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
};

export default function AdminDashboard() {

  const [data, setData] = useState({
    detections: [],
    summary: { total_cost: 0, total_detected: 0 }
  });

  const [budget, setBudget] = useState(1500000);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("map");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  /* Fetch dashboard data */
  const fetchDashboard = async () => {

    try {

      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budget}`);
      if (!res.ok) return;

      const json = await res.json();
      setData(json);

    } catch (err) {
      console.error(err);
    }

  };

  useEffect(() => {

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);

    return () => clearInterval(interval);

  }, [budget]);

  /* Upload dashcam */
  const uploadVideo = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {

      await fetch(`${API_BASE_URL}/analyze-infrastructure?budget=${budget}`, {
        method: "POST",
        body: formData
      });

      fetchDashboard();

    } catch {
      alert("Upload failed");
    }

    setLoading(false);

  };

  /* Reset DB */
  const resetSystem = async () => {

    if (!window.confirm("Reset system database?")) return;

    await fetch(`${API_BASE_URL}/clear-database`, {
      method: "DELETE"
    });

    fetchDashboard();
  };

  /* Stats */

  const highRisk = useMemo(
    () => data.detections.filter(d => d.risk_level === "High").length,
    [data.detections]
  );

  const avgDepth = useMemo(() => {

    if (!data.detections.length) return 0;

    const total = data.detections.reduce((sum, d) => sum + (d.depth_cm || 0), 0);
    return (total / data.detections.length).toFixed(1);

  }, [data.detections]);

  return (

    <div className="ai-dashboard">

      {/* HEADER */}

      <header className="dashboard-header">

  <div className="header-title">

    <button
      className="back-btn"
      onClick={() => navigate("/")}
    >
      ← Back
    </button>

    <div>
      <h1>GovRoadAI Infrastructure Command Center</h1>
      <p>AI-powered road defect detection and repair planning</p>
    </div>

  </div>

  <div className="header-controls">

    <div className="budget-box">
      <label>Budget</label>
      <input
        type="number"
        value={budget}
        onChange={(e)=>setBudget(Number(e.target.value))}
      />
    </div>

   {/* No longer needed <label className="upload-btn">
      {loading ? "Processing..." : "Upload Dashcam"}
      <input type="file" accept="video/*" onChange={uploadVideo} hidden />
    </label> */}

    <button className="reset-btn" onClick={resetSystem}>
      Reset System
    </button>

  </div>

</header>

      {/* AI STATS */}

      <section className="stats-grid">

        <div className="stat-card">
          <h4>Total Defects</h4>
          <span>{data.summary.total_detected}</span>
        </div>

        <div className="stat-card danger">
          <h4>High Risk</h4>
          <span>{highRisk}</span>
        </div>

        <div className="stat-card success">
          <h4>Budget Allocation</h4>
          <span>₹{data.summary.total_cost.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <h4>Avg Depth</h4>
          <span>{avgDepth} cm</span>
        </div>

      </section>

      {/* VIEW SWITCH */}

      <div className="view-tabs">

        <button
          className={view === "map" ? "active" : ""}
          onClick={()=>setView("map")}
        >
          AI Map Intelligence
        </button>

        <button
          className={view === "table" ? "active" : ""}
          onClick={()=>setView("table")}
        >
          Detection Logs
        </button>

        <div className="live-indicator">
          ● Live AI System
        </div>

      </div>

      {/* MAIN PANEL */}

      <div className="dashboard-panel">

        {view === "map" ? (

          <MapContainer
            center={[13.0827,80.2707]}
            zoom={14}
            style={{height:"100%",width:"100%"}}
          >

            <MapFix/>

            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {data.detections.map(d => (

              <CircleMarker
                key={d.id}
                center={[d.lat,d.lng]}
                radius={10}
                pathOptions={{
                  color: d.risk_level === "High" ? "#ef4444" : "#f59e0b",
                  fillOpacity:.8
                }}
              >

                <Popup>

                  <div className="popup-ai">

                    {d.image_data && (
                      <img
                        src={d.image_data}
                        alt="defect"
                        onClick={()=>setImage(d.image_data)}
                      />
                    )}

                    <p><b>ID:</b> {d.id}</p>
                    <p><b>Depth:</b> {d.depth_cm} cm</p>
                    <p><b>Severity:</b> {d.risk_level}</p>
                    <p><b>Repair Cost:</b> ₹{d.cost_inr}</p>

                  </div>

                </Popup>

              </CircleMarker>

            ))}

          </MapContainer>

        ) : (

          <div className="table-wrapper">

            <table className="ai-table">

              <thead>

                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Depth (cm)</th>
                  <th>Severity</th>
                  <th>Cost</th>
                  <th>Source</th>
                </tr>

              </thead>

              <tbody>

                {data.detections.map(d => (

                  <tr key={d.id}>

                    <td>
                      {d.image_data &&
                        <img
                          src={d.image_data}
                          onClick={()=>setImage(d.image_data)}
                          alt="defect"
                        />
                      }
                    </td>

                    <td>{d.id}</td>
                    <td>{d.depth_cm}</td>
                    <td>{d.risk_level}</td>
                    <td>₹{d.cost_inr}</td>
                    <td>{d.source}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* IMAGE VIEWER */}

      {image && (

        <div className="image-viewer" onClick={()=>setImage(null)}>
          <img src={image} alt="analysis"/>
        </div>

      )}

    </div>
  );
}
