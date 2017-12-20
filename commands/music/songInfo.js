const commando = require("discord.js-commando");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});

class SongInfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "songinfo",
            aliases: ["si"],
            group: "music",
            memberName: "songinfo",
            description: "Gives detailed information about the current song or a song in queue.",
            guildOnly: true,
            args: [{
                key: "number",
                label: "songnumber",
                prompt: "",
                type: "integer",
                default: 0,
                infinite: false,
                min: 0
            }],
            argsPromptLimit: 0
        });
        this.queue = [];
    }
    async run(message, args) {
        if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 0) this.queue = await this.client.provider.get(message.guild, "queue");
        if (args.number > this.queue.length-1) return;
        youtubeV3.videos.list({
            part: "snippet, contentDetails",
            id: this.queue[args.number].ID
        }, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            else {
                if (data.items[0].snippet.thumbnails.maxres) var img = data.items[0].snippet.thumbnails.maxres;
                else if(data.items[0].snippet.thumbnails.high) var img = data.items[0].snippet.thumbnails.high;
                else if(data.items[0].snippet.thumbnails.standard) var img = data.items[0].snippet.thumbnails.standard;
                else var img = data.items[0].snippet.thumbnails.default;
                // youtubeV3.
                var estimated = 0;
                var hours = 0;
                var mins = 0;
                var secs = 0;
                if (args.number != 0) {
                    var first;
                    this.queue.some((song, index) => {
                        if (index == 0) {
                            first = song;
                            return false;
                        }
                        if (index == args.number) {
                            return true;
                        }
                        console.log(song.length.split(":"));
                        if(song.length.split(":").length == 3) {
                            hours += parseInt(song.length.split(":")[0]);
                            mins += parseInt(song.length.split(":")[1]);
                            secs += parseInt(song.length.split(":")[2]);
                        }
                        if (song.length.split(":").length == 2) {
                            mins += parseInt(song.length.split(":")[0]);
                            secs += parseInt(song.length.split(":")[1]);
                        }
                        return false;
                    });
                    if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
                        console.log(message.guild.voiceConnection.dispatcher.time);
                        console.log(Math.floor((message.guild.voiceConnection.dispatcher.time/1000)/60));
                        console.log(Math.floor((message.guild.voiceConnection.dispatcher.time/1000)%60));
                        var fmins = Math.floor((message.guild.voiceConnection.dispatcher.time/1000)/60);
                        var fsecs = Math.floor((message.guild.voiceConnection.dispatcher.time/1000)%60);
                        var fhour = Math.floor(fmins/60);
                        fmins = fmins%60;
                        if(first.length.split(":").length == 3) {
                            hours += parseInt(first.length.split(":")[0]) - fhour;
                            mins += parseInt(first.length.split(":")[1]) - fmins;
                            secs += parseInt(first.length.split(":")[2]) - fsecs;
                        }
                        if (first.length.split(":").length == 2) {
                            mins += parseInt(first.length.split(":")[0]) - fmins;
                            secs += parseInt(first.length.split(":")[1]) - fsecs;
                        }
                        
                        // secs += Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
                    }
                    // mins += secs / 60;
                    mins += Math.floor(secs/60);
                    secs = secs % 60;
                    // hours += mins / 60;
                    hours += Math.floor(mins/60);
                    mins = mins % 60;
                    if (hours == 0) {
                        estimated = mins.toString()+":"+secs.toString();
                        var name = " (M:S)";
                        if(mins<10) {
                            if (secs<10) estimated = "0"+mins.toString()+":"+"0"+secs.toString();
                            else estimated = "0"+mins.toString()+":"+secs.toString();
                        }
                        if(secs<10) {
                            if(mins<10) estimated = "0"+mins.toString()+":"+"0"+secs.toString();
                            else estimated = mins.toString()+":"+"0"+secs.toString();
                        }
                        else estimated = mins.toString()+":"+secs.toString();
                        var date = new Date();
                        var newDate = new Date(date.setTime(date.getTime()+hours*3600000+mins*60000+secs*1000)).toString();
                        console.log(new Date().toString());
                        console.log(newDate);
                        // console.log(newDate-date)
                    } else {
                        var name = " (H:M:S)";
                        if(mins<10) {
                            if (secs<10) estimated = hours.toString() + ":"+"0"+mins.toString()+":"+"0"+secs.toString();
                            else estimated = hours.toString() + ":"+"0"+mins.toString()+":"+secs.toString();
                        }
                        if(secs<10) {
                            if(mins<10) estimated = hours.toString() + ":"+"0"+mins.toString()+":"+"0"+secs.toString();
                            else estimated = hours.toString() + ":"+mins.toString()+":"+"0"+secs.toString();
                        }
                        else estimated = hours.toString() + ":"+mins.toString()+":"+secs.toString();
                        var date = new Date();
                        var newDate = new Date(date.setTime(date.getTime()+hours*3600000+mins*60000+secs*1000)).toString();
                    }
                }
                else {
                    name = "";
                    estimated = "Now playing";
                }
                message.channel.send({embed: {
                    "author": {
                        "name": this.queue[args.number].title,
                        "url": `https://www.youtube.com/watch?v=${data.items[0].id}`
                    },
                    "color": 666,
                    "thumbnail": {
                        "url": img.url,
                        "width": img.width,
                        "height": img.height
                    },
                    "timestamp": new Date(),
                    "fields": [{
                        "name": "Channel",
                        "value": `[${data.items[0].snippet.channelTitle}](https://www.youtube.com/channel/${data.items[0].snippet.channelId})`,
                        "inline": true
                    },  {
                        "name": "Length",
                        "value": this.queue[args.number].length,
                        "inline": true
                    }, {
                        "name": "Description",
                        "value": data.items[0].snippet.description.length > 1024 ? data.items[0].snippet.description.substring(0,1009) + "\n...<too long>" : data.items[0].snippet.description
                    }, {
                        "name": "Queued by",
                        "value": message.guild.member(this.queue[args.number].queuedBy).user.toString(),
                        "inline": true
                    }, {
                        "name": "Queued at",
                        "value": this.queue[args.number].queuedAt,
                        "inline": true
                    }, {
                        "name": "ETA"+name,
                        "value": newDate? estimated +"\n"+newDate:estimated,
                        "inline": true
                    }, {
                        "name": "Thumbnail",
                        "value": img.url
                    }],
                    "image":{
                        "url": img.url,
                        "width": img.width,
                        "height": img.height
                    }
                }});
            }
        });
    }
}
module.exports = SongInfo;