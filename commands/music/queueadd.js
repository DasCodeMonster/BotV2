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
            }, {
                key: "position",
                label: "position",
                prompt: "In which position do you want to place the song?",
                type: "integer",
                min: 1,
                default: 1,
                infinite: false
            }]
        });
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
        if (queue.queue.length !== 0){
            if(args.position > queue.queue.length) {
                message.reply("Position is too high! I will add the Song to the end of the queue.");
                args.position = queue.queue.length;
            }
        }
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
        queue.addSingle(message, song, args.position);
        if(message.guild.voiceConnection.dispatcher) return;
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
        queue.addList(message, songs);
        if(message.guild.voiceConnection.dispatcher) return;
        else queue.play(message, this.client.provider);
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