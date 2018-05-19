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
     * @property {string} songorlist
     * @property {boolean|string} boolean
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
        if(args.songorlist === "song" && util.isBoolean(args.boolean)){
            voiceModule.player.queue.setLoopSong(args.boolean, message);
        }else if(args.songorlist === "list" && util.isBoolean(args.boolean)){
            voiceModule.player.queue.setLoopList(args.boolean, message);
        }else if(util.isString(args.boolean) && args.songorlist === "default"){
            message.channel.send(voiceModule.player.queue.getLoop(message))
        }else {
            message.channel.send(voiceModule.player.queue.getLoop(message))
            //message.reply("Unknown combination! Please try again!");
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        return true;
        // var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        // if(message.member.hasPermission("ADMINISTRATOR")){
        //     return true;
        // }
        // if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        // else {
        //     return true;
        // }
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