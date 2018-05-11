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
        this.reactions = [];
    }
    makeEmbed(){
        try{
            let footer;
            if(this.lastEditedFrom != null){
                footer = {
                    text: `Edited by ${this.lastEditedFrom}`,
                    icon: this.lastEditedFrom.user.displayAvatarURL()
                }
            }else{
                footer = {
                    text: `Requested by ${this.requestedBy.displayName}`,
                    icon: this.requestedBy.user.displayAvatarURL()
                }
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
                embed.addField("Queue (Page: "+this.page, this.queue.queueText.get(this.page), false)
                .addField("Total pages:", this.queue.queueText.size, true)
                .addField("Total songs:", this.queue.list.size-1, true)
                .addField("Total length:", moment.duration(this.queue.length, "seconds").format(customTemplate, {trim: false}));
            }
            embed.setFooter(footer.text, footer.icon)
            if(loopmode !== null){
                embed.addField("Loop mode:", loopmode, true);
            }
            embed.setTimestamp(new Date());
            return embed
        }catch(e){
            console.log(e);
        }
    }
    async react(){
        try {
            if(!this.created) throw new Error("Use #Create() first!");
            let reactions = ["🔁","🔂"];
            // await this.message.react("🔁");
            // await this.message.react("🔂");
            if(this.queue.list.size > 0) {
                // await this.message.react("ℹ");
                reactions.push("ℹ");
            }
            if(this.queue.list.size > 1) {
                // await this.message.react("⏭");
                reactions.push("⏭");
            }
            if(this.queue.list.size > 2) {
                // await this.message.react("🔀");
                reactions.push("🔀");
            }
            if(this.queue.queueText.size > 1) {
                if(this.page !== this.queue.queueText.size && this.page !== 1){
                    // await this.message.react("◀");
                    // await this.message.react("▶");
                    reactions.push(["◀", "▶"]);
                }else if(this.page === this.queue.queueText.size){
                    // await this.message.react("◀");
                    reactions.push("◀");
                }
                else if(this.page === 1){
                    // await this.message.react("▶");
                    reactions.push("▶");
                }
            }
            if(reactions === this.reactions) return;
            await this.message.reactions.removeAll();
            for (var i=0; i<reactions.length; i++){
                await this.message.react(reactions[i]);
            }
            this.reactions = reactions;
        } catch (error) {
            console.log(error);
        }
    }
    async update(page=1, resetTime=false){
        try{
            if(!this.created) throw new Error("Use #Create() first!");
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
            this.created = true;
            this.requestedBy = message.member;
            this.textChannel = message.channel;
            this.page = page;
            this.message = await this.textChannel.send(this.makeEmbed());
            await this.react();
            this._handle();
        }catch(e){
            console.log(e);
        }
    }
    _handle(){
        try {
            if(!this.created) throw new Error("Use #Create() first!");
            const Collector = new ReactionCollector(this.message,
                /**
                 * @param {MessageReaction} reaction
                 * @param {User} user
                 * @param {Collection} collection
                 */
                (reaction, user, collection)=>{
                    if(!reaction.me) return false;
                    reaction.users.remove(user);
            });
        } catch (error) {
            console.log(error);
        }
    }
    _update(){

    }
}
module.exports = QueueMessage;