const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require("googleapis");
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");

class Search extends commando.Command {
    constructor(client) {
        super(client,{
            name: "search",
            aliases: ["s"],
            group: "music",
            memberName: "search",
            description: "Search for a Song on YouTube!",
            guildOnly: true,
            args: [{
                key: "query",
                label: "query",
                prompt: "Tell me for what I should search!",
                type: "string"
            }]
        });
    }
    async run(msg, args) {
        var queue = await this.client.provider.get(msg.guild, "queue");
        if (queue) this.queue = queue;
        if (msg.guild.voiceConnection) {
            this.search(msg, args);
        }
        else {
            if (msg.member.voiceChannel) {
                    msg.member.voiceChannel.join();
                    this.search(msg, args);
            }
            else {
                msg.reply("you need to join a voicechannel first");
            }
        }
    }
    async search(message, args) {
        youtubeV3.search.list({
            part: "snippet",
            type: "video",
            maxResults: 5,
            q: args.query
        }, (err, data) => {
            if (err) {
                console.log(err);
                message.reply("an error occured!");
            }
            else {
                console.log(data);
                var messageBuilder = "you searched for:" + args.link + "\n```"
                data.items.forEach((item, index) => {
                    messageBuilder += `${index+1} Title: ${item.snippet.title} Channel:${item.snippet.channelTitle}\n`;
                });
                messageBuilder += "```"
                console.log(messageBuilder);
                this.waitForMessage(message, args, messageBuilder, data)
            }
        });
    }
    async waitForMessage(message, args, oneLiner, response) {
        var commandmsg = await message.reply("type the number of the song to play:\n"+oneLiner+"Respond with ``cancel`` to cancel the command.\n"+
            "The command will automatically be cancelled in 30 seconds, unless you respond.");
        const responses = await message.channel.awaitMessages(msg2 => {
            if (msg2.author.id === message.author.id) {
                console.log(msg2.id);
                msg2.delete();
                return true;
            }}, {
            maxMatches: 1,
            time: 30000,
            errors: ["time"]
        });
        var value;
        if(responses && responses.size === 1) value = responses.first().content; else return null;
        if(value.toLowerCase() === 'cancel') {
            commandmsg.delete();
            return null;
        }
        commandmsg.delete();
        console.log(value);
        console.log(response.items[value-1].id.videoId);
        await message.member.voiceChannel.join();
        this.addSingle(message, args, response.items[value-1].id.videoId);
    }
    async addSingle(message, args, ID) {
        await youtubeV3.videos.list({
            part: "snippet, contentDetails",
            id: ID
        }, (err, data) => {
            if (err) console.log(err);
            else {
                data.items.forEach(item => {
                    if (this.queue.length>1){
                        this.queue.splice(1,0,this.song(message, args, item));
                    }
                    else {
                        this.queue.push(this.song(message, args, item));                        
                    }
                });
                if(message.guild.voiceConnection.dispatcher) message.guild.voiceConnection.dispatcher.end("!play");
                else this.play(message);                
            }
        });
    }
    song(message, args, item) {
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
        //console.log(tmp);
        var song = new Song(item.id, item.snippet.title, item.snippet.channelTitle, tmp, message.member.id);
        //console.log(song);
        //this.queue.push(song);
        //if(!message.guild.voiceConnection.dispatcher) this.play(message);
        //console.log(this.queue);
        return song;
    }
    async play(message) {
        if (this.queue.length > 0) {
            //var vid = this.queue.splice(0, 1)[0];
            var vid = this.queue[0];
            console.log(vid.ID);
            this.client.provider.set(message.guild, "queue", this.queue);
            this.client.provider.set(message.guild, "nowPlaying", vid);
            message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
            else message.guild.voiceConnection.dispatcher.setVolume(0.3);
            message.channel.send("Now playing: "+vid.title);
            message.guild.voiceConnection.dispatcher.on("end", reason => {
                this.onEnd(message, reason);
            });
        }
    }
    async onEnd(message, reason) {
        console.log("File ended");
        if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 0) {
            var queue = await this.client.provider.get(message.guild, "queue");
            if (reason && reason !== "!skip") {
                if (await this.client.provider.get(message.guild, "song", false)) {

                } else {
                    var vidold = queue.splice(0, 1)[0];
                    if (await this.client.provider.get(message.guild, "list", false)){
                        queue.push(vidold);
                    }
                }
            }
            else {
                var vidold = queue.splice(0, 1)[0];
                if (await this.client.provider.get(message.guild, "list", false)){
                    queue.push(vidold);
                }              
            }
            if(queue.length>0){
                var vid = queue[0];
                console.log(vid);
                message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
                if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
                else message.guild.voiceConnection.dispatcher.setVolume(0.3);
                message.channel.send("Now playing: "+vid.title);
                this.client.provider.set(message.guild, "queue", queue);
                this.client.provider.set(message.guild, "nowPlaying", vid);
                message.guild.voiceConnection.dispatcher.on("end", reason => {
                    if (reason) console.log(reason);
                    this.onEnd(message, reason);
                });
            }
            else {
                var empty = [];
                this.client.provider.set(message.guild, "queue", empty);
                console.log("queue is empty");
                return;
            }
        }
        else {
            var empty = [];
            this.client.provider.set(message.guild, "queue", empty);
            console.log("queue is empty");
            return;
        }
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
module.exports = Search;