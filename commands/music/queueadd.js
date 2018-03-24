const commando = require("discord.js-commando");
const Queue = require("../../myQueue");
const {Message} = require("discord.js");
const getYt = require("../../ytsong");
const Audioworker = require("../../audioworker");

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
        var pos;
        if(args.position === 0){
            pos = null;
        }
        else {
            pos = args.position;
        }
        var song = await getYt.Single(args.link.link, message);
        queue.add(song);
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
        var pos;
        if(args.position === 0){
            pos = null;
        }
        else {
            pos = args.position;
        }
        var songs = await getYt.Playlist(ID, message);
        queue.add(songs);
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