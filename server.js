const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
  res.redirect(302, 'https://login.opencloudt.org/');
});

app.listen(PORT, () => {
  console.log('Redirect server running on port ' + PORT);
});
