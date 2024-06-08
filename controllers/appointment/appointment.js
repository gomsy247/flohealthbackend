const express = require('express');
const router = express.Router();
const mysql = require('mysql');

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'flohealthub_telemedicine'
});

// Fetch Appointments
router.get('/api/appointments', (req, res) => {
  const sql = 'SELECT * FROM appointments';
  db.query(sql, (err, results) => {
    if(err) throw err;
    res.send(results);
  });
});

// Approve Appointment
router.put('/api/appointments/:id', (req, res) => {
  const sql = `UPDATE appointments SET status = 'approved' WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if(err) throw err;
    res.send('Appointment updated...');
  });
});

// Decline Appointment
router.delete('/api/appointments/:id', (req, res) => {
  const sql = `UPDATE appointments SET status = 'declined' WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if(err) throw err;
    res.send('Appointment updated...');
  });
});

module.exports = router;