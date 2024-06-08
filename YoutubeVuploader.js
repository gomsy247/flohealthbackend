const fs = require('fs');
const { google } = require('googleapis');

const categoryIds = {
Entertainment: 24,
Education: 27,
ScienceTechnology: 28
}
const videoFilePath = './videoplayback.mp4'
const thumbFilePath = '../thumb.png'

function uploadVideo(auth, title, description, tags) {
let oauth2Client = new google.auth.OAuth2("158953543582-aikird8t9gm85t1mlg972204l0rhdnlj.apps.googleusercontent.com", "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", "localhost");
oauth2Client.setCredentials({ access_token: "ya29.a0AfB_byDv8Y6KR9mN1MO-ZggytPWRaJpR5Doj_WlqaeCmaH39ZbHeFpKWxo4zX36NpoWfYdYaupo1qhzO119foe-e9_Gm0Fz9ctUZ9l9H3Y3fllyuIb1j8sJPWgWMYXWAUNXaKuiMn0nTBzfWjvz4MMtN24isM3V1OZvfaCgYKAZESARASFQHGX2MimMwiIh_IYu8cvcAEQs9GLg0171" });

const service = google.youtube({
    version: 'v3',
    auth: oauth2Client
});
// const oauth2Client = new OAuth2("158953543582-aikird8t9gm85t1mlg972204l0rhdnlj.apps.googleusercontent.com", "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", "localhost");

// oauth2Client.setCredentials({
//     access_token: "ya29.a0AfB_byBlkvayDllVA0bwvqiDj_TLfGJskEcqpYEGwWgDxTp54XdPdU35CUek7cSo5J3V5XAcxS4bL7DPXG4wCM-fNFzNEdy4nrGp5nXYyQMCaOZ6ID-F9aFW2QkkFkc8WbhPlfpQBULDwZwooaqkuFt3NJ2lB7Fi-OCRaCgYKASoSARASFQHGX2Mi6zCK61ySM_w9KpCuLJRsPg0171"
// })

service.videos.insert({
    auth: oauth2Client,
    // auth: {
    //     access_token: "ya29.a0AfB_byBlkvayDllVA0bwvqiDj_TLfGJskEcqpYEGwWgDxTp54XdPdU35CUek7cSo5J3V5XAcxS4bL7DPXG4wCM-fNFzNEdy4nrGp5nXYyQMCaOZ6ID-F9aFW2QkkFkc8WbhPlfpQBULDwZwooaqkuFt3NJ2lB7Fi-OCRaCgYKASoSARASFQHGX2Mi6zCK61ySM_w9KpCuLJRsPg0171"
    // },
    // auth: "ya29.a0AfB_byBlkvayDllVA0bwvqiDj_TLfGJskEcqpYEGwWgDxTp54XdPdU35CUek7cSo5J3V5XAcxS4bL7DPXG4wCM-fNFzNEdy4nrGp5nXYyQMCaOZ6ID-F9aFW2QkkFkc8WbhPlfpQBULDwZwooaqkuFt3NJ2lB7Fi-OCRaCgYKASoSARASFQHGX2Mi6zCK61ySM_w9KpCuLJRsPg0171",
    part: 'snippet,status',
    requestBody: {
        snippet: {
            title,
            description,
            tags,
            categoryId: categoryIds.ScienceTechnology,
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
        },
        status: {
            privacyStatus: "private"
        },
    },
    media: {
        body: fs.createReadStream(videoFilePath),
    },
}, function (err, response) {
    if (err) {
        console.log('The API returned an error: ' + err);
        return;
    }
    console.log(response.data)

    console.log('Video uploaded. Uploading the thumbnail now.')
    service.thumbnails.set({
        auth: auth,
        videoId: response.data.id,
        media: {
            body: fs.createReadStream(thumbFilePath)
        },
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(response.data)
    })
})
}
