const commando = require("discord.js-commando");
const {Message, ReactionCollector} = require("discord.js");
const Audioworker = require("../../audioworker");
const util = require("util");
const colors = require("colors");
const Logger = require("../../logger");
const VoiceModule = require("../../VoiceModule");

colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class Queuecommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queue",
            aliases: ["q"],
            group: "music",
            memberName: "queue",
            description: "This command shows you all the queued songs!",
            guildOnly: true,
            args: [{
                key: "page",
                label: "page",
                prompt: "Which page of the queue do you want to see?",
                type: "integer",
                min: 1,
                default: 1
            }]
        });
    }
    /**
     * Reply to the Message with the current queue
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
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
        // /** 
        //  * @type {Audioworker}
        //  */
        // var audioworker = this.client.Audioworker;
        // if(!audioworker.queues.has(message.guild.id)){
        //    var queue = audioworker.add(message.guild);
        // }
        // else{
        //     var queue = audioworker.queues.get(message.guild.id);
        // }
        // await queue.sendQueueEmbed(message, args);

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
        let embed = await voiceModule.player.queue._getQueueEmbed(1, message);
        await message.channel.send({embed: embed.embed});
    }
    /**
     * 
     * @param {Array} reactions 
     * @param {Message} message 
     */
    async react(reactions, message){
        for(var i=0;i<reactions.length;i++){
            await message.react(reactions[i]);
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
module.exports = Queuecommand;