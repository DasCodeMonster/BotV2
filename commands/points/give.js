const commando = require("discord.js-commando");
const Logger = require("../../logger");
const util = require("util");

class Give extends commando.Command {
    constructor(client) {
        super(client, {
            name: "give",
            group: "points",
            memberName: "give",
            description: "Give points to another user",
            guildOnly: true,
            argsCount: 2,
            args: [{
                key: "user",
                label: "user",
                prompt: "to which user you want to tranfer your points?",
                type: "user"
            }, {
                key: "number",
                label: "number",
                prompt: "how many points do you want to transfer?",
                type: "integer"
            }]
        })
    }
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
        if (this.client.provider.get(message.guild, message.member.id)) {
            var points = this.client.provider.get(message.guild, message.member.id);
            if (args.number > points) {
                message.reply("you dont have that much points!\nPoints: "+points);
                return;
            }
        }
        else {
            message.reply("you have no points to transfer :/");
            return;
        }
        message.reply(args.number+" points successfully transfered to "+args.user);
        this.client.provider.set(message.guild, message.member.id, points-args.number);
        if (this.client.provider.get(message.guild, args.id)) {
            var friendPoints = this.client.provider.get(message.guild, args.user.id);
        }
        else {
            var friendPoints = 0;
        }
        this.client.provider.set(message.guild, args.user.id, friendPoints+args.number);
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
module.exports = Give;