const express = require('express');

const app = express();

app.get('', (req, res) => {
  res.send('Hello, express');
});

app.listen(80),
  () => {
    console.log('Server is up on port 3000');
  };
