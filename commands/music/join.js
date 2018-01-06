const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const Queue = require("./myQueue");
const {Message} = require("discord.js");

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
        console.log("User: "+message.member.displayName+" in Guild: "+message.guild.name+" used Command: "+this.name+" in textchannel: "+message.channel.name);
        if (message.member.voiceChannel) {
            message.member.voiceChannel.join();
            console.log("Guild: "+message.guild.name+", joined voicechannel: "+message.member.voiceChannel.name);
            message.reply("ok i joined voicechannel: " + message.member.voiceChannel.name);
            /**
             * @type {Queue}
             */
            var queue = await this.client.provider.get(message.guild, "queue", new Queue());
            if(!message.guild.voiceConnection.dispatcher){
                this.play(message, queue, this);
                this.client.provider.get(message.guild, "queue", new Queue())
            }
        }
        else {
            message.reply("you need to join a voicechannel first!");
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {Queue} queue 
     * @param {this} thisarg
     */
    async play(message, queue, thisarg) {
        console.log(queue);
        if (queue.queue.length >= 0) {
            var vid = queue.nowPlaying;
            console.log(vid);
            console.log(vid.ID);
            thisarg.client.provider.set(message.guild, "queue", queue);
            await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            await message.guild.voiceConnection.dispatcher.setVolume(await thisarg.client.provider.get(message.guild, "volume", 0.3));
            await message.channel.send("Now playing: "+vid.title);
            message.guild.voiceConnection.dispatcher.on("end", reason => {
                if(reason) console.log(reason);
                thisarg.onEnd(message, queue, thisarg, reason);
            });
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {String} reason 
     * @param {Queue} queue
     * @param {this} thisarg 
     */
    async onEnd(message, queue, thisarg, reason) {
        console.log(queue.queue[0]);
        if (queue.queue.length >=1) {
            if (reason && reason === "!skip") {
                await queue.skip();
            }
            else {
                await queue.next();       
            }
            var vid = queue.nowPlaying;
            console.log(vid);
            await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            await message.guild.voiceConnection.dispatcher.setVolume(await thisarg.client.provider.get(message.guild, "volume", 0.3));
            await message.channel.send("Now playing: "+vid.title);
            await message.guild.voiceConnection.dispatcher.on("end", reason => {
                if (reason) console.log(reason);
                thisarg.onEnd(message, queue, thisarg, reason);
            });
            await thisarg.client.provider.set(message.guild, "queue", queue);
        }
        else {
            thisarg.client.provider.set(message.guild, "queue", queue);
            console.log("queue is empty");
            return;
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
        console.log(command);
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