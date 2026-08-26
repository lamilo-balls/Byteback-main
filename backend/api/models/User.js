/**
 * User.js
 *
 * Matches the fields on the "User Registration" Figma screen:
 * full name, email, phone, password, and role (defaults to 'public').
 */

module.exports = {

  attributes: {

    fullName: {
      type: 'string',
      required: true
    },

    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },

    phone: {
      type: 'string',
      allowNull: true
    },

    address: {
      type: 'string',
      allowNull: true
    },

    notificationPrefs: {
      type: 'json',
      defaultsTo: { email: true, sms: true, investigatorRemarks: true, marketing: false }
    },

    isActive: {
      type: 'boolean',
      defaultsTo: true
    },

    // Never returned to the client - see customToJSON below.
    password: {
      type: 'string',
      required: true
    },

    role: {
      type: 'string',
      isIn: ['public', 'investigator', 'supervisor', 'admin'],
      defaultsTo: 'public'
    },

    isVerified: {
      type: 'boolean',
      defaultsTo: false
    },

    // 6-digit code for the Email Verification screen. Cleared once verified.
    verificationCode: {
      type: 'string',
      allowNull: true
    },

    notifications: {
      collection: 'notification',
      via: 'user'
    },

    complaints: {
      collection: 'complaint',
      via: 'submittedBy'
    }

  },

  customToJSON: function () {
    return _.omit(this, ['password', 'verificationCode']);
  }

};
