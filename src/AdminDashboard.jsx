import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

/* Map auto focus component */
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
  const [view, setView] = useState("map"); // map, table, settings
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [image, setImage] = useState(null);
  const [budget, setBudget] = useState(1500000);
  
  const [data, setData] = useState({
    detections: [],
    summary: { total_cost: 0, total_detected: 0, optimized_repairs: 0 }
  });

  const [costs, setCosts] = useState({
    material_cost_kg: 45,
    labor_cost_sqm: 1200,
    vehicle_overhead: 2500,
    admin_overhead_pct: 0.10
  });

  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budget}`);
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const fetchCostSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/get-cost-settings`);
      const json = await res.json();
      setCosts(json);
    } catch (err) {
      console.error("Settings Load Error:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchCostSettings();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [budget]);

  // --- Handlers ---
  const handleUpdateCosts = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("material", costs.material_cost_kg);
    formData.append("labor", costs.labor_cost_sqm);
    formData.append("vehicle", costs.vehicle_overhead);
    formData.append("admin", costs.admin_overhead_pct);

    try {
      const res = await fetch(`${API_BASE_URL}/update-cost-settings`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        alert("Financial parameters updated globally!");
        fetchDashboard(); // Refresh data with new costs
      }
    } catch (err) {
      alert("Update failed.");
    }
  };

  const resetSystem = async () => {
    if (!window.confirm("⚠️ WARNING: This will permanently delete all infrastructure data. Continue?")) return;
    await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" });
    fetchDashboard();
  };

  // --- Analytics ---
  const budgetUsedPercent = useMemo(() => {
    if (budget === 0) return 0;
    return Math.min((data.summary.total_cost / budget) * 100, 100).toFixed(1);
  }, [data.summary.total_cost, budget]);

  const highRiskCount = useMemo(() => 
    data.detections.filter(d => d.risk_level === "High").length
  , [data.detections]);

  return (
    <div className={`soc-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      
      {/* SIDEBAR */}
      <aside className="soc-sidebar">
        <div className="soc-brand">
          <button className="soc-back-btn" onClick={() => navigate("/")}>← Exit to Portal</button>
          <h2>GovRoadAI</h2>
          <span className="soc-badge">COMMAND CENTER</span>
        </div>

        <div className="soc-panel">
          <h3 className="panel-title">Navigation</h3>
          <div className="sidebar-nav-group">
            <button className={`tab-btn-side ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>🗺️ Intelligence Map</button>
            <button className={`tab-btn-side ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>📋 Data Logs</button>
            <button className={`tab-btn-side ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>⚙️ Cost Settings</button>
          </div>
        </div>

        <div className="soc-panel">
          <h3 className="panel-title">Budget Allocation (₹)</h3>
          <div className="budget-input-group">
            <span className="currency-symbol">₹</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
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
          <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <div className="system-status">
            <span className="status-dot pulsing"></span>
            AI Polling Active
          </div>
          <button className="soc-purge-btn" onClick={resetSystem}>Purge Database</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="soc-main">
        
        {/* STATS HUD */}
        <div className="soc-hud">
          <div className="hud-card">
            <p className="hud-label">Total Detected</p>
            <h3 className="hud-value">{data.summary.total_detected}</h3>
          </div>
          <div className="hud-card danger-glow">
            <p className="hud-label">Critical Defects</p>
            <h3 className="hud-value">{highRiskCount}</h3>
          </div>
          <div className="hud-card">
            <p className="hud-label">Scheduled Repairs</p>
            <h3 className="hud-value">{data.summary.optimized_repairs}</h3>
          </div>
          <div className="hud-card">
            <p className="hud-label">Allocated Capital</p>
            <h3 className="hud-value">₹{(data.summary.total_cost / 1000).toFixed(1)}k</h3>
          </div>
        </div>

        {/* WORKSPACE VIEW SWITCHER */}
        <div className="soc-workspace">
          
          {view === 'settings' ? (
            <div className="soc-table-container settings-view fade-in">
              <div className="settings-header">
                <h3>⚙️ Financial Parameter Configuration</h3>
                <p>Adjust global repair costs. AI will recalculate budget impact instantly.</p>
              </div>
              <form onSubmit={handleUpdateCosts} className="settings-form">
                <div className="setting-group">
                  <label>Material Cost (Asphalt) per KG</label>
                  <input type="number" value={costs.material_cost_kg} onChange={e => setCosts({...costs, material_cost_kg: e.target.value})} />
                </div>
                <div className="setting-group">
                  <label>Labor Cost (Workforce) per SQM</label>
                  <input type="number" value={costs.labor_cost_sqm} onChange={e => setCosts({...costs, labor_cost_sqm: e.target.value})} />
                </div>
                <div className="setting-group">
                  <label>Vehicle/Machinery Overhead (per site)</label>
                  <input type="number" value={costs.vehicle_overhead} onChange={e => setCosts({...costs, vehicle_overhead: e.target.value})} />
                </div>
                <div className="setting-group">
                  <label>Admin/Safety Buffer (0.10 = 10%)</label>
                  <input type="number" step="0.01" value={costs.admin_overhead_pct} onChange={e => setCosts({...costs, admin_overhead_pct: e.target.value})} />
                </div>
                <button type="submit" className="save-settings-btn">Apply Financial Changes</button>
              </form>
            </div>
          ) : view === 'map' ? (
            <div className="workspace-view">
              <MapContainer 
                center={[13.0827, 80.2707]} 
                zoom={14} 
                style={{ height: "100%", width: "100%", background: isDarkMode ? "#0a0f1c" : "#e5e7eb" }}
              >
                <MapFix />
                <TileLayer 
                  url={isDarkMode 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  } 
                />
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
                          <p><span>Cost:</span> ₹{d.cost_inr.toLocaleString()}</p>
                          <span className={`soc-tag ${d.risk_level === "High" ? "tag-red" : "tag-yellow"}`}>
                            {d.risk_level} Risk
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="soc-table-container">
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>Evidence</th>
                    <th>Defect ID</th>
                    <th>Depth (cm)</th>
                    <th>Repair Cost</th>
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
                      <td>{d.depth_cm}</td>
                      <td className="cost-col">₹{d.cost_inr.toLocaleString()}</td>
                      <td>
                        <span className={`soc-tag ${d.risk_level === "High" ? "tag-red" : "tag-yellow"}`}>
                          {d.risk_level}
                        </span>
                      </td>
                      <td className="source-col">{d.source.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* LIGHTBOX / IMAGE VIEWER */}
      {image && (
        <div className="soc-lightbox" onClick={() => setImage(null)}>
          <img src={image} alt="Enlarged defect evidence" />
        </div>
      )}
    </div>
  );
}
