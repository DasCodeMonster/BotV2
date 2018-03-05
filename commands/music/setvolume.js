const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");

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
        queue.channel = message.channel;
        if (args.number === -1) {
            await queue.getVolume(message);
            return;
        }else{
            await queue.setVolume(message, args.number);
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
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = SetVolumeCommand;