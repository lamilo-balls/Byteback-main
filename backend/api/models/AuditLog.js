/**
 * AuditLog.js
 *
 * Records staff/system actions. Backs the Admin "Audit Logs" screen
 * (general actions: role changes, status overrides, user creation) and
 * "Security Logs" screen (login_success / login_failed entries).
 */

module.exports = {

  attributes: {

    action: {
      type: 'string',
      required: true // e.g. 'login_success', 'login_failed', 'role_changed', 'status_overridden', 'user_created'
    },

    details: {
      type: 'string',
      allowNull: true
    },

    ip: {
      type: 'string',
      allowNull: true
    },

    actor: {
      model: 'user' // who performed the action (null for anonymous failed logins)
    }

  }

};
