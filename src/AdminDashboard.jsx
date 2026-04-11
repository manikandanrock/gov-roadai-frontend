import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import {
  Activity, Map as MapIcon, BarChart3, Settings, AlertTriangle,
  ShieldAlert, CheckCircle2, RefreshCw, Trash2, Database, ArrowLeft,
  Wifi, WifiOff, Clock, Sun, Moon
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./App.css";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════ */
const API_BASE = "https://maniiiikk-roadgovai.hf.space/api/v1";
const POLL_MS = 15000;

/* ═══════════════════════════════════════════════════════════════
   MAP HELPER
═══════════════════════════════════════════════════════════════ */
function MapFix({ center }) {
  const map = useMap();
  const hasCentered = useRef(false);
  
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (center && !hasCentered.current) {
        map.flyTo(center, 13, { duration: 1.2 });
        hasCentered.current = true;
      }
    }, 300);
    return () => clearTimeout(t);
  }, [map, center]);
  
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function Toast({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM MODAL
═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-icon">
          <AlertTriangle size={24} color="var(--danger)" />
        </div>
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-full" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-full" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════════ */
function SkeletonStats() {
  return (
    <div className="skeleton-stats">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-stat-cell">
          <div className="skeleton" style={{ width: "60%", height: 12, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: "40%", height: 28 }} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [view, setView] = useState("map");
  const [dashData, setDashData] = useState({
    summary: { total_detected: 0, optimized_repairs: 0, total_cost: 0 },
    detections: [],
    optimized_plan: [],
  });
  const [settings, setSettings] = useState({
    material_cost_kg: 45,
    labor_cost_sqm: 1200,
    vehicle_overhead: 2500,
    admin_overhead_pct: 0.10,
  });
  const [budget, setBudget] = useState(1500000);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [viewImage, setViewImage] = useState(null); // Lightbox state
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gov_admin_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('gov_admin_theme', theme);
  }, [theme]);

  const budgetRef = useRef(budget);
  const intervalRef = useRef(null);
  useEffect(() => { budgetRef.current = budget; }, [budget]);

  const showToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError(null);
    try {
      const [dashRes, setRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard-data?budget=${budgetRef.current}`),
        fetch(`${API_BASE}/get-cost-settings`),
      ]);
      if (!dashRes.ok) throw new Error(`Dashboard: HTTP ${dashRes.status}`);
      if (!setRes.ok) throw new Error(`Settings: HTTP ${setRes.status}`);
      const [dashJson, setJson] = await Promise.all([dashRes.json(), setRes.json()]);
      setDashData({
        summary: dashJson.summary ?? { total_detected: 0, optimized_repairs: 0, total_cost: 0 },
        detections: dashJson.detections ?? [],
        optimized_plan: dashJson.optimized_plan ?? [],
      });
      setSettings({
        material_cost_kg: Number(setJson.material_cost_kg ?? 45),
        labor_cost_sqm: Number(setJson.labor_cost_sqm ?? 1200),
        vehicle_overhead: Number(setJson.vehicle_overhead ?? 2500),
        admin_overhead_pct: Number(setJson.admin_overhead_pct ?? 0.10),
      });
      setLastSync(new Date());
    } catch (err) {
      setFetchError(err.message);
      if (!silent) showToast(`Data fetch failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); return () => clearInterval(intervalRef.current); }, [fetchData]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isLive) intervalRef.current = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [isLive, fetchData]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(true), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const fd = new FormData();
      fd.append("material", Math.round(Number(settings.material_cost_kg)));
      fd.append("labor", Math.round(Number(settings.labor_cost_sqm)));
      fd.append("vehicle", Math.round(Number(settings.vehicle_overhead)));
      fd.append("admin", Number(settings.admin_overhead_pct));
      const res = await fetch(`${API_BASE}/update-cost-settings`, { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `HTTP ${res.status}`); }
      showToast("Settings saved — AI engine updated ✓", "success");
      await fetchData(true);
    } catch (err) { showToast(`Failed to save settings: ${err.message}`, "error"); }
    finally { setSavingSettings(false); }
  };

  const runCleanup = async () => {
    setCleaningUp(true);
    try {
      const res = await fetch(`${API_BASE}/cleanup-duplicates`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      showToast(`Cleanup complete — ${data.duplicates_removed ?? 0} duplicates removed, ${data.remaining_defects ?? 0} remain.`, "success");
      await fetchData(true);
    } catch (err) { showToast(`Cleanup failed: ${err.message}`, "error"); }
    finally { setCleaningUp(false); }
  };

  const clearDatabase = () => {
    askConfirm(
      "CRITICAL: This permanently deletes ALL defect records from the database. This action cannot be undone.",
      async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API_BASE}/clear-database`, { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          showToast("Database cleared successfully", "success");
          await fetchData(true);
        } catch (err) { showToast(`Database clear failed: ${err.message}`, "error"); }
      }
    );
  };

  const detections = dashData.detections || [];
  const optimizedPlan = dashData.optimized_plan || [];
  const optimizedIds = useMemo(() => new Set(optimizedPlan.map(p => p.id)), [optimizedPlan]);

  const mapCenter = useMemo(() => {
    if (!detections.length) return [13.0827, 80.2707];
    const lats = detections.map(d => d.lat).filter(Boolean);
    const lngs = detections.map(d => d.lng).filter(Boolean);
    if (!lats.length) return [13.0827, 80.2707];
    return [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
    ];
  }, [detections]);

  const severityData = useMemo(() => {
    const high = detections.filter(d => d.risk_level === "High").length;
    const med = detections.filter(d => d.risk_level === "Medium").length;
    return [
      { name: "Critical", value: high, color: "#ef4444" },
      { name: "Warning", value: med, color: "#f59e0b" },
    ].filter(s => s.value > 0);
  }, [detections]);

  const topCostData = useMemo(() =>
    [...detections].sort((a, b) => (b.cost_inr ?? 0) - (a.cost_inr ?? 0)).slice(0, 5),
    [detections]
  );

  const navItems = [
    { id: "map", icon: <MapIcon size={16} />, label: "Intelligence Map" },
    { id: "analytics", icon: <BarChart3 size={16} />, label: "Data Analytics" },
    { id: "table", icon: <Activity size={16} />, label: "Defect Registry" },
    { id: "settings", icon: <Settings size={16} />, label: "Engine Config" },
  ];

  const totalBacklog = detections.reduce((s, d) => s + (d.cost_inr ?? 0), 0);

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="admin-shell" data-theme={theme}>
      <Toast toasts={toasts} />
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ════ LIGHTBOX ════ */}
      {viewImage && (
        <div className="lightbox-overlay fade-in" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="Expanded evidence overlay" className="lightbox-img" />
        </div>
      )}

      {/* ════ SIDEBAR ════ */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-wordmark">Road<span>AI</span></div>
          <div className="sidebar-sub">Command Center · v3.0</div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard sections">
          {navItems.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <span className="nav-item-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setIsLive(v => !v)}
            className={`live-indicator ${isLive ? "active" : ""}`}
            aria-pressed={isLive}
          >
            {isLive
              ? <><span className="status-dot dot-green" /><Wifi size={13} /> Live Sync Active</>
              : <><span className="status-dot dot-gray" /><WifiOff size={13} /> Sync Paused</>
            }
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <main className="admin-main">

        {/* Top bar */}
        <div className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ gap: "0.35rem" }}>
              <ArrowLeft size={14} /> Portal
            </Link>
            <span className="topbar-title">
              {navItems.find(n => n.id === view)?.label ?? "Dashboard"}
            </span>
          </div>

          <div className="topbar-right">
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="btn btn-ghost btn-sm"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="budget-widget">
              <span className="budget-label">Budget ₹</span>
              <input
                type="number"
                value={budget}
                min={0}
                step={100000}
                onChange={e => setBudget(Number(e.target.value))}
                className="budget-input"
                aria-label="Global repair budget"
              />
            </div>

            {lastSync && (
              <div className="sync-badge">
                <Clock size={11} />
                {lastSync.toLocaleTimeString()}
              </div>
            )}

            <button
              onClick={() => fetchData()}
              className="btn btn-ghost btn-sm"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stats HUD */}
        {loading ? <SkeletonStats /> : (
          <div className="stats-row">
            <div className="stat-cell">
              <div className="stat-label">
                <AlertTriangle size={12} color="var(--danger)" />
                Hazards Detected
              </div>
              <div className="stat-value red">{dashData.summary.total_detected ?? 0}</div>
              <div className="stat-sub">total records</div>
            </div>

            <div className="stat-cell">
              <div className="stat-label">
                <CheckCircle2 size={12} color="var(--success)" />
                Budget Covered
              </div>
              <div className="stat-value green">{dashData.summary.optimized_repairs ?? 0}</div>
              <div className="stat-sub">repairs funded</div>
            </div>

            <div className="stat-cell">
              <div className="stat-label">
                <ShieldAlert size={12} color="var(--amber)" />
                Funded Repair Cost
              </div>
              <div className="stat-value amber">
                ₹{((dashData.summary.total_cost ?? 0) / 1000).toFixed(0)}k
              </div>
              <div className="stat-sub">of ₹{(budget / 1000).toFixed(0)}k budget</div>
            </div>

            <div className="stat-cell">
              <div className="stat-label">
                <Database size={12} color="var(--text-faint)" />
                Est. Backlog Cost
              </div>
              <div className="stat-value">
                ₹{(totalBacklog / 1000).toFixed(0)}k
              </div>
              <div className="stat-sub">total repair estimate</div>
            </div>
          </div>
        )}

        {/* Content panel */}
        <div className="admin-content">

          {/* Error */}
          {!loading && fetchError && (
            <div className="fetch-error fade-in">
              <AlertTriangle size={32} color="var(--danger)" />
              <h3>Could not load data</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{fetchError}</p>
              <button className="btn btn-amber" onClick={() => fetchData()}>
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          )}

          {/* ── MAP ── */}
          {view === "map" && (
            <div className="map-shell fade-in">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url={`https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
                />
                <MapFix center={detections.length > 0 ? mapCenter : null} />
                {detections.map(d => {
                  const funded = optimizedIds.has(d.id);
                  return (
                    <CircleMarker
                      key={d.id}
                      center={[d.lat, d.lng]}
                      radius={funded ? 10 : 7}
                      pathOptions={{
                        color: funded ? "#22c55e" : "#ef4444",
                        fillColor: funded ? "#22c55e" : "#ef4444",
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="map-popup-inner">
                          {d.image_data && (
                            <img 
                              src={d.image_data} 
                              alt="Defect evidence" 
                              className="map-popup-img lightbox-trigger"
                              onClick={() => setViewImage(d.image_data)}
                              style={{ cursor: 'pointer' }}
                            />
                          )}
                          <div className="map-popup-body">
                            <div className="map-popup-id mono">{d.id}</div>
                            <span className={`badge ${funded ? "badge-low" : "badge-high"}`}>
                              {funded ? "Funded" : "Unfunded"}
                            </span>
                            <div className="map-popup-depth">
                              Depth: {d.depth_cm ?? "—"} cm &nbsp;·&nbsp;
                              ₹{(d.cost_inr ?? 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {!loading && !fetchError && view === "analytics" && (
            <div className="analytics-grid fade-in">
              {detections.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                  <div className="empty-state-icon"><BarChart3 size={24} /></div>
                  <p>No data yet — submit field reports to see analytics.</p>
                </div>
              ) : (
                <>
                  <div className="chart-card">
                    <div className="chart-title">Severity Distribution</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={severityData}
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {severityData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-primary)",
                            fontSize: "0.83rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-card">
                    <div className="chart-title">Top 5 Most Expensive Repairs</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topCostData} barSize={28}>
                        <XAxis
                          dataKey="id"
                          tick={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "DM Mono" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "DM Mono" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip
                          formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Cost"]}
                          contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-soft)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--text-primary)",
                            fontSize: "0.83rem",
                          }}
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        />
                        <Bar
                          dataKey="cost_inr"
                          fill="var(--amber)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TABLE ── */}
          {!loading && !fetchError && view === "table" && (
            <div className="table-shell fade-in">
              {detections.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Activity size={24} /></div>
                  <p>No defect records — submit a field report to get started.</p>
                </div>
              ) : (
                <table className="data-table" role="grid">
                  <thead>
                    <tr>
                      <th>Evidence</th>
                      <th>Defect ID</th>
                      <th>Severity</th>
                      <th>Depth</th>
                      <th>Est. Cost</th>
                      <th>Source</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...detections]
                      .sort((a, b) => (b.depth_cm ?? 0) - (a.depth_cm ?? 0))
                      .map(d => {
                        const funded = optimizedIds.has(d.id);
                        return (
                          <tr key={d.id}>
                            <td>
                              {d.image_data
                                ? <img 
                                    src={d.image_data} 
                                    alt="defect" 
                                    className="table-thumb lightbox-trigger" 
                                    onClick={() => setViewImage(d.image_data)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                : <span className="text-muted">—</span>}
                            </td>
                            <td className="cell-id">{d.id}</td>
                            <td>
                              <span className={`badge ${d.risk_level === "High" ? "badge-high" : "badge-medium"}`}>
                                {d.risk_level ?? "—"}
                              </span>
                            </td>
                            <td className="mono" style={{ fontSize: "0.82rem" }}>
                              {d.depth_cm != null ? `${d.depth_cm} cm` : "—"}
                            </td>
                            <td className="cell-cost">
                              ₹{(d.cost_inr ?? 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ textTransform: "capitalize", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {d.source ?? "—"}
                            </td>
                            <td>
                              {funded
                                ? <span className="scheduled-tag"><CheckCircle2 size={13} /> Scheduled</span>
                                : <span className="pending-tag">Pending</span>}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {!loading && !fetchError && view === "settings" && (
            <div className="settings-shell fade-in">

              {/* Financial constants */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <Settings size={18} color="var(--amber)" />
                  <h3>Financial Constants</h3>
                </div>
                <p className="settings-card-desc">
                  AI engine recalculates budget prioritisation instantly on save.
                </p>
                <form className="settings-form" onSubmit={saveSettings}>
                  {[
                    ["material_cost_kg", "Material Cost (₹/kg)", "number", "1"],
                    ["labor_cost_sqm", "Labor Cost (₹/sq m)", "number", "1"],
                    ["vehicle_overhead", "Vehicle Overhead (₹)", "number", "100"],
                    ["admin_overhead_pct", "Admin Overhead (decimal)", "number", "0.01"],
                  ].map(([key, label, type, step]) => (
                    <div key={key}>
                      <label className="field-label">{label}</label>
                      <input
                        type={type}
                        step={step}
                        min={0}
                        className="field-input"
                        value={settings[key]}
                        onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                  <button type="submit" className="btn btn-amber" disabled={savingSettings}>
                    {savingSettings
                      ? <><span className="spinner" /> Saving…</>
                      : <><RefreshCw size={14} /> Sync Engine Variables</>}
                  </button>
                </form>
              </div>

              {/* Spatial deduplication */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <Database size={18} color="var(--amber)" />
                  <h3>Spatial Deduplication</h3>
                </div>
                <p className="settings-card-desc">
                  Scans all records for duplicates within 5 metres and merges them,
                  keeping the deepest/worst reading.
                </p>
                <button
                  onClick={runCleanup}
                  disabled={cleaningUp}
                  className="btn btn-outline btn-full"
                >
                  {cleaningUp
                    ? <><span className="spinner" /> Deduplicating…</>
                    : <><Database size={14} /> Run Cleanup</>}
                </button>
              </div>

              {/* Danger zone */}
              <div className="settings-card settings-card-danger">
                <div className="settings-card-header">
                  <AlertTriangle size={18} color="var(--danger)" />
                  <h3 style={{ color: "var(--danger)" }}>Danger Zone</h3>
                </div>
                <p className="settings-card-desc">
                  Permanently wipes all defect records and spatial data. Irreversible.
                </p>
                <button
                  onClick={clearDatabase}
                  className="btn btn-danger btn-full"
                >
                  <Trash2 size={14} /> Execute Database Wipe
                </button>
              </div>

            </div>
          )}

        </div>{/* admin-content */}
      </main>
    </div>
  );
}
