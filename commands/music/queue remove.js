const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");

class QueueRemove extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queueremove",
            aliases: ["remove"],
            group: "music",
            memberName: "queue remove",
            description: "Removes the queue",
            guildOnly: true,
            args: [{
                key: "start",
                label: "start",
                prompt: "Where do you want to start to remove songs?",
                type: "integer",
                min: 1,
            }, {
                key: "count",
                label: "count",
                prompt: "how many songs do you want to remove?",
                default: 1,
                type: "integer",
                min:1,
                infinite: false
            }]
        });
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
        var del = queue.tremove(args.start-1, args.count);
        if (del.length === 1) message.reply("Removed "+del[0].title+" from the queue");
        else message.reply("Removed "+del.length+" songs!");
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
module.exports = QueueRemove;