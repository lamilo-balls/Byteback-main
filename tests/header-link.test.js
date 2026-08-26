const fs = require('fs');
const path = require('path');
const assert = require('assert');

const apiJsPath = path.join(__dirname, '..', 'frontend', 'js', 'api.js');
const content = fs.readFileSync(apiJsPath, 'utf8');

assert(
  content.includes('<a href="dashboard.html" class="app-header-brand">'),
  'The logged-in victim header should link the ByteBack logo back to the dashboard, not the public home page.'
);

console.log('Header link regression test passed');
