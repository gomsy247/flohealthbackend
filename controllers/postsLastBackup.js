import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import multer from 'multer';
import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { upload } from 'youtube-videos-uploader' //Typescript

// Get the absolute path of the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure Multer storage using diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination folder based on file type
    if (file.mimetype.startsWith('video/')) {
      //cb(null, '../videos'); // Adjust the destination path as needed
      const uploadVideo = path.join(__dirname, '..', 'videos'); // Modify the path as needed
      cb(null, uploadVideo);
    } else if (file.mimetype.startsWith('image/')) {
      //cb(null, '../photos'); // Adjust the destination path as needed
      const uploadPhoto = path.join(__dirname, '..', 'thumbnails'); // Modify the path as needed
      cb(null, uploadPhoto);
    } else {
      cb(new Error('Invalid file type. Please upload a video or an image.'), false);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename or use the original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop();

    // Store the file information in variables
    if (file.mimetype.startsWith('video/')) {
      req.videoFile = filename;
    } else if (file.mimetype.startsWith('image/')) {
      req.thumbnailFile = filename;
    }

    cb(null, filename);
  },
});

// Initialize Multer with the configured storage
const uploadLocal = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check file types, adjust as needed
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a video or an image.'), false);
    }
  },
});


export const addVideoPost = (req, res) => {
  const cpUpload = uploadLocal.fields([{ name: 'videoUrl', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);
  cpUpload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    // Access uploaded files
    //const videoFile = req.files['videoUrl'][0];
    //const thumbnailFile = req.files['thumbnail'][0];

    // Assuming you have a valid token in the request headers
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json("Not logged in!");

    jwt.verify(token, "secretkey", (err, userInfo) => {
      if (err) return res.status(403).json("Token is not valid!");

      // Construct the database query
      const q =
        "INSERT INTO videoposts (`content`, `title`, `subtitle`, `videourl`, `thumbnail`, `userId`, `createdAt`) VALUES (?)";
      const values = [
        req.body.content,
        req.body.title,
        req.body.subtitle,
        req.videoFile, // Use videoFile.originalname instead of req.body.videourl
        req.thumbnailFile,
        userInfo.id,
        moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      ];

      // Execute the query (adjust as needed)
      db.query(q, [values], (err, data) => {
        if (err) return res.status(500).json(err);
      //console.log("VIDEO PATH NAME: ", path.join(__dirname, '..', 'videos', req.videoFile))
     // console.log("THUMBNAIL PATH NAME: ", path.join(__dirname, '..', 'thumbnails', req.thumbnailFile))
              // Start Upload to Youtube
       /*  const credentials = {
          email: 'naijastreets.nig@gmail.com',
          pass: 'Osekoko@27',
          recoveryemail: 'mossy1000@gmail.com',
        };

        const videoOptions = {
          path: path.join(__dirname, '..', 'videos', req.videoFile),
          title: req.body.title,
          description: req.body.content,
          thumbnail: path.join(__dirname, '..', 'thumbnails', req.thumbnailFile),
          language: 'english',
          tags: ['naijastreets Talent Demo', 'Talent Video'],
          playlist: 'Entertainment',
          channelName: 'NaijaStreets',
          onSuccess: (videoUrl) => {
            // Do something on success
            console.log('Your talent video has been successfully uploaded... The video URL is'+ videoUrl);
          },
          skipProcessingWait: true,
          onProgress: (progress) => {
            console.log('progress', progress);
          },
        };
        */
        console.log("REQ BODY", req.body)

        /*  const credentials = {
          email: 'mossy1k@gmail.com',
          pass: 'Olowo$jomuko_%agira1067',
          recoveryemail: 'mossy1000@gmail.com',
        };

        const onVideoUploadSuccess = (videoUrl) => {
          // ..return the status and the message to the frontend..
          return res.status(200).json({
            status: true,
            data,
            videoUrl,
            message: "Your Talent Video Demo Post has been posted successfully.",
          });
        }

        const video2 = {
          path: path.join(__dirname, '..', 'videos', req.videoFile),
          title: req.body.title,
          description: req.body.content,
          //thumbnail: '',/* path.join(__dirname, '..', 'thumbnails', req.thumbnailFile), *
          language: 'english',
          tags: ['Gbeng', 'gomsolutions'],
          playlist: 'Technology',
          //privacyStatus: "private",
          publishType: 'PUBLIC',
          channelName: 'Gbenga Omoyeni',
          onSuccess:onVideoUploadSuccess,
          skipProcessingWait: true,
          onProgress: (progress) => { console.log('progress', progress) },
          //uploadAsDraft: false,
          //isAgeRestriction: false,
          //isNotForKid: false,
          //isChannelMonetized: false
        }; */

        /*   const videoOptions = {
          path: path.join(__dirname, '..', 'videos', req.videoFile),
          title: req.body.title,
          description: req.body.content,
        }; */

        const credentials = {
          email: 'naijastreets.nig@gmail.com',
          pass: 'Oloriade@27',
          recoveryemail: 'mossy1000@gmail.com',
        };

        const onVideoUploadSuccess = (videoUrl) => {
          // ..return the status and the message to the frontend..
          return res.status(200).json({
            status: true,
            data,
            videoUrl,
            message: "Your Talent Video Demo Post has been posted successfully.",
          });
        }

        // Extra options like tags, thumbnail, language, playlist etc
        const video2 = {
          path: path.join(__dirname, '..', 'videos', req.videoFile),
          title: req.body.title,
          description: req.body.content,
          thumbnail:'',
          language: 'english',
          tags: ['talent', 'naijastreets'],
          playlist: req.body.playlist,
          //privacyStatus: "private", // Set privacy status to private
          publishType: 'PUBLIC',
          channelName: 'NaijaStreets',
          onSuccess:onVideoUploadSuccess,
          skipProcessingWait: true,
          onProgress: (progress) => { console.log('progress', progress) },
          /* uploadAsDraft: false,
          isAgeRestriction: false,
          isNotForKid: false,
          isChannelMonetized: false */
        }


        // Returns uploaded video links in array
        //upload (credentials, [videoOptions]).then(console.log)
        upload(
          credentials,
         // [videoOptions, video2],
          [video2],
          {
            headless: true,
            timeout: 400000,
          })
        .then(
          console.log
        );
        // YoutubeUpload(credentials, videoOptions);
        // End of Youtube Upload

      });
    });
  });
};
export const getPosts = (req, res) => {
  const userId = req.query.userId;
  //const token = req.cookies.accessToken;
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    console.log(userId);

    const q =
      userId !== "undefined"
        ? `SELECT p.*, u.id AS userId, name, profilePic FROM videoposts AS p JOIN users AS u ON (u.id = p.userId) WHERE p.userId = ? ORDER BY p.createdAt DESC`
        : `SELECT p.*, u.id AS userId, name, profilePic FROM videoposts AS p JOIN users AS u ON (u.id = p.userId)
    LEFT JOIN relationships AS r ON (p.userId = r.followedUserId) WHERE r.followerUserId= ? OR p.userId =?
    ORDER BY p.createdAt DESC`;

    const values =
      userId !== "undefined" ? [userId] : [userInfo.id, userInfo.id];

    db.query(q, values, (err, data) => {
      if (err) return res.status(500).json(err);
      console.log("DATA", data)
      return res.status(200).json(data);
    });
  });
};

export const getAllTalentVideoPosts = async (req, res) => {
  try {
    const userId = req.query.userId;
    // const token = req.cookies.accessToken;
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).json("Not logged in!");

    const userInfo = await new Promise((resolve, reject) => {
      jwt.verify(token, "secretkey", (err, decoded) => {
        if (err) reject("Token is not valid!");
        resolve(decoded);
      });
    });

    console.log(userId);

    const q = userId !== undefined
      ? "SELECT * FROM videoposts WHERE userId = ? ORDER BY createdAt DESC"
      : "SELECT * FROM videoposts ORDER BY createdAt DESC";

    const values = userId !== undefined ? [userId] : [];

    db.query(q, values, (err, data) => {
      if (err) return res.status(500).json(err);
      console.log("DATA", data);
      return res.status(200).json(data);
    });
  } catch (error) {
    return res.status(403).json(error);
  }
};


export const addPost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q =
      "INSERT INTO posts(`desc`, `img`, `createdAt`, `userId`) VALUES (?)";
    const values = [
      req.body.desc,
      req.body.img,
      moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      userInfo.id,
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json("Post has been created.");
    });
  });
};

export const deletePost = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "secretkey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    const q =
      "DELETE FROM posts WHERE `id`=? AND `userId` = ?";

    db.query(q, [req.params.id, userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if(data.affectedRows>0) return res.status(200).json("Post has been deleted.");
      return res.status(403).json("You can delete only your post")
    });
  });
};
