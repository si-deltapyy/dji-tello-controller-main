// server.js
const express = require('express');
const { PythonShell } = require('python-shell');
const os = require('os');
const app = express();
const port = 3000;

// Mendapatkan alamat IP mesin (menggunakan os.networkInterfaces())
const getIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const iface in networkInterfaces) {
    for (const details of networkInterfaces[iface]) {
      // Mencari alamat IPv4 yang bukan `127.0.0.1` (localhost)
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost'; // Jika tidak ditemukan, default ke localhost
};

// API untuk menjalankan skrip Python
app.get('/run-python', (req, res) => {
  PythonShell.run('tello_script.py', null, (err, result) => {
    if (err) {
      res.status(500).send('Error running Python script: ' + err);
    } else {
      res.send(result);  // Kembalikan hasil dari skrip Python
    }
  });
});

// API untuk tes, menambahkan response agar bisa diakses di browser
app.get('/tes', (req, res) => {
  console.log(`cek_api`);
  res.send('API /tes berhasil diakses!');  // Mengirimkan response ke browser
});

// Mendapatkan IP mesin dan menggunakannya untuk listening
const ip = getIpAddress();

app.listen(port, ip, () => {
  console.log(`Server listening at http://${ip}:${port}`);
});
