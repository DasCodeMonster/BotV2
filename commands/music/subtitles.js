const commando = require("discord.js-commando");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});

class Subtitles extends commando.Command {
    constructor(client) {
        super(client, {
            name: "subtitles",
            aliases: ["sub"],
            group: "music",
            memberName: "subtitles",
            description: "shows the subtiles for the current song if one is existing",
            guildOnly: true
        });
    }
    async run(msg, args) {
        youtubeV3.captions.list({
            "part": "snippet",
            'videoId': '1UeMVfHN2P8'
        }, (err, data)=>{
            if (err) {
                console.log(err);
                return;
            }
            else if (data){
                console.log(data); 
                console.log(data.items[0].snippet);
                var id = data.items[0].id;
                youtubeV3.captions.download({
                    "id": id
                }, (err, data)=>{
                    if (err) {
                        console.log(err);
                        return;
                    }
                    else if(data){
                        console.log(data);
                        return;
                    }
                })
            }
        });
    }
    hasPermission(msg) {
        return false;
    }
}
module.exports = Subtitles;