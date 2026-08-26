/**
 * SupervisorController.js
 *
 * Covers: SUP - Dashboard, SUP - Case Assignment,
 * SUP - Investigator Performance, SUP - Workload Distribution.
 */

module.exports = {

  // GET /api/supervisor/dashboard
  dashboard: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['supervisor', 'admin']);
    if (!user) return;

    var all = await Complaint.find();
    var unassigned = all.filter(function (c) { return !c.assignedTo; });
    var counts = { total: all.length, unassigned: unassigned.length, investigating: 0, resolved: 0 };
    var resolvedCount = 0;
    all.forEach(function (c) {
      if (c.status === 'investigating') counts.investigating++;
      if (c.status === 'resolved') counts.resolved++;
      if (c.status === 'resolved' || c.status === 'closed') resolvedCount++;
    });
    var resolutionRate = all.length ? Math.round((resolvedCount / all.length) * 100) : 0;

    // Filed-per-week for the last 8 weeks (real data from Complaint.createdAt)
    var weeklyTrend = [];
    for (var w = 7; w >= 0; w--) {
      var weekStart = Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
      var weekEnd = Date.now() - w * 7 * 24 * 60 * 60 * 1000;
      var filedCount = all.filter(function (c) { return c.createdAt >= weekStart && c.createdAt < weekEnd; }).length;
      weeklyTrend.push(filedCount);
    }

    // Overdue alerts: open cases older than 10 days
    var overdue = all
      .filter(function (c) { return (c.status === 'investigating' || c.status === 'under_review' || c.status === 'submitted') && (Date.now() - c.createdAt) > 10 * 24 * 60 * 60 * 1000; })
      .sort(function (a, b) { return a.createdAt - b.createdAt; })
      .slice(0, 5)
      .map(function (c) {
        return { referenceNumber: c.referenceNumber, daysOpen: Math.floor((Date.now() - c.createdAt) / (1000 * 60 * 60 * 24)) };
      });

    // Top performers this month, by resolved count
    var investigators = await User.find({ role: 'investigator' });
    var assignedCases = await Complaint.find({ assignedTo: { '!=': null } });
    var performers = investigators.map(function (inv) {
      var theirs = assignedCases.filter(function (c) { return c.assignedTo === inv.id; });
      var resolved = theirs.filter(function (c) { return c.status === 'resolved' || c.status === 'closed'; });
      return { fullName: inv.fullName, resolvedCount: resolved.length };
    }).sort(function (a, b) { return b.resolvedCount - a.resolvedCount; }).slice(0, 3);

    return res.json({
      counts: counts,
      resolutionRate: resolutionRate,
      weeklyTrend: weeklyTrend,
      recentUnassigned: unassigned.slice(0, 5),
      overdueAlerts: overdue,
      topPerformers: performers,
      activeInvestigatorCount: investigators.length
    });
  },

  // GET /api/supervisor/unassigned  (Case Assignment screen - left column)
  unassignedCases: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['supervisor', 'admin']);
    if (!user) return;

    var cases = await Complaint.find({ assignedTo: null }).sort('createdAt ASC');
    return res.json({ cases: cases });
  },

  // POST /api/supervisor/cases/:id/assign  (Case Assignment screen - assign action)
  assign: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['supervisor', 'admin']);
    if (!user) return;

    var investigatorId = req.body.investigatorId;
    if (!investigatorId) return res.badRequest({ error: 'investigatorId is required.' });

    var investigator = await User.findOne({ id: investigatorId, role: 'investigator' });
    if (!investigator) return res.badRequest({ error: 'That user is not a valid investigator.' });

    var complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.notFound({ error: 'Case not found.' });

    await Complaint.updateOne({ id: complaint.id }).set({ assignedTo: investigator.id, status: 'investigating' });

    await StatusLog.create({
      status: 'investigating',
      note: 'Assigned to ' + investigator.fullName + ' by ' + user.fullName,
      complaint: complaint.id,
      changedBy: user.id
    });

    return res.json({ message: 'Case assigned to ' + investigator.fullName + '.' });
  },

  // GET /api/supervisor/investigators  (Investigator Performance screen)
  investigatorPerformance: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['supervisor', 'admin']);
    if (!user) return;

    var investigators = await User.find({ role: 'investigator' });
    var allCases = await Complaint.find({ assignedTo: { '!=': null } });
    var allLogs = await StatusLog.find();

    var SLA_DAYS = 10; // resolution target used for the SLA Compliance column

    var performance = await Promise.all(investigators.map(async function (inv) {
      var theirCases = allCases.filter(function (c) { return c.assignedTo === inv.id; });
      var resolved = theirCases.filter(function (c) { return c.status === 'resolved' || c.status === 'closed'; });
      var active = theirCases.length - resolved.length;

      var overdueCount = theirCases.filter(function (c) {
        return (c.status !== 'resolved' && c.status !== 'closed') && (Date.now() - c.createdAt) > SLA_DAYS * 24 * 60 * 60 * 1000;
      }).length;

      // Avg response = average time from case creation to that investigator's first logged action.
      var responseTimes = [];
      theirCases.forEach(function (c) {
        var caseLogs = allLogs.filter(function (l) { return l.complaint === c.id && l.changedBy === inv.id; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
        if (caseLogs.length) responseTimes.push((caseLogs[0].createdAt - c.createdAt) / (1000 * 60 * 60 * 24));
      });
      var avgResponseDays = responseTimes.length ? (responseTimes.reduce(function (a, b) { return a + b; }, 0) / responseTimes.length) : null;

      // SLA compliance = % of resolved cases that were resolved within SLA_DAYS of filing.
      var withinSla = resolved.filter(function (c) {
        var caseLogs = allLogs.filter(function (l) { return l.complaint === c.id && (l.status === 'resolved' || l.status === 'closed'); }).sort(function (a, b) { return b.createdAt - a.createdAt; });
        var resolvedAt = caseLogs.length ? caseLogs[0].createdAt : c.updatedAt;
        return (resolvedAt - c.createdAt) <= SLA_DAYS * 24 * 60 * 60 * 1000;
      }).length;
      var slaCompliance = resolved.length ? Math.round((withinSla / resolved.length) * 100) : null;

      return {
        id: inv.id,
        fullName: inv.fullName,
        email: inv.email,
        assignedCount: theirCases.length,
        activeCases: active,
        resolvedCount: resolved.length,
        overdueCount: overdueCount,
        avgResponseDays: avgResponseDays,
        slaCompliance: slaCompliance,
        resolutionRate: theirCases.length ? Math.round((resolved.length / theirCases.length) * 100) : 0
      };
    }));

    return res.json({ investigators: performance });
  },

  // GET /api/supervisor/workload  (Workload Distribution screen)
  workload: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['supervisor', 'admin']);
    if (!user) return;

    var investigators = await User.find({ role: 'investigator' });
    var allCases = await Complaint.find({ assignedTo: { '!=': null } });

    var workload = investigators.map(function (inv) {
      var theirCases = allCases.filter(function (c) { return c.assignedTo === inv.id; });
      var byStatus = { investigating: 0, resolved: 0, closed: 0, submitted: 0, under_review: 0 };
      theirCases.forEach(function (c) { if (byStatus[c.status] !== undefined) byStatus[c.status]++; });
      return { id: inv.id, fullName: inv.fullName, total: theirCases.length, byStatus: byStatus };
    });

    return res.json({ workload: workload });
  }

};
