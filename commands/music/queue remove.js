const commando = require("discord.js-commando");

class QueueRemove extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queueremove",
            aliases: ["remove"],
            group: "music",
            memberName: "queue remove",
            description: "Removes the queue",
            guildOnly: true
        });
        this.queue = [];
        this.newQueue = [];
    }
    async run(message, args) {
        if (this.client.provider.get(message.guild, "queue")) this.queue = this.client.provider.get(message.guild, "queue");
        //await this.client.provider.remove(message.guild, "queue");
        if (this.queue.length > 0) this.newQueue = this.queue.splice(0,1);
        await this.client.provider.set(message.guild, "queue", this.newQueue);
        console.log(this.client.provider.get(message.guild, "queue"));
        message.reply("Removed the queue!");
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