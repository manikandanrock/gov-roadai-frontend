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

  const resetSystem = async () => {
    if (!window.confirm("⚠️ WARNING: Purge all infrastructure data?")) return;
    await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" });
    fetchDashboard();
  };

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
    <div className="soc-layout">
      {/* SIDEBAR */}
      <aside className="soc-sidebar">
        <div className="soc-brand">
          <button className="soc-back-btn" onClick={() => navigate("/")}>← Exit to Portal</button>
          <h2>GovRoadAI</h2>
          <span className="soc-badge">COMMAND CENTER</span>
        </div>

        <div className="soc-panel">
          <h3 className="panel-title">FINANCIAL CONTROL</h3>
          <div className="budget-input-group">
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min="0"
              step="10000"
            />
          </div>

          <div className="budget-meter">
            <div className="meter-labels">
              <span>Utilized: ₹{data.summary.total_cost.toLocaleString()}</span>
              <span className="meter-percent">{budgetUsedPercent}%</span>
            </div>
            <div className="meter-track">
              <div 
                className={`meter-fill ${budgetUsedPercent > 90 ? 'danger' : budgetUsedPercent > 70 ? 'warning' : 'safe'}`} 
                style={{ width: `${budgetUsedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="soc-panel bottom-panel">
          <div className="system-status">
            <span className="status-dot pulsing"></span>
            AI Polling Active
          </div>
          <button className="soc-purge-btn" onClick={resetSystem}>
            Purge Database
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="soc-main">
        {/* STATS HUD */}
        <div className="soc-hud">
          <div className="hud-card">
            <p className="hud-label">Total Defects</p>
            <h3 className="hud-value">{data.summary.total_detected}</h3>
          </div>
          <div className="hud-card danger-glow">
            <p className="hud-label">Critical Severity</p>
            <h3 className="hud-value">{highRisk}</h3>
          </div>
          <div className="hud-card">
            <p className="hud-label">Scheduled Repairs</p>
            <h3 className="hud-value">{data.summary.optimized_repairs}</h3>
          </div>
          <div className="hud-card">
            <p className="hud-label">Avg Depth</p>
            <h3 className="hud-value">{avgDepth} <span>cm</span></h3>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="soc-workspace">
          <div className="workspace-tabs">
            <button className={`tab-btn ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>
              LIVE MAP
            </button>
            <button className={`tab-btn ${view === "table" ? "active" : ""}`} onClick={() => setView("table")}>
              DETECTION LOGS
            </button>
          </div>

          <div className="workspace-view">
            {view === "map" ? (
              <MapContainer center={[13.0827, 80.2707]} zoom={14} style={{ height: "100%", width: "100%", background: "#0a0f1c" }}>
                <MapFix />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {data.detections.map(d => (
                  <CircleMarker
                    key={d.id}
                    center={[d.lat, d.lng]}
                    radius={d.risk_level === "High" ? 10 : 7}
                    pathOptions={{
                      color: d.risk_level === "High" ? "#ef4444" : "#f59e0b",
                      fillColor: d.risk_level === "High" ? "#ef4444" : "#f59e0b",
                      fillOpacity: 0.6,
                      weight: 2
                    }}
                  >
                    <Popup className="soc-popup">
                      <div className="popup-content">
                        {d.image_data && <img src={d.image_data} alt="defect" onClick={() => setImage(d.image_data)} />}
                        <div className="popup-details">
                          <p><span>ID:</span> {d.id}</p>
                          <p><span>Depth:</span> {d.depth_cm} cm</p>
                          <p><span>Cost:</span> ₹{d.cost_inr}</p>
                          <span className={`soc-tag ${d.risk_level === "High" ? "tag-red" : "tag-yellow"}`}>
                            {d.risk_level} Risk
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            ) : (
              <div className="soc-table-container">
                <table className="soc-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Defect ID</th>
                      <th>Depth</th>
                      <th>Est. Cost</th>
                      <th>Severity</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detections.map(d => (
                      <tr key={d.id}>
                        <td>
                          {d.image_data ? (
                            <img src={d.image_data} onClick={() => setImage(d.image_data)} alt="defect" className="thumb" />
                          ) : <div className="no-thumb">-</div>}
                        </td>
                        <td className="font-mono">{d.id}</td>
                        <td>{d.depth_cm} cm</td>
                        <td className="cost-col">₹{d.cost_inr}</td>
                        <td>
                          <span className={`soc-tag ${d.risk_level === "High" ? "tag-red" : "tag-yellow"}`}>
                            {d.risk_level}
                          </span>
                        </td>
                        <td className="source-col">{d.source.replace('_', ' ')}</td>
                      </tr>
                    ))}
                    {data.detections.length === 0 && (
                      <tr><td colSpan="6" className="empty-state">No active detections.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* LIGHTBOX */}
      {image && (
        <div className="soc-lightbox" onClick={() => setImage(null)}>
          <img src={image} alt="Enlarged defect" />
        </div>
      )}
    </div>
  );
}
