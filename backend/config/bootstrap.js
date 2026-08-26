/**
 * config/bootstrap.js
 *
 * Runs once when the server starts. Creates a default admin account if
 * none exists yet, so you have a way to log in and use User Management to
 * create your real investigator/supervisor/admin accounts from there.
 *
 * Change these credentials via env vars, or just log in and change the
 * password immediately from Settings.
 */

var bcrypt = require('bcryptjs');

module.exports.bootstrap = async function () {
  var existingAdmin = await User.findOne({ role: 'admin' });

  if (!existingAdmin) {
    var email = process.env.SEED_ADMIN_EMAIL || 'admin@byteback.local';
    var password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
    var hashed = await bcrypt.hash(password, 10);

    await User.create({
      fullName: 'System Administrator',
      email: email,
      password: hashed,
      role: 'admin',
      isVerified: true
    });

    sails.log.info('==================================================');
    sails.log.info('No admin account found - created a default one:');
    sails.log.info('  email:    ' + email);
    sails.log.info('  password: ' + password);
    sails.log.info('Log in and create your real staff accounts from');
    sails.log.info('User Management, then change this password.');
    sails.log.info('==================================================');
  }
};
