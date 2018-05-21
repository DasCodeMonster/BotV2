const {ArgumentType} = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require("./../tokens");
const {google} = require("googleapis");
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
// const Q = require("q")

class YTlink extends ArgumentType {
    constructor(client) {
        super(client, "ytlink");
    }
    async validate(value, msg, arg) {
        if (ytdl.validateURL(value)) return ytdl.validateURL(value);
        else {
            var ID = value.split(/(list=)+/)[2];
            return await tube(ID);
        }
    }
    /**
     * 
     * @param {String} value 
     */
    async parse(value) {
        let valid = await this.validate(value);
        if(!valid) throw new Error("Not a valid Link");
        if (ytdl.validateURL(value)) {
            let ID = value.split(/(v=)+/)[2];
            ID = ID.split(/([&])+/)[0];
            // return [ID, "single"];
            return {type: "single", id: ID, link: value};
        } 
        else {
            let ID = value.split(/(list=)+/)[2];
            // return [ID, "list"];
            return {type: "list", id: ID, link: value};
        }
    }
}

function tube(ID) {
    /**
     * @type {Promise<Boolean>}
     */
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