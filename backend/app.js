/**
 * app.js
 *
 * Use `node app.js` to start the Sails server, or `npm run dev`
 * (which runs `sails lift`, same thing, more logging).
 */

process.chdir(__dirname);

require('dotenv').config();

var sails = require('sails');

sails.lift({}, function (err) {
  if (err) {
    console.error('Failed to lift ByteBack backend:', err);
    return;
  }
  console.log('ByteBack backend running at http://localhost:1337');
});
