const Song = require("./Song");
const {Message, Util, Collection, RichEmbed, Client, VoiceConnection, TextChannel, ReactionCollector} = require("discord.js");
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
        this.queueMessage = new Collection();
        this.loop = queueConfig.loop;
        this.volume = queueConfig.volume;
        this.guildID = queueConfig.guildID;
        /**
         * @type {TextChannel}
         */
        this.channel = null;
        this.lastMessage = null;
        this.lastQueueEmbedID = null;
        this.qReactionCollector = null;
        this.length = 0;
        this.events = {skip: "skip", play: "play", volumeChange: "volumeChange", addedSong: "addedSong", remove: "remove", join: "join", leave: "leave", end:"qend", loopChange: "loopChange", shuffle: "shuffle", ready: "qready"};
        /**
         * @type {Collection<Number,Song>}
         */
        this.queue = new Collection().set(0, null);
        if(queueConfig.queue.length !== 0){
            this.add(queueConfig.queue);
        }
        // this.once(this.events.ready, (queueMessage, queue)=>{
        //     this.updateQueueMessage();
        //     this.updateLength();
        // });
        // this.on(this.events.end, (reason, message)=>{
        //     if(reason){
        //         this.updateQueueMessage();
        //         this.updateLength();
        //     }
        // });
        // this.on(this.events.skip, (song)=>{
        //     this.updateQueueMessage();
        //     this.updateLength();
        // });
        // this.on(this.events.addedSong, ()=>{
        //     this.updateQueueMessage();
        //     this.updateLength();
        // });
        // this.on(this.events.remove, ()=>{
        //     this.updateQueueMessage();
        //     this.updateLength();
        // });
        // this.on(this.events.shuffle, ()=>{
        //     this.updateQueueMessage();
        //     this.updateLength();
        // });
        // this.on(this.events.play, ()=>{
        //     // this.updateQueueMessage();
        //     // this.updateLength();
        // });
        this.on("error", error=>{
            console.error("%s".error, error);
        });
        this.emit(this.events.ready, this.queueMessage, this.queue);
    }
    /**
     * It will move all elements in the queue forward. Additionally the new currently played song will be returned;
     * @returns {Song}
     */
    next(){
        if(this.loop.song){
            return this.queue.get(0);
        }
        var newQ = new Collection();
        this.queue.forEach((val, key, map)=>{
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
        this.queue = newQ;
        this.updateQueueMessage();
        return this.queue.get(0);
    }
    /**
     * Adds a List of Songs (or one) to the current Queue in the order they are given.
     * The first Song of the Array will be at the given position
     * @param {Song|Song[]} songs Songs to add to the queue
     * @param {Number} position Position to insert the new songs
     */
    add(songs, position=null){
        if(!position){
            if(util.isArray(songs)){
                songs.forEach((song, index, array)=>{
                    this.queue.set(this.queue.size, song);
                });
            }else{
                this.queue.set(this.queue.size, songs);
            }
        }else{
            if(position<1) throw new Error("Position must be at least 1");
            var afterpos = this.queue.filter((song, key, coll)=>{
                if(key>=position){
                    return true;
                }
            });
            afterpos.forEach((song, key, map)=>{
                this.queue.delete(key);
            });
            if(util.isArray(songs)){
                songs.forEach((song, index, array)=>{
                    this.queue.set(this.queue.size, song);
                });
            }else{
                this.queue.set(this.queue.size, songs);
            }
            afterpos.forEach((song, key, map)=>{
                this.queue.set(this.queue.size, song);
            });
        }
        if(this.queue.get(0) ===null){
            this.skip();
        }
        this.updateQueueMessage();
    }
    /**
     * Skips a song and returns the next in the Queue
     */
    skip(){
        if(this.queue.size === 1){
            if(!this.loop.list){
                this.queue.set(0, null);
            }
            return this.queue.get(0);
        }
        var newQ = new Collection();
        this.queue.forEach((val, key, map)=>{
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
        this.queue = newQ;
        this.updateQueueMessage();
        return this.queue.get(0);
    }
    /**
     * Will join a voiceChannel if possible and starts playing the first song in queue.
     * If given the song(s) will be added so the given song will be played directly (or the first of all given).
     * @param {Message} message 
     * @param {Song|Song[]} song Song or songs to add in front of the queue. First one will be played directly.
     */
    async play(message, song=null){
        if(song){
            await this.add(song, 1);
            if(this.queue.get(0)!==song){
                await this.skip();
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
            await message.guild.voiceConnection.playStream(ytdl(this.queue.get(0).ID, {filter: "audioonly"}), {volume: this.volume/100});
            if(this.channel){
                await this.channel.send(`Now playing: ${this.queue.get(0).title}`);
            }else if(this.lastMessage !== null && this.lastMessage !== message){
                await this.lastMessage.channel.send(`Now playing: ${this.queue.get(0).title}`);
            }else{
                await message.channel.send(`Now playing: ${this.queue.get(0).title}`);
            }
            await message.guild.voiceConnection.dispatcher.once("end", reason=>{
                if(reason){
                    console.debug("%s".debug, reason);
                    if(reason === "disconnect"){
                        return;
                    }
                }
                this.onEnd(message, reason);
            });
        }
    }
    /**
     * This Method will be called everytime a song ends
     * @param {Message} message Message which invoked the command
     * @param {String} reason Why the stream ended
     */
    async onEnd(message, reason){
        if(reason !== "skip"){
            await this.next();
        }
        if(this.queue.get(0) === null) {
            return;
        }
        await message.guild.voiceConnection.playStream(ytdl(this.queue.get(0).ID, {filter: "audioonly"}), {volume: this.volume/100});
        if(this.qReactionCollector !== null){
            this.qReactionCollector.emit("update");
        }
        console.log(1);
        if(this.channel){
            await this.channel.send(`Now playing: ${this.queue.get(0).title}`);
        }else if(this.lastMessage !== null && this.lastMessage !== message){
            await this.lastMessage.channel.send(`Now playing: ${this.queue.get(0).title}`);
        }else{
            await message.channel.send(`Now playing: ${this.queue.get(0).title}`);
        }
        console.log(2);
        await message.guild.voiceConnection.dispatcher.once("end", reason => {
            if (reason) {
                console.debug("%s".debug, reason);
                if(reason === "disconnect"){
                    return;
                }
            }
            this.onEnd(message, reason);
        });
    }
    /**
     * Generates a new random order of the songs in the queue.
     */
    shuffle(){
        let before = this.queue.filterArray((song, key, coll)=>{
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
            this.queue.set(index+1, song);
        });
        this.updateQueueMessage();
        // this.emit(this.events.shuffle, before, after);
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    remove(start=0, count=1){
        var nowPlaying = this.queue.get(0);
        var queue = this.queue.filterArray((song, key, coll)=>{
            return key>0;
        });
        let removed = queue.splice(start, count);
        this.queue.clear();
        this.queue.set(0, nowPlaying);
        queue.forEach((song, index, arr)=>{
            this.queue.set(this.queue.size, song);
        });
        // this.emit(this.events.remove, removed);
        this.updateQueueMessage();
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
        this.updateQueueMessage();
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
        this.updateQueueMessage();
        return this.loop;
    }
    /**
     * Returns a String representing the current queue or if the queue is empty returns null
     */
    getQueueMessage(){
        if (this.queue.size === 1) {
            return null;
        }
        else {
            var firstLine = "```";
            var messageBuilder = "";
            this.queue.forEach((song, index) => {
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
    getQueueEmbed(page=1, message=null){
        this.lastMessage = message;
        var reactions = [];
        if (page >= this.queueMessage.size) page = this.queueMessage.size-1;
        if (this.queueMessage.size === 0 && this.queue.get(0) === null){
            return {
                embed: new RichEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL),
                reactions: reactions
            }
        }
        else if((page<this.queueMessage.size) || (this.queueMessage.size === 0 && this.queue.get(0) !== null)){
            reactions.push("🔁");
            reactions.push("🔂");
            reactions.push("ℹ");
            if (this.queue.get(0) !== null){
                var embed = new RichEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.queue.get(0).title, false).addField("Channel:", this.queue.get(0).author, true);
                if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(message.guild.voiceConnection.dispatcher.time, "milliseconds").format()}/${moment.duration(this.queue.get(0).length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.queue.get(0).length, "seconds").format()}`, true);
                }
                embed.addField("Queued by:", this.client.guilds.get(this.guildID).member(this.queue.get(0).queuedBy).user.toString(), true);
            }
            if(this.queueMessage.size !== 0){
                this.updateLength();
                embed.addField(`Queue (Page: ${page+1})`, this.queueMessage.get(page), false)
                .addField("Total pages:", this.queueMessage.size, true)
                .addField("Total songs in queue:", this.queue.size-1, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.queue.size > 2) reactions.push("🔀");
            }
            if(!embed) throw new Error("Queuemessage unavailable");
            if(this.loop.list && this.loop.song) embed.addField("Loop mode:", "🔁🔂");
            else {
                if(this.loop.list) embed.addField("Loop mode:", "🔁");
                if(this.loop.song) embed.addField("Loop mode:", "🔂");
            }
            embed.setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL);
            reactions.push("⏭");
            return {
                embed: embed,
                reactions: reactions
            }
        }
    }
    /**
     * Sends an embed to the channel where the command was invoked and handles reactions and also updates the message
     * @param {Message} message 
     */
    async sendQueueEmbed(message, args){
        var last = this.getLastQueueEmbedID();
        if(this.qReactionCollector !== null){
            this.qReactionCollector.stop("starting new Collector");
        }
        if(last !== null && await message.guild.channels.has(last.channelID)){
            /**
             * @type {Message}
             */
            var lastQueueMessage = await message.guild.channels.get(last.channelID).fetchMessage(last.embedID);
            // lastQueueMessage.reactions.clear();
            await lastQueueMessage.reactions.forEach((val, key, map)=>{
                val.users.forEach(async (user, ukey, map)=>{
                    await val.remove(user);
                });
            });
        }
        var obj = await this.getQueueEmbed(args.page-1, message);
        var embed = obj.embed;
        var reactions = obj.reactions;
        /**
         * @type {Message}
         */
        var reply = await message.channel.send({embed: embed, split:false});
        var collector = new ReactionCollector(reply, (reaction, user)=>{
            if(this.client.user.id === user.id){
                return false;
            }
            var ret = reactions.includes(reaction.emoji.name);
            reply.reactions.get(reaction.emoji.name).remove(user);
            return ret;
        });
        collector.on("collect", async (element, collector)=>{
            var name = element.emoji.name
            if(name === "🔁"){
                if (this.loop.list) await this.setLoopList(false);
                else await this.setLoopList(true);
            }
            if(name === "🔂"){
                if(this.loop.song) await this.setLoopSong(false);
                else await this.setLoopSong(true);
            }
            if(name === "🔀"){
                await this.shuffle();
            }
            if(name === "ℹ"){
                var embed = await this.songInfo(message, 0);
                await message.channel.send({embed: embed});
            }
            if(name === "⏭"){
                await this.skip();
                await this.play(message);
            }
        });
        collector.once("end", async (collected, reason)=>{
            await reply.reactions.forEach((val, key, map)=>{
                val.users.forEach(async (user, ukey, map)=>{
                    await val.remove(user);
                });
            });
            console.debug("%s".debug, reason);
        });
        collector.on("error", (error)=>{
            console.error("%s".error, util.inspect(error));
        });
        collector.on("update", async ()=>{
            var obj = await this.getQueueEmbed(args.page-1, message);
            var embed = obj.embed;
            var reactions = obj.reactions;
            await reply.edit({embed: embed});
            await reply.reactions.clear();
            await react(reactions, reply);
        });
        this.setLastQueueEmbedID(reply, collector);
        if(reactions.length !== 0){
            await react(reactions, reply);
        }
        async function react(reactions, message) {
            for(var i=0;i<reactions.length;i++){
                await message.react(reactions[i]);
            }
        }
    }
    /**
     * 
     * @param {Message} embedMessage 
     * @param {ReactionCollector} collector
     */
    setLastQueueEmbedID(embedMessage, collector){
        this.lastQueueEmbedID = {
            embedID: embedMessage.id,
            channelID: embedMessage.channel.id 
        }
        this.qReactionCollector = collector;
    }
    getLastQueueEmbedID(){
        return this.lastQueueEmbedID
    }
    /**
     * Updates the intern Collection which holds all the pages of the queue in message form
     */
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
        if(this.qReactionCollector !== null){
            console.log("will emit update");
            this.qReactionCollector.emit("update");
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
        return new QueueConfig(this.guildID, this.queue.array(), this.loop.song, this.loop.list, this.volume);        
    }
    /**
     * Automatically joins a voicechannel if possible and plays the first song in queue when not already playing
     * @param {Message} message 
     */
    async autoplay(message){
        if(!message.guild.voiceConnection){
            if(message.member.voiceChannel){
                await message.member.voiceChannel.join();
            } else {
                message.reply("You need to join a voicechannel first!");
                return;
            }
        }
        if(message.guild.voiceConnection && !message.guild.voiceConnection.dispatcher){
            if(this.queue.get(0) !== null){
                await this.play(message);
            }
            else if(this.queue.size > 1){
                await this.next();
                await this.play(message);
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
    async leave(message){
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
        this.updateQueueMessage();
    }
    /**
     * Updated the intern property which defines the length of all queued songs
     */
    updateLength(){
        var length = 0;
        var queue = this.queue.filterArray((song, key, coll)=>{
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
    songInfo(message, position){
        this.lastMessage = message;
        if(position > this.queue.size-1){
            position = this.queue.size-1;
        }
        if(this.queue.get(0) === null){
            return new RichEmbed().setColor(666).setTimestamp(new Date()).setDescription("There are not any songs in the queue. You need add some first!");
        }
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += this.queue.get(0).length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += this.queue.get(0).length;
        this.queue.some((song, index) => {
            if(index === 0)return false;
            if (index === position) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        var date = new Date();
        var newDate = new Date(date.setTime(date.getTime()+seconds*1000)).toString();
        var description = Util.splitMessage(this.queue.get(position).description, {maxLength: 1000, char: "\n", append: "\n(Description too long)"});
        var embed = new RichEmbed()
        .setAuthor(this.queue.get(position).title, null, `https://www.youtube.com/watch?v=${this.queue.get(position).ID}`)
        .setColor(666)
        .setThumbnail(this.queue.get(position).thumbnailURL)
        .setTimestamp(new Date())
        .setImage(this.queue.get(position).thumbnailURL)
        .addField("Channel", `[${this.queue.get(position).author}](https://www.youtube.com/channel/${this.queue.get(position).channelID})`, true)
        .addField("Length", moment.duration(this.queue.get(position).length, "seconds").format(), true)
        .addField("Description", util.isArray(description)? description[0] : description, false)
        .addField("Queued by", message.guild.member(this.queue.get(position).queuedBy).user.toString(), true)
        .addField("Queued at", this.queue.get(position).queuedAt, true)
        .addField("ETA", newDate).addField("Thumbnail", this.queue.get(position).thumbnailURL);
        return embed;
    }
}
module.exports = Queue;
