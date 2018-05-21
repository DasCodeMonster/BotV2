const {google} = require("googleapis");
const Song = require("./Song");
const {Message, RichEmbed} = require("discord.js");
const moment = require("moment");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class Youtube {
    /**
     * 
     * @param {String} APIKEY 
     * @requires ytdl-core
     */
    constructor(APIKEY){
        this.youtube = google.youtube({version: "v3", auth: APIKEY});
        this.ytdl = require("ytdl-core");
    }
    /**
     * 
     * @param {String} URL 
     * @param {Message} message 
     */
    async single(URL, message){
        try {
            let data = await this.ytdl.getInfo(URL);
            if (!data) {
                throw new Error("Could not fetch video data");
            }
            let songlength = Number.parseInt(data.length_seconds);
            return new Song(data.video_id, data.title, data.description, data.author.name, data.author.id, songlength, data.thumbnail_url, message.author.id);
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * Returns an array of Songs from all available Videos in the playlist
     * @param {String} playlistID The ID of the playlist to fetch
     * @param {Message} message The message the command was invoked from
     */
    async playlist(playlistID, message){
        try {
            /**
             * @type {Song[]}
            */
            let songs = [];
            let ids = [];
            let nextPageToken;
            let ytdata = await this.youtube.playlistItems.list({
                part: "snippet",
                playlistId: playlistID,
                maxResults: "50"
            });
            if(!ytdata) throw new Error("An error occured while fetching playlist!");
            nextPageToken = ytdata.data.nextPageToken;
            ytdata.data.items.forEach(item=>{
                ids.push(item.snippet.resourceId.videoId);
            });
            let vidData = await this.youtube.videos.list({
                part: "snippet, contentDetails",
                id: ids.length>1?ids.join(", "):ids[0]
            });
            vidData.data.items.forEach(item=>{
                songs.push(song(item, message));
            });
            while(nextPageToken){
                ids = [];
                ytdata = await this.youtube.playlistItems.list({
                    part: "snippet",
                    playlistId: playlistID,
                    maxResults: "50",
                    pageToken: nextPageToken
                });
                nextPageToken = ytdata.data.nextPageToken;
                ytdata.data.items.forEach(item=>{
                    ids.push(item.snippet.resourceId.videoId);
                });
                vidData = await this.youtube.videos.list({
                    part: "snippet, contentDetails",
                    id: ids.join(", ")
                });
                vidData.data.items.forEach(item=>{
                    songs.push(song(item, message));
                });
            }
            return songs;
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * Return an Array of Songs of videos which were listed by youtube as result of the search with the given query
     * @param {Message} message 
     * @param {String} query 
     */
    async search(message, query){
        try {
            let sresult = await this.youtube.search.list({
                part: "snippet",
                type: "video",
                maxResults: 5,
                q: query
            });
            if(!sresult) throw new Error("An error occured while searching for videos!"); 
            let ids = [];
            sresult.data.items.forEach(item=>{
                ids.push(item.id.videoId);
            });
            let vidData = await this.youtube.videos.list({
                part: "snippet, contentDetails",
                id: ids.join(", ")
            });
            if(!vidData) throw new Error("An error occured while searching for videos!"); 
            /**
             * @type {Song[]}
             */
            let songs = [];
            vidData.data.items.forEach(item=>{
                songs.push(song(item, message));
            });
            return songs;
        } catch (e) {
            console.log(e);
        }
    }
}
module.exports = Youtube;
/**
 * 
 * @param {Message} message 
 * @param {*} item 
 */
function song(item, message) {
    var duration = moment.duration(item.contentDetails.duration, moment.ISO_8601).asSeconds();
    var thumbnail;
    if(item.snippet.thumbnails.maxres) thumbnail = item.snippet.thumbnails.maxres.url;
    else if(item.snippet.thumbnails.standard) thumbnail = item.snippet.thumbnails.standard.url;
    else if(item.snippet.thumbnails.high) thumbnail = item.snippet.thumbnails.high.url;
    else if(item.snippet.thumbnails.medium) thumbnail = item.snippet.thumbnails.medium.url;
    else if(item.snippet.thumbnails.default) thumbnail = item.snippet.thumbnails.url;
    var song = new Song(item.id, item.snippet.title, item.snippet.description, item.snippet.channelTitle, item.snippet.channelId, duration, thumbnail, message.member.id);
    return song;
} 