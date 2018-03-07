const commando = require("discord.js-commando");
const {Message} = require("discord.js");

class Pause extends commando.Command {
    constructor(client) {
        super(client, {
            name: "pause",
            group: "music",
            memberName: "pause",
            description: "Pause the song which is currently playing.",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    run(message, args) {
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
            if (message.guild.voiceConnection.dispatcher.paused){
                message.reply("the stream is already paused!");
                return;
            }
            message.guild.voiceConnection.dispatcher.pause();
            message.reply("ok I paused the music!:pause_button:");
        }
        else {
            message.reply("there is nothing to pause!");
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
module.exports = Pause;