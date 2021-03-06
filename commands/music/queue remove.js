const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const VoiceModule = require("../../VoiceModule");
const Logger = require("../../logger");
const util = require("util");

class QueueRemove extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queueremove",
            aliases: ["remove"],
            group: "music",
            memberName: "queue remove",
            description: "Removes the queue",
            guildOnly: true,
            args: [{
                key: "start",
                label: "start",
                prompt: "Where do you want to start to remove songs?",
                type: "integer",
                min: 1,
            }, {
                key: "count",
                label: "count",
                prompt: "how many songs do you want to remove?",
                default: 1,
                type: "integer",
                min:1,
                infinite: false
            }]
        });
    }
    /**
     * @typedef {Object} argument
     * @property {Number} start
     * @property {Number} count
     */
    /**
     * 
     * @param {Message} message 
     * @param {argument} args 
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
        let deleted = voiceModule.player.queue.remove(args.start, args.count);
        if (deleted.length === 1) message.reply("Removed "+deleted[0].title+" from the queue");
        else message.reply("Removed "+deleted.length+" songs!");
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
module.exports = QueueRemove;