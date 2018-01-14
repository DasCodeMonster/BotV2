const commando = require("discord.js-commando");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");

class Shuffle extends commando.Command {
    constructor(client) {
        super(client, {
            name: "shuffle",
            group: "music",
            memberName: "shuffle",
            description: "shuffle the queue.",
            guildOnly: true
        });
        this.queue = [];
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        /**
         * @type {QueueConfig}
         */
        var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
        var queue = new Queue(queueConfig);
        queue.shuffle();
        await this.client.provider.set(message.guild, "queueConfig", new QueueConfig(queue.nowPlaying, queue.queue, queue.loop.song, queue.loop.list));
        message.reply("ok i shuffeled the queue!");
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
module.exports = Shuffle;