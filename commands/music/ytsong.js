const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const Song = require("./Song");
const {Message} = require("discord.js");
const q = require("q");
const promise = require("bluebird");
const wait = require("wait.for");
const util = require("util");
//const youtubeV3 = promise.promisifyAll(google.youtube({ version: "v3", auth: keys.YoutubeAPIKey }));
const youtubeV3 = google.youtube({ version: "v3", auth: keys.YoutubeAPIKey })

class getYoutube{
    /**
    * 
    * @param {*} URL 
    * @param {Message} message
     */
    static async Single(URL, message) {
        var data = await ytdl.getInfo(URL);
        return new Song(data.video_id, data.title, data.description, data.author, data.length_seconds, message.member.id);
    }
    /**
     * 
     * @param {String} playlistID 
     * @param {Message} message 
     */
    static async Playlist(playlistID, message) {
        /**
         * @type {Song[]}
         */
        var songs = [];
        var ids = [];
        var nextPageToken;
        var ytitems = await util.promisify(youtubeV3.playlistItems.list);
        var ytdata = await ytitems({
            part: "snippet",
            playlistId: playlistID,
            maxResults: "50"
        });
        nextPageToken = ytdata.nextPageToken;
        ytdata.items.forEach(item=>{
            ids.push(item.snippet.resourceId.videoId);
        });
        console.log(ids.length);
        // var i = 0;
        // for(let item of ytdata.items){
        //     let dldata = await ytdl.getInfo("https://www.youtube.com/watch?v="+item.snippet.resourceId.videoId).catch(err=>{console.error(err);});
        //     // console.log(err);
        //     if(!dldata) continue;
        //     songs.push(new Song(dldata.video_id, dldata.title, dldata.description, dldata.author, dldata.length_seconds, message.member.id));
        //     console.log(++i);
        // }

        var vidDatafn = await util.promisify(youtubeV3.videos.list);
        var vidData = await vidDatafn({
            part: "snippet, contentDetails",
            id: ids.join(", ")
        });
        console.log(vidData);
        // console.log(vidData.items);
        vidData.items.forEach(item=>{
            songs.push(song(item, message));
        });

        while(nextPageToken){
            let ids = [];
            let ytdata = await ytitems({
                part: "snippet",
                playlistId: playlistID,
                maxResults: "50",
                pageToken: nextPageToken
            });
            nextPageToken = ytdata.nextPageToken;
            ytdata.items.forEach(item=>{
                ids.push(item.snippet.resourceId.videoId);
            });
            let vidDatafn = await util.promisify(youtubeV3.videos.list);
            let vidData = await vidDatafn({
                part: "snippet, contentDetails",
                id: ids.join(", ")
            });
            vidData.items.forEach(item=>{
                songs.push(song(item, message));
            });
        }
        // console.log(ytdata);
        console.log(songs.length);
        return songs;
    }
}
module.exports = getYoutube;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

async function fetchAllPages(listId, PageToken) {
    var ytitems = await util.promisify(youtubeV3.playlistItems.list);
    var ytdata = await ytitems({
        part: 'snippet',
        playlistId: listId,
        maxResults: "50",
        pageToken: PageToken
    })
    return nextPageResults;
    return songs;
}

function Single(id, message){
    var deferred = q.defer();
    youtubeV3.videos.list({
        part: "snippet, contentDetails",
        id: id
    }, (err, data)=>{
        if (err) deferred.reject(new Error("An Error occurred: "+err));return;
        data.items.forEach(item => {
            deferred.resolve(song(message, item)); 
        });
    });
    return deferred.promise;
}
/**
 * 
 * @param {Message} message 
 * @param {*} item 
 */
function song(item, message) {
    var match = /PT((\d+)H)?((\d+)M)?((\d+)S)?/.exec(item.contentDetails.duration)
    var tmp = ""
    if (match[2]) {
        tmp += match[2] + ":"
    }
    if (match[4]) {
        tmp += ("00" + match[4]).slice(-2) + ":"
    } else {
        tmp += "00:"
    }
    if (match[6]) {
        tmp += ("00" + match[6]).slice(-2)
    } else {
        tmp += "00"
    }
    var song = new Song(item.id, item.snippet.title, item.snippet.description, item.snippet.channelTitle, tmp, message.member.id);
    return song;
}