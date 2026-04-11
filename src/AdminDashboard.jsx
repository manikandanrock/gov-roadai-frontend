import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./App.css";

const API_BASE = "https://maniiiikk-roadgovai.hf.space/api/v1"; 

// Helper component to recenter map
const MapFix = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => { map.invalidateSize(); }, 300); }, [map]);
  return null;
};

export default function AdminDashboard() {
  const [view, setView] = useState("map"); 
  const [budget, setBudget] = useState(1500000);
  const [dashboardData, setDashboardData] = useState({ summary: {}, detections: [], optimized_plan: [] });
  const [settings, setSettings] = useState({ material_cost_kg: 45, labor_cost_sqm: 1200, vehicle_overhead: 2500, admin_overhead_pct: 0.1 });
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Dashboard
      const dashRes = await fetch(`${API_BASE}/dashboard-data?budget=${budget}`);
      const dashJson = await dashRes.json();
      setDashboardData(dashJson);

      // Fetch Settings
      const setRes = await fetch(`${API_BASE}/get-cost-settings`);
      const setJson = await setRes.json();
      setSettings(setJson);
    } catch (err) { 
      console.error("Error fetching data:", err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [budget]);

  // Handle Settings Update (Requires FormData for FastAPI)
  const saveSettings = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("material", settings.material_cost_kg);
    formData.append("labor", settings.labor_cost_sqm);
    formData.append("vehicle", settings.vehicle_overhead);
    formData.append("admin", settings.admin_overhead_pct);

    try {
      await fetch(`${API_BASE}/update-cost-settings`, { method: "POST", body: formData });
      fetchData(); // Refresh everything
      alert("Settings updated successfully.");
    } catch(err) { alert("Failed to update settings."); }
  };

  const clearDatabase = async () => {
    if(window.confirm("Are you sure you want to permanently delete all defect data?")) {
      await fetch(`${API_BASE}/clear-database`, { method: "DELETE" });
      fetchData();
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
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>📋 Priority Repairs</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>⚙️ Engine Config</button>
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
          {loading && <div style={{padding: '2rem', textAlign: 'center'}}>Syncing with Command Center...</div>}
          
          {!loading && view === 'map' && (
             <div className="map-wrapper">
               <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: "100%", width: "100%" }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                 <MapFix />
                 {(dashboardData.detections || []).map((d, i) => {
                   const isOptimized = dashboardData.optimized_plan.some(plan => plan.id === d.id);
                   return (
                     <CircleMarker 
                      key={d.id || i} center={[d.lat, d.lng]} radius={8} 
                      pathOptions={{ 
                        color: isOptimized ? '#10b981' : '#ef4444', 
                        fillColor: isOptimized ? '#10b981' : '#ef4444', 
                        fillOpacity: 0.6 
                      }}
                     >
                       <Popup>
                         <div style={{textAlign: 'center'}}>
                            {d.image_data && <img src={d.image_data} alt="defect" style={{width: '100px', borderRadius: '8px', marginBottom: '5px'}}/>}
                            <br/><strong>{d.id}</strong><br/>
                            Depth: {d.depth_cm}cm | Cost: ₹{d.cost_inr}<br/>
                            {isOptimized ? "✅ Scheduled" : "❌ No Budget"}
                         </div>
                       </Popup>
                     </CircleMarker>
                   )
                 })}
               </MapContainer>
             </div>
          )}

          {!loading && view === 'table' && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Defect ID</th>
                    <th>Risk Level</th>
                    <th>Depth (cm)</th>
                    <th>Est. Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData.detections || []).sort((a,b) => b.depth_cm - a.depth_cm).map(d => {
                    const isSelected = dashboardData.optimized_plan.some(plan => plan.id === d.id);
                    return (
                      <tr key={d.id} style={{opacity: isSelected ? 1 : 0.5}}>
                        <td>{d.image_data ? <img src={d.image_data} alt="defect" style={{height:'40px', borderRadius:'4px'}}/> : '-'}</td>
                        <td style={{fontWeight: '600'}}>{d.id}</td>
                        <td><span className={`badge ${d.risk_level === 'High' ? 'badge-high' : 'badge-medium'}`}>{d.risk_level}</span></td>
                        <td>{d.depth_cm} cm</td>
                        <td>₹{(d.cost_inr || 0).toLocaleString()}</td>
                        <td>{isSelected ? "✅ Scheduled" : "Pending"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && view === 'settings' && (
             <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflowY: 'auto', height: '100%' }}>
               
               {/* Financial Settings Card */}
               <div className="card-modern" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
                 <h3 style={{marginBottom: '0.5rem'}}>Financial & Material Constants</h3>
                 <p style={{color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>Adjust global repair costs. AI will recalculate budget impact instantly.</p>
                 
                 <form onSubmit={saveSettings} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                    <div>
                      <label className="res-label" style={{fontWeight: '600', fontSize: '0.85rem'}}>Material Cost (₹/kg)</label>
                      <input type="number" className="form-input" value={settings.material_cost_kg} onChange={e => setSettings({...settings, material_cost_kg: e.target.value})} />
                    </div>
                    <div>
                      <label className="res-label" style={{fontWeight: '600', fontSize: '0.85rem'}}>Labor Cost (₹/sqm)</label>
                      <input type="number" className="form-input" value={settings.labor_cost_sqm} onChange={e => setSettings({...settings, labor_cost_sqm: e.target.value})} />
                    </div>
                    <div>
                      <label className="res-label" style={{fontWeight: '600', fontSize: '0.85rem'}}>Vehicle Overhead (₹)</label>
                      <input type="number" className="form-input" value={settings.vehicle_overhead} onChange={e => setSettings({...settings, vehicle_overhead: e.target.value})} />
                    </div>
                    <div>
                      <label className="res-label" style={{fontWeight: '600', fontSize: '0.85rem'}}>Admin Overhead (%)</label>
                      <input type="number" step="0.01" className="form-input" value={settings.admin_overhead_pct} onChange={e => setSettings({...settings, admin_overhead_pct: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-modern btn-primary" style={{marginTop: '0.5rem'}}>Update Constants</button>
                 </form>
               </div>

               {/* Danger Zone Card */}
               <div className="card-modern" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', marginTop: '1.5rem', border: '1px solid var(--danger-bg)' }}>
                 <h4 style={{color: 'var(--danger)', marginBottom: '0.5rem'}}>Danger Zone</h4>
                 <p style={{color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem'}}>This action will permanently delete all defect records from the database. This cannot be undone.</p>
                 <button onClick={clearDatabase} className="btn-modern" style={{background: 'var(--danger-bg)', color: 'var(--danger)', width: '100%'}}>
                   ⚠️ Clear All Database Records
                 </button>
               </div>

             </div>
          )}
