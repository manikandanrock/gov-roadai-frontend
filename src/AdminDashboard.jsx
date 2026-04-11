import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./App.css";

const API_BASE = "http://localhost:8000/api/v1"; // Update to your backend URL

export default function AdminDashboard() {
  const [view, setView] = useState("map"); // 'map', 'table', 'settings', 'dashcam'
  const [budget, setBudget] = useState(1500000);
  const [dashboardData, setDashboardData] = useState({ summary: {}, detections: [], optimized_plan: [] });
  const [settings, setSettings] = useState({ material_cost_kg: 0, labor_cost_sqm: 0, vehicle_overhead: 0, admin_overhead_pct: 0 });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Fetch Dashboard & Optimization Data
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard-data?budget=${budget}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) { console.error("Error fetching dashboard:", err); }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/get-cost-settings`);
      setSettings(await res.json());
    } catch (err) { console.error("Error fetching settings:", err); }
  };

  useEffect(() => {
    fetchDashboard();
    fetchSettings();
  }, [budget]);

  // Handle Settings Update
  const saveSettings = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("material", settings.material_cost_kg);
    formData.append("labor", settings.labor_cost_sqm);
    formData.append("vehicle", settings.vehicle_overhead);
    formData.append("admin", settings.admin_overhead_pct);

    await fetch(`${API_BASE}/update-cost-settings`, { method: "POST", body: formData });
    fetchDashboard(); // Recalculate costs
    alert("Settings updated successfully.");
  };

  // Handle Dashcam Upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("file", file);
    // You can also append telemetry JSON here if available

    try {
      await fetch(`${API_BASE}/analyze-infrastructure`, { method: "POST", body: formData });
      fetchDashboard();
      setView("map");
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const clearDatabase = async () => {
    if(window.confirm("Are you sure you want to delete all defect data?")) {
      await fetch(`${API_BASE}/clear-database`, { method: "DELETE" });
      fetchDashboard();
    }
  }

  return (
    <div className="admin-grid-layout">
      {/* Sidebar Mission Control */}
      <aside className="mission-control">
        <div className="brand-zone">
          <Link to="/" className="btn-modern btn-secondary" style={{marginBottom: '1rem', padding: '0.5rem 1rem'}}>← Home</Link>
          <h1>Road<span>AI</span> Control</h1>
        </div>

        <nav className="nav-vertical">
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>📍 Intelligence Map</button>
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>📋 Repair Plan</button>
          <button className={view === 'dashcam' ? 'active' : ''} onClick={() => setView('dashcam')}>📹 Dashcam Upload</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>⚙️ Configuration</button>
        </nav>

        <div className="card-modern" style={{marginTop: 'auto', padding: '1rem', background: 'var(--bg-app)', border: 'none'}}>
          <label className="res-label" style={{display: 'block', marginBottom: '0.5rem'}}>Repair Budget (₹)</label>
          <input 
            type="number" 
            value={budget} 
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-light)'}}
          />
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="dashboard-body">
        <header className="stats-hud">
          <div className="hud-stat card-modern">
            <span className="label">Total Hazards Found</span>
            <span className="value">{dashboardData.summary.total_detected || 0}</span>
          </div>
          <div className="hud-stat card-modern" style={{borderColor: 'var(--success)'}}>
            <span className="label">Optimal Repairs (Within Budget)</span>
            <span className="value" style={{color: 'var(--success)'}}>{dashboardData.summary.optimized_repairs || 0}</span>
          </div>
          <div className="hud-stat card-modern">
            <span className="label">Required Budget</span>
            <span className="value">₹{(dashboardData.summary.total_cost || 0).toLocaleString()}</span>
          </div>
        </header>

        <section className="workspace-area card-modern">
          {view === 'map' && (
             <div className="map-wrapper">
               <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: "100%", width: "100%" }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                 {dashboardData.detections.map((d, i) => {
                   const isOptimized = dashboardData.optimized_plan.some(plan => plan.id === d.id);
                   return (
                     <CircleMarker 
                      key={i} center={[d.lat, d.lng]} radius={8} 
                      pathOptions={{ 
                        color: isOptimized ? '#10b981' : '#ef4444', 
                        fillColor: isOptimized ? '#10b981' : '#ef4444', 
                        fillOpacity: 0.6 
                      }}
                     >
                       <Popup>
                         <strong>{d.id}</strong><br/>
                         Depth: {d.depth_cm}cm<br/>Cost: ₹{d.cost_inr}<br/>
                         {isOptimized ? "✅ Selected for Repair" : "❌ Insufficient Budget"}
                       </Popup>
                     </CircleMarker>
                   )
                 })}
               </MapContainer>
             </div>
          )}

          {view === 'table' && (
            <div className="table-wrapper">
              <h3 style={{marginBottom: '1rem'}}>AI Optimized Repair Priority</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Defect ID</th>
                    <th>Risk Level</th>
                    <th>Depth (cm)</th>
                    <th>Asphalt Needed</th>
                    <th>Est. Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.detections.sort((a,b) => b.depth_cm - a.depth_cm).map(d => {
                    const isSelected = dashboardData.optimized_plan.some(plan => plan.id === d.id);
                    return (
                      <tr key={d.id} style={{opacity: isSelected ? 1 : 0.5}}>
                        <td style={{fontWeight: '600'}}>{d.id}</td>
                        <td><span className={`badge ${d.risk_level === 'High' ? 'badge-high' : 'badge-medium'}`}>{d.risk_level}</span></td>
                        <td>{d.depth_cm} cm</td>
                        <td>{d.kg_asphalt} kg</td>
                        <td>₹{d.cost_inr.toLocaleString()}</td>
                        <td>{isSelected ? "✅ Scheduled" : "Pending Budget"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === 'settings' && (
             <div className="table-wrapper" style={{maxWidth: '600px'}}>
               <h3 style={{marginBottom: '1.5rem'}}>Financial & Material Constants</h3>
               <form onSubmit={saveSettings} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <div>
                    <label className="res-label">Material Cost (₹ per kg)</label>
                    <input type="number" className="form-input" value={settings.material_cost_kg} onChange={e => setSettings({...settings, material_cost_kg: e.target.value})} />
                  </div>
                  <div>
                    <label className="res-label">Labor Cost (₹ per sqm)</label>
                    <input type="number" className="form-input" value={settings.labor_cost_sqm} onChange={e => setSettings({...settings, labor_cost_sqm: e.target.value})} />
                  </div>
                  <div>
                    <label className="res-label">Vehicle/Equipment Overhead (₹)</label>
                    <input type="number" className="form-input" value={settings.vehicle_overhead} onChange={e => setSettings({...settings, vehicle_overhead: e.target.value})} />
                  </div>
                  <div>
                    <label className="res-label">Admin Overhead (%)</label>
                    <input type="number" step="0.01" className="form-input" value={settings.admin_overhead_pct} onChange={e => setSettings({...settings, admin_overhead_pct: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-modern btn-primary">Update Constants</button>
               </form>
               <hr style={{margin: '2rem 0', borderColor: 'var(--border-light)'}}/>
               <button onClick={clearDatabase} className="btn-modern" style={{background: 'var(--danger-bg)', color: 'var(--danger)'}}>⚠️ Clear All Defect Data</button>
             </div>
          )}

          {view === 'dashcam' && (
             <div className="table-wrapper" style={{textAlign: 'center', padding: '4rem 2rem'}}>
               <div className="icon-hero" style={{fontSize: '4rem'}}>📹</div>
               <h2>Upload Dashcam Footage</h2>
               <p className="text-muted" style={{marginBottom: '2rem'}}>The AI will process the video frame-by-frame, detect potholes, calculate depth, and map them using telemetry.</p>
               
               {uploadingVideo ? (
                 <div className="res-label pulse">Processing video with YOLOv8 & MiDaS... This may take a while.</div>
               ) : (
                 <label className="btn-modern btn-primary">
                    Select .MP4 Video File
                    <input type="file" accept="video/mp4" onChange={handleVideoUpload} hidden />
                 </label>
               )}
             </div>
          )}
        </section>
      </main>
    </div>
  );
}
