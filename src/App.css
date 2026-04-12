/* ═══════════════════════════════════════════════════════════════
   App.css — Enhanced Mobile-First GovRoadAI Interface
   With space utilization, vertical balance & visual enhancements
═══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════
   LANDING PAGE - ENHANCED MOBILE
══════════════════════════════ */

.landing-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-void);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Animated grid background - enhanced */
.landing-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(245, 158, 11, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 158, 11, 0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-drift 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes grid-drift {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(40px, 40px);
  }
}

/* Enhanced radial bloom */
.landing-root::after {
  content: '';
  position: fixed;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 120vw;
  height: 500px;
  background: radial-gradient(ellipse, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 70%);
  animation: bloom-pulse 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes bloom-pulse {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.05);
  }
}

/* Floating orbs for depth */
.floating-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.4;
}

.orb-1 {
  width: 200px;
  height: 200px;
  background: rgba(245, 158, 11, 0.15);
  top: 20%;
  left: -50px;
  animation: float-1 15s ease-in-out infinite;
}

.orb-2 {
  width: 150px;
  height: 150px;
  background: rgba(56, 189, 248, 0.1);
  bottom: 20%;
  right: -40px;
  animation: float-2 12s ease-in-out infinite;
}

.orb-3 {
  width: 180px;
  height: 180px;
  background: rgba(245, 158, 11, 0.08);
  top: 50%;
  right: 10%;
  animation: float-3 18s ease-in-out infinite;
}

@keyframes float-1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, -40px) scale(1.1);
  }
}

@keyframes float-2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-25px, 35px) scale(1.15);
  }
}

@keyframes float-3 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(20px, 30px) scale(0.95);
  }
}

.landing-body {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  padding: max(env(safe-area-inset-top), 1.25rem) max(env(safe-area-inset-right), 1rem) max(env(safe-area-inset-bottom), 1rem) max(env(safe-area-inset-left), 1rem);
  gap: 1.5rem;
}

/* ── Animation Classes ── */
.fade-in {
  animation: fade-in 0.6s ease-out both;
}

.fade-in-delay {
  animation: fade-in 0.6s ease-out 0.2s both;
}

.fade-in-delay-2 {
  animation: fade-in 0.6s ease-out 0.4s both;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Top Section: Branding ── */
.landing-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
}

/* Eyebrow chip - enhanced */
.landing-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: var(--amber-dim);
  border: 1px solid var(--amber-border);
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--amber);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}

.landing-eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 8px var(--amber);
  animation: pulse-amber 2s infinite;
}

@keyframes pulse-amber {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.85);
  }
}

/* Hero Section */
.landing-hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.landing-wordmark {
  font-family: var(--font-display);
  font-size: clamp(2rem, 11vw, 3.5rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
  text-shadow: 0 0 40px rgba(245, 158, 11, 0.15);
}

.landing-wordmark em {
  font-style: normal;
  color: var(--amber);
  position: relative;
}

.landing-wordmark em::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  opacity: 0.5;
  border-radius: 2px;
}

.landing-tagline {
  font-size: 0.9rem;
  color: var(--text-muted);
  max-width: 90%;
  line-height: 1.6;
  margin: 0;
  padding: 0 0.5rem;
}

/* ── Middle Section: Stats & Specs ── */
.landing-middle {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
}

/* Stats Preview */
.stats-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.stats-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  opacity: 0.7;
}

.stat-preview-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-preview-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: var(--amber-dim);
  border-radius: var(--radius-md);
  border: 1px solid var(--amber-border);
}

.stat-preview-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-preview-value {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--amber);
  line-height: 1;
}

.stat-preview-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-preview-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.stat-preview-divider {
  width: 1px;
  height: 32px;
  background: var(--border-subtle);
}

/* Tech Specs Strip */
.landing-specs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 400px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  white-space: nowrap;
}

.spec-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 6px var(--amber);
  animation: spec-pulse 3s infinite;
}

@keyframes spec-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.spec-divider {
  height: 14px;
  width: 1px;
  background: var(--border-subtle);
}

/* ── Bottom Section: Portals ── */
.landing-portals-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.landing-portals {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.portal-link {
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}

.portal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  min-height: 80px;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Glowing accent */
.portal-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-color, var(--amber)) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
}

.portal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent-color, var(--amber)), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.portal-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.portal-card:active .portal-glow {
  opacity: 0.08;
}

.portal-card::before {
  --accent-color: var(--amber);
}

.portal-card.portal-admin::before,
.portal-card.portal-admin .portal-glow {
  --accent-color: rgba(56, 189, 248, 1);
}

.portal-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  position: relative;
  z-index: 1;
}

.portal-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--amber-dim);
  border: 1px solid var(--amber-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.portal-icon {
  width: 24px;
  height: 24px;
  color: var(--amber);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.portal-card:active .portal-icon {
  transform: scale(1.1) rotate(5deg);
}

.portal-card.portal-admin .portal-icon-wrap {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.2);
}

.portal-card.portal-admin .portal-icon {
  color: rgba(56, 189, 248, 1);
}

.portal-text {
  flex: 1;
  min-width: 0;
}

.portal-label {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0 0 0.25rem 0;
}

.portal-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.portal-arrow {
  font-size: 1.25rem;
  color: var(--text-faint);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.portal-card:active .portal-arrow {
  transform: translateX(4px);
  color: var(--amber);
}

.portal-card.portal-admin:active .portal-arrow {
  color: rgba(56, 189, 248, 1);
}

/* Footer */
.landing-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-dim);
}

.dev-footer {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: center;
}

.dev-names {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dev-institute {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

/* ══════════════════════════════
   ADMIN DASHBOARD - MOBILE BASE
══════════════════════════════ */

.admin-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-void);
}

/* ── Mobile Bottom Navigation ── */
.admin-sidebar {
  background: var(--bg-dark);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  order: 2;
  flex-shrink: 0;
  padding-bottom: max(env(safe-area-inset-bottom), 0);
  -webkit-overflow-scrolling: touch;
}

.sidebar-brand {
  padding: 0.75rem 1rem;
  border-right: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.sidebar-wordmark {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.sidebar-wordmark span {
  color: var(--amber);
}

.sidebar-sub {
  display: none;
}

.sidebar-nav {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  padding: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: var(--font-body);
  white-space: nowrap;
  min-height: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-item.active {
  color: var(--amber);
  background: var(--amber-dim);
  border-color: var(--amber-border);
}

.nav-item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item.active .nav-item-icon {
  opacity: 1;
}

.sidebar-footer {
  display: none;
}

/* ── Main Content Area ── */
.admin-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  order: 1;
}

.admin-topbar {
  padding: 1rem;
  padding-top: max(env(safe-area-inset-top), 1rem);
  border-bottom: 1px solid var(--border-dim);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-dark);
  flex-shrink: 0;
}

.topbar-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  padding: 0.4rem 0.75rem;
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

/* ── Stats HUD ── */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border-dim);
  border-bottom: 1px solid var(--border-dim);
  flex-shrink: 0;
}

.stat-cell {
  background: var(--bg-dark);
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 80px;
}

.stat-label {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-value.amber {
  color: var(--amber);
}

.stat-value.green {
  color: var(--success);
}

.stat-value.red {
  color: var(--danger);
}

.stat-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* ── Content Area ── */
.admin-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  position: relative;
}

/* ── Map ── */
.map-shell {
  width: 100%;
  height: 100%;
}

/* ── Analytics ── */
.analytics-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.chart-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

/* ── Table View ── */
.table-shell {
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table thead tr {
  border-bottom: 1px solid var(--border-subtle);
}

.data-table th {
  padding: 0.75rem 0.5rem;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  white-space: nowrap;
  font-weight: 500;
  position: sticky;
  top: 0;
  background: var(--bg-void);
  z-index: 10;
}

.data-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-dim);
  vertical-align: middle;
}

.data-table tbody tr:active {
  background: var(--bg-panel);
}

.table-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.cell-id {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--amber);
  font-weight: 500;
}

.cell-cost {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.scheduled-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--success);
  font-family: var(--font-mono);
}

.pending-tag {
  font-size: 0.7rem;
  color: var(--text-faint);
  font-family: var(--font-mono);
}

/* ── Settings View ── */
.settings-shell {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  width: 100%;
}

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.settings-card-header h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.settings-card-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-card-danger {
  border-color: var(--danger-border);
}

/* ── Budget Widget ── */
.budget-widget {
  padding: 1rem;
  background: var(--bg-panel);
  border: 1px solid var(--border-dim);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: var(--radius-md);
}

.budget-label {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.budget-input {
  background: transparent;
  border: none;
  color: var(--amber);
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
}

.budget-input::placeholder {
  color: var(--text-faint);
}

/* ── Toast Stack ── */
.toast-stack {
  position: fixed;
  top: max(env(safe-area-inset-top), 1rem);
  right: 1rem;
  left: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast-item {
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border: 1px solid transparent;
  pointer-events: auto;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.toast-info {
  background: #0f2840;
  color: var(--info);
  border-color: rgba(56, 189, 248, 0.25);
}

.toast-success {
  background: #0a2e1a;
  color: var(--success);
  border-color: var(--success-border);
}

.toast-error {
  background: #2a0a0a;
  color: var(--danger);
  border-color: var(--danger-border);
}

/* ── Confirm Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: max(env(safe-area-inset-top), 1.5rem);
  padding-bottom: max(env(safe-area-inset-bottom), 1.5rem);
}

.modal-box {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.modal-msg {
  font-size: 0.9rem;
  color: var(--text-body);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* ── Empty / Error States ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 100%;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
  font-size: 1.5rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 280px;
  line-height: 1.5;
}

.fetch-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 100%;
  padding: 2rem 1rem;
  text-align: center;
}

.fetch-error h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--danger);
}

/* ── Skeleton Loading ── */
.skeleton-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border-dim);
  border-bottom: 1px solid var(--border-dim);
}

.skeleton-stat-cell {
  background: var(--bg-dark);
  padding: 1rem 0.75rem;
  height: 80px;
}

/* ── Map Popup ── */
.map-popup-inner {
  display: flex;
  flex-direction: column;
  font-family: var(--font-body);
  min-width: 200px;
}

.map-popup-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
}

.map-popup-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.map-popup-id {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--amber);
  font-weight: 500;
}

.map-popup-depth {
  font-size: 0.8rem;
  color: var(--text-body);
}

/* ══════════════════════════════
   LIGHTBOX COMPONENT
══════════════════════════════ */

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  cursor: zoom-out;
  -webkit-tap-highlight-color: transparent;
}

.lightbox-img {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.lightbox-trigger {
  cursor: zoom-in;
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.lightbox-trigger:active {
  opacity: 0.85;
}

/* ══════════════════════════════
   TABLET LANDSCAPE (min-width: 640px)
══════════════════════════════ */

@media (min-width: 640px) {
  .landing-body {
    padding: 1.75rem 1.5rem 1.25rem;
  }

  .landing-tagline {
    font-size: 1rem;
    max-width: 520px;
  }

  .landing-middle {
    gap: 1.25rem;
  }

  .portal-card {
    padding: 1.5rem;
    min-height: 88px;
  }

  .portal-card:hover::before {
    opacity: 1;
  }

  .portal-card:hover .portal-glow {
    opacity: 0.06;
  }

  .portal-card:hover {
    border-color: var(--border-soft);
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
  }

  .portal-card:active {
    transform: translateY(-1px) scale(0.99);
  }

  .stats-row {
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-cell {
    padding: 1.1rem 1.5rem;
  }

  .admin-topbar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .topbar-right {
    flex-wrap: nowrap;
  }

  .budget-widget {
    flex-direction: row;
    align-items: center;
  }

  .budget-input {
    width: 140px;
  }

  .modal-actions {
    flex-direction: row;
  }

  .toast-stack {
    right: 1.25rem;
    left: auto;
    max-width: 360px;
  }

  .toast-item {
    animation: toast-in-desktop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes toast-in-desktop {
    from {
      opacity: 0;
      transform: translateX(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
}

/* ══════════════════════════════
   TABLET PORTRAIT (min-width: 768px)
══════════════════════════════ */

@media (min-width: 768px) {
  .landing-header {
    gap: 1.25rem;
  }

  .landing-wordmark {
    font-size: clamp(2.5rem, 8vw, 3.75rem);
  }

  .landing-portals {
    flex-direction: row;
    gap: 1.25rem;
  }

  .landing-portals-wrapper {
    max-width: 700px;
    margin: 0 auto;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .table-shell {
    padding: 1.5rem;
  }

  .settings-shell {
    padding: 1.5rem;
    gap: 1.25rem;
  }

  .settings-card {
    max-width: 600px;
    padding: 1.5rem;
  }
}

/* ══════════════════════════════
   DESKTOP (min-width: 1024px)
══════════════════════════════ */

@media (min-width: 1024px) {
  .landing-body {
    max-width: 900px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    gap: 2rem;
  }

  .landing-root::before {
    background-size: 60px 60px;
  }

  .landing-header {
    padding-top: 1rem;
  }

  /* Desktop Admin Layout */
  .admin-shell {
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-rows: 1fr;
  }

  .admin-sidebar {
    flex-direction: column;
    border-top: none;
    border-right: 1px solid var(--border-subtle);
    order: 0;
    padding-bottom: 0;
  }

  .sidebar-brand {
    padding: 1.5rem 1.25rem 1.25rem;
    border-right: none;
    border-bottom: 1px solid var(--border-dim);
  }

  .sidebar-wordmark {
    font-size: 1.3rem;
  }

  .sidebar-sub {
    display: block;
    font-size: 0.7rem;
    margin-top: 0.3rem;
  }

  .sidebar-nav {
    flex-direction: column;
    padding: 1rem 0.75rem;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .sidebar-nav::-webkit-scrollbar {
    display: block;
    width: 6px;
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 3px;
  }

  .nav-item {
    padding: 0.7rem 0.9rem;
    font-size: 0.875rem;
  }

  .nav-item:hover {
    color: var(--text-primary);
    background: var(--bg-panel);
  }

  .nav-item:active {
    transform: none;
  }

  .nav-item-icon {
    width: 18px;
    height: 18px;
  }

  .sidebar-footer {
    display: block;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-dim);
  }

  .live-indicator {
    display: flex;
  }

  .admin-main {
    order: 0;
  }
}

/* ══════════════════════════════
   LARGE DESKTOP (min-width: 1280px)
══════════════════════════════ */

@media (min-width: 1280px) {
  .analytics-grid {
    gap: 2rem;
    padding: 2rem;
  }

  .chart-card {
    padding: 2rem;
  }
}

/* ══════════════════════════════
   ACCESSIBILITY & PERFORMANCE
══════════════════════════════ */

/* Focus states for keyboard navigation */
@media (hover: hover) {
  .portal-card:focus-visible,
  .nav-item:focus-visible,
  .table-thumb:focus-visible {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .floating-orb {
    display: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .portal-card {
    border-width: 2px;
  }

  .nav-item.active {
    border-width: 2px;
  }

  .landing-eyebrow {
    border-width: 2px;
  }
}
