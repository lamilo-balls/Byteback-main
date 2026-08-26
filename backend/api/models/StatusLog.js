/**
 * StatusLog.js
 *
 * One entry per status change on a complaint. Backs the Investigator
 * "Case Timeline" screen and is written to by "Update Status".
 */

module.exports = {

  attributes: {

    status: {
      type: 'string',
      required: true
    },

    note: {
      type: 'string',
      allowNull: true
    },

    complaint: {
      model: 'complaint'
    },

    changedBy: {
      model: 'user'
    }

  }

};
