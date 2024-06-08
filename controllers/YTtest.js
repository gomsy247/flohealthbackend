import { upload } from 'youtube-videos-uploader' //Typescript
//OR
//const { upload } = require('youtube-videos-uploader'); //vanilla javascript

// recoveryemail is optional, only required to bypass login with recovery email if prompted for confirmation
const credentials = { email: 'naijastreets.nig@gmail.com', pass: 'Osekoko@27', recoveryemail: 'mossy1000@gmail.com' }

// minimum required options to upload video
const video1 = { path: 'C:/Users/Master/Desktop/SSDBACKUP/GM/PROJECTS/Laravel Projects/ionic/ionic-react-naijastreets-app-mobilendesktop/api/videoUrl-1707485955365-991980027.mp4', title: 'naijastreets talent demo 1', description: 'naijastreets talent demo desc 1' }

const onVideoUploadSuccess = (videoUrl) => {
    // ..do something..
}
// Extra options like tags, thumbnail, language, playlist etc
const video2 = { path: 'C:/Users/Master/Desktop/SSDBACKUP/GM/PROJECTS/Laravel Projects/ionic/ionic-react-naijastreets-app-mobilendesktop/api/videos/videoUrl-1707484961162-187916570.mp4', title: 'naijastreets talent demo 2', description: 'naijastreets talent demo desc 2', thumbnail:'../thumbnails/thumbnails/thumbnail-1707223631810-969143893.jpeg', language: 'english', tags: ['video', 'github'], playlist: 'Entertainment', channelName: 'NaijaStreets', onSuccess:onVideoUploadSuccess, skipProcessingWait: true, onProgress: (progress) => { console.log('progress', progress) }, uploadAsDraft: false, isAgeRestriction: false, isNotForKid: false, publishType: 'PUBLIC', isChannelMonetized: false }


// Returns uploaded video links in array
upload (credentials, [video1, video2]).then(console.log)

// OR
// This package uses Puppeteer, you can also pass Puppeteer launch configuration
upload (credentials, [video1, video2], {headless:false}).then(console.log)

// Refer Puppeteer documentation for more launch configurations like proxy etc
// https://pptr.dev/#?product=Puppeteer&version=main&show=api-puppeteerlaunchoptions
