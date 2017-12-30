const commando = require("discord.js-commando");

class Resume extends commando.Command {
    constructor(client) {
        super(client, {
            name: "resume",
            group: "music",
            memberName: "resume",
            description: "resumes a paused stream",
            guildOnly: true
        });
    }
    async run(message, args) {
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
            message.guild.voiceConnection.dispatcher.resume();            
            message.reply(":arrow_forward:");
        }
        else {
            message.reply("there is nothing to resume!");
        }
    }
    async play(message) {
        if (this.queue.length > 0) {
            //var vid = this.queue.splice(0, 1)[0];
            var vid = this.queue[0];
            console.log(vid.ID);
            this.client.provider.set(message.guild, "queue", this.queue);
            this.client.provider.set(message.guild, "nowPlaying", vid);
            message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
            else message.guild.voiceConnection.dispatcher.setVolume(0.3);
            message.channel.send("Now playing: "+vid.title);
            message.guild.voiceConnection.dispatcher.on("end", reason => {
                this.onEnd(message, reason);
            });
        }
    }
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
}
module.exports = Resume;