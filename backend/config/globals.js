/**
 * config/globals.js
 *
 * Exposes models (e.g. `User`), services, `sails`, `_`, and `async` as
 * global variables. Sails' CLI (`sails lift`) defaults this to `true`,
 * but programmatic `sails.lift()` (used by app.js / `npm start`) defaults
 * to `false` unless this file says otherwise - so it's required here since
 * config/bootstrap.js and the controllers rely on the `User`, etc. globals.
 */

module.exports.globals = {
  models: true,
  sails: true,
  _: require('@sailshq/lodash'),
  async: require('async')
};
