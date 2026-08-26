/**
 * config/policies.js
 *
 * Auth is currently checked inline inside each controller action
 * (looking at req.session.userId) so this stays wide open. If you want
 * route-level policies instead, add a policy file in api/policies/
 * and map actions to it here.
 */

module.exports.policies = {
  '*': true
};
