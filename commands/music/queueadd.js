const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const Queue = require("./myQueue");
const {Message} = require("discord.js");
const q = require("q");
const getYt = require("./ytsong");
const QueueConfig = require("./queueConfig");

class List extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queueadd",
            aliases: ["qa", "qadd", "add"],
            group: "music",
            memberName: "queueadd",
            description: "Adds a song to the queue",
            guildOnly: true,
            args: [{
                key: "link",
                label: "link",
                prompt: "Which song would you like to add to the queue? Just give me the link!",
                type: "ytlink"
            }]
        });
        this.IDs = [];
        this.pages = 0;
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     */
    async run(message, args) {
        var ID = args.link.id;
        /**
         * @type {QueueConfig}
         */
        var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
        var queue = new Queue(queueConfig);
        if (message.guild.voiceConnection) {
            if (args.link.type ==="single") {
                this.addSingle(ID, message, args, queue);
            }
            else {
                this.addPlaylist(message, args, ID, queue);
            }
        }
        else {
            if (message.member.voiceChannel) {
                message.member.voiceChannel.join();
                if (args.link.type === "single") {
                    this.addSingle(ID, message, args, queue);
                }
                else {
                    this.addPlaylist(message, args, ID, queue);
                }              
            }
            else {
                message.reply("you need to join a voicechannel first");
            }
        }
    }
    /**
     *  
     * @param {*} ID 
     * @param {Message} message
     * @param {Object} args
     * @param {Queue} queue
     */
    async addSingle(ID, message, args, queue) {
        var song = await getYt.Single(args.link.link, message);
        queue.addSingle(song);
        if(message.guild.voiceConnection.dispatcher) return;
        // else this.play(message,queue);
        else queue.play(message, queue, this.client.provider);
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     * @param {*} ID 
     * @param {Queue} queue 
     */
    async addPlaylist(message, args, ID, queue) {
        var songs = await getYt.Playlist(ID, message);
        queue.addList(songs);
        if(message.guild.voiceConnection.dispatcher) return;
        // else this.play(message,queue);
        else queue.play(message, queue, this.client.provider);
    }
    /**
     * 
     * @param {Message} message 
     * @param {Queue} queue 
     */
    async play(message, queue) {
        var vid = queue.nowPlaying;
        await this.client.provider.set(message.guild, "queueConfig", new QueueConfig(queue.nowPlaying, queue.queue, queue.loop.song, queue.loop.list));
        await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
        await message.guild.voiceConnection.dispatcher.setVolume(await this.client.provider.get(message.guild, "volume", 0.3));
        await message.channel.send("Now playing: "+vid.title);
        message.guild.voiceConnection.dispatcher.on("end", reason => {
            if(reason) console.log(reason);
            queue.onEnd(message, reason, this.client.provider);
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
module.exports = List;