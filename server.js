// server.js
const express = require('express');
const { PythonShell } = require('python-shell');
const app = express();
const port = 3000;

// API untuk menjalankan skrip Python
app.get('/run-python', (req, res) => {
  // Jalankan skrip Python menggunakan python-shell
  PythonShell.run('tello_script.py', null, (err, result) => {
    if (err) {
      res.status(500).send('Error running Python script: ' + err);
    } else {
      res.send(result);  // Kembalikan hasil dari skrip Python
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


