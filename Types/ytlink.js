const ArgumentType = require("../node_modules/discord.js-commando/src/types/base");
const ytdl = require("ytdl-core");
const keys = require('./../Token&Keys');
const {google} = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Q = require("q")

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
            return {"type":"single", "id":ID, "link":retvar}
        } 
        else {
            if (this.validate(value)) {
                ID = value.split(/(list=)+/)[2];
                // return [ID, "list"];
                return {"type":"list", "id":ID}
            }
            else throw new Error("Invalid link!");
        }
    }
}

function tube(ID) {
    var deferred = Q.defer();
    youtubeV3.playlistItems.list({
        part: "snippet",
        playlistId: ID,
        maxResults: "5"
    }, (err, data) => {
        if(err) {
            deferred.resolve(false)
        }
        if(data){
            deferred.resolve(true)
        }
    });
    return deferred.promise
}
module.exports = YTlink;