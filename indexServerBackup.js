import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import likeRoutes from './routes/likes.js';
import relationshipRoutes from './routes/relationships.js';
import appointmentRoute from './routes/appointmentRoute.js';
import paymentRoute from './routes/paymentRoute.js';

import multer from 'multer';
import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db, pool } from './connect.js';

import WebSocket from 'ws';
import mysql from 'mysql';
import cron from 'cron';

// Get the absolute path of the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'], // Update with your frontend's URL
    methods: ['GET', 'POST'],
  },
});

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'Shisacomapa', // Replace with a secure key
  resave: false,
  saveUninitialized: true,
}));

app.use(cors());
app.use(cookieParser());

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

  // Set appropriate headers for video streaming
  res.header('Content-Type', 'video/mp4');

  // Send the video file
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

let authenticationStatus = false;

app.use(express.json());

app.use('/photos', express.static(__dirname + '/photos'));

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  const users = {};   // To store patients' socket IDs
  const doctors = {}; // To store doctors' socket IDs

  // When a doctor joins, save their socket ID using their doctorId
  socket.on('doctor-join', ({ doctorId }) => {
    doctors[doctorId] = socket.id;
    console.log(`Doctor connected with ID: ${doctorId}, Socket ID: ${socket.id}`);
  });

  // When the patient joins, save their socket ID
  socket.on('patient-join', ({ patientName, userId, doctorId, socketId }) => {
    console.log('List of doctors connected', doctors);
    users[userId] = socketId;
    console.log(`Patient Name: ${patientName}, User ID: ${userId}, Doctor ID: ${doctorId}, Socket ID: ${socketId}`);
    // Send to the specified Doctor using their ID
    const doctorSocketId = doctors[doctorId];
    if (doctorSocketId) {
      console.log(`Doctors: ${JSON.stringify(doctors)}`)
      io.to(doctorSocketId).emit('consultationRequest', { patientName, userId, doctorId, socketId });
    } else {
      console.log(`Doctor with ID ${doctorId} is not connected.`);
    }
  });

  // Handle consultation response from the doctor
  socket.on('consultation-response', ({ userId, status }) => {
    const patientSocketId = users[userId];
    if (patientSocketId) {
      io.to(patientSocketId).emit('consultation-status', { status });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove the user or doctor from the tracking list
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    for (let doctorId in doctors) {
      if (doctors[doctorId] === socket.id) {
        delete doctors[doctorId];
        break;
      }
    }
  });
});


const oauth2Client = new google.auth.OAuth2(
  '819208777941-abp7d09iv3r75um2i6sp8gbhaca9cgn5.apps.googleusercontent.com',
  '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',
  'http://localhost:8801/callback/like'
);

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload'],
  });

  res.json({ status: true, url: authUrl });
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  authenticationStatus = true;
  console.log('Authentication successful. You can now make API requests.');
  req.session.oauth2Client = oauth2Client;
  res.redirect('http://127.0.0.1:3001/profiletabs?tab=uploader&autho=yeees#uploader');
});

// YouTube Interaction Methods
let youtube;

// Session route test
app.get('/session', async (req, res) => {
  const oauth2ClientSession = req.session.oauth2Client;
  youtube = google.youtube({
    version: 'v3',
    auth: oauth2ClientSession ? oauth2ClientSession : oauth2Client,
  });
  res.json({ oauth2ClientSession, youtube });
});

// Database connection
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

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

server.listen(8801, () => {
  console.log('Server is running on port 8801');
});
