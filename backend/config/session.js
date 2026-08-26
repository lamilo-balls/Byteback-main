module.exports.session = {
  secret: process.env.SESSION_SECRET || 'byteback-dev-secret-change-me',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
};
