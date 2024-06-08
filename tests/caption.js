import axios from 'axios';

const options = {
  method: 'GET',
  url: 'https://youtube-v31.p.rapidapi.com/commentThreads',
  params: {
    part: 'snippet',
    videoId: 'QS2Rr8DdBn0',
    maxResults: '100'
  },
  headers: {
    'X-RapidAPI-Key': '0bb66a01dfmsh4a62ef445153104p1330f0jsn3e8263b36958',
    'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com'
  }
};

try {
	const response = await axios.request(options);
	console.log(response.data);
} catch (error) {
	console.error(error);
}
