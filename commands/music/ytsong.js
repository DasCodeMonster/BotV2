const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const {Message} = require("discord.js");
const q = require("q");
/**
 * 
 * @param {*} id 
 * @param {Message} message 
 * @param {function(Array):void} callback
 */
class getYoutube{
    Single(id, message, callback){
        var deferred = q.defer();
        console.list("hey");
        youtubeV3.videos.list({
            part: "snippet, contentDetails",
            id: id
        }, (err, data)=>{
            if (err) deferred.reject(new Error("An Error occurred: "+err));return;
            data.items.forEach(item => {
                console.list(deferred);
                deferred.resolve(this.song(message, item));
                console.list(deferred);
            });
        });
        return deferred.promise;
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} item 
     */
    song(message, item) {
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
        var song = new Song(item.id, item.snippet.title, item.snippet.channelTitle, tmp, message.member.id);
        return song;
    }
}
module.exports = getYoutube;
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
function song(message, item) {
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
    var song = new Song(item.id, item.snippet.title, item.snippet.channelTitle, tmp, message.member.id);
    return song;
}