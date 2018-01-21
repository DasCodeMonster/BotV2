const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const getYt = require("./ytsong");
const QueueConfig = require("./queueConfig");
const Queue = require("./myQueue");

class Play extends commando.Command {
    constructor(client) {
        super(client, {
            name: "play",
            group: "music",
            memberName: "play",
            description: "Plays the song from the given link directly",
            guildOnly: true,
            argsSingleQuotes: true,
            args: [{
                key: "link",
                label: "link",
                prompt: "Which song would you like to play? Just give me the link!",
                type: "ytlink"
            }]
        });
        this.queue = [];
        this.IDs = [];
        this.pages = 0;
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     */
    async run(message, args) {
        console.log(args);
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
        queue.playNow(song, message, this.client.provider);
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
        queue.playNowList(songs, message, this.client.provider);
        // if(message.guild.voiceConnection.dispatcher) return;
        // // else this.play(message,queue);
        // else queue.play(message, queue, this.client.provider);
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
module.exports = Play;