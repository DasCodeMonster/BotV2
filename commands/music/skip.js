const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");

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
            if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 0){
                this.queue = await this.client.provider.get(message.guild, "queue");
                this.onEnd(message, "!skip");
                // for (var i = 0; i<args.number-1;i++){
                //     await message.guild.voiceConnection.dispatcher.end("!skip");
                // }
            }
            else {
                console.log("queue is empty!");
            }
        }
        else {
            message.reply("I don't play any Songs at the moment!");
        }
    }
    // async play(message) {
    //     if (this.queue.length > 0) {
    //         //var vid = this.queue.splice(0, 1)[0];
    //         var vid = this.queue[0];            
    //         this.client.provider.set(message.guild, "queue", this.queue);
    //         this.client.provider.set(message.guild, "nowPlaying", vid);
    //         message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
    //         if (this.client.provider.get(message.guild, "volume")) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
    //         else message.guild.voiceConnection.dispatcher.setVolume(0.3);
    //         message.channel.send("Now playing: "+vid.title);
    //         message.guild.voiceConnection.dispatcher.on("end", reason => {
    //             this.onEnd(message, reason);
    //         });
    //     }
    // }
    async onEnd(message, reason) {
        console.log("File ended");
        if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 0) {
            var queue = await this.client.provider.get(message.guild, "queue");
            if (reason && reason !== "!skip") {
                if (await this.client.provider.get(message.guild, "song", false)) {

                } else {
                    var vidold = queue.splice(0, 1)[0];
                    if (await this.client.provider.get(message.guild, "list", false)){
                        queue.push(vidold);
                    }
                }
            }
            else {
                var vidold = queue.splice(0, 1)[0];
                if (await this.client.provider.get(message.guild, "list", false)){
                    queue.push(vidold);
                }
            }
            if(queue.length>0){
                var vid = queue[0];
                console.log(vid);
                message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
                if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
                else message.guild.voiceConnection.dispatcher.setVolume(0.3);
                message.channel.send("Now playing: "+vid.title);
                this.client.provider.set(message.guild, "queue", queue);
                this.client.provider.set(message.guild, "nowPlaying", vid);
                message.guild.voiceConnection.dispatcher.on("end", reason => {
                    if (reason) console.log(reason);
                    this.onEnd(message, reason);
                });
            }
            else {
                var empty = [];
                this.client.provider.set(message.guild, "queue", empty);
                console.log("queue is empty");
                return;
            }
        }
        else {
            var empty = [];
            this.client.provider.set(message.guild, "queue", empty);
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