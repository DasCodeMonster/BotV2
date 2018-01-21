const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const Song = require("./Song");
const {Message, RichEmbed} = require("discord.js");
const q = require("q");
const util = require("util");
const moment = require("moment");
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
        // return new Song(data.video_id, data.title, data.description, data.author, data.length_seconds, message.member.id);
        // return new Song(data.video_id, data.title, data.description, data.author.name, data.author.id, data.length_seconds, data.thumbnail_url, message.author.id);
        return new Song(data.video_id, data.title, data.description, data.author.name, data.author.id, data.length_seconds, data.thumbnail_url, message.author.id);
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
            id: ids.length>1?ids.join(", "):ids[0]
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
        if(!sresult) throw new Error("An error occured while searching for videos!"); 
        // console.log(sresult.items);
        var ids = [];
        sresult.items.forEach(item=>{
            ids.push(item.id.videoId);
        });
        let vidDatafn = await util.promisify(youtubeV3.videos.list);
        let vidData = await vidDatafn({
            part: "snippet, contentDetails",
            id: ids.join(", ")
        });
        if(!vidData) throw new Error("An error occured while searching for videos!"); 
        /**
         * @type {Song[]}
         */
        var songs = [];
        vidData.items.forEach(item=>{
            songs.push(song(item, message));
        });
        // console.log(songs);
        return songs;
        // var embed = new RichEmbed({
        //     title: "Search result:"
        // }).setTimestamp(new Date()).setDescription("Type the number of the song you want to play NOW or copy the link, `cancel` the command, and add it to the manually")
        // .setColor(666);
        // sresult.items.forEach((item, index)=>{
        //     embed.addField(`${index+1} ${item.snippet.title}`, `Titel: [${item.snippet.title}](https://www.youtube.com/watch?v=${item.id.videoId})\nChannel: [${item.snippet.channelTitle}](https://www.youtube.com/channel/${item.snippet.channelId})\n`);
        // });
        // var commandmsg = await message.channel.send({embed: embed});
        // var responses = await message.channel.awaitMessages(replymsg=>{
        //     if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5){
        //         return true;
        //     }
        //     if (replymsg.author.id === message.author.id && message.content.toLowerCase() === "cancel") {
        //         return true;
        //     }
        //     else return false;
        // }, {maxMatches:1, time:30000, errors: ["time"]});
        // if(responses.first().content.toLowerCase() === 'cancel') {
        //     commandmsg.delete();
        //     return null;
        // }
        // var set = new Set(["queueadd", "qa", "qadd"])
        // if(set.has(responses.first().content.toLowerCase()){
        //     qres = await message.channel.awaitMessages(remsg=>{
        //         if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)){
        //     })
        // }
    //     var value;
    //     if(responses && responses.size === 1){
    //         value = Number.parseInt(responses.first().content)-1;
    //     }
    //     else {
    //         commandmsg.delete();
    //         return null;
    //     }
    //     await commandmsg.delete();
    //     return await getYoutube.Single("https://www.youtube.com/watch?v="+sresult.items[value].id.videoId, message);
    }
}
module.exports = getYoutube;

/**
 * 
 * @param {Message} message 
 * @param {*} item 
 */
function song(item, message) {
    var duration = moment.duration(item.contentDetails.duration, moment.ISO_8601).asSeconds();
    console.log(item.snippet.thumbnails);
    var thumbnail;
    if(item.snippet.thumbnails.maxres) thumbnail = item.snippet.thumbnails.maxres.url;
    else if(item.snippet.thumbnails.standard) thumbnail = item.snippet.thumbnails.standard.url;
    else if(item.snippet.thumbnails.high) thumbnail = item.snippet.thumbnails.high.url;
    else if(item.snippet.thumbnails.medium) thumbnail = item.snippet.thumbnails.medium.url;
    else if(item.snippet.thumbnails.default) thumbnail = item.snippet.thumbnails.url;
    var song = new Song(item.id, item.snippet.title, item.snippet.description, item.snippet.channelTitle, item.snippet.channelId, duration, thumbnail, message.member.id);
    return song;
}