const {ArgumentType} = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../tokens');
const {google} = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
// const Q = require("q")

class YTlink extends ArgumentType {
    constructor(client) {
        super(client, "ytlink");
    }
    validate(value, msg, arg) {
        if (ytdl.validateURL(value)) return ytdl.validateURL(value);
        else {
            var ID = value.split(/(list=)+/)[2];
            return tube(ID);
        }
    }
    parse(value) {
        if (ytdl.validateURL(value)) {
            var retvar = value;
            var ID = value.split(/(v=)+/)[2];
            ID = ID.split(/([&])+/)[0];
            // return [ID, "single"];
            return {type: "single", id: ID, link: retvar}
        } 
        else {
            if (this.validate(value)) {
                ID = value.split(/(list=)+/)[2];
                // return [ID, "list"];
                return {type: "list", id: ID}
            }
            else throw new Error("Invalid link!");
        }
    }
}

function tube(ID) {
    let prom = new Promise((res, rej)=>{
        youtubeV3.playlistItems.list({
            part: "snippet",
            playlistId: ID,
            maxResults: "5"
        }, (err, data) => {
            if(err) {
                res(false);
            }
            if(data){
                res(true);
            }
        });
    });
    return prom;
}
module.exports = YTlink;