const Playlist = require("./Playlist");
const {Collection, Util, MessageEmbed, VoiceConnection, Guild} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Song = require("./Song");
const moment = require("moment");
const util = require("util");

class Queue extends Playlist {
    /**
     * 
     * @param {CommandoClient} client
     * @param {Guild} guild
     * @param {VoiceConnection} voiceConnection 
     */
    constructor(client, guild, voiceConnection){
        super();
        this.client = client;
        this.guild = guild;
        this._queueMessage = new Collection();
        this.length = 0;
        this.voiceConnection = voiceConnection || null;
    }
    /**
     * Return one or multiple Strings representing the queue.
     * THIS IS NOT A STRING TO SAVE THIS IN A DATABASE AND CONVERT BACK TO JSON!
     */
    toString(){
        if (this.list.size === 1) {
            return null;
        }
        else {
            var firstLine = "```";
            var messageBuilder = "";
            this.list.forEach((song, index) => {
                if(index===0)return;
                messageBuilder += (index)+" Title: "+song.title + " | Channel: "+ song.author + "\n";
            });
            firstLine += messageBuilder;
            firstLine += "```";
            var built = Util.splitMessage(firstLine, {maxLength: 1000, char: "\n", prepend: "```", append: "```"});
            return built;
        }
    }
    _update(){
        super._update();
        let listStr = this.toString();
        if(listStr){
            if(util.isArray(listStr)){
                listStr.forEach((str, index, arr)=>{
                    this._queueMessage.set(index+1, str);
                });
            }else{
                this._queueMessage.set(1, str);
            }
        }
        if(this.voiceConnection){
            this.voiceConnection.on("disconnect", reason=>{
                this.voiceConnection = null;
            });
            this.length = super.length-(super.list.get(0).length-this.voiceConnection.dispatcher.streamTime);
        }else {
            this.length = super.length-super.list.get(0).length;
        }
        this.client.provider.set(this.guild.id, "queue", this.list.array());
    }
    add(songs, position){
        super.add(songs, position)
    }
    next(){
        return super.next();
        this._update();
    }
    skip(){
        return super.next();
        this._update();
    }
    remove(){
        return super.remove();
        this._update();
    }
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
        this._update();
        // this.emit(this.events.shuffle, before, after);
    }
    /**
     * Returns an embed representing the current queue
     * @param {Number} page
     * @param {Message} message 
     */
    getQueueEmbed(page=1, message=null){
        var reactions = [];
        if (page >= this._queueMessage.size) page = this._queueMessage.size-1;
        if (this._queueMessage.size === 0 && this.queue.get(0) === null){
            return {
                embed: new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL),
                reactions: reactions
            }
        }
        else if((page<this._queueMessage.size) || (this._queueMessage.size === 0 && this.queue.get(0) !== null)){
            reactions.push("🔁");
            reactions.push("🔂");
            reactions.push("ℹ");
            if (this.queue.get(0) !== null){
                var embed = new MessageEmbed().setTitle("Queue").setColor(666).addField("Now Playing:", this.queue.get(0).title, false).addField("Channel:", this.queue.get(0).author, true);
                if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher) {
                    embed.addField("Songlength:", `${moment.duration(message.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format(moment.defaultFormat)}/${moment.duration(this.queue.get(0).length, "seconds").format()}`, true).setTimestamp(new Date());
                }else{
                    embed.addField("Songlength:", `0:00/${moment.duration(this.queue.get(0).length, "seconds").format()}`, true);
                }
                embed.addField("Queued by:", this.client.guilds.get(this.guildID).member(this.queue.get(0).queuedBy).user.toString(), true);
            }
            if(this._queueMessage.size !== 0){
                this.updateLength();
                embed.addField(`Queue (Page: ${page+1})`, this._queueMessage.get(page), false)
                .addField("Total pages:", this._queueMessage.size, true)
                .addField("Total songs in queue:", this.queue.size-1, true)
                .addField("Total queue length:", moment.duration(this.length, "seconds").format() , true);
                if(this.queue.size > 2) reactions.push("🔀");
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
}
module.exports = Queue;