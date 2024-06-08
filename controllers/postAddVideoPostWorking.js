export const addVideoPost = (req, res) => {
  const cpUpload = uploadLocal.fields([{ name: 'videoUrl', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);
  cpUpload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    // Access uploaded files
    const videoFile = req.files['videoUrl'][0];
    const thumbnailFile = req.files['thumbnail'][0];

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
console.log("VIDEO PATH NAME: ", path.join(__dirname, '..', 'videos', req.videoFile))
console.log("THUMBNAIL PATH NAME: ", path.join(__dirname, '..', 'thumbnails', req.thumbnailFile))
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

       /*  const credentials = {
          email: 'mossy1k@gmail.com',
          pass: 'Olowo$jomuko_%agira1067',
          recoveryemail: 'mossy1000@gmail.com',
        };

        const videoOptions = {
          path: path.join(__dirname, '..', 'videos', req.videoFile),
          title: req.body.title,
          description: req.body.content,
          thumbnail: path.join(__dirname, '..', 'thumbnails', req.thumbnailFile),
          language: 'english',
          tags: ['Gbeng', 'gomsolutions'],
          playlist: 'Technology',
          channelName: 'Gbenga Omoyeni',
          onSuccess: (videoUrl) => {
            // Do something on success
            console.log('Your tech video has been successfully uploaded... The video URL is'+ videoUrl);
          },
          skipProcessingWait: true,
          onProgress: (progress) => {
            console.log('progress', progress);
          },
        }; */

        const credentials = {
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
          tags: ['talent', 'naijastreets'],
          playlist: 'Entertainment',
          isAgeRestriction: false,
          isNotForKid: false,
          publishType: 'PRIVATE',
          channelName: 'NaijaStreets',
          onSuccess: (videoUrl) => {
            // Do something on success
            console.log('Your tech video has been successfully uploaded... The video URL is'+ videoUrl);
          },
          skipProcessingWait: true,
          onProgress: (progress) => {
            console.log('progress', progress);
          },
        };

        // Returns uploaded video links in array
        //upload (credentials, [videoOptions]).then(console.log)
        upload(
          credentials,
          [videoOptions],
          {
            headless: false,
            timeout: 240000
          })
        .then(
          console.log
        );
        // YoutubeUpload(credentials, videoOptions);
        // End of Youtube Upload

        return res.status(200).json({
          status: true,
          data,
          message: "Your Talent Video Demo Post has been posted successfully.",
        });
      });
    });
  });
};
