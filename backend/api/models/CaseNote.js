/**
 * CaseNote.js
 *
 * Internal investigator notes on a case. Backs the "Investigation
 * Workspace" screen. Not visible to the public user who filed the report.
 */

module.exports = {

  attributes: {

    note: {
      type: 'string',
      required: true
    },

    complaint: {
      model: 'complaint'
    },

    investigator: {
      model: 'user'
    }

  }

};
