const Playlist = require("./Playlist");
const {Collection, Util, MessageEmbed, VoiceConnection, Guild} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const VoiceClient = require("./VoiceClient");
const {EventEmitter} = require("events");
const Song = require("./Song");
const moment = require("moment");
const util = require("util");
const QueueMessage = require("./QueueMessage");
const Player = require("./Player");

class Queue extends EventEmitter {
    /**
     * 
     * @param {VoiceClient} client
     * @param {Guild} guild
     * @param {VoiceConnection} voiceConnection
     * @param {Player} player
     */
    constructor(client, guild, voiceConnection){
        super();
        this.client = client;
        this.guild = guild;
        this._queueMessage = null;
        this.voiceConnection = voiceConnection || null;
         /**
         * @type {Collection<Number,Song>}
         */
        this.list = new Collection();
        this.loop = {
            song: false,
            list: false
        }
        this.length = 0;
    }
    /**
     * Return one or multiple Strings representing the queue.
     * THIS IS NOT A STRING TO SAVE THIS IN A DATABASE AND CONVERT BACK TO JSON!
     */
    toString(){
        /**
         * @type {Collection<Number,String>}
         */
        let collection = new Collection();
        if (this.list.size <= 1) {
            return collection;
        }
        else {
            let firstLine = "```";
            let messageBuilder = "";
            this.list.forEach((song, index) => {
                if(index===0)return;
                messageBuilder += (index)+" Title: "+song.title + " | Channel: "+ song.author + "\n";
            });
            firstLine += messageBuilder;
            firstLine += "```";
            let built = Util.splitMessage(firstLine, {maxLength: 1000, char: "\n", prepend: "```", append: "```"});
            if (built instanceof Array){
                built.forEach((page, index)=>{
                    collection.set(index+1, page);
                });
            }else{
                collection.set(1, built);
            }
            return collection;
        }
    }
    _update(){
        let length;
        this.list.some((song, key)=>{
            if(key === 0)return false;
            length += song.length;
        });
        this.length = length;
        this.client.provider.set(this.guild.id, "queue", this.list.array());
    }
    /**
     * Adds a List of Songs (or one) to the current list in the order they are given.
     * The first Song of the Array will be at the given position
     * @param {Song|Song[]|Playlist} songs Songs to add to the list
     * @param {Number} position Position to insert the new songs
     */
    add(songs, position=null){
        if(position && position<1) {
            // console.error("error while running add()".error);
            this.emit("error", new Error("Position must be at least 1"));
            return;
        }
        if(position > this.list.size){
            return new Error("Position is to high");
        }
        if(position === null){
            if (songs instanceof Song){
                this.list.set(this.list.size, songs);                
            }else if(songs instanceof Array){
                songs.forEach((song, index, array)=>{
                    this.list.set(this.list.size, song);
                });
            }else if(songs instanceof Playlist){
                this.list.concat(songs.list);
            }
        }else{
            var afterpos = this.list.filter((song, key, coll)=>{
                if(key>=position){
                    return true;
                }
                return false;
            });
            
            if (songs instanceof Song){
                this.list.set(position, songs);                
                afterpos.forEach((song, key)=>{
                    this.list.set(key+1, song);
                });
            }else if(songs instanceof Array){
                afterpos.forEach((song, key)=>{
                    this.list.delete(key);
                });
                songs.forEach((song, index, array)=>{
                    this.list.set(this.list.size, song);
                });
                afterpos.forEach((song, key)=>{
                    this.list.set(key+songs.length, song);
                });
            }else if(songs instanceof Playlist){
                afterpos.forEach((song, key)=>{
                    this.list.delete(key);
                });
                this.list.concat(songs.list);
                afterpos.forEach((song, key)=>{
                    this.list.set(this.list.size, song);
                });
            }
        }
        console.log(this.list, "130:Queue");
        this._update();
        this.emit("add");
    }
    next(){
        if(this.loop.song){
            return this.list.get(0) || null;
        }
        var newQ = new Collection();
        this.list.forEach((song, key)=>{
            if(key === 0) return;
            newQ.set(newQ.size, song);
        });
        if(this.loop.list){
            newQ.set(newQ.size, this.list.get(0));
        }
        // this.list.forEach((val, key, map)=>{
        //     if(key === 0 && val === null) return;
        //     newQ.set(key-1, val);
        // });
        // if (this.loop.list){
        //     if(newQ.has(-1)){
        //         newQ.set(newQ.size-1, newQ.get(-1));
        //     }
        // }
        // if(newQ.has(-1)){
        //     newQ.delete(-1);
        // }
        this.list = newQ;
        // this.updatelistMessage();
        this.emit("updated");
        this._update();            
        return this.list.get(0);
    }
    skip(){
        if(this.list.size === 1){
            if(this.loop.list){
                return this.list.get(0) || null;
            }
        }
        var newQ = new Collection();
        this.list.forEach((song, key)=>{
            if(key === 0) return;
            newQ.set(newQ.size, song);
        });
        if(this.loop.list){
            newQ.set(newQ.size, this.list.get(0));
        }
        this.list = newQ;
        console.log(this.list, " l.182:Queue");
        // this.updatelistMessage();
        this.emit("updated");
        this._update();  
        return this.list.get(0);
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    remove(start=1, count=1){
        start -= 1;
        if(this.list.size === 0) return;
        if(start > this.list.size){
            start = this.list.size-1;
            count = 1;
            console.log(new Error("Number to high deleting last element!"));
        }
        var nowPlaying = this.list.get(0);
        var list = this.list.filterArray((song, key, coll)=>{
            return key>0;
        });
        let removed = list.splice(start, count);
        this.list.clear();
        this.list.set(0, nowPlaying);
        list.forEach((song, index, arr)=>{
            this.list.set(this.list.size, song);
        });
        // this.emit(this.events.remove, removed);
        // this.updatelistMessage();
        this.emit("remove", removed);
        this._update();
        return removed;
    }
    shuffle(){
        let before = this.list.filterArray((song, key, coll)=>{
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
            this.list.set(index+1, song);
        });
        this._update();
        // this.emit(this.events.shuffle, before, after);
    }
    /**
     * Returns an embed representing the current queue
     * @param {Number} page
     * @param {Message} message 
     */
    _getQueueEmbed(page=1, message=null){
        var reactions = [];
        if (page >= this._queueMessage.size) page = this._queueMessage.size-1;
        if (this._queueMessage.size === 0 && this.get(0) === null){
            return {
                embed: new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL),
                reactions: reactions
            }
        }
        else if((page<this._queueMessage.size) || (this._queueMessage.size === 0 && this.get(0) !== null)){
            reactions.push("🔁");
            reactions.push("🔂");
            reactions.push("ℹ");
            if (this.list.get(0) !== null){
                var embed = new MessageEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.list.get(0).title, false).addField("Channel:", this.list.get(0).author, true);
                if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(message.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format()}/${moment.duration(this.list.get(0).length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.list.get(0).length, "seconds").format()}`, true);
                }
                embed.addField("Queued by:", this.client.guilds.get(this.guild.id).member(this.list.get(0).queuedBy).user.toString(), true);
            }
            if(this._queueMessage.size !== 0){
                console.log(this._queueMessage);
                embed.addField(`Queue (Page: ${page+1})`, this._queueMessage.get(page), false)
                .addField("Total pages:", this._queueMessage.size, true)
                .addField("Total songs in queue:", this.list.size-1, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.list.size > 2) reactions.push("🔀");
                reactions.push("⏭");
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
    async sendEmbed(message){
        try{
            console.log("sendEmbed");
            // await this._queueMessage.create(message);
            if(this._queueMessage){
                this._queueMessage.create(message);
            }else{
                this._queueMessage = new QueueMessage(this.client, this.guild, this.toString());
                this._queueMessage.create(message);
            }
        }catch(e){
            console.log(e);
        }
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
        // this.updatelistMessage();
        this.emit("updated");
        this._update();
        return this.loop;
    }
    /**
     * Sets the loop settings for the whole list.
     * If true the current Song will be added to the end of the list again after it finished.
     * @param {boolean} bool 
     */
    setLoopList(bool, message=null){
        let before = this.loop;
        this.loop.list = bool;
        let after = this.loop;
        // this.emit(this.events.loopChange, before, after);
        // this.updatelistMessage();
        this.emit("updated");
        this._update();
        return this.loop;
    }
    /**
     * Returns an embed with information about a song
     * @param {Message} message 
     * @param {Number} position position of the song in list
     */
    songInfo(message, position){
        if(position > this.list.size-1){
            position = this.list.size-1;
        }
        if(this.list.get(0) === null){
            return new MessageEmbed().setColor(666).setTimestamp(new Date()).setDescription("There are not any songs in the list. You need add some first!");
        }
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += this.list.get(0).length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += this.list.get(0).length;
        this.list.some((song, index) => {
            if(index === 0)return false;
            if (index === position) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        var date = new Date();
        var newDate = new Date(date.setTime(date.getTime()+seconds*1000)).toString();
        var description = Util.splitMessage(this.list.get(position).description, {maxLength: 1000, char: "\n", append: "\n(Description too long)"});
        var embed = new MessageEmbed()
        .setAuthor(this.list.get(position).title, null, `https://www.youtube.com/watch?v=${this.list.get(position).ID}`)
        .setColor(666)
        .setThumbnail(this.list.get(position).thumbnailURL)
        .setTimestamp(new Date())
        .setImage(this.list.get(position).thumbnailURL)
        .addField("Channel", `[${this.list.get(position).author}](https://www.youtube.com/channel/${this.list.get(position).channelID})`, true)
        .addField("Length", moment.duration(this.list.get(position).length, "seconds").format(), true)
        .addField("Description", util.isArray(description)? description[0] : description, false)
        .addField("listd by", message.guild.member(this.list.get(position).listdBy).user.toString(), true)
        .addField("listd at", this.list.get(position).listdAt, true);
        if(position === 0){
            embed.addField("ETA:", newDate+"\n"+moment.duration(seconds, "seconds").format());
        }else{
            embed.addField("ETA:", "Now playing!");
        }
        embed.addField("Thumbnail", this.list.get(position).thumbnailURL);
        return embed;
    }
    get(position){
        if(position>this.list.size); position = this.list.size-1;
        return this.list.get(position) || null;
    }
    isEmpty(){
        return this.list.size === 0;
    }
}
module.exports = Queue;