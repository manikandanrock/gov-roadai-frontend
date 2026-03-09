import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './App.css'; 

// Fix for Leaflet grey tile rendering issue
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
      const res = await fetch(`http://localhost:8000/api/v1/dashboard-data?budget=${budgetLimit}`);
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
      await fetch(`http://localhost:8000/api/v1/analyze-infrastructure?budget=${budgetLimit}`, {
        method: 'POST', body: formData,
      });
      fetchDashboardData(); 
    } catch (err) {
      alert("Error processing dashcam video. Is the backend running?");
    } finally {
      setLoading(false);
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
    // Standard browser confirmation prompt to prevent accidental clicks
    if (!window.confirm("Are you sure you want to delete ALL reports and dashcam data? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/clear-database", {
        method: "DELETE",
      });
      
      const data = await response.json();
      if (data.status === "success") {
        fetchDashboardData(); // Instantly refresh the map and numbers back to zero
      }
    } catch (err) {
      alert("Error clearing the database. Make sure the backend is running.");
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
            <span>⬅️</span>
            <h1>🛣️ Gov-RoadAI</h1>
          </Link>
          <span className="badge">Smart City Admin</span>
        </div>
       <div className="nav-actions">
          <div className="budget-control">
            <label>City Budget (₹):</label>
            <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} disabled={loading} />
          </div>
          <label className="upload-btn">
            {loading ? "⚙️ Processing..." : "📁 Upload Dashcam Video"}
            <input type="file" accept="video/*" onChange={handleInfraAnalysis} disabled={loading} hidden />
          </label>
          <button className="export-btn" onClick={exportToCSV} disabled={infraData.optimized_plan.length === 0}>
            📥 Export Plan
          </button>
          
          {/* NEW: Clear Database Button */}
          <button 
            className="export-btn" 
            style={{ backgroundColor: '#ef4444' }} // Red color for danger actions
            onClick={handleClearDatabase} 
            disabled={loading || infraData.detections.length === 0}
          >
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
                <h3>Running AI Models</h3>
                <p>Analyzing depth and predicting maintenance costs...</p>
              </div>
            )}

            {viewMode === 'map' ? (
              <MapContainer center={[13.0827, 80.2707]} zoom={12} style={{height: "100%", width: "100%", borderRadius: "8px"}}>
                <MapResizer />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {infraData.detections.map((p) => {
                  const isCitizen = p.source === 'citizen';
                  const isFunded = infraData.optimized_plan.some(op => op.id === p.id);
                  let color = isCitizen ? '#8b5cf6' : (p.risk_level === 'High' ? '#ef4444' : '#f59e0b');

                  return (
                    <CircleMarker 
                      key={p.id} center={[p.lat, p.lng]} radius={isCitizen ? 10 : p.depth_cm * 1.5}
                      pathOptions={{ color: color, weight: isCitizen ? 3 : 2, fillOpacity: 0.6 }}
                    >
                      <Popup>
                        <div className="popup-content">
                          <strong>{isCitizen ? "📱 Citizen Report" : "🎥 AI Dashcam Scan"}</strong>
                          <hr/>
                          <p>ID: {p.id}</p>
                          <p>Depth: {p.depth_cm} cm | Cost: ₹{p.cost_inr}</p>
                          <p>Status: {isFunded ? "✅ Approved" : "⏳ Pending Funds"}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
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
                          <td>{p.id}</td>
                          <td>{p.source === 'citizen' ? '📱 Mobile' : '🎥 Dashcam'}</td>
                          <td><span className={p.risk_level === 'High' ? 'text-danger' : 'text-warning'}>{p.risk_level}</span></td>
                          <td>{p.depth_cm}</td>
                          <td>₹{p.cost_inr}</td>
                          <td>{isFunded ? "✅ Funded" : "⏳ Unfunded"}</td>
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