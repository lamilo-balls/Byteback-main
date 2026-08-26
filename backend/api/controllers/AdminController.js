/**
 * AdminController.js
 *
 * Covers: ADM - Dashboard, ADM - Complaint Management, ADM - User Management,
 * ADM - Reports Analytics, ADM - Audit Logs, ADM - Security Logs.
 * (ADM - Notification Center reuses the existing /api/notifications
 * endpoints - notifications work the same for every role.
 * ADM - Settings reuses the existing /api/profile and /api/change-password
 * endpoints - an admin's own account settings work the same as anyone else's.)
 */

var bcrypt = require('bcryptjs');

module.exports = {

  // GET /api/admin/dashboard
  dashboard: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var complaints = await Complaint.find();
    var users = await User.find();

    var byStatus = { submitted: 0, under_review: 0, investigating: 0, resolved: 0, closed: 0 };
    var byCategory = {};
    complaints.forEach(function (c) {
      if (byStatus[c.status] !== undefined) byStatus[c.status]++;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    var byRole = { public: 0, investigator: 0, supervisor: 0, admin: 0 };
    users.forEach(function (u) { if (byRole[u.role] !== undefined) byRole[u.role]++; });

    var resolvedTotal = byStatus.resolved + byStatus.closed;
    var resolutionRate = complaints.length ? Math.round((resolvedTotal / complaints.length) * 100) : 0;

    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var newComplaintsThisWeek = complaints.filter(function (c) { return c.createdAt >= weekAgo; }).length;
    var newUsersThisWeek = users.filter(function (u) { return u.createdAt >= weekAgo; }).length;
    var flaggedSecurityEvents = await AuditLog.count({ action: 'login_failed', createdAt: { '>=': weekAgo } });

    var recentEvents = await AuditLog.find().populate('actor').sort('createdAt DESC').limit(4);
    var actionLabels = {
      login_success: 'Successful login',
      login_failed: 'Failed login attempt',
      role_changed: 'User role changed',
      status_overridden: 'Complaint status overridden',
      user_created: 'New staff account created'
    };

    var monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var userGrowth = [];
    for (var m = 5; m >= 0; m--) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - m);
      var monthStart = d.getTime();
      var nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      var count = users.filter(function (u) { return u.createdAt >= monthStart && u.createdAt < nextMonth.getTime(); }).length;
      userGrowth.push({ label: monthLabels[d.getMonth()], count: count });
    }

    return res.json({
      totalComplaints: complaints.length,
      totalUsers: users.length,
      newComplaintsThisWeek: newComplaintsThisWeek,
      newUsersThisWeek: newUsersThisWeek,
      activeInvestigators: byRole.investigator,
      resolutionRate: resolutionRate,
      flaggedSecurityEvents: flaggedSecurityEvents,
      byStatus: byStatus,
      byCategory: byCategory,
      byRole: byRole,
      recentSecurityEvents: recentEvents.map(function (e) {
        return {
          title: actionLabels[e.action] || e.action,
          detail: e.details || '',
          actor: e.actor ? e.actor.fullName : 'System',
          severity: e.action === 'login_failed' ? 'high' : (e.action === 'role_changed' || e.action === 'user_created' ? 'medium' : 'low')
        };
      }),
      userGrowth: userGrowth
    });
  },

  // GET /api/admin/complaints?status=&category=  (Complaint Management screen)
  listComplaints: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin', 'supervisor']);
    if (!user) return;

    var criteria = {};
    if (req.query.status) criteria.status = req.query.status;
    if (req.query.category) criteria.category = req.query.category;

    var complaints = await Complaint.find(criteria).populate('submittedBy').populate('assignedTo').sort('createdAt DESC');
    return res.json({ complaints: complaints });
  },

  // PUT /api/admin/complaints/:id  (override status/priority)
  updateComplaint: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin', 'supervisor']);
    if (!user) return;

    var complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.notFound({ error: 'Complaint not found.' });

    var changes = {};
    if (req.body.status) changes.status = req.body.status;
    if (req.body.priority) changes.priority = req.body.priority;

    var updated = await Complaint.updateOne({ id: complaint.id }).set(changes);

    await AuditLog.create({
      action: 'status_overridden',
      details: user.role + ' ' + user.email + ' updated ' + complaint.referenceNumber + ': ' + JSON.stringify(changes),
      actor: user.id
    });

    return res.json({ message: 'Complaint updated.', complaint: updated });
  },

  // GET /api/admin/users  (User Management screen)
  listUsers: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var users = await User.find().sort('createdAt DESC');
    return res.json({ users: users });
  },

  // POST /api/admin/users  (create a staff account - investigator/supervisor/admin)
  createUser: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var fullName = req.body.fullName;
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.role;

    if (!fullName || !email || !password || !role) {
      return res.badRequest({ error: 'All account detail fields must be filled out.' });
    }
    if (['investigator', 'supervisor', 'admin', 'public'].indexOf(role) === -1) {
      return res.badRequest({ error: 'Invalid role.' });
    }

    var existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.badRequest({ error: 'An account with this email already exists.' });

    var hashed = await bcrypt.hash(password, 10);
    var created = await User.create({
      fullName: fullName,
      email: email.toLowerCase(),
      password: hashed,
      role: role,
      isVerified: true // staff accounts created by an admin don't need email verification
    }).fetch();

    await AuditLog.create({
      action: 'user_created',
      details: 'Admin ' + user.email + ' created ' + role + ' account for ' + created.email,
      actor: user.id
    });

    return res.status(201).json({ user: created });
  },

  // PUT /api/admin/users/:id/role  (change a user's role)
  changeUserRole: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var role = req.body.role;
    if (['public', 'investigator', 'supervisor', 'admin'].indexOf(role) === -1) {
      return res.badRequest({ error: 'Invalid role.' });
    }

    var target = await User.findOne({ id: req.params.id });
    if (!target) return res.notFound({ error: 'User not found.' });

    await User.updateOne({ id: target.id }).set({ role: role });

    await AuditLog.create({
      action: 'role_changed',
      details: 'Admin ' + user.email + ' changed ' + target.email + ' from ' + target.role + ' to ' + role,
      actor: user.id
    });

    return res.json({ message: 'Role updated.' });
  },

  // PUT /api/admin/users/:id/status  (suspend/reactivate a user account)
  changeUserStatus: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var isActive = !!req.body.isActive;
    var target = await User.findOne({ id: req.params.id });
    if (!target) return res.notFound({ error: 'User not found.' });

    await User.updateOne({ id: target.id }).set({ isActive: isActive });

    await AuditLog.create({
      action: 'role_changed',
      details: 'Admin ' + user.email + ' ' + (isActive ? 'reactivated' : 'suspended') + ' ' + target.email,
      actor: user.id
    });

    return res.json({ message: isActive ? 'User reactivated.' : 'User suspended.' });
  },

  // DELETE /api/admin/users/:id
  deleteUser: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var targetId = req.params.id;
    if (targetId == user.id) {
      return res.badRequest({ error: 'You cannot delete your own account.' });
    }

    var target = await User.findOne({ id: targetId });
    if (!target) return res.notFound({ error: 'User not found.' });

    if (target.role === 'admin') {
      return res.badRequest({ error: 'Deleting another administrator account is not permitted.' });
    }

    try {
      // Handle associated data before deleting the user
      await Complaint.update({ submittedBy: target.id }).set({ submittedBy: null });
      await Complaint.update({ assignedTo: target.id }).set({ assignedTo: null });
      await Notification.destroy({ user: target.id });
      await AuditLog.update({ actor: target.id }).set({ actor: null });

      var deletedUser = await User.destroyOne({ id: targetId });
      if (!deletedUser) { return res.serverError({ error: 'Could not delete user record.' }); }

      await AuditLog.create({
        action: 'user_deleted',
        details: 'Admin ' + user.email + ' deleted user ' + deletedUser.email + ' (ID: ' + deletedUser.id + ')',
        actor: user.id
      });
      return res.json({ message: 'User deleted successfully.' });
    } catch (err) {
      return res.serverError(err);
    }
  },

  // GET /api/admin/reports  (Reports Analytics screen)
  reports: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin', 'supervisor']);
    if (!user) return;

    var complaints = await Complaint.find();
    var allLogs = await StatusLog.find();

    var monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var last12Months = [];
    for (var m = 11; m >= 0; m--) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - m);
      var monthStart = d.getTime();
      var nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      var count = complaints.filter(function (c) { return c.createdAt >= monthStart && c.createdAt < nextMonth.getTime(); }).length;
      last12Months.push({ label: monthLabels[d.getMonth()], count: count });
    }

    var byCategory = {};
    complaints.forEach(function (c) { byCategory[c.category] = (byCategory[c.category] || 0) + 1; });

    var resolved = complaints.filter(function (c) { return c.status === 'resolved' || c.status === 'closed'; });

    // Real average resolution time per category, from filing to the first resolved/closed StatusLog.
    var avgResolutionByCategory = {};
    Object.keys(byCategory).forEach(function (cat) {
      var resolvedInCat = resolved.filter(function (c) { return c.category === cat; });
      var days = [];
      resolvedInCat.forEach(function (c) {
        var log = allLogs.filter(function (l) { return l.complaint === c.id && (l.status === 'resolved' || l.status === 'closed'); }).sort(function (a, b) { return a.createdAt - b.createdAt; })[0];
        var resolvedAt = log ? log.createdAt : c.updatedAt;
        days.push((resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24));
      });
      avgResolutionByCategory[cat] = days.length ? Math.round((days.reduce(function (a, b) { return a + b; }, 0) / days.length) * 10) / 10 : null;
    });

    return res.json({
      totalComplaints: complaints.length,
      resolvedCount: resolved.length,
      resolutionRate: complaints.length ? Math.round((resolved.length / complaints.length) * 100) : 0,
      last12Months: last12Months,
      byCategory: byCategory,
      avgResolutionByCategory: avgResolutionByCategory
    });
  },

  // GET /api/admin/audit-logs  (Audit Logs screen)
  auditLogs: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var logs = await AuditLog.find({ action: { 'nin': ['login_success', 'login_failed'] } })
      .populate('actor')
      .sort('createdAt DESC')
      .limit(200);

    return res.json({ logs: logs });
  },

  // GET /api/admin/security-logs  (Security Logs screen - login attempts)
  securityLogs: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var logs = await AuditLog.find({ action: ['login_success', 'login_failed'] })
      .populate('actor')
      .sort('createdAt DESC')
      .limit(200);

    var dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    var flaggedLast24h = logs.filter(function (l) { return l.action === 'login_failed' && l.createdAt >= dayAgo; }).length;
    var failedLast7d = logs.filter(function (l) { return l.action === 'login_failed' && l.createdAt >= weekAgo; }).length;
    var successLast7d = logs.filter(function (l) { return l.action === 'login_success' && l.createdAt >= weekAgo; }).length;
    var suspendedAccounts = await User.count({ isActive: false });

    return res.json({
      logs: logs,
      flaggedLast24h: flaggedLast24h,
      failedLast7d: failedLast7d,
      successLast7d: successLast7d,
      suspendedAccounts: suspendedAccounts
    });
  },

  // GET /api/admin/settings  (Settings screen - General tab)
  getSettings: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var settings = await SystemSettings.findOne({ id: 1 });
    if (!settings) {
      settings = await SystemSettings.create({ id: 1 }).fetch();
    }
    return res.json({ settings: settings });
  },

  // PUT /api/admin/settings
  updateSettings: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['admin']);
    if (!user) return;

    var allowed = ['platformName', 'supportEmail', 'supportHotline', 'requireMfa', 'autoLockAfterFailedAttempts', 'sessionTimeoutEnabled', 'allowSupervisorExport'];
    var changes = {};
    allowed.forEach(function (key) {
      if (req.body[key] !== undefined) changes[key] = req.body[key];
    });

    var existing = await SystemSettings.findOne({ id: 1 });
    var updated;
    if (existing) {
      updated = await SystemSettings.updateOne({ id: 1 }).set(changes);
    } else {
      changes.id = 1;
      updated = await SystemSettings.create(changes).fetch();
    }

    await AuditLog.create({
      action: 'settings_updated',
      details: 'Admin ' + user.email + ' updated platform settings: ' + JSON.stringify(changes),
      actor: user.id
    });

    return res.json({ message: 'Settings updated.', settings: updated });
  }

};
