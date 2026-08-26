// Point this at your backend. If you deploy the API somewhere else,
// change this one line.
const API_BASE_URL = 'http://localhost:1337';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include', // send/receive the session cookie cross-origin
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

function getSelectedCaseId() {
  const params = new URLSearchParams(window.location.search);
  const queryCaseId = params.get('id');
  if (queryCaseId) {
    sessionStorage.setItem('selectedInvestigatorCaseId', queryCaseId);
    return queryCaseId;
  }
  return sessionStorage.getItem('selectedInvestigatorCaseId') || '';
}

function setSelectedCaseId(caseId) {
  if (caseId) {
    sessionStorage.setItem('selectedInvestigatorCaseId', String(caseId));
  }
}

const api = {
  register: (payload) => request('/api/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/api/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/api/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyEmail: (code) => request('/api/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),
  resendVerification: () => request('/api/resend-verification', { method: 'POST' }),
  me: () => request('/api/me'),
  updateProfile: (payload) => request('/api/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/api/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  updateNotificationPrefs: (payload) => request('/api/notification-prefs', { method: 'PUT', body: JSON.stringify(payload) }),
  deactivateAccount: () => request('/api/deactivate-account', { method: 'POST' }),
  createComplaint: (payload) => request('/api/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  listComplaints: () => request('/api/complaints'),
  getComplaint: (id) => request(`/api/complaints/${id}`),
  trackComplaint: (referenceNumber) => request(`/api/complaints/track/${referenceNumber}`),
  listNotifications: () => request('/api/notifications'),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/api/notifications/read-all', { method: 'POST' }),

  // Investigator
  invDashboard: () => request('/api/investigator/dashboard'),
  invCases: () => request('/api/investigator/cases'),
  invWorkspace: (id) => request(`/api/investigator/cases/${id}`),
  invAddNote: (id, note) => request(`/api/investigator/cases/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
  invTimeline: (id) => request(`/api/investigator/cases/${id}/timeline`),
  invUpdateStatus: (id, status, note) => request(`/api/investigator/cases/${id}/status`, { method: 'POST', body: JSON.stringify({ status, note }) }),

  // Supervisor
  supDashboard: () => request('/api/supervisor/dashboard'),
  supUnassigned: () => request('/api/supervisor/unassigned'),
  supAssign: (id, investigatorId) => request(`/api/supervisor/cases/${id}/assign`, { method: 'POST', body: JSON.stringify({ investigatorId }) }),
  supInvestigators: () => request('/api/supervisor/investigators'),
  supWorkload: () => request('/api/supervisor/workload'),

  // Admin
  admDashboard: () => request('/api/admin/dashboard'),
  admComplaints: (params = '') => request(`/api/admin/complaints${params}`),
  admUpdateComplaint: (id, payload) => request(`/api/admin/complaints/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  admUsers: () => request('/api/admin/users'),
  admCreateUser: (payload) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  admChangeRole: (id, role) => request(`/api/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  admChangeStatus: (id, isActive) => request(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  admDeleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  admReports: () => request('/api/admin/reports'),
  admAuditLogs: () => request('/api/admin/audit-logs'),
  admSecurityLogs: () => request('/api/admin/security-logs'),
  admGetSettings: () => request('/api/admin/settings'),
  admUpdateSettings: (payload) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) })
};

const CATEGORIES = [
  { key: 'online_scam', label: 'Online Scam', desc: 'Fraudulent schemes, non-delivery of goods, or investment fraud via internet.' },
  { key: 'identity_theft', label: 'Identity Theft', desc: 'Unauthorized use of personal information for financial gain or other crimes.' },
  { key: 'cyberbullying', label: 'Cyberbullying', desc: 'Harassment, threats, or intimidation occurring on digital platforms.' },
  { key: 'phishing', label: 'Phishing', desc: 'Deceptive emails or sites designed to steal sensitive information.' },
  { key: 'hacking', label: 'Hacking', desc: 'Unauthorized access to devices, networks, or digital accounts.' },
  { key: 'impersonation', label: 'Impersonation', desc: 'Creating fake profiles or pretending to be someone else online.' }
];

function categoryLabel(key) {
  const found = CATEGORIES.find((c) => c.key === key);
  return found ? found.label : key;
}

const STATUS_LABEL_CLASS = {
  submitted: 'status-submitted',
  under_review: 'status-under_review',
  investigating: 'status-investigating',
  resolved: 'status-resolved',
  closed: 'status-closed'
};

function statusBadge(status) {
  return `<span class="status-badge ${STATUS_LABEL_CLASS[status] || ''}">${status.replace('_', ' ').toUpperCase()}</span>`;
}

const STAFF_NAV = {
  investigator: [
    ['investigator-dashboard.html', 'Dashboard'],
    ['investigator-cases.html', 'Assigned Cases']
  ],
  supervisor: [
    ['supervisor-dashboard.html', 'Dashboard'],
    ['supervisor-assignment.html', 'Case Assignment'],
    ['supervisor-performance.html', 'Performance'],
    ['supervisor-workload.html', 'Workload']
  ],
  admin: [
    ['admin-dashboard.html', 'Dashboard'],
    ['admin-complaints.html', 'Complaints'],
    ['admin-users.html', 'Users'],
    ['admin-reports.html', 'Reports'],
    ['admin-audit-logs.html', 'Audit Logs'],
    ['admin-security-logs.html', 'Security Logs']
  ]
};

// Renders the shared staff header into a <div id="staffHeader"></div> placeholder.
// Call this once at the top of each role page's script.
function renderStaffHeader(role, activeHref) {
  const el = document.getElementById('staffHeader');
  if (!el) return;
  const links = (STAFF_NAV[role] || []).map(([href, label]) =>
    `<a href="${href}" style="${href === activeHref ? 'color:var(--primary); font-weight:700;' : ''}">${label}</a>`
  ).join('');
  el.innerHTML = `
    <header class="site-header">
      <div class="container">
        <a href="${role === 'public' ? 'index.html' : `${role}-dashboard.html`}" class="brand"><span class="brand-icon">🛡</span> ByteBack <span style="font-size:11px; font-weight:600; color:var(--slate-mid); text-transform:uppercase; margin-left:4px;">${role}</span></a>
        <nav class="nav-links">${links}</nav>
        <div class="nav-actions">
          <a href="notifications.html">Notifications</a>
          <button id="staffLogoutBtn" class="link-btn">Log out</button>
        </div>
      </div>
    </header>
  `;
  document.getElementById('staffLogoutBtn').addEventListener('click', async () => {
    await api.logout();
    window.location.href = 'index.html';
  });
}

// Renders the public-user app header (logo, nav, notification bell, user menu)
// matching the Dashboard Figma design. Call into a <div id="appHeader"></div>.
async function renderAppHeader(activeNav) {
  const el = document.getElementById('appHeader');
  if (!el) return;
  let me;
  try {
    me = (await api.me()).user;
  } catch (e) {
    window.location.href = 'login.html';
    return null;
  }

  let unreadCount = 0;
  try {
    const { notifications } = await api.listNotifications();
    unreadCount = notifications.filter(n => !n.read).length;
  } catch (e) { /* non-fatal */ }

  const initials = me.fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  el.innerHTML = `
    <div class="app-header">
      <div class="app-header-inner">
        <a href="dashboard.html" class="app-header-brand"><span class="app-header-logo">B</span> ByteBack</a>
        <nav class="app-header-nav">
          <a href="dashboard.html" class="${activeNav === 'dashboard' ? 'active' : ''}">Dashboard</a>
          <a href="report-category.html" class="${activeNav === 'file' ? 'active' : ''}">File a Complaint</a>
          <a href="dashboard.html#complaints" class="${activeNav === 'complaints' ? 'active' : ''}">My Complaints</a>
        </nav>
        <div class="app-header-actions">
          <a href="notifications.html" class="app-icon-btn" style="position:relative;">🔔${unreadCount ? '<span class="app-header-dot"></span>' : ''}</a>
          <a href="settings.html" class="app-icon-btn">⚙</a>
          <a href="logout-confirm.html" class="app-icon-btn" title="Log out">↩</a>
          <a href="profile.html" class="app-user-menu">
            <span class="app-avatar">${initials}</span>
            <span class="app-user-info"><strong>${me.fullName.split(' ')[0]}</strong><small>Victim / Complainant</small></span>
          </a>
        </div>
      </div>
    </div>
  `;
  return me;
}

const STAFF_SIDEBAR_NAV = {
  investigator: [
    ['investigator-dashboard.html', 'Dashboard'],
    ['investigator-cases.html', 'Assigned Cases'],
    ['investigator-workspace.html', 'Investigation Workspace'],
    ['notifications.html', 'Notifications'],
    ['profile.html', 'Profile'],
    ['settings.html', 'Settings']
  ],
  supervisor: [
    ['supervisor-dashboard.html', 'Dashboard'],
    ['supervisor-assignment.html', 'Assign Cases'],
    ['supervisor-workload.html', 'Investigator Workload'],
    ['supervisor-performance.html', 'Investigator Performance'],
    ['admin-complaints.html', 'Complaint Management'],
    ['admin-reports.html', 'Reports'],
    ['notifications.html', 'Notifications'],
    ['profile.html', 'Profile'],
    ['settings.html', 'Settings']
  ],
  admin: [
    ['admin-dashboard.html', 'Dashboard'],
    ['admin-complaints.html', 'Complaint Management'],
    ['admin-users.html', 'User Management'],
    ['admin-reports.html', 'Reports & Analytics'],
    ['admin-audit-logs.html', 'Audit Logs'],
    ['admin-security-logs.html', 'Security Logs'],
    ['admin-notifications.html', 'Notification Center'],
    ['admin-settings.html', 'Settings'],
    ['profile.html', 'Profile']
  ]
};

const STAFF_ROLE_COLOR = {
  investigator: '#2563eb',
  supervisor: '#7c3aed',
  admin: '#b45309'
};

// Renders the sidebar + topbar shell used by Investigator/Supervisor/Admin
// pages. Call into <div id="staffShell"></div>. Returns the logged-in user
// (or null + redirects if not authorized). Page-specific content should
// live in a <div id="staffContent"></div> placeholder that this creates.
// `allowedRoles` guards the page; the sidebar itself always reflects the
// actual logged-in user's role (so a page usable by both Admin and
// Supervisor, e.g. Complaint Management, shows the right nav for each).
async function renderStaffShell({ role, allowedRoles, activeHref, title, subtitle }) {
  const me = await requireRole(allowedRoles || [role]);
  if (!me) return null;

  const viewerRole = me.role;
  const accent = STAFF_ROLE_COLOR[viewerRole] || '#2563eb';
  const el = document.getElementById('staffShell');
  const initials = me.fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const navItems = STAFF_SIDEBAR_NAV[viewerRole] || [];
  const notificationsHref = viewerRole === 'admin' ? 'admin-notifications.html' : 'notifications.html';

  let unreadCount = 0;
  try {
    const { notifications } = await api.listNotifications();
    unreadCount = notifications.filter(n => !n.read).length;
  } catch (e) { /* non-fatal */ }

  el.innerHTML = `
    <div class="staff-shell">
      <aside class="staff-sidebar">
        <div class="staff-sidebar-brand"><span class="logo" style="background:${accent};">B</span><span class="name">ByteBack</span></div>
        <div class="staff-role-badge" style="color:${accent};">${viewerRole.toUpperCase()}</div>
        <nav class="staff-nav">
          ${navItems.map(([href, label]) => `<a href="${href}" class="${href === activeHref ? 'active' : ''}" style="${href === activeHref ? '--accent:' + accent + ';' : ''}">${label}</a>`).join('')}
        </nav>
        <div class="staff-sidebar-user">
          <span class="av" style="background:${accent};">${initials}</span>
          <div>
            <div class="name">${me.fullName}</div>
            <a href="#" class="logout-link" id="staffSidebarLogout">Log Out</a>
          </div>
        </div>
      </aside>
      <div class="staff-main">
        <div class="staff-topbar">
          <div>
            <h1>${title}</h1>
            <p>${subtitle || ''}</p>
          </div>
          <a href="${notificationsHref}" class="staff-bell-btn">🔔${unreadCount ? '<span class="app-header-dot"></span>' : ''}</a>
        </div>
        <div class="staff-content" id="staffContent"></div>
      </div>
    </div>
  `;

  document.getElementById('staffSidebarLogout').addEventListener('click', async (e) => {
    e.preventDefault();
    await api.logout();
    window.location.href = 'index.html';
  });

  return me;
}

const FLOW_STEPS = ['Category', 'Details', 'Evidence', 'Review'];
function renderStepIndicator(activeStepIdx) {
  return `<div class="step-indicator">` + FLOW_STEPS.map((label, i) => {
    const circClass = i < activeStepIdx ? 'done' : (i === activeStepIdx ? 'active' : 'inactive');
    const labelClass = i <= activeStepIdx ? '' : 'inactive';
    const circContent = i < activeStepIdx ? '✓' : (i + 1);
    const line = i < FLOW_STEPS.length - 1 ? '<div class="step-line"></div>' : '';
    return `<div class="step-item"><span class="step-circ ${circClass}">${circContent}</span><span class="step-label ${labelClass}">${label}</span></div>${line}`;
  }).join('') + `</div>`;
}

// correct home page if their role doesn't match what this page requires.
async function requireRole(allowedRoles) {
  let me;
  try {
    me = (await api.me()).user;
  } catch (e) {
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles.indexOf(me.role) === -1) {
    const roleHome = {
      public: 'dashboard.html',
      investigator: 'investigator-dashboard.html',
      supervisor: 'supervisor-dashboard.html',
      admin: 'admin-dashboard.html'
    };
    window.location.href = roleHome[me.role] || 'dashboard.html';
    return null;
  }
  return me;
}
