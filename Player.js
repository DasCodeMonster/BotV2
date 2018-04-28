const {Guild, Message, MessageEmbed} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Playlist = require("./Playlist");
const Queue = require("./Queue");
const Song = require("./Song");
const ytdl = require("ytdl-core");

class Player extends EventEmitter {
    /**
     * @param {CommandoClient} client
     * @param {Guild} guild
     */
    constructor(client, guild){
        super();
        this.client = client;
        this.voiceConnection = guild.voiceConnection || null;
        /**
         * @type {Song[]}
         */
        let _queue = client.provider.get(guild.id, "queue", []);
        this.queue = new Queue(client, guild, this.voiceConnection);
        if(_queue.length > 0){
            this.queue.add(_queue);
        }
        this.guild = guild;
        this.volume = 5;
    }
    /**
     * 
     * @param {Message} message 
     */
    async join(message){
        if(!message.guild.voiceConnection){
            if(message.member.voiceChannel){
                this.voiceConnection = await message.member.voiceChannel.join();
                this.voiceConnection.on("disconnect", reason=>{
                    console.log(reason);
                    this.voiceConnection = null;
                });
                return true;
            }else{
                message.reply("You need to join a voicechannel first!");
                return false
            }
        }
    }
    /**
     * Will join a voiceChannel if possible and starts playing the first song in queue.
     * If given the song(s) will be added so the given song will be played directly (or the first of all given).
     * @param {Message} message 
     * @param {Song|Song[]|Playlist} songs Song or songs to add in front of the queue. First one will be played directly.
     */
    async play(message, songs=null){
        let joined = await this.join(message);
        if(!joined) return;
        if(songs){
            console.log(this.queue.get(0), "l.58:Player");
            await this.queue.add(songs, 1);
            // await this.add(songs, 1);
            if(this.queue.get(0)!==songs){
                await this.queue.skip();
            }
            if(this.voiceConnection.dispatcher){
                this.voiceConnection.dispatcher.emit("finish", "skip");
            }
        }
        let song = this.queue.get(0);
        await this.voiceConnection.play(ytdl(song.ID, {filter: "audioonly"}), {volume: 5/100, passes: 2}); //this.volume
        if(this.channel){
            await this.channel.send(`Now playing: ${song.title}`);
        }else{
            await message.channel.send(`Now playing: ${song.title}`);
        }
        await this.voiceConnection.dispatcher.once("finish", reason=>{
            if(reason){
                console.debug("%s", reason);
                if(reason === "disconnect"){
                    return;
                }
            }
            this.onEnd(message, reason);
        });
    }
    /**
     * This Method will be called everytime a song ends
     * @param {Message} message Message which invoked the command
     * @param {String} reason Why the stream ended
     */
    async onEnd(message, reason){
        let song;
        if(reason === "skip"){
            song = await this.queue.skip();
        }else{
            song = await this.queue.next();
        }
        if(song === null) return;
        if(!this.voiceConnection){
            console.error(new Error("No voiceConnection"));
            // this.logger.error(new Error("No voiceConnection"))
            return;
        }
        await this.voiceConnection.play(ytdl(song.ID, {filter: "audioonly"}), {volume: 5/100, passes: 2});
        // if(this.qReactionCollector !== null){
        //     this.updateQueueMessage();
        // }
        if(this.channel){
            await this.channel.send(`Now playing: ${this.queue.list.get(0).title}`);
        }else{
            await message.channel.send(`Now playing: ${this.queue.list.get(0).title}`);
        }
        await this.voiceConnection.dispatcher.once("finish", reason => {
            if (reason) {
                console.debug("%s", reason);
                if(reason === "disconnect"){
                    return;
                }
            }
            this.onEnd(message, reason);
        });
    }
    async skip(message){
        let joined = await this.join(message);
        if(!joined) return;
        this.queue.skip();
        this.play(message)
    }
    /**
     * Stops playing but stays in the channel
     */
    stop(){
        if(!this.voiceConnection) return;
        this.voiceConnection.dispatcher.player.destroy();
    }
    /**
     * Sets the volume of the dispatcher dynamically
     * @param {Message} message 
     * @param {Number} vol Number in Percent to set the volume to
     */
    async setVolume(vol, message=null){
        let before = this.volume;
        this.volume = vol;
        if(message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.setVolume(vol/100);
            await message.reply(`set the volume to ${this.volume}.`);
        }
        // this.emit(this.events.volumeChange, before, this.volume);
    }
    /**
     * Returns an embed representing the volume and the volume as a number
     */
    getVolume(){
        return {embed: new MessageEmbed().setTitle("Current volume").setColor(666).setDescription(this.volume).setTimestamp(new Date()),
            volume: this.volume
        }
    }
    /**
     * Leaving the voicechannel if connected to one
     * @param {Message} message 
     */
    async leave(message){
        this.lastMessage = message;
        if (this.voiceConnection) {
            if(this.voiceConnection.dispatcher){
                this.stop();
            }
            await message.guild.voiceConnection.disconnect();
            await message.reply("Ok, i left the channel.");
        }
        else {
            message.reply("I am not in a voicechannel.");
        }
    }
}
module.exports = Player;