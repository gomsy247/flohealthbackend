/* const express = require('express');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/users.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes  = require( './routes/comments.js');
const likeRoutes  = require('./routes/likes.js');
const relationshipRoutes  = require('./routes/relationships.js');
const appointmentRoute  = require('./routes/appointmentRoute.js');
const paymentRoute  = require('./routes/paymentRoute.js');

const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql');
const cron = require('cron');
const cors = require('cors');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length; */
import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import likeRoutes from './routes/likes.js';
import relationshipRoutes from './routes/relationships.js';
import appointmentRoute from './routes/appointmentRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';
import mysql from 'mysql';
import cron from 'cron';
import cors from 'cors';
import cluster from 'cluster';
import { cpus } from 'os';

const numCPUs = cpus().length;
const PORT = process.env.PORT || 8801;

const app = express();
app.use(cors());
app.use(cookieParser());

app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'videos'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  res.status(200).json(file.filename);
});

// Define a route to serve videos
app.get('/videos/:videoFileName', (req, res) => {
  const videoFileName = req.params.videoFileName;
  const videoPath = path.join(__dirname, 'videos', videoFileName);
  res.header('Content-Type', 'video/mp4');
  res.sendFile(videoPath);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/appointments', appointmentRoute);
app.use('/api/payments', paymentRoute);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'flohealthhubco_telemedicine'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

const notifyClients = (message, wss) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const pollChanges = (wss) => new cron.CronJob('*/10 * * * * *', () => {
  db.query('SELECT * FROM appointment_changes', (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      notifyClients('An appointment has been updated', wss);
      db.query('TRUNCATE TABLE appointment_changes', (err) => {
        if (err) throw err;
      });
    }
  });
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  pollChanges(wss).start();

  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
      const messageObj = JSON.parse(message);
      console.log(`Received message: ${JSON.stringify(messageObj)}`);

      const { userId, status, namer } = messageObj;
      ws.send(`Your appointment has just been ${status} by ${namer}`);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });

    ws.send('Connected to WebSocket server');
  });

  app.get('/confirmed-appointment/:id/:userIdName', (req, res) => {
    const { id, userIdName } = req.params;
    const statu = 'confirmed';
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const query = `SELECT * FROM appointment WHERE ${userIdName} = ? AND status = ?`;
    db.query(query, [id, statu], (error, results) => {
      if (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });

  app.get('/pending-appointment/:id/:userIdName/:status', (req, res) => {
    const { id, userIdName, status } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const query = `SELECT * FROM appointment WHERE ${userIdName} = ? AND status = ?`;
    db.query(query, [id, status], (error, results) => {
      if (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use, trying another port...`);
      server.listen(PORT + 1);
    } else {
      throw err;
    }
  });
}

/* server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
 */


/* const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql');
const cron = require('cron');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'flohealthhubco_telemedicine'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Function to notify all WebSocket clients
const notifyClients = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Poll for changes every 10 seconds
const pollChanges = new cron.CronJob('*\/10 * * * * *', () => {
  db.query('SELECT * FROM appointment_changes', (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      notifyClients('An appointment has been updated');
      db.query('TRUNCATE TABLE appointment_changes', (err) => {
        if (err) throw err;
      });
    }
  });
});

pollChanges.start();

// Controller method to get appointments by id and status
app.get('/call-server/:id/:userIdName', (req, res) => {
  const { id, userIdName } = req.params;
  console.log('ID', id, 'userNameId', userIdName);
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const query = `SELECT * FROM appointment WHERE ${userIdName} = ? AND status = 'confirmed'`;
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle messages from clients (optional)
  ws.on('message', (message) => {
    const messageObj = JSON.parse(message);
    console.log(`Received message: ${messageObj}`);
    ws.send(`Your appointment has just been ${messageObj.status} by ${messageObj.namer}`);

  });
  
  // Notify the client of any initial state (optional)
  ws.send('Connected to WebSocket server Kapolo');
});

server.listen(8802, () => {
  console.log('Server is listening on port 8802');
});

/* // server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'flohealthhubco_telemedicine'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Function to notify all WebSocket clients
const notifyClients = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Example of database change listener (you need to implement this based on your setup)
db.query('CREATE TRIGGER after_update AFTER UPDATE ON appointment FOR EACH ROW BEGIN CALL notify_clients(); END;');
// Controller method to get appointments by id and status
app.get('/call-server', (req, res) => {
  const { id, userIdName } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  const query = `SELECT * FROM appointment WHERE ${userIdName} = ? AND status = 'confirmed'`;
  dbCI.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error getting appointments:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle messages from clients (optional)
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
  });
  
  // Notify the client of any initial state (optional)
  ws.send('Connected to WebSocket server');
});

server.listen(8802, () => {
  console.log('Server is listening on port 8802');
});
 */ 
