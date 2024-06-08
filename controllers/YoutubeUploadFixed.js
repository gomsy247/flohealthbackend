import { upload } from 'youtube-videos-uploader';

export function YoutubeUpload(credentials, video) {
  if (!video || !video.path) {
    console.error('Video parameter or path is undefined.');
    return;
  }

  upload(credentials, [video])
    .then((result) => {
      console.log(result);
      if (video.onSuccess) {
        video.onSuccess(result);
      }
    })
    .catch((error) => {
      console.error(error);
    });
    // This package uses Puppeteer, you can also pass Puppeteer launch configuration
  upload (credentials, [video], {headless:false}).then(console.log)
}

// Example usage:
/*
const credentials = {
  email: 'naijastreets.nig@gmail.com',
  pass: 'Osekoko@27',
  recoveryemail: 'mossy1000@gmail.com',
};

const videoOptions = {
  path: '../videos/videoUrl-1707223631539-789966398.mp4',
  title: 'title 2',
  description: 'description 2',
  thumbnail: '../thumbnails/thumbnail-1707223631810-969143893.jpeg',
  language: 'english',
  tags: ['naijastreets', 'talent video'],
  playlist: 'Entertainment',
  channelName: 'NaijaStreets',
  onSuccess: (videoUrl) => {
    // Do something on success
    console.log('Your talent video has been successfully uploaded... The video url is: '+videoUrl);
  },
  skipProcessingWait: true,
  onProgress: (progress) => {
    console.log('progress', progress);
  },
}; */

//YoutubeUpload(credentials, videoOptions);
