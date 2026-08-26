/**
 * config/datastores.js
 *
 * Connects to MySQL. Set DATABASE_URL in a .env file (see .env.example)
 * or export it in your shell before running the app, e.g.:
 *
 *   DATABASE_URL=mysql://root:yourpassword@localhost:3306/byteback
 *
 * Create the database first (one-time), in a MySQL shell:
 *   CREATE DATABASE byteback;
 *
 * Sails/Waterline will create the tables automatically on first run
 * (see config/models.js -> migrate: 'alter').
 */

module.exports.datastores = {

  default: {
    adapter: 'sails-mysql',
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/byteback'
  }

};
