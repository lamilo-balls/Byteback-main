/**
 * InvestigatorController.js
 *
 * Covers: INV - Dashboard, INV - Assigned Cases, INV - Investigation
 * Workspace, INV - Evidence Review, INV - Case Timeline, INV - Update Status.
 */

module.exports = {

  // GET /api/investigator/dashboard
  dashboard: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator']);
    if (!user) return;

    var myCases = await Complaint.find({ assignedTo: user.id }).populate('submittedBy');
    var counts = { assigned: myCases.length, investigating: 0, resolved: 0, closed: 0 };
    myCases.forEach(function (c) {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });

    var recent = myCases
      .slice()
      .sort(function (a, b) { return b.updatedAt - a.updatedAt; })
      .slice(0, 5);

    // Weekly closed-case chart: count StatusLog entries this investigator
    // wrote with status resolved/closed, bucketed by day over the last 7 days.
    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var closedLogs = await StatusLog.find({
      changedBy: user.id,
      status: ['resolved', 'closed'],
      createdAt: { '>=': weekAgo }
    });
    var dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var weeklyClosed = [0, 0, 0, 0, 0, 0, 0];
    closedLogs.forEach(function (log) {
      var dayIdx = new Date(log.createdAt).getDay();
      weeklyClosed[dayIdx]++;
    });

    // Oldest open cases first - used as a proxy "needs attention soonest" list
    // since there's no separate SLA/due-date field yet.
    var openCases = myCases.filter(function (c) { return c.status !== 'resolved' && c.status !== 'closed'; });
    var oldestOpen = openCases.slice().sort(function (a, b) { return a.createdAt - b.createdAt; }).slice(0, 3);

    return res.json({
      counts: counts,
      recentCases: recent,
      weeklyClosed: weeklyClosed,
      weekDayLabels: dayLabels,
      attentionNeeded: oldestOpen
    });
  },

  // GET /api/investigator/cases  (Assigned Cases screen)
  assignedCases: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator']);
    if (!user) return;

    var cases = await Complaint.find({ assignedTo: user.id }).populate('submittedBy').sort('createdAt DESC');
    return res.json({ cases: cases });
  },

  // GET /api/investigator/cases/:id  (Investigation Workspace screen)
  workspace: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator', 'supervisor', 'admin']);
    if (!user) return;

    var complaint = await Complaint.findOne({ id: req.params.id }).populate('submittedBy');
    if (!complaint) return res.notFound({ error: 'Case not found.' });

    var notes = await CaseNote.find({ complaint: complaint.id })
      .populate('investigator')
      .sort('createdAt DESC');

    return res.json({ complaint: complaint, notes: notes });
  },

  // POST /api/investigator/cases/:id/notes  (add a note in the Workspace)
  addNote: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator', 'supervisor', 'admin']);
    if (!user) return;

    var note = req.body.note;
    if (!note) return res.badRequest({ error: 'note is required.' });

    var complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.notFound({ error: 'Case not found.' });

    var created = await CaseNote.create({
      note: note,
      complaint: complaint.id,
      investigator: user.id
    }).fetch();

    return res.status(201).json({ note: created });
  },

  // GET /api/investigator/cases/:id/timeline  (Case Timeline screen)
  timeline: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator', 'supervisor', 'admin']);
    if (!user) return;

    var logs = await StatusLog.find({ complaint: req.params.id })
      .populate('changedBy')
      .sort('createdAt ASC');

    return res.json({ logs: logs });
  },

  // POST /api/investigator/cases/:id/status  (Update Status screen)
  updateStatus: async function (req, res) {
    var user = await RoleGuard.require(req, res, ['investigator', 'supervisor', 'admin']);
    if (!user) return;

    var status = req.body.status;
    var note = req.body.note;
    var validStatuses = ['submitted', 'under_review', 'investigating', 'resolved', 'closed'];
    if (!status || validStatuses.indexOf(status) === -1) {
      return res.badRequest({ error: 'status must be one of: ' + validStatuses.join(', ') });
    }

    var complaint = await Complaint.findOne({ id: req.params.id });
    if (!complaint) return res.notFound({ error: 'Case not found.' });

    await Complaint.updateOne({ id: complaint.id }).set({ status: status });

    await StatusLog.create({
      status: status,
      note: note,
      complaint: complaint.id,
      changedBy: user.id
    });

    // Let the person who filed the report know their status changed.
    if (complaint.submittedBy) {
      await Notification.create({
        message: 'Your complaint ' + complaint.referenceNumber + ' status changed to "' + status.replace('_', ' ') + '".',
        relatedComplaint: complaint.referenceNumber,
        user: complaint.submittedBy
      });
    }

    return res.json({ message: 'Status updated.' });
  }

};
