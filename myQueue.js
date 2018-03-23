const Song = require("./Song");
const {Message, Util, Collection, RichEmbed, Client, VoiceConnection, TextChannel} = require("discord.js");
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
        this.client = client;
        /**
         * @type {Collection<Number, String}
         */
        this.tqueueMessage = new Collection();
        this.loop = queueConfig.loop;
        this.volume = queueConfig.volume;
        this.guildID = queueConfig.guildID;
        /**
         * @type {TextChannel}
         */
        this.channel = null;
        this.lastMessage = null;
        this.length = 0;
        this.events = {skip: "skip", play: "play", volumeChange: "volumeChange", addedSong: "addedSong", remove: "remove", join: "join", leave: "leave", end:"qend", loopChange: "loopChange", shuffle: "shuffle", ready: "qready"};
        /**
         * @type {Collection<Number,Song>}
         */
        this.tqueue = new Collection().set(0, null);
        this.tadd(queueConfig.queue);
        this.once(this.events.ready, (queueMessage, queue)=>{
            this.tupdateQueueMessage();
            this.tupdateLength();
        });
        this.on(this.events.end, (reason, message)=>{
            if(reason){
                this.tupdateQueueMessage();
                this.tupdateLength();
            }
        });
        this.on(this.events.skip, (song)=>{
            this.tupdateQueueMessage();
            this.tupdateLength();
        });
        this.on(this.events.addedSong, ()=>{
            this.tupdateQueueMessage();
            this.tupdateLength();
        });
        this.on(this.events.remove, ()=>{
            this.tupdateQueueMessage();
            this.tupdateLength();
        });
        this.on(this.events.shuffle, ()=>{
            this.tupdateQueueMessage();
            this.tupdateLength();
        });
        this.on(this.events.play, ()=>{
            // this.tupdateQueueMessage();
            // this.tupdateLength();
        });
        this.emit(this.events.ready, this.queueMessage, this.queue);
    }
    /**
     * It will move all elements in the queue forward. Additionally the new currently played song will be returned;
     * @returns {Song}
     */
    tnext(){
        if(this.loop.song){
            return this.tqueue.get(0);
        }
        var newQ = new Collection();
        this.tqueue.forEach((val, key, map)=>{
            if(key === 0 && val === null) return;
            newQ.set(key-1, val);
        });
        if (this.loop.list){
            if(newQ.has(-1)){
                newQ.set(newQ.size-1, newQ.get(-1));
            }
        }
        if(newQ.has(-1)){
            newQ.delete(-1);
        }
        if(newQ.size === 0){
            newQ.set(0, null);
        }
        this.tqueue = newQ;
        return this.tqueue.get(0);
    }
    /**
     * Adds a List of Songs (or one) to the current Queue in the order they are given.
     * The first Song of the Array will be at the given position
     * @param {Song|Song[]} songs Songs to add to the queue
     * @param {Number} position Position to insert the new songs
     */
    tadd(songs, position=null){
        if(!position){
            if(util.isArray(songs)){
                songs.forEach((song, index, array)=>{
                    this.tqueue.set(this.tqueue.size, song);
                });
            }else{
                this.tqueue.set(this.tqueue.size, songs);
            }
        }else{
            if(position<1) throw new Error("Position must be at least 1");
            var afterpos = this.tqueue.filter((song, key, coll)=>{
                if(key>=position){
                    return true;
                }
            });
            afterpos.forEach((song, key, map)=>{
                this.tqueue.delete(key);
            });
            if(util.isArray(songs)){
                songs.forEach((song, index, array)=>{
                    this.tqueue.set(this.tqueue.size, song);
                });
            }else{
                this.tqueue.set(this.tqueue.size, songs);
            }
            afterpos.forEach((song, key, map)=>{
                this.tqueue.set(this.tqueue.size, song);
            });
        }
        if(this.tqueue.get(0) ===null){
            this.tskip();
        }
    }
    /**
     * Skips a song and returns the next in the Queue
     */
    tskip(){
        if(this.tqueue.size === 1){
            if(!this.loop.list){
                this.tqueue.set(0, null);
            }
            return this.tqueue.get(0);
        }
        var newQ = new Collection();
        this.tqueue.forEach((val, key, map)=>{
            if(key === 0 && val === null) return;
            newQ.set(key-1, val);
        });
        if(this.loop.list){
            if(newQ.has(-1)){
                newQ.set(newQ.size-1, newQ.get(-1));
            }
        }
        if(newQ.has(-1)){
            newQ.delete(-1);
        }
        this.tqueue = newQ;
        return this.tqueue.get(0);
    }
    /**
     * Will join a voiceChannel if possible and starts playing the first song in queue.
     * If given the song(s) will be added so the given song will be played directly (or the first of all given).
     * @param {Message} message 
     * @param {Song|Song[]} song Song or songs to add in front of the queue. First one will be played directly.
     */
    async tplay(message, song=null){
        if(song){
            await this.tadd(song, 1);
            if(this.tqueue.get(0)!==song){
                await this.tskip();
            }
        }
        if(!message.guild.voiceConnection){
            if(message.member.voiceChannel){
                this.voiceConnection = await message.member.voiceChannel.join();
            }else{
                message.reply("You need to join a voicechannel first");
                return;
            }
        }
        this.lastMessage = message;
        if(message.guild.voiceConnection.dispatcher){
            message.guild.voiceConnection.dispatcher.end("skip");
        }else{
            await message.guild.voiceConnection.playStream(ytdl(this.tqueue.get(0).ID, {filter: "audioonly"}));
            await message.guild.voiceConnection.dispatcher.setVolume(this.volume/100);
            if(this.channel){
                await this.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
            }else if(this.lastMessage !== null && this.lastMessage !== message){
                await this.lastMessage.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
            }else{
                await message.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
            }
            await message.guild.voiceConnection.dispatcher.once("end", reason=>{
                if(reason){
                    console.debug("%s".debug, reason);
                    if(reason === "disconnect"){
                        return;
                    }
                }
                this.tonEnd(message, reason);
            });
        }
    }
    /**
     * This Method will be called everytime a song ends
     * @param {Message} message Message which invoked the command
     * @param {String} reason Why the stream ended
     */
    async tonEnd(message, reason){
        if(reason !== "skip"){
            await this.tnext();
        }
        if(this.tqueue.get(0) === null) {
            return;
        }
        await message.guild.voiceConnection.playStream(ytdl(this.tqueue.get(0).ID, {filter: "audioonly"}));
        console.log(2);
        await message.guild.voiceConnection.dispatcher.setVolume(this.volume/100);
        console.log(3);
        if(this.channel){
            await this.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
        }else if(this.lastMessage !== null && this.lastMessage !== message){
            await this.lastMessage.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
        }else{
            await message.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
        }
        console.log(4);
        await message.guild.voiceConnection.dispatcher.once("end", reason => {
            if (reason) {
                console.debug("%s".debug, reason);
                if(reason === "disconnect"){
                    return;
                }
            }
            this.tonEnd(message, reason);
        });
    }
    /**
     * Generates a new random order of the songs in the queue.
     */
    tshuffle(){
        let before = this.tqueue.filterArray((song, key, coll)=>{
            return key > 0
        });
        var queue = before;
        var currentIndex = before.length, temporaryValue, randomIndex;
          // While there remain elements to shuffle...
        while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = queue[currentIndex];
            queue[currentIndex] = queue[randomIndex];
            queue[randomIndex] = temporaryValue;
        }
        let after = queue;
        queue.forEach((song, index, arr)=>{
            this.tqueue.set(index+1, song);
        });
        this.tupdateQueueMessage();
        // this.emit(this.events.shuffle, before, after);
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    tremove(start=0, count=1){
        var nowPlaying = this.tqueue.get(0);
        var queue = this.tqueue.filterArray((song, key, coll)=>{
            return key>0;
        });
        let removed = queue.splice(start, count);
        this.tqueue.clear();
        this.tqueue.set(0, nowPlaying);
        queue.forEach((song, index, arr)=>{
            this.tqueue.set(this.tqueue.size, song);
        });
        // this.emit(this.events.remove, removed);
        return removed;
    }
    /**
     * 
     * @param {TextChannel} channel 
     */
    setChannel(channel){
        this.channel = channel;
    }
    resetChannel(){
        this.channel = null;
    }
    /**
     * Sets the loop settings for the Song.
     * If true the current Song will be repeated.
     * @param {boolean} bool 
     */
    setLoopSong(bool, message=null){
        let before = this.loop;
        this.loop.song = bool;
        let after = this.loop;
        // this.emit(this.events.loopChange, before, after);
        return this.loop;
    }
    /**
     * Sets the loop settings for the whole queue.
     * If true the current Song will be added to the end of the queue again after it finished.
     * @param {boolean} bool 
     */
    setLoopList(bool, message=null){
        let before = this.loop;
        this.loop.list = bool;
        let after = this.loop;
        // this.emit(this.events.loopChange, before, after);
        return this.loop;
    }
    /**
     * Returns a String representing the current queue or if the queue is empty returns null
     */
    tgetQueueMessage(){
        if (this.tqueue.size === 1) {
            return null;
        }
        else {
            var firstLine = "```";
            var messageBuilder = "";
            this.tqueue.forEach((song, index) => {
                if(index===0)return;
                messageBuilder += (index)+" Title: "+song.title + " | Channel: "+ song.author + "\n";
            });
            firstLine += messageBuilder;
            firstLine += "```";
            var built = Util.splitMessage(firstLine, {maxLength: 1000, char: "\n", prepend: "```", append: "```"});
            return built;
        }
    }
    /**
     * Returns an embed representing the current queue
     * @param {Number} page
     * @param {Message} message 
     */
    tgetQueue(page=1, message=null){
        this.lastMessage = message;
        var reactions = [];
        if (page >= this.tqueueMessage.size) page = this.tqueueMessage.size-1;
        if (this.tqueueMessage.size === 0 && this.tqueue.get(0) === null){
            return {
                embed: new RichEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL),
                reactions: reactions
            }
        }
        else if((page<this.tqueueMessage.size) || (this.tqueueMessage.size === 0 && this.tqueue.get(0) !== null)){
            reactions.push("🔁");
            reactions.push("🔂");
            reactions.push("ℹ");
            if (this.tqueue.get(0) !== null){
                var embed = new RichEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.tqueue.get(0).title, false).addField("Channel:", this.tqueue.get(0).author, true);
                if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(message.guild.voiceConnection.dispatcher.time, "milliseconds").format()}/${moment.duration(this.tqueue.get(0).length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.tqueue.get(0).length, "seconds").format()}`, true);
                }
                embed.addField("Queued by:", this.client.guilds.get(this.guildID).member(this.tqueue.get(0).queuedBy).user.toString(), true);
            }
            if(this.tqueueMessage.size !== 0){
                this.tupdateLength();
                embed.addField(`Queue (Page: ${page+1})`, this.tqueueMessage.get(page), false)
                .addField("Total pages:", this.tqueueMessage.size, true)
                .addField("Total songs in queue:", this.tqueue.size-1, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.tqueue.size > 2) reactions.push("🔀");
            }
            if(!embed) throw new Error("Queuemessage unavailable");
            if(this.loop.list && this.loop.song) embed.addField("Loop mode:", "🔁🔂");
            else {
                if(this.loop.list) embed.addField("Loop mode:", "🔁");
                if(this.loop.song) embed.addField("Loop mode:", "🔂");
            }
            embed.setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL);
            return {
                embed: embed,
                reactions: reactions
            }
        }
    }
    /**
     * Updates the intern Collection which holds all the pages of the queue in message form
     */
    tupdateQueueMessage(){
        this.tqueueMessage.clear();
        let q = this.tgetQueueMessage();
        if (q === null) return;
        if(util.isArray(q)){
            q.forEach((page, index, array)=>{
                this.tqueueMessage.set(index, page);
            });
        }
        else{
            this.tqueueMessage.set(0, q);
        }
    }
    /**
     * Sets the volume of the dispatcher dynamically
     * @param {Message} message 
     * @param {Number} vol Number in Percent to set the volume to
     */
    async setVolume(vol, message){
        let before = this.volume;
        this.lastMessage = message;
        if(message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.setVolume(vol/100);
        }
        this.volume = vol;
        this.emit(this.events.volumeChange, before, this.volume);
        await message.reply(`set the volume to ${this.volume}.`);
    }
    /**
     * Returns an embed representing the volume and the volume as a number
     */
    getVolume(){
        return {embed: new RichEmbed().setTitle("Current volume").setColor(666).setDescription(this.volume).setTimestamp(new Date()),
            volume: this.volume
        }
    }
    save(){
        return new QueueConfig(this.guildID, this.tqueue.array(), this.loop.song, this.loop.list, this.volume);        
    }
    /**
     * Automatically joins a voicechannel if possible and plays the first song in queue when not already playing
     * @param {Message} message 
     */
    async tautoplay(message){
        if(!message.guild.voiceConnection && message.member.voiceChannel){
            await message.member.voiceChannel.join();
        }
        if(message.guild.voiceConnection && !message.guild.voiceConnection.dispatcher){
            if(this.tqueue.get(0) !== null){
                await this.tplay(message);
            }
            else if(this.tqueue.size > 1){
                await this.tnext();
                await this.tplay(message);
            }
            else{
                await message.reply("you need to add some songs to the queue first!");
            }
        }
    }
    /**
     * Leaving the voicechannel if connected to one
     * @param {Message} message 
     */
    async tleave(message){
        this.lastMessage = message;
        if (message.guild.voiceConnection) {
            if(message.guild.voiceConnection.dispatcher){
                await message.guild.voiceConnection.dispatcher.end("disconnect");
            }
            await message.guild.voiceConnection.disconnect();
            await message.reply("Ok, i left the channel.");
        }
        else {
            message.reply("I am not in a voicechannel.");
        }
    }
    /**
     * Updated the intern property which defines the length of all queued songs
     */
    tupdateLength(){
        var length = 0;
        var queue = this.tqueue.filterArray((song, key, coll)=>{
            return key>0
        });
        queue.forEach((song, index, array)=>{
            length += song.length;
        });
        this.length = length;
    }
    /**
     * Returns an embed with information about a song
     * @param {Message} message 
     * @param {Number} position position of the song in queue
     */
    tsonginfo(message, position){
        this.lastMessage = message;
        if(position > this.tqueue.size-1){
            position = this.tqueue.size-1;
        }
        if(this.tqueue.get(0) === null){
            return new RichEmbed().setColor(666).setTimestamp(new Date()).setDescription("There are not any songs in the queue. You need add some first!");
        }
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += this.tqueue.get(0).length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += this.tqueue.get(0).length;
        this.tqueue.some((song, index) => {
            if(index === 0)return false;
            if (index === position) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        var date = new Date();
        var newDate = new Date(date.setTime(date.getTime()+seconds*1000)).toString();
        var description = Util.splitMessage(this.tqueue.get(position).description, {maxLength: 1000, char: "\n", append: "\n(Description too long)"});
        var embed = new RichEmbed()
        .setAuthor(this.tqueue.get(position).title, null, `https://www.youtube.com/watch?v=${this.tqueue.get(position).ID}`)
        .setColor(666)
        .setThumbnail(this.tqueue.get(position).thumbnailURL)
        .setTimestamp(new Date())
        .setImage(this.tqueue.get(position).thumbnailURL)
        .addField("Channel", `[${this.tqueue.get(position).author}](https://www.youtube.com/channel/${this.tqueue.get(position).channelID})`, true)
        .addField("Length", moment.duration(this.tqueue.get(position).length, "seconds").format(), true)
        .addField("Description", util.isArray(description)? description[0] : description, false)
        .addField("Queued by", message.guild.member(this.tqueue.get(position).queuedBy).user.toString(), true)
        .addField("Queued at", this.tqueue.get(position).queuedAt, true)
        .addField("ETA", newDate).addField("Thumbnail", this.tqueue.get(position).thumbnailURL);
        return embed;
    }
}
module.exports = Queue;
