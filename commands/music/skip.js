const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class Skip extends commando.Command {
    constructor(client) {
        super(client, {
            name: "skip",
            group: "music",
            memberName: "skip",
            description: "skip a song!",
            guildOnly: true,
            args: [{
                key: "number",
                label: "songnumber",
                prompt: "How many Songs do you want to skip?",
                type: "integer",
                default: 1,
                infinite: false,
                min: 1
            }],
            argsPromptLimit: 0
        });
        this.queue = [];
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        if (message.guild.voiceConnection) {
            if (message.guild.voiceConnection.dispatcher){
                message.guild.voiceConnection.dispatcher.end("!skip");
            }
            
        } else if (message.member.voiceChannel) {
            await message.member.voiceChannel.join();
            if(!message.guild.voiceConnection.dispatcher){
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
                queue.skip();
                // this.play(message, queue);
                queue.play(message);
                return;
            }
            message.guild.voiceConnection.dispatcher.end("!skip");
        }
        else {
            message.reply("I don't play any Songs at the moment!");
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
module.exports = Skip;