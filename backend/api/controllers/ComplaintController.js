/**
 * ComplaintController.js
 *
 * Covers: Category Selection -> Details Form -> Evidence Upload -> Review
 * (submitted here as one call), plus listing/detail for the Dashboard and
 * "Complaint Full Details" screens.
 */

module.exports = {

  // POST /api/complaints
  create: async function (req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to file a complaint.' });
      }

      var category = req.body.category;
      var title = req.body.title;
      var description = req.body.description;
      var incidentDate = req.body.incidentDate;
      var platform = req.body.platform;
      var suspectInfo = req.body.suspectInfo;
      var estimatedLoss = req.body.estimatedLoss;
      var evidence = req.body.evidence; // array of file URLs/names from the upload step

      if (!category || !title || !description) {
        return res.badRequest({ error: 'category, title, and description are required.' });
      }

      // Manually generate a reference number. The model's lifecycle callback seems to be failing,
      // resulting in a null referenceNumber, which causes the subsequent Notification.create() to fail.
      const year = new Date().getFullYear();
      const random = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `CR-${year}-${random}`;

      var complaint = await Complaint.create({
        referenceNumber: referenceNumber,
        category: category,
        title: title,
        description: description,
        incidentDate: incidentDate,
        platform: platform,
        suspectInfo: suspectInfo,
        estimatedLoss: estimatedLoss,
        evidence: evidence || [],
        submittedBy: req.session.userId
      }).fetch();

      if (!complaint || !complaint.id) {
        sails.log.error('Complaint creation failed unexpectedly, create().fetch() returned:', complaint);
        throw new Error('Failed to create complaint record in database.');
      }

      await Notification.create({
        message: 'Your complaint "' + complaint.title + '" (' + complaint.referenceNumber + ') has been submitted and is under review.',
        relatedComplaint: complaint.referenceNumber,
        user: req.session.userId
      });

      return res.status(201).json({
        message: 'Complaint submitted.',
        complaint: complaint
      });
    } catch (err) {
      sails.log.error('An unexpected error occurred when creating a complaint:', err);
      return res.serverError({ error: 'A server error occurred. Please try again later.' });
    }
  },


  // GET /api/complaints  (Dashboard: "My Complaints" list)
  find: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    var complaints = await Complaint.find({ submittedBy: req.session.userId })
      .sort('createdAt DESC');
    return res.json({ complaints: complaints });
  },

  // GET /api/complaints/:id  (Complaint Full Details screen)
  findOne: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    var complaint = await Complaint.findOne({ id: req.params.id }).populate('assignedTo');
    if (!complaint || complaint.submittedBy !== req.session.userId) {
      return res.notFound({ error: 'Complaint not found.' });
    }

    var latestLog = await StatusLog.find({ complaint: complaint.id }).sort('createdAt DESC').limit(1);

    return res.json({
      complaint: complaint,
      latestRemark: (latestLog[0] && latestLog[0].note) ? latestLog[0].note : null
    });
  },

  // GET /api/complaints/track/:referenceNumber  (Landing page "Quick Tracking" widget - no login needed)
  track: async function (req, res) {
    var complaint = await Complaint.findOne({ referenceNumber: req.params.referenceNumber });
    if (!complaint) {
      return res.notFound({ error: 'No complaint found with that reference number.' });
    }
    return res.json({
      referenceNumber: complaint.referenceNumber,
      status: complaint.status,
      category: complaint.category,
      createdAt: complaint.createdAt
    });
  }

};
