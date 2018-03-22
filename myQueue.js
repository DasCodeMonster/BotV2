const Song = require("./Song");
const {Message, Util, Collection, RichEmbed, Client, VoiceConnection, TextChannel} = require("discord.js");
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
        /**
         * @type {Collection<Number,Song>}
         */
        this.tqueue = new Collection().set(0, null);
        this.nowPlaying = queueConfig.nowPlaying;
        this.queue = queueConfig.queue;
        this.length = 0;
        this.loop = queueConfig.loop;
        this.volume = queueConfig.volume;
        this.voiceConnection = null;
        /**
         * @type {TextChannel}
         */
        this.channel = null;
        this.client = client;
        this.guildID = queueConfig.guildID;
        this.events = {skip: "skip", play: "play", volumeChange: "volumeChange", addedSong: "addedSong", remove: "remove", join: "join", leave: "leave", end:"qend", loopChange: "loopChange", shuffle: "shuffle", ready: "qready"};
        /**
         * @type {Collection<Number, String}
         */
        this.queueMessage = new Collection();
        /**
         * @type {Collection<Number, String}
         */
        this.tqueueMessage = new Collection();
        this.once(this.events.ready, (queueMessage, queue)=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.on(this.events.end, (reason, message)=>{
            if(reason){
                this.updateQueueMessage();
                this.updateLength();
            }
        });
        this.on(this.events.skip, (song)=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.on(this.events.addedSong, ()=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.on(this.events.remove, ()=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.on(this.events.shuffle, ()=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.on(this.events.play, ()=>{
            this.updateQueueMessage();
            this.updateLength();
        });
        this.client.on("voiceStateUpdate", (oldMember, newMember)=>{
            if(newMember.id === this.client.user.id){
                this.channel = newMember.voiceChannel;
            }
        })
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
        if(message !== null){
            this.channel = message.channel;
        }
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
            this.emit(this.events.addedSong, message, song, pos);
            message.reply("I added "+song.title+" to the queue("+this.queue.length+" titles)");
        }
    }
    /**
     * It will move all elements in the queue forward. Additionally the new currently played song will be returned;
     * @returns {Song}
     */
    tnext(){
        // console.log(tqueue);
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
        // console.log(tqueue);
        return this.tqueue.get(0);
    }
    /**
     * Adds a List of Songs (or one) to the current Queue in the order they are given.
     * The first Song of the Array will be at the given position
     * @param {Song|Song[]} songs 
     * @param {Number} position
     */
    tadd(songs, position=null){
        if(!position){
            if(util.isArray(songs)){
                songs.forEach((song, index, array)=>{
                    this.tqueue.set(this.tqueue.size, song);
                });
            }else{
                console.log(this.tqueue); 
                console.log("\n\n");
                this.tqueue.set(this.tqueue.size, songs);
                console.log(this.tqueue);
                console.log("\n\n");
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
            console.log(this.tqueue);
            console.log("\n\n");
            console.log(afterpos);
            console.log("\n\n");
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
            console.log(this.tqueue);
            console.log("\n\n");
        }
        if(this.tqueue.get(0) ===null){
            this.tskip();
        }
        console.log(this.tqueue);        
        console.log("\n\n");
    }
    /**
     * Skips a song and returns the next in the Queue
     */
    tskip(){
        console.log(1);
        if(this.tqueue.size === 1){
            if(!this.loop.list){
                this.tqueue.set(0, null);
            }
            // console.log(tqueue);
            return this.tqueue.get(0);
        }
        console.log(2);
        var newQ = new Collection();
        this.tqueue.forEach((val, key, map)=>{
            if(key === 0 && val === null) return;
            newQ.set(key-1, val);
        });
        console.log(3);
        if(this.loop.list){
            if(newQ.has(-1)){
                newQ.set(newQ.size-1, newQ.get(-1));
            }
        }
        console.log(4);
        if(newQ.has(-1)){
            newQ.delete(-1);
        }
        console.log(5);
        this.tqueue = newQ;
        return this.tqueue.get(0);
    }
    /**
     * 
     * @param {Message} message 
     * @param {Song|Song[]} song 
     */
    async tplay(message, song=null){
        this.channel = message.channel;
        if(song){
            console.log(this.tqueue);
            await this.tadd(song, 1);
            if(this.tqueue.get(0)!==song){
                await this.tskip();
            }
        }
        if(!message.guild.voiceConnection){
            if(message.member.voiceChannel){
                await message.member.voiceChannel.join();
            }else{
                message.reply("You need to join a voicechannel first");
                return;
            }
        }
        this.voiceConnection = message.guild.voiceConnection;
        console.log("hi");
        if(message.guild.voiceConnection.dispatcher){
            console.log("skip");
            message.guild.voiceConnection.dispatcher.end("skip");
        }else{
            await this.voiceConnection.playStream(ytdl(this.tqueue.get(0).ID, {filter: "audioonly"}));
            await this.voiceConnection.dispatcher.setVolume(this.volume/100);
            await this.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
            await this.voiceConnection.dispatcher.once("end", reason=>{
                if(reason){
                    console.debug("%s".debug, reason);
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
        // this.emit(this.events.end, reason, message);
        if (message.guild.voiceConnection){
            this.voiceConnection = message.guild.voiceConnection;
        }else return;
        console.log(1);
        console.log(await this.tnext());
        await this.voiceConnection.playStream(ytdl(this.tqueue.get(0).ID, {filter: "audioonly"}));
        console.log(2);
        await this.voiceConnection.dispatcher.setVolume(this.volume/100);
        console.log(3);
        await this.channel.send(`Now playing: ${this.tqueue.get(0).title}`);
        console.log(4);
        await this.voiceConnection.dispatcher.once("end", reason => {
            if (reason) {
                console.debug("%s".debug, reason);
            }
            this.tonEnd(message, reason);
        });
    }
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
     * Adds a List of Songs to the current Queue in the order they are in the Array.
     * The first Song of the Array will be at the given position
     * @param {Message} message
     * @param {Song[]} songs The Array of Songs to add
     * @param {number} pos
     * @returns {void}
     */
    addList(message, songs, pos=null, logLevel=1){
        if(message !== null){
            this.channel = message.channel;
        }
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
    next(message=null){
        if(message !== null){
            this.channel = message.channel;
        }
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
     * @param {VoiceConnection} dispatcher
     */
    skip(message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        if(this.loop.list){
            if(this.nowPlaying !== null) this.addSingle(message, this.nowPlaying);
        }
        if (this.queue.length === 0) {
            this.nowPlaying = null;
            return null;
        }
        this.nowPlaying = this.queue.shift();
        if(this.voiceConnection && message){
            this.play(message);
        }
        this.emit(this.events.skip, this.nowPlaying);
        return this.nowPlaying;
    }
    /**
     * It will plays the given Song directly
     * @param {Song} song 
     * @param {Message} message
     */
    async playNow(song, message){
        if(message !== null){
            this.channel = message.channel;
        }
        await this.addSingle(message, song, 1, 0);
        if(message.guild.voiceConnection.dispatcher){
            await message.guild.voiceConnection.dispatcher.end("playNow");
        }
        else {
            if(this.nowPlaying !== song){
                await this.skip(message);
            }
            if(this.nowPlaying === song){
                await this.play(message);
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
        if(message !== null){
            this.channel = message.channel;
        }
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
    setLoopSong(bool, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        let before = this.loop;
        this.loop.song = bool;
        let after = this.loop;
        this.emit(this.events.loopChange, before, after);
        return this.loop;
    }
    /**
     * Sets the loop settings for the whole queue.
     * If true the current Song will be added to the end of the queue again after it finished.
     * @param {boolean} bool 
     */
    setLoopList(bool, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        let before = this.loop;
        this.loop.list = bool;
        let after = this.loop;
        this.emit(this.events.loopChange, before, after);
        return this.loop;
    }
    /**
     * Generates a new random order of the songs in the queue.
     */
    shuffle(message=null){
        if(message !== null){
            this.channel = message.channel;
        }
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
    remove(start=0, count=1, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        let removed = this.queue.splice(start, count);
        this.emit(this.events.remove, removed);
        return removed;
    }
    /**
     * Starts playing music. The "nowPlaying" Song will be played
     * @param {Message} message Message which invoked the command
     */
    async play(message) {
        if(message !== null){
            this.channel = message.channel;
        }
        this.voiceConnection = await this.join(message);
        if(this.voiceConnection === null){
            console.warn("No voiceConnection".warn);
            return;
        }
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
        await this.channel.send("Now playing: "+this.nowPlaying.title);
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
    tgetQueueMessage(){
        console.log("q start");
        if (this.tqueue.size === 1) {
            console.log("null");
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
            console.log(built);
            return built;
        }
    }
    tgetQueue(page=1, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        var reactions = [];
        if (page >= this.tqueueMessage.size) page = this.tqueueMessage.size-1;
        if (this.queueMessage.size === 0 && this.tqueue.get(0) === null){
            return {
                embed: new RichEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666),
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
            // console.log(this.tqueueMessage)
            if(this.tqueueMessage.size !== 0){
                this.tupdateLength();
                embed.addField(`Queue (Page: ${page+1})`, this.tqueueMessage.get(page), false)
                .addField("Total pages:", this.tqueueMessage.size, true)
                .addField("Total songs in queue:", this.tqueue.size-1, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.queue.length > 1) reactions.push("🔀");
            }
            if(!embed) throw new Error("Queuemessage unavailable");
            if(this.loop.list && this.loop.song) embed.addField("Loop mode:", "🔁🔂");
            else {
                if(this.loop.list) embed.addField("Loop mode:", "🔁");
                if(this.loop.song) embed.addField("Loop mode:", "🔂");
            }
            return {
                embed: embed,
                reactions: reactions
            }
        }
    }
    /**
     * Returns an embed representing the current queue
     * @param {Number} page
     * @param {Message} message 
     */
    getQueue(page, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        var reactions = [];
        if (page >= this.queueMessage.size) page = this.queueMessage.size-1;
        if (this.queueMessage.size === 0 && this.nowPlaying === null){
            return {
                embed: new RichEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666),
                reactions: reactions
            }
        }
        else if((page<this.queueMessage.size) || (this.queueMessage.size === 0 && this.nowPlaying !== null)){
            reactions.push("🔁");
            reactions.push("🔂");
            reactions.push("ℹ");
            if (this.nowPlaying !== null){
                var embed = new RichEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.nowPlaying.title, false).addField("Channel:", this.nowPlaying.author, true);
                if (this.voiceConnection && this.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(this.voiceConnection.dispatcher.time, "milliseconds").format()}/${moment.duration(this.nowPlaying.length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.nowPlaying.length, "seconds").format()}`, true);
                }
                embed.addField("Queued by:", this.client.guilds.get(this.guildID).member(this.nowPlaying.queuedBy).user.toString(), true);
            }
            if(this.queueMessage.size !== 0){
                this.updateLength();
                embed.addField(`Queue (Page: ${page+1})`, this.queueMessage.get(page), false)
                .addField("Total pages:", this.queueMessage.size, true)
                .addField("Total songs in queue:", this.queue.length, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.queue.length > 1) reactions.push("🔀");
            }
            if(!embed) throw new Error("Queuemessage unavailable");
            if(this.loop.list && this.loop.song) embed.addField("Loop mode:", "🔁🔂");
            else {
                if(this.loop.list) embed.addField("Loop mode:", "🔁");
                if(this.loop.song) embed.addField("Loop mode:", "🔂");
            }
            return {
                embed: embed,
                reactions: reactions
            }
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
        console.log(this.tqueueMessage);
    }
    /**
     * 
     * @param {Message} message 
     * @param {Number} vol
     */
    async setVolume(vol, message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        let before = this.volume;
        if(message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
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
    getVolume(message=null){
        if(message !== null){
            this.channel = message.channel;
        }
        return {embed: new RichEmbed().setTitle("Current volume").setColor(666).setDescription(this.volume).setTimestamp(new Date()),
            volume: this.volume
        }
    }
    save(){
        return new QueueConfig(this.guildID, this.nowPlaying, this.queue, this.loop.song, this.loop.list, this.volume);
    }
    /**
     * 
     * @param {Message} message 
     * @returns {VoiceConnection}
     */
    async join(message){
        if(message.guild.voiceConnection && message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
            this.emit(this.events.join, "equal", message.guild.voiceConnection);
        }else if(message.member.voiceChannel){
            var oldConnection = this.voiceConnection
            this.voiceConnection = await message.member.voiceChannel.join();
            var newConnection = this.voiceConnection;
            this.emit(this.events.join, "changed", oldConnection, newConnection);
        }else {
            this.voiceConnection = null;
            this.emit(this.events.join, "null");
        }
        return this.voiceConnection;

        // if(message !== null){
        //     this.channel = message.channel;
        // }
        // if (message.guild.voiceConnection && message.member.voiceChannel){
        //     this.voiceConnection = message.guild.voiceConnection;
        //     if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
        //         if (message.guild.voiceConnection.dispatcher){
        //             this.emit(this.events.join, "already in voicechannel", message.guild.voiceConnection.channel);
        //             message.reply("I am already in your voicechannel :)");
        //             return;
        //         }
        //     }
        // }
        // if (message.member.voiceChannel) {
        //     await message.member.voiceChannel.join();
        //     this.voiceConnection = message.guild.voiceConnection;
        //     if (message.guild.voiceConnection.channel.equals(message.member.voiceChannel)){
        //         this.emit(this.events.join, "joined", message.guild.voiceConnection.channel);
        //         message.reply("ok i joined voicechannel: " + message.member.voiceChannel.name);
        //     }
        //     if(!message.guild.voiceConnection.dispatcher){
        //         if (this.nowPlaying !== null){
        //             this.play(message);
        //         }
        //         else if (this.queue.length !== 0){
        //             this.next();
        //             this.play(message)
        //         }
        //         else {
        //             message.reply("you need to add some songs to the queue first!");
        //         }
        //     }
        // }
        // else {
        //     this.voiceConnection = null;
        //     this.emit(this.events.join, "member not in voice");
        //     message.reply("you need to join a voicechannel first!");
        // }
    }
    /**
     * 
     * @param {Message} message 
     */
    async autoplay(message){
        if(this.voiceConnection && !this.voiceConnection.dispatcher){
            if(this.nowPlaying !== null){
                await this.play(message);
            }
            else if(this.queue.length !== 0){
                await this.next();
                await this.play(message);
            }
            else {
                await message.reply("you need to add some songs to the queue first!");
            }
        }
    }
    /**
     * 
     * @param {Message} message 
     */
    async tautoplay(message){
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
     * 
     * @param {Message} message 
     */
    async leave(message){
        if(message !== null){
            this.channel = message.channel;
        }
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
    updateLength(){
        var length = 0;
        this.queue.forEach((song, index, array)=>{
            length += song.length;
        });
        this.length = length;
    }
    tsonginfo(message, position){
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
        if (position !== 0){
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
        }
        else {
            var description = Util.splitMessage(this.tqueue.get(0).description, {maxLength: 1000, char: "\n", append: "\n...(Description too long)"});
            var embed = new RichEmbed()
            .setAuthor(this.tqueue.get(0).title, null, `https://www.youtube.com/watch?v=${this.tqueue.get(0).ID}`)
            .setColor(666)
            .setThumbnail(this.tqueue.get(0).thumbnailURL)
            .setTimestamp(new Date())
            .setImage(this.tqueue.get(0).thumbnailURL)
            .addField("Channel", `[${this.tqueue.get(0).author}](https://www.youtube.com/channel/${this.tqueue.get(0).channelID})`, true)
            .addField("Length", moment.duration(this.tqueue.get(0).length, "seconds").format(), true)
            .addField("Description", util.isArray(description)? description[0] : description, false)
            .addField("Queued by", message.guild.member(this.tqueue.get(0).queuedBy).user.toString(), true)
            .addField("Queued at", this.tqueue.get(0).queuedAt, true)
            .addField("ETA", "Now playing").addField("Thumbnail", this.tqueue.get(0).thumbnailURL);
        }
        return embed;
    }
    /**
     * Returns an embed with information about a song
     * @param {Message} message 
     * @param {Number} position 
     */
    songinfo(message, position){
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += this.nowPlaying.length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += this.nowPlaying.length;
        this.queue.some((song, index) => {
            if (index === position-1) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        var date = new Date();
        var newDate = new Date(date.setTime(date.getTime()+seconds*1000)).toString();
        if (position !== 0){
            var description = Util.splitMessage(this.queue[position-1].description, {maxLength: 1000, char: "\n", append: "\n(Description too long)"});
            var embed = new RichEmbed()
            .setAuthor(this.queue[position-1].title, null, `https://www.youtube.com/watch?v=${this.queue[position-1].ID}`)
            .setColor(666)
            .setThumbnail(this.queue[position-1].thumbnailURL)
            .setTimestamp(new Date())
            .setImage(this.queue[position-1].thumbnailURL)
            .addField("Channel", `[${this.queue[position-1].author}](https://www.youtube.com/channel/${this.queue[position-1].channelID})`, true)
            .addField("Length", moment.duration(this.queue[position-1].length, "seconds").format(), true)
            .addField("Description", util.isArray(description)? description[0] : description, false)
            .addField("Queued by", message.guild.member(this.queue[position-1].queuedBy).user.toString(), true)
            .addField("Queued at", this.queue[position-1].queuedAt, true)
            .addField("ETA", newDate).addField("Thumbnail", this.queue[position-1].thumbnailURL);
        }
        else {
            var description = Util.splitMessage(this.nowPlaying.description, {maxLength: 1000, char: "\n", append: "\n...(Description too long)"});
            var embed = new RichEmbed()
            .setAuthor(this.nowPlaying.title, null, `https://www.youtube.com/watch?v=${this.nowPlaying.ID}`)
            .setColor(666)
            .setThumbnail(this.nowPlaying.thumbnailURL)
            .setTimestamp(new Date())
            .setImage(this.nowPlaying.thumbnailURL)
            .addField("Channel", `[${this.nowPlaying.author}](https://www.youtube.com/channel/${this.nowPlaying.channelID})`, true)
            .addField("Length", moment.duration(this.nowPlaying.length, "seconds").format(), true)
            .addField("Description", util.isArray(description)? description[0] : description, false)
            .addField("Queued by", message.guild.member(this.nowPlaying.queuedBy).user.toString(), true)
            .addField("Queued at", this.nowPlaying.queuedAt, true)
            .addField("ETA", "Now playing").addField("Thumbnail", this.nowPlaying.thumbnailURL);
        }
        return embed;
    }
}
module.exports = Queue;
// var tqueue = new Collection();
// tqueue.set("NowPlaying", "now!");
// tqueue.set(1, "eins");
// tqueue.set(2, "zwei");
// tqueue.set(3, "drei");
// var loop = true;
// console.log(tqueue);
// for(var i=4;i<7;i++){
//     Queue.tadd(new Song(i, "custom", "nu", "me", "none", 0, "www", "me"), tqueue);
// }
