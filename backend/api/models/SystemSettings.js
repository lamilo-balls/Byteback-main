/**
 * SystemSettings.js
 *
 * Platform-wide configuration, edited from the Admin Settings screen.
 * This is a singleton - there's always exactly one row (id: 1),
 * created on first access if it doesn't exist yet.
 */

module.exports = {

  attributes: {

    platformName: {
      type: 'string',
      defaultsTo: 'ByteBack Cybercrime Complaint Management System'
    },

    supportEmail: {
      type: 'string',
      defaultsTo: 'support@byteback.gov'
    },

    supportHotline: {
      type: 'string',
      defaultsTo: '1-800-CYBER-REP'
    },

    requireMfa: {
      type: 'boolean',
      defaultsTo: true
    },

    autoLockAfterFailedAttempts: {
      type: 'boolean',
      defaultsTo: true
    },

    sessionTimeoutEnabled: {
      type: 'boolean',
      defaultsTo: true
    },

    allowSupervisorExport: {
      type: 'boolean',
      defaultsTo: false
    }

  }

};
