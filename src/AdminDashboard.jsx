import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

/* Fix leaflet resizing */
const MapFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
};

const AdminDashboard = () => {
  const [data, setData] = useState({
    detections: [],
    summary: { total_cost: 0, total_detected: 0 }
  });

  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(1500000);
  const [view, setView] = useState("map");
  const [image, setImage] = useState(null);

  /* API Fetch */
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budget}`);
      if (!res.ok) return;

      const json = await res.json();
      setData(json);

    } catch (err) {
      console.error("API Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [budget]);

  /* Upload video */
  const handleUpload = async (e) => {
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

      fetchData();
    } catch {
      alert("Upload failed");
    }

    setLoading(false);
  };

  /* Reset database */
  const resetSystem = async () => {
    if (!window.confirm("Reset system database?")) return;

    await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" });
    fetchData();
  };

  const highRisk = useMemo(
    () => data.detections.filter(d => d.risk_level === "High").length,
    [data.detections]
  );

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <img src="/favicon.svg" alt="logo" />
          <h2>GovRoadAI</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">🏠 Home</Link>
          <div className="nav-item active">📊 Dashboard</div>
          <div className="nav-item">🛰 Satellite</div>
          <div className="nav-item">⚙ System</div>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-danger" onClick={resetSystem}>
            Reset Database
          </button>
        </div>

      </aside>


      {/* MAIN DASHBOARD */}
      <main className="admin-main">

        {/* TOP BAR */}
        <div className="dashboard-topbar">

          <div>
            <h1>AI Infrastructure Command Center</h1>
            <p>Real-time road monitoring powered by computer vision</p>
          </div>

          <div className="topbar-controls">

            <div className="budget-box">
              <label>Budget</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>

            <label className="upload-btn">
              {loading ? "Processing..." : "Upload Dashcam"}
              <input
                type="file"
                accept="video/*"
                onChange={handleUpload}
                hidden
              />
            </label>

          </div>

        </div>


        {/* STATS */}
        <div className="stats-grid">

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

        </div>


        {/* VIEW SWITCH */}
        <div className="panel-header">

          <div className="tabs">
            <button
              className={view === "map" ? "active" : ""}
              onClick={() => setView("map")}
            >
              Map Intelligence
            </button>

            <button
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              Data Logs
            </button>
          </div>

          <div className="live-status">
            ● Live System Active
          </div>

        </div>


        {/* MAIN PANEL */}
        <div className="dashboard-panel">

          {view === "map" ? (

            <MapContainer
              center={[13.0827, 80.2707]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >

              <MapFix />

              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {data.detections.map(p => (

                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={10}
                  pathOptions={{
                    color: p.risk_level === "High" ? "#ef4444" : "#f59e0b",
                    fillOpacity: 0.7
                  }}
                >

                  <Popup>

                    <div className="popup-card">

                      {p.image_data && (
                        <img
                          src={p.image_data}
                          alt="defect"
                          onClick={() => setImage(p.image_data)}
                        />
                      )}

                      <strong>ID:</strong> {p.id}

                      <br />

                      <strong>Cost:</strong> ₹{p.cost_inr}

                    </div>

                  </Popup>

                </CircleMarker>

              ))}

            </MapContainer>

          ) : (

            <div className="table-wrapper">

              <table className="modern-table">

                <thead>
                  <tr>
                    <th>Image</th>
                    <th>ID</th>
                    <th>Source</th>
                    <th>Severity</th>
                    <th>Cost</th>
                  </tr>
                </thead>

                <tbody>

                  {data.detections.map(p => (

                    <tr key={p.id}>

                      <td>
                        {p.image_data ? (
                          <img
                            src={p.image_data}
                            className="table-thumb"
                            alt="defect"
                            onClick={() => setImage(p.image_data)}
                          />
                        ) : "Video"}
                      </td>

                      <td>{p.id}</td>

                      <td>{p.source}</td>

                      <td className={p.risk_level === "High" ? "danger" : "warning"}>
                        {p.risk_level}
                      </td>

                      <td>₹{p.cost_inr}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>


      {/* IMAGE VIEWER */}
      {image && (
        <div className="image-lightbox" onClick={() => setImage(null)}>
          <img src={image} alt="defect large" />
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
