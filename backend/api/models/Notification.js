/**
 * Notification.js
 *
 * Backs the "Notification Center" screen. Notifications are created
 * automatically (e.g. when a complaint is submitted or its status changes).
 */

module.exports = {

  attributes: {

    message: {
      type: 'string',
      required: true
    },

    read: {
      type: 'boolean',
      defaultsTo: false
    },

    relatedComplaint: {
      type: 'string',
      allowNull: true // stores the complaint referenceNumber for a "View" link, if relevant
    },

    user: {
      model: 'user'
    }

  }

};
