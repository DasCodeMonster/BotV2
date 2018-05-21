const {TextChannel, Guild, Message, MessageEmbed, MessageReaction, ReactionCollector, GuildMember, User} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const VoiceClient = require("./VoiceClient");
const Queue = require("./Queue");
const Player = require("./Player");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
function customTemplate(){
    if(this.duration.asSeconds() >= 86400){
        return "d [days] h:m:ss";
    }
    if(this.duration.asSeconds() >= 3600){
        return "h:m:ss";
    }
    if(this.duration.asSeconds() < 3600){
        return "m:ss";
    }
}

class QueueMessage extends EventEmitter {
    /**
     * 
     * @param {VoiceClient} client 
     * @param {Guild} guild 
     * @param {TextChannel} textChannel
     * @param {Queue} queue 
     */
    constructor(client, guild, queue){
        super();
        this.client = client;
        this.guild = guild;
        this.queue = queue;
        /**
         * @type {TextChannel}
         */
        this.textChannel;
        /**
         * @type {Message}
         */
        this.message;
        this.page = 1;
        /**
         * @type {GuildMember}
         */
        this.requestedBy;
        /**
         * @type {GuildMember}
         */
        this.lastEditedFrom = null;
        this.created = false;
        this._resetTime = false;
        /**
         * @type {Array}
         */
        this.reactions = [];
    }
    makeEmbed(){
        try{
            let footer;
            if(this.lastEditedFrom != null){
                footer = {
                    text: `Edited by ${this.lastEditedFrom}`,
                    icon: this.lastEditedFrom.user.displayAvatarURL()
                };
            }else{
                footer = {
                    text: `Requested by ${this.requestedBy.displayName}`,
                    icon: this.requestedBy.user.displayAvatarURL()
                };
            }
            let loopmode;
            if(this.queue.loop.song && this.queue.loop.list){
                loopmode = "🔂🔁";
            }else if(this.queue.loop.song){
                loopmode = "🔂";
            }else if(this.queue.loop.list){
                loopmode = "🔁";
            }else{
                loopmode = null;
            }
            if(this.page > this.queue.queueText.size) this.page = this.queue.queueText.size;
            if(this.queue.queueText.size === 0 && this.queue.list.size === 0){
                let empty = new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(footer.text, footer.icon);
                if(loopmode !== null){
                    empty.addField("Loop mode:", loopmode, true);
                }
                return empty;
            }
            let song = this.queue.get(0);
            let songlengthField;
            if(this.guild.voiceConnection && this.guild.voiceConnection.dispatcher && !this._resetTime){
                songlengthField = `${moment.duration(this.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format(customTemplate, {trim: false})}/${moment.duration(song.length, "seconds").format(customTemplate, {trim: false})}`;
            }else{
                songlengthField = `0:00/${moment.duration(song.length, "seconds").format(customTemplate, {trim: false})}`;
                this._resetTime = false;
            }
            let embed = new MessageEmbed()
                .setTitle("Queue")
                .setColor(666)
                .addField("Now Playing:", song.title, false)
                .addField("Channel:", song.author, true)
                .addField("Songlength:", songlengthField, true)
                .addField("Queued by:", this.guild.member(song.queuedBy).user.toString(), true);
            if(this.queue.queueText.get(this.page)){
                embed.addField("Queue (Page: "+this.page+")", this.queue.queueText.get(this.page), false)
                    .addField("Total pages:", this.queue.queueText.size, true)
                    .addField("Total songs:", this.queue.list.size-1, true)
                    .addField("Total length:", moment.duration(this.queue.length, "seconds").format(customTemplate, {trim: false}));
            }
            embed.setFooter(footer.text, footer.icon);
            if(loopmode !== null){
                embed.addField("Loop mode:", loopmode, true);
            }
            embed.setTimestamp(new Date());
            return embed;
        }catch(e){
            console.log(e);
        }
    }
    async react(){
        try {
            if(!this.created || !this.message) throw new Error("Use #Create() first!");
            let reactions = ["🔁","🔂"];
            if(this.queue.list.size > 0 && this.guild.voiceConnection) {
                reactions.push("ℹ");
                reactions.push("⏹");
            }
            if(this.queue.list.size > 1 && this.guild.voiceConnection) {
                reactions.push("⏭");
            }
            if(this.queue.list.size > 2) {
                reactions.push("🔀");
            }
            if(this.queue.queueText.size > 1) {
                if(this.page === this.queue.queueText.size){
                    reactions.push("◀");
                }
                else if(this.page === 1){
                    reactions.push("▶");
                }else{
                    reactions.push("◀");
                    reactions.push("▶");
                }
            }
            if(ArrayEqual(reactions, this.reactions)){
                return;
            }
            this.reactions = reactions;
            await this.message.reactions.removeAll();
            await asyncForEach(reactions, async name=>{
                await this.message.react(name);
            });
        } catch (error) {
            console.log(error);
        }
    }
    async update(page=this.page, resetTime=false){
        try{
            if(!this.created || !this.message) throw new Error("Use #Create() first!");
            this.page = page;
            this._resetTime = resetTime;
            this.react();
            let embed = this.makeEmbed();
            await this.message.edit(embed);
        }catch(e){
            console.log(e);
        }
    }
    /**
     * 
     * @param {Message} message 
     */
    async create(message, page=1){
        try{
            // if(this.created) throw new Error("Can only use this once!");
            if(!(message.channel instanceof TextChannel)) throw new Error("Must be TextChannel!");
            if(this.Collector){
                await this._stop("New handler created");
            }
            this.requestedBy = message.member;
            this.textChannel = message.channel;
            this.page = page;
            this.reactions = [];
            this.message = await this.textChannel.send(this.makeEmbed());
            this.react();
            this.created = true;
            this._handle();
        }catch(e){
            console.log(e);
        }
    }
    _handle(){
        try {
            if(!this.created) throw new Error("Use #Create() first!");
            this.Collector = new ReactionCollector(this.message,
                /**
                 * @param {MessageReaction} reaction
                 * @param {User} user
                 * @param {Collection} collection
                 */
                (reaction, user, collection)=>{
                    if(user.id === this.client.user.id) return false;
                    reaction.users.remove(user);
                    if(!this.reactions.includes(reaction.emoji.name)) return false;
                    return true;
                });
            this.Collector.on("collect", (reaction, user)=>{
                this.emit(reaction.emoji.name, user);
            });
            this.Collector.on("error", e=>{
                console.log(e);
            });
            this.Collector.on("end", (_, reason)=>{
                console.log(reason);
            });
        } catch (error) {
            console.log(error);
        }
    }
    /**
     * 
     * @param {string} reason 
     */
    async _stop(reason){
        await this.message.reactions.removeAll();
        this.Collector.stop(reason);
    }
    _update(){

    }
}
module.exports = QueueMessage;

/**
 * 
 * @param {Array} arr1 
 * @param {Array} arr2 
 */
function ArrayEqual(arr1, arr2) {
    let length = arr1.length;
    if (length !== arr2.length) return false;
    for (var i = 0; i < length; i++)
        if (arr1[i] !== arr2[i])
            return false;
    return true;
}

/**
 * 
 * @param {Array} array 
 * @param {function(*, Number, Array)} callback 
 */
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}