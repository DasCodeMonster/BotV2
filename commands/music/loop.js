const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");
const VoiceModule = require("../../VoiceModule");
const VoiceClient = require("../../VoiceClient");

class Loop extends commando.Command {
    constructor(client) {
        super(client, {
            name: "loop",
            group: "music",
            memberName: "loop",
            description: "loops the playlist or the song.",
            guildOnly: true,
            args: [{
                key: "songorlist",
                label: "song Or List",
                prompt: "invalid option",
                oneOf: ["song", "list"],
                type: "string",
                default: "default",
                infinite: false
            }, {
                key: "boolean",
                label: "boolean",
                prompt: "true or false?",
                default: "default",
                type: "optionalbool",
                infinite: false
            }]
        });
    }
    /**
     * @typedef {Object} Argument
     * @property {String} songorlist
     * @property {Boolean|String} boolean
     */

    /**
     * 
     * @param {Message} message 
     * @param {Argument} args 
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
        /**
         * @type {VoiceModule}
         */
        let voiceModule;
        if(this.client.VoiceModules.has(message.guild.id)){
            voiceModule = this.client.VoiceModules.get(message.guild.id);
        }else {
            voiceModule = new VoiceModule(this.client, message.guild);  
            this.client.VoiceModules.set(message.guild.id, voiceModule);
        }
        if(args.songorlist === "song" && (args.boolean instanceof Boolean || typeof args.boolean === "boolean")){
            voiceModule.player.queue.setLoopSong(args.boolean, message);
        }else if(args.songorlist === "list" && (args.boolean instanceof Boolean || typeof args.boolean === "boolean")){
            voiceModule.player.queue.setLoopList(args.boolean, message);
        }else if((args.boolean instanceof String || typeof args.boolean === "string") && args.songorlist === "default"){
            message.channel.send(voiceModule.player.queue.getLoop(message))
        }else {
            message.reply("Unknown option! Please try again!");
        }
        return
        if (args.songorlist === "default" && args.boolean === "default") {
            message.reply(`Current settings for list: ${queue.loop.list}\nCurrent settings for song: ${queue.loop.song}`);
            
        }
        else if (args.songorlist !== "default" && args.boolean === "default") {
            if(args.songorlist === "song"){
                message.reply(`Current settings for ${args.songorlist}: ${queue.loop.song}`);                
            }
            else if(args.songorlist === "list") {
                message.reply(`Current settings for ${args.songorlist}: ${queue.loop.list}`);
            }
        } else if (args.songorlist !== "default" && args.boolean !== "default") {
            if(args.songorlist === "song"){
                queue.setLoopSong(args.boolean, message);
            }
            if(args.songorlist === "list"){
                queue.setLoopList(args.boolean, message);
            }
            message.reply(`set loop ${args.songorlist} to ${args.boolean}`);
        } else if (args.songorlist === "default" && args.boolean !== "default") {
            message.reply(`you need to be more precise! Do you want to set loop list or loop song to ${args.boolean}`);
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
module.exports = Loop;