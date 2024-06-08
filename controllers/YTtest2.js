import { upload } from 'youtube-videos-uploader' //Typescript
//OR
//const { upload } = require('youtube-videos-uploader'); //vanilla javascript

// recoveryemail is optional, only required to bypass login with recovery email if prompted for confirmation
const credentials = { email: 'naijastreets.nig@gmail.com', pass: 'Osekoko@27', recoveryemail: 'mossy1000@gmail.com' }


// minimum required options to upload video
//const video1 = { path: 'video1.mp4', title: 'title 1', description: 'description 1' }

const onVideoUploadSuccess = (videoUrl) => {
    // ..do something..
}
// Extra options like tags, thumbnail, language, playlist etc
const video2 = { path: 'C:/Users/Master/Desktop/SSDBACKUP/GM/PROJECTS/Laravel Projects/ionic/ionic-react-naijastreets-app-mobilendesktop/api/videoUrl-1707485955365-991980027.mp4', title: 'title 2', description: 'description 2', /* thumbnail:'thumbnail.png', */ language: 'english', tags: ['talent', 'talent demo'], playlist: 'Entertainment', channelName: 'NaijaStreets', onSuccess:onVideoUploadSuccess, skipProcessingWait: true, onProgress: (progress) => { console.log('progress', progress) }, uploadAsDraft: false, isAgeRestriction: false, isNotForKid: false, publishType: 'PRIVATE', isChannelMonetized: false }


// Returns uploaded video links in array
upload (credentials, [video2]).then(console.log)

// OR
// This package uses Puppeteer, you can also pass Puppeteer launch configuration
upload (
  credentials,
  [video2], {headless:false}).then(console.log)

// Refer Puppeteer documentation for more launch configurations like proxy etc
// https://pptr.dev/#?product=Puppeteer&version=main&show=api-puppeteerlaunchoptions
