const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const Queue = require("./myQueue");
const {Message} = require("discord.js");
const QueueConfig = require("./queueConfig");

class joinVoicechannelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'join',
            group: 'music',
            memberName: 'join',
            description: 'Let the Bot join your Voicechannel.',
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        if (message.guild.voiceConnection && message.member.voiceChannel){
            if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
                if (message.guild.voiceConnection.dispatcher){
                    message.reply("I am already in your voicechannel :)");
                    return;
                }
            }
        }
        if (message.member.voiceChannel) {
            await message.member.voiceChannel.join();
            if (!message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
                message.reply("ok i joined voicechannel: " + message.member.voiceChannel.name);
            }
            if(!message.guild.voiceConnection.dispatcher){
                /**
                 * @type {QueueConfig}
                 */
                var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
                var queue = new Queue(queueConfig);
                queue.play(message, queue, this.client.provider);
            }
        }
        else {
            message.reply("you need to join a voicechannel first!");
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}});
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
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = joinVoicechannelCommand;