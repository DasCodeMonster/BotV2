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
        if(!ytdata) throw new Error("An error occured while fetching playlist!");
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
    /**
     * 
     * @param {Message} message 
     * @param {String} query 
     */
    static async search(message, query){
        var svidfn = await util.promisify(youtubeV3.search.list);
        var sresult = await svidfn({
            part: "snippet",
            type: "video",
            maxResults: 5,
            q: query
        });
        if(!sresult) throw new Error("An error occured while searching gor videos!");       
        var messageBuilder = "you searched for: `" + querry + "`\n```"
            sresult.items.forEach((item, index) => {
                messageBuilder += `${index+1} Title: ${item.snippet.title} Channel:${item.snippet.channelTitle}\n`;
        });
        messageBuilder += "```type the number of the song to play\nRespond with ``cancel`` to cancel the command.\n"+
        "The command will automatically be cancelled in 30 seconds, unless you respond.";
        var commandmsg = await message.reply(messageBuilder);
        var responses = await message.channel.awaitMessages(replymsg=>{
            if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5){
                return true;
            }
            if (replymsg.author.id === message.author.id && message.content.toLowerCase() === "cancel") return true;
            else return false;
        }, {maxMatches:1, time:30000, errors: ["time"]});
        if(responses.first().content.toLowerCase() === 'cancel') {
            commandmsg.delete();
            return null;
        }
        var value;
        if(responses && responses.size === 1){
            value = Number.parseInt(responses.first().content)-1;
        }
        else {
            commandmsg.delete();
            return null;
        }
        await commandmsg.delete();
        return await getYoutube.Single("https://www.youtube.com/watch?v="+sresult.items[value].id.videoId, message);
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