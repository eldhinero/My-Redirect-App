const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variable for target
const TARGET_URL = process.env.TARGET_URL || 'https://login.opencloudt.org/';

app.get('*', (req, res) => {
  res.redirect(302, TARGET_URL);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Redirect service running on port ${PORT}`);
  console.log(`Target: ${TARGET_URL}`);
});
