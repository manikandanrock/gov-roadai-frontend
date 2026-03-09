import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

/* Resize map when layout changes */
const MapResizer = () => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

const AdminDashboard = () => {
  const [infraData, setInfraData] = useState({
    detections: [],
    optimized_plan: [],
    summary: { total_cost: 0, total_detected: 0 }
  });

  const [loading, setLoading] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(1500000);
  const [viewMode, setViewMode] = useState("map");
  const [expandedImage, setExpandedImage] = useState(null);

  /* Fetch Dashboard Data */
  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budgetLimit || 0}`);

      if (!res.ok) {
        throw new Error("API error");
      }

      const data = await res.json();
      setInfraData(data);

    } catch (err) {
      console.error("Gov-RoadAI API Error:", err);
    }
  };

  /* Auto refresh dashboard */
  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 10000);

    return () => clearInterval(interval);
  }, [budgetLimit]);

  /* Upload infrastructure video */
  const handleInfraAnalysis = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`${API_BASE_URL}/analyze-infrastructure?budget=${budgetLimit || 0}`, {
        method: "POST",
        body: formData
      });

      fetchDashboardData();

    } catch (err) {
      alert("Analysis failed.");
      console.error(err);
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  /* Reset Database */
  const handleClearDatabase = async () => {
    const confirmReset = window.confirm("Format database?");

    if (!confirmReset) return;

    setLoading(true);

    try {
      await fetch(`${API_BASE_URL}/clear-database`, {
        method: "DELETE"
      });

      fetchDashboardData();

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* Count high risk defects */
  const highRiskCount = useMemo(() => {
    return infraData.detections.filter(d => d.risk_level === "High").length;
  }, [infraData.detections]);

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <img
            src="/favicon.svg"
            alt="GovRoadAI Logo"
            style={{ width: "32px", height: "32px", borderRadius: "8px" }}
          />
          <h2>Gov-RoadAI</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">🏠 Home</Link>
          <div className="nav-item active">📊 Analytics</div>
          <div className="nav-item">🛰️ Satellite</div>
          <div className="nav-item">⚙️ System</div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn-clear"
            onClick={handleClearDatabase}
            style={{
              width: "100%",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid #ef4444",
              padding: "0.75rem",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            🗑 Reset System
          </button>
        </div>

      </aside>

      {/* MAIN PANEL */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <div className="header-title">
            <h1>Infrastructure Command Center</h1>
            <p style={{ color: "#64748b", fontWeight: "500" }}>
              Real-time Road Asset Monitoring & AI Budgeting
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>

            {/* Budget Input */}
            <div style={{ textAlign: "right" }}>
              <label style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: "800",
                color: "#64748b",
                textTransform: "uppercase"
              }}>
                Current Budget
              </label>

              <input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "1.2rem",
                  fontWeight: "800",
                  textAlign: "right",
                  color: "#4f46e5",
                  width: "120px"
                }}
              />
            </div>

            {/* Upload Button */}
            <label style={{
              background: "#4f46e5",
              color: "white",
              padding: "0.8rem 1.5rem",
              borderRadius: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 10px 15px rgba(79,70,229,0.3)"
            }}>
              {loading ? "⌛ Processing..." : "📁 Upload Dashcam"}

              <input
                type="file"
                accept="video/*"
                onChange={handleInfraAnalysis}
                hidden
              />
            </label>

          </div>

        </header>

        {/* STATS */}
        <section className="stats-grid">

          <div className="stat-card">
            <span className="stat-label">Total Defects</span>
            <span className="stat-value">
              {infraData.summary?.total_detected || 0}
            </span>
          </div>

          <div className="stat-card urgent">
            <span className="stat-label">High Risk Areas</span>
            <span className="stat-value">{highRiskCount}</span>
          </div>

          <div className="stat-card success">
            <span className="stat-label">Allocated Spend</span>
            <span className="stat-value">
              ₹{infraData.summary?.total_cost?.toLocaleString() || 0}
            </span>
          </div>

        </section>

        {/* MAIN PANEL */}
        <div className="content-panel">

          <div className="panel-top">

            <div className="tabs">
              <button
                className={viewMode === "map" ? "active" : ""}
                onClick={() => setViewMode("map")}
              >
                Spatial Intelligence
              </button>

              <button
                className={viewMode === "table" ? "active" : ""}
                onClick={() => setViewMode("table")}
              >
                Analytical Logs
              </button>
            </div>

            <div style={{
              color: "#10b981",
              fontWeight: "700",
              fontSize: "0.9rem"
            }}>
              ● Live Data Sync Active
            </div>

          </div>

          {/* MAP VIEW */}
          <div style={{ flex: 1, position: "relative" }}>

            {viewMode === "map" ? (

              <MapContainer
                center={[13.0827, 80.2707]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >

                <MapResizer />

                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {infraData.detections.map((p) => (

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

                      <div style={{ width: "200px" }}>

                        {p.image_data && (
                          <img
                            src={p.image_data}
                            alt="Road defect"
                            onClick={() => setExpandedImage(p.image_data)}
                            style={{
                              width: "100%",
                              borderRadius: "12px",
                              cursor: "pointer",
                              marginBottom: "10px"
                            }}
                          />
                        )}

                        <p style={{ fontWeight: "800", margin: 0 }}>
                          ID: {p.id}
                        </p>

                        <p style={{ fontWeight: "700", color: "#4f46e5" }}>
                          Cost: ₹{p.cost_inr}
                        </p>

                      </div>

                    </Popup>

                  </CircleMarker>

                ))}

              </MapContainer>

            ) : (

              <div style={{ padding: "1rem" }}>

                <table className="modern-table">

                  <thead>
                    <tr>
                      <th>Visual Proof</th>
                      <th>Defect ID</th>
                      <th>Source</th>
                      <th>Severity</th>
                      <th>Est. Cost</th>
                    </tr>
                  </thead>

                  <tbody>

                    {infraData.detections.map((p) => (

                      <tr key={p.id}>

                        <td>
                          {p.image_data ? (
                            <img
                              src={p.image_data}
                              alt="road defect"
                              className="table-thumb"
                              onClick={() => setExpandedImage(p.image_data)}
                            />
                          ) : "🎥"}
                        </td>

                        <td>{p.id}</td>

                        <td>
                          <span className="source-badge">
                            {p.source}
                          </span>
                        </td>

                        <td style={{
                          color: p.risk_level === "High"
                            ? "#ef4444"
                            : "#f59e0b"
                        }}>
                          {p.risk_level}
                        </td>

                        <td>₹{p.cost_inr?.toLocaleString()}</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </main>

      {/* IMAGE LIGHTBOX */}
      {expandedImage && (

        <div
          className="image-lightbox"
          onClick={() => setExpandedImage(null)}
        >

          <div
            className="lightbox-wrap"
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >

            <img
              src={expandedImage}
              alt="Analysis Result"
            />

            <button
              onClick={() => setExpandedImage(null)}
              style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                background: "#ef4444",
                color: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ✕
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default AdminDashboard;
