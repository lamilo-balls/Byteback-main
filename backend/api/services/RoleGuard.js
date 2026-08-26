/**
 * RoleGuard.js
 *
 * Sails auto-globalizes everything in api/services, so this is available
 * anywhere as `RoleGuard` (no require() needed) - same way `User` and
 * `Complaint` are available as global models.
 *
 * Usage inside a controller action:
 *   var user = await RoleGuard.require(req, res, ['investigator', 'supervisor']);
 *   if (!user) return; // RoleGuard already sent the 401/403 response
 */

module.exports = {

  require: async function (req, res, allowedRoles) {
    if (!req.session.userId) {
      res.status(401).json({ error: 'Not logged in.' });
      return null;
    }
    var user = await User.findOne({ id: req.session.userId });
    if (!user) {
      res.status(401).json({ error: 'Not logged in.' });
      return null;
    }
    if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
      res.status(403).json({ error: 'You do not have permission to do that.' });
      return null;
    }
    return user;
  }

};
