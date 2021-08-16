const Twitter = require('twitter');
const config = require('./.config.json');
const request = require('request');
const fs = require('fs');

const client = new Twitter(config.twitter);
const downloadPath = config.download_path;
const screenName = config.screen_name;

const params = {
  screen_name: screenName,
  include_entities: 'media.fields',
  count: 10
};

function getImages(){
  return new Promise((resolve, reject) => {

    client.get('statuses/user_timeline', params, function(error, tweets) {
      if (error) {
        reject(error);
      }

      const images = tweets
        .filter(tweet => tweet.extended_entities)
        .flatMap(tweet => tweet.extended_entities.media.map(media => media.media_url));

      resolve(images);
    });
  });
}

function getNameFromUrl(url){
  return url.match(/([^\/]+?)$/)[1];
}

function download(url){
  return new Promise((resolve, reject) => {
    request(url, {encoding: null}, function (error, response, body) {
      if(error){
        reject(error);
      }
      resolve(body);
    });
  });
}


(async ()=>{
  try{
    const urls = await getImages();

    for(const url of urls){
      console.log('download: ' + url);
      const filePath = downloadPath + getNameFromUrl(url);

      try {
        fs.accessSync(filePath);
        console.log('skip: ' + url);

      }catch(e){

        const body = await download(url);
        fs.writeFileSync(filePath, body);
        console.log('completed: ' + url);
      }
    }

  }catch(e){
    console.log(e);
  }
})();
