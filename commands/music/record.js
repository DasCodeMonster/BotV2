const commando = require("discord.js-commando");
const Queue = require("../../myQueue");
const {Message, GuildMember} = require("discord.js");
const VoiceModule = require("../../VoiceModule");
const Logger = require("../../logger");
const util = require("util");
const fs = require("fs");

class Record extends commando.Command {
    constructor(client) {
        super(client, {
            name: "record",
            group: "music",
            memberName: "record",
            description: "records voicedata from a user",
            guildOnly: true,
            args: [{
                key: "member",
                label: "member",
                prompt: "Which user would you like to record? Just mention him!",
                type: "member"
            }, {
                key: "name",
                label: "name",
                prompt: "How should I name your record?",
                type: "string"
            }],
            argsSingleQuotes: true
        });
    }
    /**
     * @typedef {Object} argument
     * @property {GuildMember} member
     * @property {string} name
     */
    /**
     * 
     * @param {Message} message 
     * @param {argument} args 
     */
    async run(message, args){
        let logger;
        if(this.client.loggers.has(message.guild.id)){
            /**
             * @type {Logger}
             */
            logger = this.client.loggers.get(message.guild.id);
        }else{
            logger = new Logger(message.guild.id);
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
        message.reply(`Recording ${args.member.toString()} now!`);
        let finished = await voiceModule.record(args.member, args.name, message.member);
        message.reply("Finished recording");
    }
    hasPermission(){
        return true;
    }
}
module.exports = Record;