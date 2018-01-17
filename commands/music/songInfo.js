const commando = require("discord.js-commando");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");
const {Message} = require("discord.js");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");

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
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        /**
         * @type {QueueConfig}
         */
        var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
        var queue = new Queue(queueConfig);
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += queue.nowPlaying.length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += queue.nowPlaying.length;
        queue.queue.some((song, index) => {
            if (index === args.number-1) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        message.channel.send({embed: {
            "author": {
                "name": queue.queue[args.number].title,
                "url": `https://www.youtube.com/watch?v=${queue.queue[args.number].ID}`
            },
            "color": 666,
            "thumbnail": {
                "url": queue.queue[args.number].thumbnailURL,
                "width": queue.queue[args.number].tWidth,
                "height": queue.queue[args.number].tHeight
            },
            "timestamp": new Date(),
            "fields": [{
                "name": "Channel",
                "value": `[${queue.queue[args.number].author}](https://www.youtube.com/channel/${queue.queue[args.number].channelID})`,
                "inline": true
            },  {
                "name": "Length",
                "value": moment.duration(queue.queue[args.number].length, "seconds").format(),
                "inline": true
            }, {
                "name": "Description",
                "value": queue.queue[args.number].description.length > 1024 ? queue.queue[args.number].description.substring(0,1009) + "\n...<too long>" : queue.queue[args.number].description
            }, {
                "name": "Queued by",
                "value": message.guild.member(queue.queue[args.number].queuedBy).user.toString(),
                "inline": true
            }, {
                "name": "Queued at",
                "value": queue.queue[args.number].queuedAt,
                "inline": true
            }, {
                "name": "ETA"+name,
                "value": newDate? estimated +"\n"+newDate:estimated,
                "inline": true
            }, {
                "name": "Thumbnail",
                "value": queue.queue[args.number].thumbnailURL
            }],
            "image":{
                "url": queue.queue[args.number].thumbnailURL,
                "width": queue.queue[args.number].tWidth,
                "height": queue.queue[args.number].tHeight
            }
        }});

        return;
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
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        else {
            return true;
        }
    }
}
/**
 * @param {*} command
 * @param {Message} message
 * @returns {boolean}
 */
function role(message, command) {
    var ret;
    message.member.roles.array().some((role, index, array) => {
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = SongInfo;