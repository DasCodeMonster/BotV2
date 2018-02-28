const Song = require("./Song");
const {Message, Util, Collection, RichEmbed, Client} = require("discord.js");
// const {Client} = require("discord.js-commando");
const ytdl = require("ytdl-core");
const QueueConfig = require("./queueConfig");
const moment = require("moment");
const colors = require("colors");
const util = require("util");
const {EventEmitter} = require("events");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});
var momentDurationFormatSetup = require("moment-duration-format");
class Queue extends EventEmitter {
    /**
     * @param {QueueConfig} queueConfig
     * @param {Client} client
     */
    constructor(queueConfig, client){
        super();
        this.nowPlaying = queueConfig.nowPlaying;
        this.queue = queueConfig.queue;
        this.loop = queueConfig.loop;
        this.volume = queueConfig.volume;
        this.voiceConnection = null;
        this.client = client;
        this.guildID = queueConfig.guildID;
        this.events = {skip: "skip", play: "play", volumeChange: "volumeChange", addedSong: "addedSong", remove: "remove", join: "join", leave: "leave", end:"qend", loopChange: "loopChange", shuffle: "shuffle", ready: "qready"};
        /**
         * @type {Collection<Number, String}
         */
        this.queueMessage = new Collection();
        this.once(this.events.ready, (queueMessage, queue)=>{
            this.updateQueueMessage();
        });
        this.on(this.events.end, (reason, message)=>{
            if(reason){
                this.updateQueueMessage();
            }
        });
        this.on(this.events.skip, (song)=>{
            this.updateQueueMessage();
        });
        this.on(this.events.addedSong, ()=>{
            this.updateQueueMessage();
        });
        this.on(this.events.remove, ()=>{
            this.updateQueueMessage();
        });
        this.on(this.events.shuffle, ()=>{
            this.updateQueueMessage();
        });
        this.on(this.events.play, ()=>{
            this.updateQueueMessage();
        });
        this.emit(this.events.ready, this.queueMessage, this.queue);
    }
    /**
     * Adds a single Song to the current queue
     * @param {Message} message Message which invoked the Command
     * @param {Song} song The song to add to the Queue
     * @param {number} pos Positon of the Song in the Queue of upcoming Songs. 0 is the next Song to play!
     * @param {number} logLevel LogLevel is a value of how much info output you will receive
     * @returns {void}
     */
    addSingle(message, song, pos=null, logLevel=1){
        if(pos!== null && (this.queue.length !== 0 || pos > this.queue.length+1)){
            this.queue.splice(pos-1, 0, song);
        } else {
            this.queue.push(song);
        }
        if (this.nowPlaying === null) this.next();
        // else message.reply("I added "+song.title+" to the queue("+this.queue.length+" titles)");
        this.emit(this.events.addedSong, message, song, pos);
        if (logLevel > 0) {
            console.debug(`added 1 song(${song.title}) to the queue(${this.queue.length} titles)`.debug);
        }
        if(message){
            message.reply("I added "+song.title+" to the queue("+this.queue.length+" titles)");
        }
    }
    /**
     * Adds a List of Songs to the current Queue in the order they are in the Array.
     * The first Song of the Array will be at the given position
     * @param {Message} message
     * @param {Song[]} songs The Array of Songs to add
     * @param {number} pos
     * @returns {void}
     */
    addList(message, songs, pos=null, logLevel=1){
        if (pos !== null){
            var reversed = songs.reverse();
            reversed.forEach((song, index, array)=>{
                this.addSingle(message, song, pos, 0);
            });
            if(logLevel >0) console.debug(`I added ${songs.length} songs to the queue(${this.queue.length} titles)`.debug);
            return;
        }
        /**
         * @type {Song[]}
         */
        var nq = this.queue.concat(songs);
        this.queue = nq;
        if (this.nowPlaying === null) this.next();
        this.emit(this.events.addedSong, message, songs, pos);
        message.reply(`I added ${songs.length} songs to the queue(${this.queue.length} titles)`);
        if(logLevel >0)console.debug(`I added ${songs.length} songs to the queue(${this.queue.length} titles)`.debug);
    }
    /**
     * It will move all elements in the queue forward. Additionally the new currently played song will be returned;
     * @returns {Song}
     */
    next(){
        if (this.loop.song)return this.nowPlaying;
        if(this.loop.list){
            if(this.nowPlaying !== null) this.addSingle(null, this.nowPlaying);
        }
        if (this.queue.length === 0) {
            this.nowPlaying = null;
            return null;
        }
        this.nowPlaying = this.queue.shift();
        return this.nowPlaying;
    }
    /**
     * Skips a song and returns the next in the Queue
     * @param {number} amount How many songs should be skipped
     */
    skip(){
        if(this.loop.list){
            if(this.nowPlaying !== null) this.addSingle(null, this.nowPlaying);
        }
        if (this.queue.length === 0) {
            this.nowPlaying = null;
            return null;
        }
        this.nowPlaying = this.queue.shift();
        this.emit(this.events.skip, this.nowPlaying);
        return this.nowPlaying;
    }
    /**
     * It will plays the given Song directly
     * @param {Song} song 
     * @param {Message} message
     */
    async playNow(song, message){
        await this.addSingle(message, song, 1, 0);
        if(message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.end("playNow");
        }
        else {
            if(this.nowPlaying !== song){
                await this.skip();
            }
            if(this.nowPlaying === song){
                this.play(message);
            }
            else {
                console.error("An error occured in the playNow Method!".error);
            }
        }
        return song;
    }
    /**
     * It will add the Array of Songs before all other Songs in the Queue and plays the first of it immediately
     * @param {Song[]} songs
     * @param {Message} message
     */
    async playNowList(songs, message){
        await this.addList(message, songs, 1, 0);
        if(message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.end("playNowList");
        }
        else {
            if(this.nowPlaying !== this.queue[0]){
                await this.next();
                this.play(message);
            }
        }
        return songs[0];
    }
    /**
     * Sets the loop settings for the Song.
     * If true the current Song will be repeated.
     * @param {boolean} bool 
     */
    setLoopSong(bool){
        let before = this.loop;
        this.loop.song = bool;
        let after = this.loop;
        this.emit(this.events.loopChange, before, after);
    }
    /**
     * Sets the loop settings for the whole queue.
     * If true the current Song will be added to the end of the queue again after it finished.
     * @param {boolean} bool 
     */
    setLoopList(bool){
        let before = this.loop;
        this.loop.list = bool;
        let after = this.loop;
        this.emit(this.events.loopChange, before, after);
    }
    /**
     * Generates a new random order of the songs in the queue.
     */
    shuffle(){
        let before = this.queue;
        var currentIndex = this.queue.length, temporaryValue, randomIndex;
        
          // While there remain elements to shuffle...
        while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = this.queue[currentIndex];
            this.queue[currentIndex] = this.queue[randomIndex];
            this.queue[randomIndex] = temporaryValue;
        }
        let after = this.queue;
        this.emit(this.events.shuffle, before, after);
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    remove(start=0, count=1){
        let removed = this.queue.splice(start, count);
        this.emit(this.events.remove, removed);
        return removed;
    }
    /**
     * Starts playing music. The "nowPlaying" Song will be played
     * @param {Message} message Message which invoked the command
     */
    async play(message) {
        this.voiceConnection = message.guild.voiceConnection;
        await message.guild.voiceConnection.playStream(ytdl(this.nowPlaying.ID, {filter: "audioonly"}));
        await message.guild.voiceConnection.dispatcher.setVolume(this.volume/100);
        await message.channel.send("Now playing: "+this.nowPlaying.title);
        this.emit(this.events.play, this.nowPlaying);
        if (!message.guild.voiceConnection && !message.guild.voiceConnection.dispatcher) return;
        await message.guild.voiceConnection.dispatcher.once("end", reason => {
            if(reason) {
                console.debug("%s".debug, reason);
                this.onEnd(message, reason);
            }
        });
    }
    /**
     * This Method will be called everytime a song ends
     * @param {Message} message Message which invoked the command
     * @param {String} reason Why the stream ended
     */
    async onEnd(message, reason){
        if (reason && (reason === "!skip"|| reason === "playNow")) {
            await this.skip();
        }
        else {
            await this.next();       
        }
        if (this.nowPlaying === null) {
            console.debug("queue is empty".debug);
            return;
        }
        this.emit(this.events.end, reason, message);
        this.voiceConnection = message.guild.voiceConnection;
        await message.guild.voiceConnection.playStream(ytdl(this.nowPlaying.ID, {filter: "audioonly"}));
        await message.guild.voiceConnection.dispatcher.setVolume(this.volume/100);
        await message.channel.send("Now playing: "+this.nowPlaying.title);
        if (!message.guild.voiceConnection && !message.guild.voiceConnection.dispatcher) return;
        await message.guild.voiceConnection.dispatcher.once("end", reason => {
            if (reason) {
                console.debug("%s".debug, reason);
                this.onEnd(message, reason);
            }
        });
    }
    /**
     * Returns a String representing the current queue or if the queue is empty returns null
     * @param {Message} message 
     */
    getQueueMessage(){
        if (this.queue.length === 0) {
            return null;
        }
        else {
            var firstLine = "```";
            var messageBuilder = "";
            this.queue.forEach((element, index) => {
                messageBuilder += (index+1)+" Title: "+element.title + " | Channel: "+ element.author + "\n";
            });
            firstLine += messageBuilder;
            firstLine += "```";
            var built = Util.splitMessage(firstLine, {maxLength: 1000, char: "\n", prepend: "```", append: "```"});
            return built;
        }
    }
    /**
     * 
     * @param {Number} page
     * @param {Message} message 
     */
    getQueue(page, message=null){
        if (page >= this.queueMessage.size) page = this.queueMessage.size-1;
        if (this.queueMessage.size === 0 && this.nowPlaying === null){
            return new RichEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666);
        }
        else if((page<this.queueMessage.size) || (this.queueMessage.size === 0 && this.nowPlaying !== null)){
            if (this.nowPlaying !== null){
                var embed = new RichEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.nowPlaying.title, true).addField("Channel:", this.nowPlaying.author, true);
                if (this.voiceConnection && this.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(this.voiceConnection.dispatcher.time, "milliseconds").format()}/${moment.duration(this.nowPlaying.length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.nowPlaying.length, "seconds").format()}`, true);
                }
                if(message !== null){
                    embed.addField("Queued by:", message.guild.member(message.author.id).toString(), true);
                }
            }
            if(this.queueMessage.size !== 0){
                embed.addField(`Queue (Page: ${page+1})`, this.queueMessage.get(page), false)
                .addField("Total pages:", this.queueMessage.size, true)
                .addField("Total songs in queue:", this.queue.length, true);
            }
            if(!embed) throw new Error("Queuemessage unavailable");
            return embed;
        }
        else{
            return "Your index was higher than the number of pages existing";
        }
    }
    updateQueueMessage(){
        this.queueMessage.clear();
        let q = this.getQueueMessage();
        if (q === null) return;
        if(util.isArray(q)){
            q.forEach((page, index, array)=>{
                this.queueMessage.set(index, page);
            });
        }
        else{
            this.queueMessage.set(0, q);
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {Number} vol
     */
    async setVolume(message, vol){
        let before = this.volume;
        if(message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.setVolume(vol/100);
        }
        this.volume = vol;
        this.emit(this.events.volumeChange, before, this.volume);
        await message.reply(`set the volume to ${this.volume}.`);
    }
    /**
     * 
     * @param {Message} message 
     */
    async getVolume(message){
        await message.reply(`current volume: ${this.volume}`);
        return this.volume;
    }
    save(){
        return new QueueConfig(this.guildID, this.nowPlaying, this.queue, this.loop.song, this.loop.list, this.volume);
    }
    /**
     * 
     * @param {Message} message 
     */
    async join(message){
        if (message.guild.voiceConnection && message.member.voiceChannel){
            this.voiceConnection = message.guild.voiceConnection;
            if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
                if (message.guild.voiceConnection.dispatcher){
                    this.emit(this.events.join, "already in voicechannel", message.guild.voiceConnection.channel);
                    message.reply("I am already in your voicechannel :)");
                    return;
                }
            }
        }
        if (message.member.voiceChannel) {
            await message.member.voiceChannel.join();
            this.voiceConnection = message.guild.voiceConnection;
            if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
                this.emit(this.events.join, "joined", message.guild.voiceConnection.channel);
                message.reply("ok i joined voicechannel: " + message.member.voiceChannel.name);
            }
            if(!message.guild.voiceConnection.dispatcher){
                if (this.nowPlaying !== null){
                    this.play(message);
                }
                else if (this.queue.length !== 0){
                    this.next();
                    this.play(message)
                }
                else {
                    message.reply("you need to add some songs to the queue first!");
                }
            }
        }
        else {
            this.voiceConnection = null;
            this.emit(this.events.join, "member not in voice");
            message.reply("you need to join a voicechannel first!");
        }
    }
    /**
     * 
     * @param {Message} message 
     */
    async leave(message){
        if (message.guild.voiceConnection) {
            let channel = message.guild.voiceConnection.channel;
            await message.guild.voiceConnection.channel.leave();
            this.voiceConnection = null;
            await message.reply("Ok, i left the channel.");
            this.emit(this.events.leave, "left", channel);
        }
        else {
            this.voiceConnection = null;
            message.reply("I am not in a voicechannel.");
            this.emit(this.events.leave, "not in voice");
        }
    }
}
module.exports = Queue;