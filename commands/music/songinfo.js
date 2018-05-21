const commando = require("discord.js-commando");
const {Message, RichEmbed} = require("discord.js");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");

class SongInfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "songinfo",
            aliases: ["si"],
            group: "music",
            memberName: "songinfo",
            description: "Gives detailed information about the current song or a song in queue.",
            guildOnly: true,
            args: [{
                key: "number",
                label: "songnumber",
                prompt: "",
                type: "integer",
                default: 0,
                infinite: false,
                min: 0
            }],
            argsPromptLimit: 0
        });
    }
    /**
     * @typedef {Object} argument
     * @property {Number} number
     */

    /**
     * 
     * @param {Message} message 
     * @param {argument} args 
     */
    async run(message, args) {
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
        // await message.channel.send({embed: await queue.songInfo(message, args.number)});
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
module.exports = SongInfo;