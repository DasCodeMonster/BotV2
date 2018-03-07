const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");
const util = require("util");

class Queuecommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queue",
            aliases: ["q"],
            group: "music",
            memberName: "queue",
            description: "This command shows you all the queued songs!",
            guildOnly: true,
            args: [{
                key: "page",
                label: "page",
                prompt: "Which page of the queue do you want to see?",
                type: "integer",
                min: 1,
                default: 1
            }]
        });
    }
    /**
     * Reply to the Message with the current queue
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
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
        await queue.updateQueueMessage();
        var reactions = queue.getQueue(args.page-1, message).reactions;
        var reply = await message.channel.send({embed: await queue.getQueue(args.page-1).embed});
        if(reactions.length !== 0){
            await this.react(reactions, reply);
        }
        if (!util.isArray(reply)){
            var coll = await reply.awaitReactions((reaction, user)=>{
                if (!util.isArray(reply)){
                    if(this.client.user.id === user.id) return false;
                    reply.reactions.get(reaction.emoji.name).remove(user);
                    var name = reaction.emoji.name;
                    if(!reply.reactions.has(name)) return false;
                    if(name === "🔁"){
                        if (queue.loop.list) queue.setLoopList(false);
                        else queue.setLoopList(true);
                        reply.edit({embed: queue.getQueue(args.page-1).embed});
                        reply.reactions.clear();
                        this.react(queue.getQueue(args.page-1).reactions, reply);
                    }
                    if(name === "🔂"){
                        if(queue.loop.song) queue.setLoopSong(false);
                        else queue.setLoopSong(true);
                        reply.edit({embed: queue.getQueue(args.page-1).embed});
                        reply.reactions.clear();
                        this.react(queue.getQueue(args.page-1).reactions, reply);
                    }
                    if(name === "🔀"){
                        queue.shuffle();
                        reply.edit({embed: queue.getQueue(args.page-1).embed});
                        reply.reactions.clear();
                        this.react(queue.getQueue(args.page-1).reactions, reply);
                    }
                    return false;
                }
            }, {time: 60000});
            await reply.clearReactions();
        }
    }
    /**
     * 
     * @param {Array} reactions 
     * @param {Message} message 
     */
    async react(reactions, message){
        for(var i=0;i<reactions.length;i++){
            await message.react(reactions[i]);
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
module.exports = Queuecommand;