const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const Song = require("./Song");
const {Message} = require("discord.js");
const q = require("q");
const util = require("util");
const youtubeV3 = google.youtube({ version: "v3", auth: keys.YoutubeAPIKey })

class getYoutube{
    /**
    * Returns a Song of the Video
    * @param {*} URL 
    * @param {Message} message
     */
    static async Single(URL, message) {
        var data = await ytdl.getInfo(URL).catch(err=>{console.error(err);return});
        if (!data) return;
        return new Song(data.video_id, data.title, data.description, data.author, data.length_seconds, message.member.id);
    }
    /**
     * Returns an array of Songs from all available Videos in the playlist
     * @param {String} playlistID The ID of the playlist to fetch
     * @param {Message} message The message the command was invoked from
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
        var vidDatafn = await util.promisify(youtubeV3.videos.list);
        var vidData = await vidDatafn({
            part: "snippet, contentDetails",
            id: ids.join(", ")
        });
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
        return songs;
    }
    static async search(){
        
    }
}
module.exports = getYoutube;

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