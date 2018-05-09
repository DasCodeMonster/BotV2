const {TextChannel, Guild, Message, MessageEmbed, MessageReaction, ReactionCollector, GuildMember} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const VoiceClient = require("./VoiceClient");
const Queue = require("./Queue");
const Player = require("./Player");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");

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
            if(this.page > this.queue.queueText.size) this.page = this.queue.queueText.size;
            if(this.queue.queueText.size === 0 && this.queue.list.size === 0){
                return new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(footer.text, footer.icon);
            }
            let song = this.queue.get(0);
            let songlengthField;
            if(this.guild.voiceConnection && this.guild.voiceConnection.dispatcher){
                songlengthField = `${moment.duration(this.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format()}/${moment.duration(song.length, "seconds").format()}`;
            }else{
                songlengthField = `0:00/${moment.duration(song.length, "seconds").format()}`;
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
                .addField("Total length:", moment.duration(this.queue.length, "seconds").format())
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
    async update(page=1){
        try{
            if(!this.created) throw new Error("Use #Create() first!");
            this.page = page;
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
        }catch(e){
            console.log(e);
        }
    }

    _update(){

    }
}
module.exports = QueueMessage;