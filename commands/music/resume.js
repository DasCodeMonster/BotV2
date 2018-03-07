const commando = require("discord.js-commando");
const {Message} = require("discord.js");

class Resume extends commando.Command {
    constructor(client) {
        super(client, {
            name: "resume",
            group: "music",
            memberName: "resume",
            description: "resumes a paused stream",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
            if (!message.guild.voiceConnection.dispatcher.paused){
                message.reply("i am streaming right now! No need to resume.");
                return;
            }
            message.guild.voiceConnection.dispatcher.resume();  
            message.reply(":arrow_forward:");
        }
        else {
            message.reply("there is nothing to resume!");
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
module.exports = Resume;