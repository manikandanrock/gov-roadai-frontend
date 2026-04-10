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

  /* Reset DB */
  const resetSystem = async () => {
    if (!window.confirm("⚠️ WARNING: This will permanently delete all infrastructure data. Continue?")) return;
    await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" });
    fetchDashboard();
  };

  /* Derived Stats */
  const highRisk = useMemo(
    () => data.detections.filter(d => d.risk_level === "High").length,
    [data.detections]
  );

  const avgDepth = useMemo(() => {
    if (!data.detections.length) return 0;
    const total = data.detections.reduce((sum, d) => sum + (d.depth_cm || 0), 0);
    return (total / data.detections.length).toFixed(1);
  }, [data.detections]);

  const budgetUsedPercent = useMemo(() => {
    if (budget === 0) return 0;
    return Math.min((data.summary.total_cost / budget) * 100, 100).toFixed(1);
  }, [data.summary.total_cost, budget]);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <button className="sidebar-back" onClick={() => navigate("/")}>← Home</button>
          <h2>GovRoadAI</h2>
          <p>Command Center</p>
        </div>

        <div className="sidebar-section">
          <h3>Financial Control</h3>
          <div className="budget-control">
            <label>Operating Budget (₹)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min="0"
              step="10000"
            />
          </div>

          <div className="budget-visualizer">
            <div className="budget-labels">
              <span>Used: ₹{data.summary.total_cost.toLocaleString()}</span>
              <span>{budgetUsedPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className={`progress-bar-fill ${budgetUsedPercent > 90 ? 'critical' : budgetUsedPercent > 70 ? 'warning' : 'safe'}`} 
                style={{ width: `${budgetUsedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>System Admin</h3>
          <button className="btn-danger" onClick={resetSystem}>
            Purge Database
          </button>
          <div className="system-status">
            <span className="pulse-dot"></span> System Live & Polling
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* STATS ROW */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <p className="stat-label">Total Defects Found</p>
            <h3 className="stat-value">{data.summary.total_detected}</h3>
          </div>
          <div className="admin-stat-card critical">
            <p className="stat-label">High Severity</p>
            <h3 className="stat-value">{highRisk}</h3>
          </div>
          <div className="admin-stat-card">
            <p className="stat-label">Repairs Planned</p>
            <h3 className="stat-value">{data.summary.optimized_repairs}</h3>
          </div>
          <div className="admin-stat-card">
            <p className="stat-label">Average Depth</p>
            <h3 className="stat-value">{avgDepth} <span className="text-sm text-muted">cm</span></h3>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="admin-workspace">
          <div className="workspace-header">
            <div className="segmented-control">
              <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
                🗺️ AI Map Intelligence
              </button>
              <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>
                📋 Detection Logs
              </button>
            </div>
          </div>

          <div className="workspace-content">
            {view === "map" ? (
              <MapContainer
                center={[13.0827, 80.2707]}
                zoom={14}
                style={{ height: "100%", width: "100%", borderRadius: "0 0 16px 16px" }}
              >
                <MapFix />
                {/* Dark mode map for better contrast with glowing markers */}
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {data.detections.map(d => (
                  <CircleMarker
                    key={d.id}
                    center={[d.lat, d.lng]}
                    radius={d.risk_level === "High" ? 12 : 8}
                    pathOptions={{
                      color: d.risk_level === "High" ? "#ff4b4b" : "#facc15",
                      fillOpacity: 0.8,
                      weight: 2
                    }}
                  >
                    <Popup className="dark-popup">
                      <div className="popup-ai">
                        {d.image_data && (
                          <img src={d.image_data} alt="defect" onClick={() => setImage(d.image_data)} />
                        )}
                        <p><strong>ID:</strong> {d.id}</p>
                        <p><strong>Depth:</strong> {d.depth_cm} cm</p>
                        <p><strong>Cost:</strong> ₹{d.cost_inr}</p>
                        <span className={`badge ${d.risk_level === "High" ? "badge-red" : "badge-yellow"}`}>
                          {d.risk_level} Risk
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            ) : (
              <div className="data-grid-wrapper">
                <table className="data-grid">
                  <thead>
                    <tr>
                      <th>Snapshot</th>
                      <th>Defect ID</th>
                      <th>Depth (cm)</th>
                      <th>Cost (INR)</th>
                      <th>Severity</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detections.map(d => (
                      <tr key={d.id}>
                        <td>
                          {d.image_data ? (
                            <img src={d.image_data} onClick={() => setImage(d.image_data)} alt="defect" className="table-thumb" />
                          ) : (
                            <div className="no-thumb">N/A</div>
                          )}
                        </td>
                        <td className="mono">{d.id}</td>
                        <td>{d.depth_cm}</td>
                        <td className="font-bold">₹{d.cost_inr}</td>
                        <td>
                          <span className={`badge ${d.risk_level === "High" ? "badge-red" : "badge-yellow"}`}>
                            {d.risk_level}
                          </span>
                        </td>
                        <td className="capitalize">{d.source.replace('_', ' ')}</td>
                      </tr>
                    ))}
                    {data.detections.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-state">No infrastructure data found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL IMAGE VIEWER */}
      {image && (
        <div className="image-viewer" onClick={() => setImage(null)}>
          <img src={image} alt="analysis" />
          <button className="close-viewer">×</button>
        </div>
      )}
    </div>
  );
}
