const {Collection, Util, MessageEmbed} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Song = require("./Song");
const util = require("util");

class Playlist extends EventEmitter {
    constructor(){
        super();
        /**
         * @type {Collection<Number,Song>}
         */
        this.list = new Collection();
        this.list.set(0, null);
        this.loop = {
            song: false,
            list: false
        }
        this._listMessage = new Collection();
        this.length = 0;
    }
    _update(){
        let listStr = this.toString();
        if(util.isArray(listStr)){
            listStr.forEach((str, index, arr)=>{
                this._listMessage.set(index+1, str);
            });
        }else{
            this._listMessage.set(1, listStr);
        }
        let length = 0;
        this.list.forEach(song=>{
            length += song.length;
        });
        this.length = length;
    }
    toString(){
        if(this.list.size === 0){
            return "The Playlist is empty"
        }
        else {
            var firstLine = "```";
            var messageBuilder = "";
            this.list.forEach((song, index) => {
                messageBuilder += (index+1)+" Title: "+song.title + " | Channel: "+ song.author + "\n";
            });
            firstLine += messageBuilder;
            firstLine += "```";
            var built = Util.splitMessage(firstLine, {maxLength: 1000, char: "\n", prepend: "```", append: "```"});
            return built;
        }
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
        if(!position){
            if (songs instanceof Song){
                console.log(this.list);
                this.list.set(this.list.size, songs);                
            }else if(songs instanceof Array){
                songs.forEach((song, index, array)=>{
                    this.list.set(this.list.size, song);
                });
            }else if(songs instanceof Playlist){
                this.list.concat(songs.list);
            }

            // if(util.isArray(songs)){
            //     songs.forEach((song, index, array)=>{
            //         this.list.set(this.list.size, song);
            //     });
            // }else{
            //     this.list.set(this.list.size, songs);
            // }

        }else{
            var afterpos = this.list.filter((song, key, coll)=>{
                if(key>=position){
                    return true;
                }
            });
            afterpos.forEach((song, key, map)=>{
                this.list.delete(key);
            });

            if (songs instanceof Song){
                this.list.set(this.list.size, songs);                
            }else if(songs instanceof Array){
                songs.forEach((song, index, array)=>{
                    this.list.set(this.list.size, song);
                });
            }else if(songs instanceof Playlist){
                this.list.concat(songs.list);
            }

            // if(util.isArray(songs)){
            //     songs.forEach((song, index, array)=>{
            //         this.list.set(this.list.size, song);
            //     });
            // }else{
            //     this.list.set(this.list.size, songs);
            // }

            afterpos.forEach((song, key, map)=>{
                this.list.set(this.list.size, song);
            });
        }
        if(this.list.get(0) ===null){
            this.skip();
        }
        // this.updatelistMessage();
        this._update();
        this.emit("add");
    }
    next(){
        if(this.loop.song){
            return this.list.get(0);
        }
        var newQ = new Collection();
        this.list.forEach((val, key, map)=>{
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
        this.list = newQ;
        // this.updatelistMessage();
        this.emit("updated");
        this._update();            
        return this.list.get(0);
    }
    skip(){
        if(this.list.size === 1){
            if(!this.loop.list){
                this.list.set(0, null);
            }
            return this.list.get(0);
        }
        var newQ = new Collection();
        this.list.forEach((val, key, map)=>{
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
        this.list = newQ;
        console.log(this.list);
        // this.updatelistMessage();
        this.emit("updated");
        this._update();  
        return this.list.get(0);
    }
    /**
     * Generates a new random order of the songs in the list.
     */
    shuffle(){
        var list = this.list.array();
        var currentIndex = before.length, temporaryValue, randomIndex;
          // While there remain elements to shuffle...
        while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = list[currentIndex];
            list[currentIndex] = list[randomIndex];
            list[randomIndex] = temporaryValue;
        }
        let after = list;
        list.forEach((song, index, arr)=>{
            this.list.set(index+1, song);
        });
        // this.updatelistMessage();
        this.emit("shuffle");  
        this._update();              
        // this.emit(this.events.shuffle, before, after);
    }
    /**
     * Removes a number of songs
     * @param {number} start Where to start deleting songs 
     * @param {number} count How many songs after the start(included) should be deleted
     */
    remove(start=0, count=1){
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
        if(position>this.list.size);
        this.list.get(position);
    }
}
module.exports = Playlist;
