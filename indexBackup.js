import express from "express";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import commentRoutes from "./routes/comments.js";
import likeRoutes from "./routes/likes.js";
import relationshipRoutes from "./routes/relationships.js";
import appointmentRoute from "./routes/appointmentRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import cookieParser from "cookie-parser";
import path from "path";
import session from "express-session";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { db, pool } from "./connect.js";

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
  res.header("Access-Control-Allow-Credentials", true);
  next();
}); */
app.use(express.json());

app.use(
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3001",  "http://localhost:3000",
    "https://mtchskcn.uks1.devtunnels.ms", "https://naijastreets.ng",
    "https://accounts.google.com/o/oauth2/v2/auth", "https://mtchskcn-3000.uks1.devtunnels.ms"],
  })
);
/* app.use(
  cors({
    origin: true,
  })
); */
//app.use(cors());
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

app.post("/api/upload", upload.single("file"), (req, res) => {
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

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/appointments", appointmentRoute);
app.use("/api/payments", paymentRoute);

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
  console.log("MY OGBONGE TOKENNY", authenticationStatus);
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
  //console.log("oauth2ClientSession", oauth2ClientSession, "youtube", youtube);
  res.json({oauth2ClientSession, youtube})
});

// Additional routes for actions
app.get('/subscribe/:channelId', async (req, res) => {
    // Retrieve oauth2Client from session
    const oauth2ClientSession = req.session.oauth2Client;
    youtube = google.youtube({
      version: 'v3',
      auth: oauth2ClientSession ? oauth2ClientSession : oauth2Client,
    });

  //if(oauth2Client) {
    console.log("MY OGBONGE TOKENNY", authenticationStatus);
    const { channelId } = req.params;

      // Fix: Define youtube variable

    await youtube.subscriptions.insert({
      part: 'snippet',
      resource: {
        snippet: {
          resourceId: {
            channelId,
          },
        },
      },
    });

    res.status(201).json({status: true, message:`Subscribed to channel with ID ${channelId}`});
 /*  } else {
    res.status(400).json({status: false, message:`Unable to subscribe this time, Please try again later`});
  } */
});

app.get('/subscribeAndCheck/:channelId', async (req, res) => {
  const API_KEY = process.env.KII;
  // Extract the channel ID from the request parameters
  const CHANNEL_ID = req.params.channelId;

  // Create a YouTube Data API client
  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  try {
    // Check if the user is already subscribed
    const subscriptionResponse = await youtube.subscriptions.list({
      part: 'snippet',
      channelId: CHANNEL_ID,
      mine: true, // Check for the authorized user's subscriptions
    });

    if (subscriptionResponse.data.items.length > 0) {
      // User is already subscribed
      res.json({
        status: true,
        totalSubscriptions: [],
        message: 'You are already subscribed to this channel.',
      });
    } else {
      // Subscribe the user to the channel
      await youtube.subscriptions.insert({
        part: 'snippet',
        resource: {
          snippet: {
            resourceId: {
              kind: 'youtube#channel',
              channelId: CHANNEL_ID,
            },
          },
        },
      });

      // Get the updated total number of subscriptions for the user
      const totalSubscriptionsResponse = await youtube.subscriptions.list({
        part: 'subscriberSnippet',
        mine: true, // Get the authorized user's subscriptions
      });

      const totalSubscriptions = totalSubscriptionsResponse.data.pageInfo.totalResults;

      // Respond with the total number of subscriptions
      res.json({
        status: 'success',
        totalSubscriptions: totalSubscriptions,
        message: `Subscribed successfully! Total Subscriptions: ${totalSubscriptions}`,
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/likeToggle/:videoId/:userId', async (req, res) => {
  const API_KEY = process.env.KII;
  const VIDEO_ID = req.params.videoId;
  const USER_ID = req.params.userId;// Replace with the specific user's ID

  // Create a YouTube Data API client
  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  try {
    // Check if the video is already liked by the user
    const ratingResponse = await youtube.videos.getRating({
      id: VIDEO_ID,
      onBehalfOfContentOwner: USER_ID,
    });

    if (ratingResponse.data.items.length > 0) {
      // Video is already liked, remove the like
      await youtube.videos.rate({
        id: VIDEO_ID,
        rating: 'none',
        onBehalfOfContentOwner: USER_ID,
      });



      res.json({
        status: 'success',
        message: 'Like removed successfully.',
      });
    } else {
      // Video is not liked, like it
      await youtube.videos.rate({
        id: VIDEO_ID,
        rating: 'like',
        onBehalfOfContentOwner: USER_ID,
      });

      res.json({
        status: 'success',
        message: 'Video liked successfully.',
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/toggleDislike/:videoId', async (req, res) => {
  const API_KEY = process.env.KII;
  const VIDEO_ID = req.params.videoId;

  const youtube = google.youtube({
    version: 'v3',
    auth: API_KEY,
  });

  try {
    // Check if the video is already disliked
    const checkResponse = await youtube.videos.getRating({
      id: VIDEO_ID,
    });

    const isDisliked = checkResponse.data.items[0]?.rating === 'dislike';

    if (isDisliked) {
      // Remove the dislike if already disliked
      await youtube.videos.rate({
        id: VIDEO_ID,
        rating: 'none',
      });

      res.json({
        status: 'success',
        message: 'Dislike removed successfully!',
      });
    } else {
      // Dislike the video if not already disliked
      await youtube.videos.rate({
        id: VIDEO_ID,
        rating: 'dislike',
      });

      // Get the updated total number of likes for the video
      const response = await youtube.videos.list({
        part: 'statistics',
        id: VIDEO_ID,
      });

      const dislikesCount = response.data.items[0].statistics.dislikeCount;

      res.json({
        status: 'success',
        totalCount: dislikesCount,
        videoId: VIDEO_ID,
        message: `Video disliked successfully! Updated disLikes: ${dislikesCount}`,
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Route to submit a comment and retrieve comments data
app.post('/submitAndRetrieveComments/:videoId', async (req, res) => {
  try {
    const API_KEY = process.env.KII;
    const VIDEO_ID = req.params.videoId;
    const commentText = req.body.commentText;


    const youtube = google.youtube({
      version: 'v3',
      auth: API_KEY,
    });
    // Submit a comment
    await youtube.commentThreads.insert({
      part: 'snippet',
      resource: {
        snippet: {
          videoId: VIDEO_ID,
          topLevelComment: {
            snippet: {
              textOriginal: commentText,
            },
          },
        },
      },
    });

    // Retrieve the total number of comments
    const commentsResponse = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: VIDEO_ID,
      maxResults: 1, // Adjust as needed
    });

    const totalComments = commentsResponse.data.pageInfo.totalResults;

    // Retrieve updated comments data
    const updatedCommentsResponse = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: VIDEO_ID,
      maxResults: 5, // Adjust as needed
    });

    const updatedCommentsData = updatedCommentsResponse.data.items;

    res.json({
      status: 'success',
      totalComments: totalComments,
      updatedComments: updatedCommentsData,
      message: 'Comment submitted successfully!',
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


  // Additional route for video upload after authentication
  app.post('/upload', upload.single('video'), async (req, res) => {

   // Retrieve oauth2Client from session
   const oauth2ClientSession = req.session.oauth2Client;

    // Use YouTube API to upload the video
   youtube = google.youtube({
     version: 'v3',
     auth: oauth2ClientSession ? oauth2ClientSession : oauth2Client,
   });
/*   const {
    file
  } = req; */
  const {
    videoTitle,
    videoDescription,
    videoFile
  } = req.body;


  const response = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        videoTitle,
        videoDescription,
      },
      status: {
        privacyStatus: 'private', // You can adjust privacy settings
      },
    },
    media: {
      body: videoFile.buffer,
    },
  });

  res.send(`Video uploaded successfully. Video ID: ${response.data.id}`);
  res.status(201).json({status: true, message:`Video uploaded successfully. Video ID: ${response.data.id}`});
});

// Route to handle form submission and insert data into MySQL
app.post('/register-patient', (req, res) => {
  const { doctor, fullname, gender, appointment_date, email, password, phone, reason } = req.body;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  // SQL query to insert data into patient table
  const sql = `INSERT INTO patients (doctor, fullname, gender, appointment_date, email, password, phone, reason)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  // Values to be inserted into the database
  const values = [doctor, fullname, gender, appointment_date, email, password, phone, reason];
  connection.query(sql, values, (error, results) => {
    connection.release(); // Release the connection
  // Execute the SQL query
  if (error) {
    console.error('Error inserting data into MySQL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

    // Data inserted successfully
    console.log('Data inserted successfully:', results);
    res.status(200).json({ success: true, message: 'Data inserted successfully' });
  });
});
});

// Endpoint to handle Doctor registration form submission
app.post('/register-doctor', (req, res) => {
  const { name, gender, specialty, email, password, phone_number, license_number, experience_years } = req.body;
console.log(name, gender, specialty, email, password, phone_number, license_number, experience_years);

  // Insert the form data into the MySQL database
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const sql = 'INSERT INTO doctors (name, gender, specialty, email, password, phone_number, license_number, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [name, gender, specialty, email, password, phone_number, license_number, experience_years];

    connection.query(sql, values, (error, results) => {
      connection.release(); // Release the connection

      if (error) {
        console.error('Error inserting data into MySQL:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      console.log('Doctor registered successfully:', results);
      res.status(200).json({ message: 'Doctor registered successfully' });
    });
  });
});


const port = 8801 || process.env.PORT
app.listen(port, () => {
  console.log("API working! at port "+port);
});
