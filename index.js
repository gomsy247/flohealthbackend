import express from 'express';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import likeRoutes from './routes/likes.js';
import relationshipRoutes from './routes/relationships.js';
import appointmentRoute from './routes/appointmentRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import path from 'path';
import session from 'express-session';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { db, pool } from './connect.js';

import http from 'http';
import WebSocket from 'ws';
import mysql from 'mysql';
import cron from 'cron';

// Get the absolute path of the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Use Helmet for additional security measures
app.use(helmet());

// Enable CORS for specific domains
/* const corsOptions = {
  origin: ['http://127.0.0.1:3000', 'http://127.0.0.1:3002', 'http://localhost:3000',
  'https://mtchskcn.uks1.devtunnels.ms', 'https://naijastreets.ng',
  'https://accounts.google.com/o/oauth2/v2/auth', 'https://mtchskcn-3000.uks1.devtunnels.ms','http://localhost:53493'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));
 */

const corsOptions = {
  origin: [
    'https://naijapis.naijastreets.ng',
    /\.naijastreets\.ng$/, 
    'http://localhost:3000',// match subdomains
  ],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
//app.use(cors('*'));

dotenv.config();
// Set up session middleware
app.use(session({
  secret: 'Shisacomapa202yeepa', // Change this to a secure random string
  resave: false,
  saveUninitialized: true
}));

//middlewares
/* app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  next();
}); */
app.use(express.json());

/* app.use(
  cors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3001',  'http://localhost:3000',
    'https://mtchskcn.uks1.devtunnels.ms', 'https://naijastreets.ng',
    'https://accounts.google.com/o/oauth2/v2/auth', 'https://mtchskcn-3000.uks1.devtunnels.ms'],
  })
); */
/* app.use(
  cors({
    origin: true,
  })
); */
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

// Gomsolutions
/* const oauth2Client = new google.auth.OAuth2(
  '559328978066-1m56a4520b2paacgdhd9mo951ltgl5c1.apps.googleusercontent.com',
  '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',
  'http://localhost:8801/callback'
); */

// Naijastreets
const oauth2Client = new google.auth.OAuth2(
  '819208777941-abp7d09iv3r75um2i6sp8gbhaca9cgn5.apps.googleusercontent.com',
  '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',
  'http://localhost:8801/callback/like'
);

// Naijastreets
/* const oauth2Client = new OAuth2Client({
  clientId: '16875146604-td21mu3qpp0ko6fo9vqsen552kjp2dmr.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: 'http://localhost:8801/callback',
}); */



app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload'],
  });

  //res.redirect(authUrl);
  res.json({status: true, url: authUrl});
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);// Set tokens obtained during authentication
 /*  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  }); */


  authenticationStatus = true;
  console.log('Authentication successful. You can now make API requests.');
  // Now you can use the authenticated client to make YouTube API requests
  //res.send('Authentication successful. You can now make API requests.');
  console.log('MY OGBONGE TOKENNY', authenticationStatus);
  // Store oauth2Client in session
  req.session.oauth2Client = oauth2Client;
  res.redirect('http://127.0.0.1:3001/profiletabs?tab=uploader&autho=yeees#uploader');

  //res.json({status: true, oauth2Client: oauth2Client});
});

/// Youtube Interaction Methods
let youtube;
console.log('Current oauth2Client', )

// session route test
app.get('/session', async (req, res) => {
  const oauth2ClientSession = req.session.oauth2Client;
  youtube = google.youtube({
    version: 'v3',
    auth: oauth2ClientSession ? oauth2ClientSession : oauth2Client,
  });
  //console.log('oauth2ClientSession', oauth2ClientSession, 'youtube', youtube);
  res.json({oauth2ClientSession, youtube})
});

// WEBSOCKET CODES 
// Database connection

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
const pollChanges = new cron.CronJob('*/10 * * * * *', () => {
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
   /*  const formattedResult = results.map((result, index) => {
      return {...result, add_date:result.add_date.split(' ')[0]}
    })
    res.json(formattedResult); */
    res.json(results);
  });
});

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle messages from clients (optional)
  ws.on('message', (message) => {
    console.log(`Received message: ${message.status}`);
    ws.send(`Your appointment has just been approved by ${message.namer}`);
  });
  
  // Notify the client of any initial state (optional)
  ws.send('Connected to WebSocket server Kapolo');
});
// WEBSOCKET CODES 



const port = 8801 || process.env.PORT
app.listen(port, () => {
  console.log('API working! at port '+port);
});
