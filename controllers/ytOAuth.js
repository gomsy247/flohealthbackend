import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

import stream from 'stream'; // Import the 'stream' module

const __dirname = dirname(fileURLToPath(import.meta.url));


// Replace 'YOUR_API_KEY' and 'YOUR_CLIENT_ID' with your actual API key and client ID.
const API_KEY = 'AIzaSyA8taS11fdby5vj7SikimfN3CIIe713ch8';
const CLIENT_ID = '559328978066-r0roshe8m20q1j7kqf793jjfmp77m343.apps.googleusercontent.com';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, '', '');
oauth2Client.setCredentials({ access_token: API_KEY });
console.log('OAuth2Client:', oauth2Client);

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

async function uploadVideo(videoFilePath, title, description, tags) {
  try {
    const videoData = fs.readFileSync(videoFilePath);
    const videoStream = new stream.PassThrough().end(videoData); // Create a readable stream from the Buffer

    const res = await youtube.videos.insert({
      part: 'snippet,status',
      resource: {
        snippet: {
          title,
          description,
          tags,
        },
        status: {
          privacyStatus: 'private', // You can change this to 'public' or 'unlisted'
        },
      },
      media: {
        body: videoStream, // Use the readable stream here
      },
    });

    console.log(`Video uploaded! Video ID: ${res.data.id}`);
  } catch (error) {
    console.error('Error uploading video:', error.message);
  }
}

// Example usage:
const videoFilePath = path.join(__dirname, '..', 'videos', 'videoUrl-1707484961162-187916570.mp4');
const videoTitle = 'Talent Demo 1';
const videoDescription = 'Talent Demo description';
const videoTags = ['talent', 'hunt', 'talentdemo'];

uploadVideo(videoFilePath, videoTitle, videoDescription, videoTags);
