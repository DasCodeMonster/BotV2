const Playlist = require("./Playlist");
const {Collection, Util, MessageEmbed, VoiceConnection, Guild, Message} = require("discord.js");
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
        this.queueText = new Collection();
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
        this._queueMessage = new QueueMessage(client, guild, this);
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
        try {
            this.queueText = this.toString();
            let length = 0;
            this.list.some((song, key)=>{
                if(key === 0)return false;
                length += song.length;
            });
            this.length = length;
            if(this._queueMessage.created){
                this._queueMessage.update();
            }
            this.client.provider.set(this.guild.id, "queue", this.list.array());
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * Adds a List of Songs (or one) to the current list in the order they are given.
     * The first Song of the Array will be at the given position
     * @param {Song|Song[]|Playlist} songs Songs to add to the list
     * @param {Number} position Position to insert the new songs
     */
    add(songs, position=null){
        try {
            if(position && position<1) {
                // console.error("error while running add()".error);
                throw new Error("Position must be at least 1");
            }
            if(position > this.list.size){
                // throw new Error("Position is to high");
                position = null;
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
            this._update();
            this.emit("add");
        } catch (e) {
            console.log(e);
        }
    }
    next(){
        try {
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
        } catch (e) {
            console.log(e);
        }
    }
    skip(){
        try {
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
            // this.updatelistMessage();
            this.emit("updated");
            this._update();  
            return this.list.get(0);
        } catch (e) {
            console.log(e);
        }
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
     * @param {Message} message
     */
    async sendEmbed(message){
        try{
            // await this._queueMessage.create(message);
            if(this._queueMessage){
                this._queueMessage.create(message);
            }else{
                throw new Error("QueueMessage not initialized");
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
    setLoopSong(bool){
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
    setLoopList(bool){
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
     * @argument {Message} message
     */
    getLoop(message){
        let text = "";
        if(this.loop.song){
            text += "🔂";
        }
        if(this.loop.list){
            text += "🔁";
        }
        if(!this.loop.song && !this.loop.list){
            text += "The queue is not looped";
        }
        let embed = new MessageEmbed()
        .setTitle("Loop Mode")
        .setColor(666)
        .setDescription(text)
        .setFooter(`Requested by ${message.member.displayName}`)
        .setTimestamp(new Date());
        return embed;
    }
    /**
     * Returns an embed with information about a song
     * @param {Number} position position of the song in list
     */
    songInfo(position){
        if(position > this.list.size-1){
            position = this.list.size-1;
        }
        if(this.list.get(0) === null){
            return new MessageEmbed().setColor(666).setTimestamp(new Date()).setDescription("There are not any songs in the list. You need add some first!");
        }
        var seconds = 0;
        if (this.voiceConnection && this.voiceConnection.dispatcher){
            seconds += this.list.get(0).length-Math.floor((this.voiceConnection.dispatcher.time/1000));
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
        .addField("queued by", this.guild.member(this.list.get(position).queuedBy).user.toString(), true)
        .addField("queued at", this.list.get(position).queuedAt, true);
        if(position === 0){
            embed.addField("ETA:", "Now playing!");
        }else{
            embed.addField("ETA:", newDate+"\n"+moment.duration(seconds, "seconds").format());
        }
        embed.addField("Thumbnail", this.list.get(position).thumbnailURL);
        return embed;
    }
    get(position){
        if(position>this.list.size) position = this.list.size-1;
        return this.list.get(position) || null;
    }
    isEmpty(){
        return this.list.size === 0;
    }
}
module.exports = Queue;