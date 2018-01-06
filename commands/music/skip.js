const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const Queue = require("./myQueue");
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
    async run(message, args) {
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
            message.guild.voiceConnection.dispatcher.end("!skip");
            // for (var i = 0; i<args.number;i++){
            //     await message.guild.voiceConnection.dispatcher.end("!skip");
            // }
        } else if (message.member.voiceChannel) {
            message.member.voiceChannel.join();
            /**
             * @type {Queue}
             */
            var queue = this.client.provider.get(message.guild, "queue", new Queue());
            var song = queue.skip();
            if (song === null) message.reply("There are't any Songs in the Queue!");
            else this.play(message, queue, this);
            this.client.provider.get(message.guild, "queue", queue);
            // if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 0){
            //     this.queue = await this.client.provider.get(message.guild, "queue");
            //     this.onEnd(message, "!skip");
                // for (var i = 0; i<args.number-1;i++){
                //     await message.guild.voiceConnection.dispatcher.end("!skip");
                // }
            // }
            // else {
            //     console.log("queue is empty!");
            // }
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
        // console.log("File ended");
        if (queue.queue.length >=1) {
            if (reason && reason !== "!skip") {
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