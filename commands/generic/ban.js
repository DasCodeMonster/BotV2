const {Command} = require("discord.js-commando");
const {Message} = require("discord.js");
const Logger = require("../../logger");
const util = require("util");

class BanCommand extends Command {
    constructor(client) {
        super(client, {
            name: "ban",
            group: "generic",
            memberName: "ban",
            description: "Bans a mentioned user. Reason must be given!",
            args: [{
                key: "user",
                label: "user",
                prompt: "Which user do you want to ban?",
                type: "user"
            }, {
                key: "reason",
                label: "reason",
                prompt: "You need to specify why the mentioned user should be banned",
                type: "string"
            }, {
                key: "days",
                label: "days",
                prompt: "How many days should the user be banned?",
                type: "integer"
            }],
            clientPermissions: ["BAN_MEMBERS"],
            userPermissions: ["BAN_MEMBERS"]
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
        // message.guild.ban(args.user, {days: args.days, reason: args.reason});
    }
    hasPermission(message, args){
        return false;
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
module.exports = BanCommand;