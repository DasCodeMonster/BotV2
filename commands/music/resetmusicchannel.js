const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const VoiceModule = require("../../VoiceModule");
const Logger = require("../../logger");
const util = require("util");

class ResetMusicChannel extends commando.Command {
    constructor(client){
        super(client, {
            name: "resetmusicchannel",
            aliases: ["resetchannel", "rchannel"],
            group: "music",
            memberName: "resetmusicchannel",
            description: "PLACEHOLDER",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
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
        //TO DO
    }
    hasPermission(){
        return true;
    }
}
module.exports = ResetMusicChannel;