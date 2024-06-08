import { upload } from 'youtube-videos-uploader';

/* interface Credentials {
  email: string;
  pass: string;
  recoveryemail?: string;
}

interface CustomVideoOptions{
  path?: string;
  description?: string;
  title?: string;
  thumbnail?: string;
  language?: string;
  tags?: string[];
  playlist?: string;
  channelName?: string;
  onSuccess?: (videoUrl: any) => void;
  skipProcessingWait?: boolean;
  onProgress?: (progress: any) => void;
} */

export function YoutubeUpload(video, credentials) {
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
}

const credentials = {
  email: 'naijastreets.nig@gmail.com',
  pass: 'Osekoko@27',
  recoveryemail: 'mossy1000@gmail.com',
};

const videoOptions = {
  path: 'video2.mp4',
  title: 'title 2',
  description: 'description 2',
  thumbnail: 'thumbnail.png',
  language: 'english',
  tags: ['video', 'github'],
  playlist: 'playlist name',
  channelName: 'Channel Name',
  onSuccess: (videoUrl) => {
    // Do something on success
    console.log('Your talent video has been successfully uploaded...');
  },
  skipProcessingWait: true,
  onProgress: (progress) => {
    console.log('progress', progress);
  },
};

YoutubeUpload(credentials, videoOptions);
