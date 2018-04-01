const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");

class SetVolumeCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "setvolume",
            aliases: ["volume", "vol"],
            group: "music",
            memberName: "setvolume",
            description: "Set the volume of the bot",
            details: "default volume is 30",
            examples: ["!setVolume 50"],
            guildOnly: true,
            args: [{
                key: "number",
                label: "number",
                prompt: "Set the volume to a number between 0 and 100.",
                type: "integer",
                min: 0,
                max: 100,
                default: -1,
                infinte: false
            }],
            argsCount: 1
        })
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
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
         * @type {Audioworker}
         */
        var audioworker = this.client.Audioworker;
        if(!audioworker.queues.has(message.guild.id)){
           var queue = audioworker.add(message.guild);
        }
        else{
            var queue = audioworker.queues.get(message.guild.id);
        }
        if (args.number === -1) {
            await message.channel.send({embed: await queue.getVolume(message).embed})
            return;
        }else{
            await queue.setVolume(args.number, message);
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
module.exports = SetVolumeCommand;