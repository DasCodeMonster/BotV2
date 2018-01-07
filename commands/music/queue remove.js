const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Queue = require("./myQueue");

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
                prompt: "Where do you want to start to rempve songs?",
                default: 1,
                type: "integer",
                min: 1,
                infinite: false
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
    async run(message, args) {
        /**
         * @type {Queue}
         */
        var queue = this.client.provider.get(message.guild, "queue", new Queue());
        queue.remove(args.start-1, args.count);
        message.reply("Removed some songs!");
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
module.exports = QueueRemove;