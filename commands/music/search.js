const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require("googleapis");
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const {Message} = require("discord.js");
const getYT = require("./ytsong");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");

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
        if (message.guild.voiceConnection) {
            this.addSingle(message, args, queue);
        }
        else {
            if (message.member.voiceChannel) {
                    message.member.voiceChannel.join();
                    this.addSingle(message, args, queue);
            }
            else {
                message.reply("you need to join a voicechannel first");
            }
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {Queue} queue 
     */
    async addSingle(message, args, queue){
        var song = await getYT.search(message, args.query);
        queue.addSingle(message, song);
        if (!message.guild.voiceConnection.dispatcher){
            queue.play(message, queue, this.client.provider);
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