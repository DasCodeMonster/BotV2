const commando = require("discord.js-commando");
const {Message, ReactionCollector} = require("discord.js");
const Audioworker = require("../../audioworker");
const util = require("util");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

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
        /**
         * @type {Message}
         */
        var reply = await message.channel.send({embed: await queue.getQueue(args.page-1).embed, split:false});
        var collector = new ReactionCollector(reply, (reaction, user)=>{
            console.log(this.client.user.id === user.id);
            if(this.client.user.id === user.id){
                return false;
            }
            var ret = reactions.includes(reaction.emoji.name);
            reply.reactions.get(reaction.emoji.name).remove(user);
            return ret;
        }, {time: 60000});
        collector.on("collect", async (element, collector)=>{
            var name = element.emoji.name
            if(name === "🔁"){
                if (queue.loop.list) await queue.setLoopList(false);
                else await queue.setLoopList(true);
                await reply.edit({embed: await queue.getQueue(args.page-1).embed});
                await reply.reactions.clear();
                await this.react(await queue.getQueue(args.page-1).reactions, reply);
            }
            if(name === "🔂"){
                if(queue.loop.song) await queue.setLoopSong(false);
                else await queue.setLoopSong(true);
                await reply.edit({embed: await queue.getQueue(args.page-1).embed});
                await reply.reactions.clear();
                await this.react(await queue.getQueue(args.page-1).reactions, reply);
            }
            if(name === "🔀"){
                await queue.shuffle();
                await reply.edit({embed: await queue.getQueue(args.page-1).embed});
                await reply.reactions.clear();
                await this.react(await queue.getQueue(args.page-1).reactions, reply);
            }
            if(name === "ℹ"){
                var embed = await queue.songinfo(message, 0);
                await message.channel.send({embed: embed});
            }
            if(name === "⏭"){
                await queue.skip();
                await queue.play(message);
            }
        });
        collector.once("end", async (collected, reason)=>{
            await reply.reactions.forEach((val, key, map)=>{
                val.users.forEach(async (user, ukey, map)=>{
                    await val.remove(user);
                });
            });
            console.debug("%s".debug, reason);
        });
        collector.on("error", (error)=>{
            console.error("%s".error, util.inspect(error));
        });
        if(reactions.length !== 0){
            await this.react(reactions, reply);
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