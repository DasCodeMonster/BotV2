const commando = require("discord.js-commando");
const Queue = require("../../myQueue");
const {Message} = require("discord.js");
const getYt = require("../../ytsong");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");

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
                default: 0,
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
        if(this.client.loggers.has(message.guild.id)){
            /**
             * @type {Logger}
             */
            var logger = this.client.loggers.get(message.guild.id);
        }else{
            var logger = new Logger(message.guild.id);
            this.client.loggers.set(message.guild.id, logger);
        }
        logger.log(message.author.username+"#"+message.author.discriminator, "("+message.author.id+")", "used", this.name, "command in channel:", message.channel.name, "("+message.channel.id+")\nArguments:", util.inspect(args));
        var ID = args.link.id;
        /** 
         * @type {Audioworker}
         */
        var audioworker = this.client.Audioworker;
        if(!audioworker.queues.has(message.guild.id)){
           var queue = audioworker.add(message.guild);
        }
        else{
            var queue = audioworker.queues.get(message.guild.id);
        }
        if(args.position !== 0){
            if (queue.queue.length !== 0){
                if(args.position > queue.queue.length) {
                    message.reply("Position is too high! I will add the Song to the end of the queue.");
                    args.position = queue.queue.length;
                }
            }
        }
        if (args.link.type ==="single") {
            this.addSingle(ID, message, args, queue);
        }
        else {
            this.addPlaylist(message, args, ID, queue);
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
        if(args.position === 0){
            queue.add(song);
        }
        else {
            queue.add(song, args.position);
        }
        if(message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) return;        
        queue.play(message);
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
        if(args.position === 0){
            queue.add(songs);
        }
        else {
            queue.add(songs, args.position);
        }
        if(message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) return;
        queue.play(message);
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
        if(command.role.true.indexOf(role.id) >-1) {
            ret = true;
            return true;
        }
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = List;