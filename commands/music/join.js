const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const VoiceModule = require("../../VoiceModule");
const Logger = require("../../logger");
const util = require("util");

class joinVoicechannelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'join',
            group: 'music',
            memberName: 'join',
            description: 'Let the Bot join your Voicechannel.',
            guildOnly: true,
            args: [{
                key: "channel",
                label: "channel",
                prompt: "Which channel should i join?",
                type: "voicechannel",
                default: "undefined"
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        try{
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
            await voiceModule.join(message, args.channel === "undefined"?null:args.channel);
        }catch(e){
            console.log(e);
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
        // var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}});
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
module.exports = joinVoicechannelCommand;