/**
 * config/cors.js
 *
 * The frontend is a plain HTML/CSS/JS site, usually opened with a tool like
 * VS Code's "Live Server" (default port 5500) - a different origin than the
 * API (localhost:1337). Add any other origin you serve the frontend from.
 */

module.exports.cors = {
  allRoutes: true,
  allowOrigins: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  allowCredentials: true
};
