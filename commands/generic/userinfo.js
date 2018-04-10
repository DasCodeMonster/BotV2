const commando = require("discord.js-commando");
const {Message, MessageEmbed} = require("discord.js");
const Logger = require("../../logger");
const util = require("util");

class Userinfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "userinfo",
            aliases: ["ui"],
            group: "generic",
            memberName: "userinfo",
            description: "gives you some info about the mentioned user.",
            guildOnly: true,
            args: [{
                key: "user",
                label: "user",
                prompt: "about which user do you want to have informations?",
                type: "user",
                default: "self"
            }]
        });
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
        if(args.user === "self"){
            var user = message.member.user;
        }
        else {
            var user = args.user;
        }
        var points = this.client.provider.get(message.guild, user.id, 0);
        var roles = message.guild.roles.filterArray((role, key, colection)=>{
            return role.members.has(message.author.id);
        });
        var roleString = "";
        roles.forEach((role, index, array)=>{
            roleString += role.toString()+"\n";
        });
        var embed = new MessageEmbed()
        .setAuthor(user.username+"#"+user.discriminator, user.displayAvatarURL)
        .setColor(666)
        .setThumbnail(user.displayAvatarURL)
        .setTimestamp(new Date())
        .addField("ID:", user.id)
        .addField("Bot:", user.bot?":white_check_mark:":":x:", true)
        .addField("Points:", points, true)
        .addField("Roles:", roleString, true)
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL);
        await message.channel.send({embed: embed});
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
module.exports = Userinfo;