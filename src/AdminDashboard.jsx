import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './App.css'; 

const API_BASE_URL = "https://maniiiikk-roadgovai.hf.space/api/v1";

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const AdminDashboard = () => {
  const [infraData, setInfraData] = useState({ detections: [], optimized_plan: [], summary: { total_cost: 0, total_detected: 0 } });
  const [loading, setLoading] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(1500000);
  const [viewMode, setViewMode] = useState('map');
  const [expandedImage, setExpandedImage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budgetLimit || 0}`);
      if (res.ok) {
        const data = await res.json();
        setInfraData(data);
      }
    } catch (err) { console.error("Gov-RoadAI API Error:", err); }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [budgetLimit]);

  const handleInfraAnalysis = async (e) => {
    if (!e.target.files[0]) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      await fetch(`${API_BASE_URL}/analyze-infrastructure?budget=${budgetLimit || 0}`, { method: 'POST', body: formData });
      fetchDashboardData(); 
    } catch (err) { alert("Analysis failed."); } finally { setLoading(false); e.target.value = null; }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("Wipe entire database?")) return;
    setLoading(true);
    try { await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" }); fetchDashboardData(); }
    finally { setLoading(false); }
  };

  const highRiskCount = useMemo(() => infraData.detections.filter(d => d.risk_level === 'High').length, [infraData.detections]);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand"><div className="logo-icon">🛣️</div><h2>Gov-RoadAI</h2></div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">🏠 Home</Link>
          <div className="nav-item active">📊 Analytics</div>
        </nav>
        <div className="sidebar-footer"><button className="btn-clear" onClick={handleClearDatabase}>🗑️ Reset DB</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title"><h1>Infrastructure Dashboard</h1><p>Smart City Asset Management</p></div>
          <div className="header-actions">
            <div className="budget-input-group"><label>Budget</label><input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} /></div>
            <label className="btn-primary">{loading ? "⌛ Processing..." : "📁 Upload Video"}<input type="file" accept="video/*" onChange={handleInfraAnalysis} hidden /></label>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card"><span className="stat-label">Total Defects</span><span className="stat-value">{infraData.summary?.total_detected || 0}</span></div>
          <div className="stat-card urgent"><span className="stat-label">Critical Risks</span><span className="stat-value">{highRiskCount}</span></div>
          <div className="stat-card success"><span className="stat-label">Budget Spend</span><span className="stat-value">₹{infraData.summary?.total_cost.toLocaleString() || 0}</span></div>
        </section>

        <div className="content-container">
          <div className="content-panel">
            <div className="panel-top"><div className="tabs">
              <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>Interactive Map</button>
              <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Detailed Logs</button>
            </div></div>
            <div className="panel-view">
              {viewMode === 'map' ? (
                <MapContainer center={[13.0827, 80.2707]} zoom={12} className="leaflet-map">
                  <MapResizer /><TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  {infraData.detections.map((p) => (
                    <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={10} pathOptions={{ color: p.risk_level === 'High' ? '#ef4444' : '#f59e0b', fillOpacity: 0.7 }}>
                      <Popup><div className="map-popup">
                        {p.image_data && <img src={p.image_data} alt="scan" onClick={() => setExpandedImage(p.image_data)} style={{width: '100%', borderRadius: '8px', cursor: 'pointer'}}/>}
                        <p><strong>Cost:</strong> ₹{p.cost_inr}</p>
                      </div></Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              ) : (
                <div className="table-responsive"><table className="modern-table">
                  <thead><tr><th>Visual</th><th>ID</th><th>Source</th><th>Severity</th><th>Cost</th></tr></thead>
                  <tbody>{infraData.detections.map(p => (
                    <tr key={p.id}>
                      <td>{p.image_data ? <img src={p.image_data} className="table-thumb" onClick={() => setExpandedImage(p.image_data)} /> : "🎥"}</td>
                      <td>{p.id}</td><td>{p.source}</td><td>{p.risk_level}</td><td>₹{p.cost_inr}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
            </div>
          </div>
        </div>
      </main>

      {expandedImage && (
        <div className="image-lightbox" onClick={() => setExpandedImage(null)}>
          <div className="lightbox-wrap" onClick={(e) => e.stopPropagation()}>
            <img src={expandedImage} alt="Analysis Result" />
            <button className="close-lightbox" onClick={() => setExpandedImage(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
