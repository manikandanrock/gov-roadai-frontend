import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Import styles
import "./index.css";
import "./App.css";

export default function AdminDashboard() {
  const [view, setView] = useState("map"); // Toggles between 'map' and 'table'
  
  // Dummy data simulating backend response
  const [data] = useState({
    summary: { total_cost: 245000, total_detected: 14 },
    detections: [
      { id: "DEF-001", depth_cm: 12, cost_inr: 15000, risk_level: "High", source: "citizen_app", lat: 13.0827, lng: 80.2707 },
      { id: "DEF-002", depth_cm: 4, cost_inr: 4500, risk_level: "Medium", source: "dashcam", lat: 13.0850, lng: 80.2800 },
      { id: "DEF-003", depth_cm: 18, cost_inr: 32000, risk_level: "High", source: "citizen_app", lat: 13.0750, lng: 80.2600 },
    ]
  });

  return (
    <div className="admin-grid-layout">
      {/* Sidebar Mission Control */}
      <aside className="mission-control">
        <div className="brand-zone">
          <Link to="/" className="btn-modern btn-secondary" style={{marginBottom: '1rem', padding: '0.5rem 1rem'}}>← Home</Link>
          <h1>Road<span>AI</span> Control</h1>
        </div>

        <nav className="nav-vertical">
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>
            📍 Intelligence Map
          </button>
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
            📋 Data Archive
          </button>
        </nav>

        <div className="card-modern" style={{marginTop: 'auto', padding: '1rem', background: 'var(--bg-app)', border: 'none'}}>
          <p className="res-label">System Status</p>
          <p style={{color: 'var(--success)', fontWeight: 'bold'}}>🟢 All Systems Operational</p>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="dashboard-body">
        {/* HUD (Heads Up Display) */}
        <header className="stats-hud">
          <div className="hud-stat card-modern">
            <span className="label">Total Hazards</span>
            <span className="value">{data.summary.total_detected}</span>
          </div>
          <div className="hud-stat card-modern" style={{borderColor: 'var(--danger)'}}>
            <span className="label">Critical Risks</span>
            <span className="value">{data.detections.filter(d => d.risk_level === 'High').length}</span>
          </div>
          <div className="hud-stat card-modern">
            <span className="label">Est. Repair Budget</span>
            <span className="value">₹{data.summary.total_cost.toLocaleString()}</span>
          </div>
        </header>

        {/* Dynamic Data Viewer */}
        <section className="workspace-area card-modern">
          {view === 'map' ? (
             <div className="map-wrapper">
               <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: "100%", width: "100%" }}>
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                 {data.detections.map(d => (
                   <CircleMarker 
                    key={d.id} 
                    center={[d.lat, d.lng]} 
                    radius={8} 
                    pathOptions={{ 
                      color: d.risk_level === 'High' ? '#ef4444' : '#f59e0b', 
                      fillColor: d.risk_level === 'High' ? '#ef4444' : '#f59e0b', 
                      fillOpacity: 0.6 
                    }}
                   >
                     <Popup>
                       <strong>{d.id}</strong><br/>Risk: {d.risk_level}<br/>Cost: ₹{d.cost_inr}
                     </Popup>
                   </CircleMarker>
                 ))}
               </MapContainer>
             </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Defect ID</th>
                    <th>Risk Level</th>
                    <th>Depth (cm)</th>
                    <th>Est. Cost</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detections.map(d => (
                    <tr key={d.id}>
                      <td style={{fontWeight: '600'}}>{d.id}</td>
                      <td>
                        <span className={`badge ${d.risk_level === 'High' ? 'badge-high' : 'badge-medium'}`}>
                          {d.risk_level}
                        </span>
                      </td>
                      <td>{d.depth_cm} cm</td>
                      <td>₹{d.cost_inr.toLocaleString()}</td>
                      <td style={{textTransform: 'capitalize'}}>{d.source.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
