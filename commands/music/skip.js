const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");
const {Message} = require("discord.js");
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
                prompt: "",
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
                 * @type {QueueConfig}
                 */
                var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
                var queue = new Queue(queueConfig);
                queue.skip();
                // this.play(message, queue);
                queue.play(message, queue, this.client.provider);
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
     * @param {Queue} queue 
     * @param {this} thisarg
     */
    async play(message, queue) {
        var vid = queue.nowPlaying;
        await this.client.provider.set(message.guild, "queueConfig", new QueueConfig(queue.nowPlaying, queue.queue, queue.loop.song, queue.loop.list));
        await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
        await message.guild.voiceConnection.dispatcher.setVolume(await this.client.provider.get(message.guild, "volume", 0.3));
        await message.channel.send("Now playing: "+vid.title);
        message.guild.voiceConnection.dispatcher.on("end", reason => {
            if(reason) console.log(reason);
            //  this.onEnd(message, reason);
            queue.onEnd(message, reason, this.client.provider);
        });
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