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

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard-data?budget=${budgetLimit || 0}`);
      if (res.ok) {
        const data = await res.json();
        setInfraData(data);
      }
    } catch (err) {
      console.error("Gov-RoadAI API Error:", err);
    }
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
    } catch (err) {
      alert("Error processing dashcam video. Check backend connection.");
    } finally {
      setLoading(false);
      e.target.value = null; 
    }
  };

  const exportToCSV = () => {
    if (infraData.optimized_plan.length === 0) return alert("No optimized plan to export.");
    const headers = ["ID,Source,Latitude,Longitude,Depth(cm),Asphalt Required(kg),Repair Cost(INR),Risk Level"];
    const rows = infraData.optimized_plan.map(p => 
      `${p.id},${p.source},${p.lat},${p.lng},${p.depth_cm},${p.kg_asphalt},${p.cost_inr},${p.risk_level}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Gov-RoadAI_Approved_Budget_Plan.csv";
    link.click();
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reports and dashcam data? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clear-database`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") fetchDashboardData();
    } catch (err) {
      alert("Error clearing the database.");
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = useMemo(() => infraData.detections.filter(d => d.risk_level === 'High').length, [infraData.detections]);

  return (
    <div className="dashboard-wrapper">
      <nav className="top-nav">
        <div className="nav-brand">
          <Link to="/" style={{textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{ fontSize: '1.2rem' }}>⬅️</span>
            <h1>Gov-RoadAI</h1>
          </Link>
          <span className="badge">Smart City Admin</span>
        </div>
       <div className="nav-actions">
          <div className="budget-control">
            <label>City Budget (₹):</label>
            <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} disabled={loading} min="0" />
          </div>
          <label className={`upload-btn ${loading ? 'disabled' : ''}`}>
            {loading ? "⚙️ Processing..." : "📁 Upload Dashcam Video"}
            <input type="file" accept="video/*" onChange={handleInfraAnalysis} disabled={loading} hidden />
          </label>
          <button className="export-btn" onClick={exportToCSV} disabled={infraData.optimized_plan.length === 0}>
            📥 Export Plan
          </button>
          <button className="clear-btn" onClick={handleClearDatabase} disabled={loading || infraData.detections.length === 0}>
            🗑️ Clear Data
          </button>
        </div>
      </nav>

      <header className="kpi-header">
        <div className="kpi-card">
          <span className="kpi-title">Total Defects Detected</span>
          <span className="kpi-value">{infraData.summary?.total_detected || 0}</span>
        </div>
        <div className="kpi-card danger">
          <span className="kpi-title">High Risk Segments</span>
          <span className="kpi-value">{highRiskCount}</span>
        </div>
        <div className="kpi-card success">
          <span className="kpi-title">Optimized Repair Spend</span>
          <span className="kpi-value">₹{infraData.summary?.total_cost.toLocaleString() || 0}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Repairs Funded</span>
          <span className="kpi-value">{infraData.summary?.optimized_repairs || 0}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="content-panel map-panel">
          <div className="panel-header">
            <h2>Infrastructure Overview</h2>
            <div className="view-toggles">
              <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>🗺️ Map</button>
              <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>📊 Data</button>
            </div>
          </div>

          <div className="panel-body">
            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <h3 style={{ color: '#0f172a' }}>Synchronizing...</h3>
              </div>
            )}

            {viewMode === 'map' ? (
              <div style={{ height: '100%', width: '100%', position: 'relative' }}>
                <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{height: "100%", width: "100%"}}>
                  <MapResizer />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {infraData.detections.map((p) => {
                    const isCitizen = p.source === 'citizen';
                    const isFunded = infraData.optimized_plan.some(op => op.id === p.id);
                    let color = isCitizen ? '#4f46e5' : (p.risk_level === 'High' ? '#ef4444' : '#f59e0b');

                    return (
                      <CircleMarker 
                        key={p.id} center={[p.lat, p.lng]} radius={isCitizen ? 10 : p.depth_cm * 1.5}
                        pathOptions={{ color: color, weight: isCitizen ? 3 : 2, fillOpacity: 0.6 }}
                      >
                        <Popup>
                          <div className="popup-content" style={{ minWidth: '220px' }}>
                            <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>
                              {isCitizen ? "📱 Citizen Report" : "🎥 Dashcam Scan"}
                            </strong>
                            
                            {/* AI RENDERED IMAGE IN POPUP */}
                            {p.image_data && (
                              <img 
                                src={p.image_data} 
                                alt="AI Detection" 
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }} 
                              />
                            )}

                            <p style={{ margin: '4px 0', color: '#475569' }}><strong>ID:</strong> {p.id}</p>
                            <p style={{ margin: '4px 0', color: '#475569' }}><strong>Depth:</strong> {p.depth_cm} cm</p>
                            <p style={{ margin: '4px 0', color: '#475569' }}><strong>Cost:</strong> ₹{p.cost_inr}</p>
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                              <span style={{ 
                                background: isFunded ? '#ecfdf5' : '#fef2f2', 
                                color: isFunded ? '#10b981' : '#ef4444', 
                                padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' 
                              }}>
                                {isFunded ? "✅ Funds Approved" : "⏳ Pending Budget"}
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>ID</th>
                      <th>Source</th>
                      <th>Risk Level</th>
                      <th>Depth (cm)</th>
                      <th>Cost (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infraData.detections.map(p => {
                      const isFunded = infraData.optimized_plan.some(op => op.id === p.id);
                      return (
                        <tr key={p.id}>
                          {/* AI RENDERED THUMBNAIL IN TABLE */}
                          <td>
                            {p.image_data ? (
                              <img 
                                src={p.image_data} 
                                alt="Defect" 
                                style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                              />
                            ) : (
                              <span style={{ fontSize: '1.5rem' }}>🎥</span>
                            )}
                          </td>
                          <td style={{ fontWeight: '700', color: '#4f46e5' }}>{p.id}</td>
                          <td>{p.source === 'citizen' ? '📱 Mobile' : '🎥 Dashcam'}</td>
                          <td><span className={p.risk_level === 'High' ? 'text-danger' : 'text-warning'}>{p.risk_level}</span></td>
                          <td>{p.depth_cm}</td>
                          <td>₹{p.cost_inr}</td>
                          <td>
                            <span style={{ 
                                color: isFunded ? '#10b981' : '#ef4444', 
                                fontWeight: '700' 
                            }}>
                              {isFunded ? "✅ Funded" : "⏳ Unfunded"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="content-panel sidebar-panel">
          <div className="panel-header"><h2>Critical Alerts</h2></div>
          <div className="alert-list">
            {infraData.detections.filter(p => p.risk_level === "High").map((p) => {
              const isFunded = infraData.optimized_plan.some(op => op.id === p.id);
              return (
                <div key={p.id} className={`alert-card ${isFunded ? 'funded' : 'unfunded'}`}>
                  <div className="alert-header">
                    <h4>{p.source === 'citizen' ? "📱 Crowdsourced" : "🎥 Dashcam"}</h4>
                    <span>{p.failure_prob}% Failure Risk</span>
                  </div>
                  <div className="alert-footer">
                    <span>Est. Cost: ₹{p.cost_inr}</span>
                    <span className="status">{isFunded ? "Approved" : "Needs Budget"}</span>
                  </div>
                </div>
              )
            })}
            {infraData.detections.length === 0 && !loading && (
              <p className="empty-state">No infrastructure data processed.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default AdminDashboard;
