import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import sharedSession from 'express-socket.io-session';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import { db } from './connect.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import likeRoutes from './routes/likes.js';
import relationshipRoutes from './routes/relationships.js';
import appointmentRoute from './routes/appointmentRoute.js';
import paymentRoute from './routes/paymentRoute.js';

// Get the absolute path of the current directory
const __dirname = path.resolve();

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3001'], // Update with your frontend's URL
    methods: ['GET', 'POST'],
  },
});

// Session configuration
const sessionMiddleware = session({
  secret: 'Shisacomapa', // Replace with a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
});

// Use the session middleware in Express
app.use(sessionMiddleware);

// Share the session with Socket.IO
io.use(sharedSession(sessionMiddleware, {
  autoSave: true
}));

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/photos', express.static(path.join(__dirname, 'photos')));

// Set up multer for video uploads
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

// Path to the JSON file where doctors will be stored
const doctorsFilePath = path.join(__dirname, 'doctors.json');

// Function to read doctors from the JSON file
const readDoctorsFromFile = () => {
  try {
    if (fs.existsSync(doctorsFilePath)) {
      const data = fs.readFileSync(doctorsFilePath);
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading doctors file:', error);
    return {};
  }
};

// Function to write doctors to the JSON file
const writeDoctorsToFile = (doctors) => {
  try {
    fs.writeFileSync(doctorsFilePath, JSON.stringify(doctors, null, 2));
  } catch (error) {
    console.error('Error writing to doctors file:', error);
  }
};

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // Load doctors from file
  let doctors = readDoctorsFromFile();

  // Initialize session doctors if not already set
  if (!socket.handshake.session.doctors) {
    socket.handshake.session.doctors = doctors;
  }

  // Handle doctor joining
  socket.on('doctor-join', ({ doctorId }) => {
    socket.handshake.session.doctors[doctorId] = socket.id;
    socket.handshake.session.save();

    // Update and save doctors to file
    doctors = socket.handshake.session.doctors;
    writeDoctorsToFile(doctors);

    console.log(`Doctor connected with ID: ${doctorId}, Socket ID: ${socket.id}`);
    //console.log(`Doctors array: ${JSON.stringify(doctors)} connected.`);
  });

  // Handle patient consultation request
  socket.on('patient-join', ({ patientName, userId, doctorId, socketId }) => {
    const doctorSocketId = socket.handshake.session.doctors[doctorId];
    console.log(`Doctor Socket ID with ID ${doctorId} is: ${doctorSocketId}`);
    if (doctorSocketId) {
     // io.to(doctorSocketId).emit('consultationRequest', { patientName, userId, doctorId, socketId });
     /// NOTE: socket.broadcast.emit makes socketio to work in both frontend and backend
      socket.broadcast.emit('consultationRequest', { patientName, userId, doctorId, socketId, message: patientName+' is requesting for a consultation' });
    } else {
      console.log(`Doctor with ID ${doctorId} is not connected.`);
    }
  });

   // Handle consultation acceptance response from the doctor
   socket.on('consultationAccepted', ({ patientName, userId, doctorId, socketId, doctorName }) => {
    socket.broadcast.emit('consultationAcceptedOrRejected', { patientName, userId, doctorId, socketId, doctorName, status: "accepted"  });
  });

  
   // Handle consultation rejection response from the doctor
   socket.on('consultationRejected', ({ patientName, userId, doctorId, socketId, doctorName }) => {
    socket.broadcast.emit('consultationAcceptedOrRejected', { patientName, userId, doctorId, socketId, doctorName, status: "rejected"  });
  });

  

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    const doctors = socket.handshake.session.doctors;
    for (let doctorId in doctors) {
      if (doctors[doctorId] === socket.id) {
        delete doctors[doctorId];
        socket.handshake.session.save();

        // Update and save doctors to file
        writeDoctorsToFile(doctors);

        console.log(`Doctor with ID ${doctorId} has been removed from session.`);
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
  req.session.oauth2Client = oauth2Client;
  res.redirect('http://127.0.0.1:3001/profiletabs?tab=uploader&autho=yeees#uploader');
});

app.get('/session', async (req, res) => {
  const oauth2ClientSession = req.session.oauth2Client;
  const youtube = google.youtube({
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
