const Song = require("./Song");
const {Message} = require("discord.js");
const ytdl = require("ytdl-core");
const QueueConfig = require("./queueConfig");
const moment = require("moment");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});
var momentDurationFormatSetup = require("moment-duration-format");
class Queue {
    /**
     * @param {QueueConfig} queueConfig
     */
    constructor(queueConfig){
        this.nowPlaying = queueConfig.nowPlaying;
        this.queue = queueConfig.queue;
        this.loop = queueConfig.loop;
        this.volume = queueConfig.volume;
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
            if(logLevel >0) console.log("added "+songs.length+" songs to the queue("+this.queue.length+" titles)");
            return;
        }
        /**
         * @type {Song[]}
         */
        var nq = this.queue.concat(songs);
        this.queue = nq;
        if (this.nowPlaying === null) this.next();
        message.reply(`I added ${songs.length-1} songs to the queue(${this.queue.length} titles)`);
        if(logLevel >0)console.debug(`I added ${songs.length-1} songs to the queue(${this.queue.length} titles)`.debug);
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
        this.loop.song = bool;
    }
    /**
     * Sets the loop settings for the whole queue.
     * If true the current Song will be added to the end of the queue again after it finished.
     * @param {boolean} bool 
     */
    setLoopList(bool){
        this.loop.list = bool;
    }
    /**
     * Generates a new random order of the songs in the queue.
     */
    shuffle(){
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
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    remove(start=0, count=1){
        return this.queue.splice(start, count);
    }
    /**
     * Starts playing music. The "nowPlaying" Song will be played
     * @param {Message} message Message which invoked the command
     */
    async play(message) {
        await message.guild.voiceConnection.playStream(ytdl(this.nowPlaying.ID, {filter: "audioonly"}));
        await message.guild.voiceConnection.dispatcher.setVolume(this.volume/100);
        await message.channel.send("Now playing: "+this.nowPlaying.title);
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
     * Return a String representing the current queue
     * @param {Message} message 
     */
    async getQueueMessage(message){
        if (this.queue.length === 0 && this.nowPlaying === null) {
            return "The queue is empty!";
        }
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
            var time = message.guild.voiceConnection.dispatcher.time;
            var seconds = time/1000;
        }
        else var seconds = 0;
        if (this.queue.length === 0 && this.nowPlaying !== null){
            return `Now playing: ${this.nowPlaying.title} from: ${this.nowPlaying.author} | ${(seconds-(seconds%60))/60}:${Math.round(seconds%60)<10?"0"+Math.round(seconds%60):Math.round(seconds%60)}/${moment.duration(this.nowPlaying.length, "seconds").format()}`;
        }
        else {
            var messageBuilder = "";
            messageBuilder += `Now playing: ${this.nowPlaying.title} from: ${this.nowPlaying.author} | ${(seconds-(seconds%60))/60}:${Math.round(seconds%60)<10?"0"+Math.round(seconds%60):Math.round(seconds%60)}/${moment.duration(this.nowPlaying.length, "seconds").format()}\n`+"```"
            await this.queue.some((element, index) => {
                if (index === 49 || messageBuilder.length >= 1800) {
                    if(this.queue.length-index+1 === 0) return true;
                    messageBuilder += `...and ${this.queue.length-index+1} more!`;
                    return true;
                }
                else {
                    messageBuilder += (index+1)+" Title: "+element.title + " | Channel: "+ element.author + "\n";
                    return false;
                }
            });
            messageBuilder += "```";
            return messageBuilder;
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {Number} vol
     */
    async setVolume(message, vol){
        if(message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.setVolume(vol/100);
        }
        this.volume = vol;
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
        return new QueueConfig(this.nowPlaying, this.queue, this.loop.song, this.loop.list, this.volume);
    }
    /**
     * 
     * @param {Message} message 
     */
    async join(message){
        if (message.guild.voiceConnection && message.member.voiceChannel){
            if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
                if (message.guild.voiceConnection.dispatcher){
                    message.reply("I am already in your voicechannel :)");
                    return;
                }
            }
        }
        if (message.member.voiceChannel) {
            await message.member.voiceChannel.join();
            if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
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
            message.reply("you need to join a voicechannel first!");
        }
    }
    /**
     * 
     * @param {Message} message 
     */
    async leave(message){
        if (message.guild.voiceConnection) {
            await message.guild.voiceConnection.channel.leave();
            await message.reply("Ok, i left the channel.");
        }
        else {
            message.reply("I am not in a voicechannel.");
        }
    }
}
module.exports = Queue;