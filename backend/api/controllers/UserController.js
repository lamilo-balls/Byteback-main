/**
 * UserController.js
 *
 * Covers: User Registration, Login, Forgot Password, Email Verification,
 * "who am I", User Profile, and User Settings (change password).
 */

var bcrypt = require('bcryptjs');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = {

  // POST /api/register
  register: async function (req, res) {
    var fullName = req.body.fullName;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.address;
    var password = req.body.password;
    var agreedToTerms = req.body.agreedToTerms;

    if (!fullName || !email || !password) {
      return res.badRequest({ error: 'All account detail fields must be filled out.' });
    }
    if (!agreedToTerms) {
      return res.badRequest({ error: 'You must agree to the Terms, User Agreement, and Data Privacy Consent to register.' });
    }

    var existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.badRequest({ error: 'An account with this email already exists.' });
    }

    var hashed = await bcrypt.hash(password, 10);
    var code = generateCode();

    var newUser = await User.create({
      fullName: fullName,
      email: email.toLowerCase(),
      phone: phone,
      address: address,
      password: hashed,
      verificationCode: code
    }).fetch();

    req.session.userId = newUser.id;

    // No real email service is wired up yet, so the code is logged here
    // (and returned in the response below) purely so you can test the
    // Email Verification screen without sending a real email.
    sails.log.info('[DEV] Verification code for ' + newUser.email + ': ' + code);

    return res.status(201).json({
      message: 'Registration successful. Check your email for a verification code.',
      user: newUser,
      devVerificationCode: code // remove this field once real email sending is wired up
    });
  },

  // POST /api/login
  login: async function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
      return res.badRequest({ error: 'email and password are required.' });
    }

    var user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await AuditLog.create({ action: 'login_failed', details: 'Unknown email: ' + email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    var matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      await AuditLog.create({ action: 'login_failed', details: 'Wrong password for ' + user.email, actor: user.id, ip: req.ip });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact support if this was a mistake.' });
    }

    req.session.userId = user.id;
    await AuditLog.create({ action: 'login_success', details: user.email, actor: user.id, ip: req.ip });

    return res.json({
      message: 'Login successful.',
      user: _.omit(user, ['password', 'verificationCode'])
    });
  },

  // POST /api/logout
  logout: function (req, res) {
    req.session.userId = undefined;
    return res.json({ message: 'Logged out.' });
  },

  // POST /api/forgot-password
  forgotPassword: async function (req, res) {
    var email = req.body.email;
    if (!email) {
      return res.badRequest({ error: 'email is required.' });
    }

    var user = await User.findOne({ email: email.toLowerCase() });

    // Always respond the same way whether or not the user exists,
    // so the API doesn't leak which emails are registered.
    // In production, send a real email with a reset token here.
    if (user) {
      sails.log.info('Password reset requested for user ' + user.id);
    }

    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  },

  // POST /api/verify-email
  verifyEmail: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var code = req.body.code;
    if (!code) {
      return res.badRequest({ error: 'code is required.' });
    }

    var user = await User.findOne({ id: req.session.userId });
    if (!user) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    if (user.isVerified) {
      return res.json({ message: 'Email already verified.' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Incorrect verification code.' });
    }

    await User.updateOne({ id: user.id }).set({ isVerified: true, verificationCode: null });

    return res.json({ message: 'Email verified successfully.' });
  },

  // POST /api/resend-verification
  resendVerification: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var user = await User.findOne({ id: req.session.userId });
    if (!user) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    if (user.isVerified) {
      return res.json({ message: 'Email already verified.' });
    }

    var code = generateCode();
    await User.updateOne({ id: user.id }).set({ verificationCode: code });
    sails.log.info('[DEV] New verification code for ' + user.email + ': ' + code);

    return res.json({ message: 'A new code has been sent.', devVerificationCode: code });
  },

  // GET /api/me  (used by the Dashboard/Profile screens to check session)
  me: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var user = await User.findOne({ id: req.session.userId });
    if (!user) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    return res.json({ user: user });
  },

  // PUT /api/profile  (User Profile screen)
  updateProfile: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var fullName = req.body.fullName;
    var phone = req.body.phone;
    var address = req.body.address;

    if (!fullName) {
      return res.badRequest({ error: 'fullName is required.' });
    }

    var updated = await User.updateOne({ id: req.session.userId }).set({ fullName: fullName, phone: phone, address: address });
    return res.json({ message: 'Profile updated.', user: updated });
  },

  // POST /api/change-password  (User Settings screen)
  changePassword: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var currentPassword = req.body.currentPassword;
    var newPassword = req.body.newPassword;

    if (!currentPassword || !newPassword) {
      return res.badRequest({ error: 'currentPassword and newPassword are required.' });
    }

    var user = await User.findOne({ id: req.session.userId });
    var matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    var hashed = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ id: user.id }).set({ password: hashed });

    return res.json({ message: 'Password updated.' });
  },

  // PUT /api/notification-prefs  (Settings screen toggles)
  updateNotificationPrefs: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    var prefs = {
      email: !!req.body.email,
      sms: !!req.body.sms,
      investigatorRemarks: !!req.body.investigatorRemarks,
      marketing: !!req.body.marketing
    };
    await User.updateOne({ id: req.session.userId }).set({ notificationPrefs: prefs });
    return res.json({ message: 'Preferences updated.', notificationPrefs: prefs });
  },

  // POST /api/deactivate-account  (Settings screen Danger Zone)
  deactivateAccount: async function (req, res) {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    await User.updateOne({ id: req.session.userId }).set({ isActive: false });
    req.session.userId = undefined;
    return res.json({ message: 'Account deactivated.' });
  }

};
