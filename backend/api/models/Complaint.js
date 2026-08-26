/**
 * Complaint.js
 *
 * Matches the multi-step "File a Complaint" flow:
 * Category Selection -> Details Form -> Evidence Upload -> Review
 */

module.exports = {

  attributes: {

    referenceNumber: {
      type: 'string',
      required: true,
      unique: true
    },

    category: {
      type: 'string',
      isIn: [
        'online_scam',
        'identity_theft',
        'cyberbullying',
        'phishing',
        'hacking',
        'impersonation'
      ],
      required: true
    },

    title: {
      type: 'string',
      required: true
    },

    description: {
      type: 'string',
      required: true
    },

    incidentDate: {
      type: 'string',
      allowNull: true
    },

    platform: {
      type: 'string',
      allowNull: true
    },

    suspectInfo: {
      type: 'string',
      allowNull: true
    },

    estimatedLoss: {
      type: 'number',
      allowNull: true
    },

    // Array of asset URLs/filenames uploaded during the "Evidence Upload" step
    evidence: {
      type: 'json',
      defaultsTo: []
    },

    status: {
      type: 'string',
      isIn: ['submitted', 'under_review', 'investigating', 'resolved', 'closed'],
      defaultsTo: 'submitted'
    },

    priority: {
      type: 'string',
      isIn: ['low', 'medium', 'high', 'critical'],
      defaultsTo: 'medium'
    },

    // Set by a Supervisor via Case Assignment; null = unassigned
    assignedTo: {
      model: 'user'
    },

    submittedBy: {
      model: 'user'
    },

    statusLogs: {
      collection: 'statuslog',
      via: 'complaint'
    },

    caseNotes: {
      collection: 'casenote',
      via: 'complaint'
    }

  },

  beforeCreate: function (record, proceed) {
    var year = new Date().getFullYear();
    var random = Math.floor(1000 + Math.random() * 9000);
    record.referenceNumber = 'CR-' + year + '-' + random;
    return proceed();
  }

};
