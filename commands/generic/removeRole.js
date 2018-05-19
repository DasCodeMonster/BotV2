const commando = require("discord.js-commando");
const Logger = require("../../logger");
const util = require("util");

class RemoveRole extends commando.Command {
    constructor(client) {
        super(client, {
            name: "removerole",
            aliases: ["rr"],
            group: "generic",
            memberName: "removerole",
            guildOnly: true,
            description: 'removes a guld from the "joinable roles".',
            args: [{
                key: "role",
                label: "role",
                prompt: "which role would you like to remove from the ``joinable roles``?",
                type: "role"
            }],
            argsCount: 1
        });
        this.roles = [];
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
        if (this.client.provider.get(message.guild, "joinableRoles")) this.roles = this.client.provider.get(message.guild, "joinableRoles");        
        if (this.roles.indexOf(args.role)>-1){
            message.member.removeRole(args.role);
            var index = this.roles.indexOf(args.role);
            this.roles.splice(index, 1);
            message.reply("removed "+ args.role+" from the ``joinable roles``!");
        }
        else message.reply(args.role+" is not a joinable role!");
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
module.exports = RemoveRole;