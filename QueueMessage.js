const {TextChannel, Guild, Message, MessageEmbed, MessageReaction, ReactionCollector, GuildMember} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const VoiceClient = require("./VoiceClient");
const Player = require("./Player");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");

class QueueMessage extends EventEmitter {
    /**
     * 
     * @param {VoiceClient} client 
     * @param {Guild} guild 
     * @param {Player} player
     */
    constructor(client, guild, text){
        super();
        this.client = client;
        this.guild = guild;
        /**
         * @type {TextChannel}
         */
        this.textChannel;
        /**
         * @type {Message}
         */
        this.message;
        this.text = text; // add function
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
        this.player = null;
    }
    makeEmbed(){
        this.player = this.client.VoiceModules.get(this.guild.id).player;
        try{
            if(this.page > this.text.size) this.page = this.text.size;
            if(this.text.size === 0){
                return new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL);
            }
            if(this.page <= 0) return;
            let song = this.player.queue.get(0);
            let songlengthField;
            if(this.guild.voiceConnection && this.guild.voiceConnection.dispatcher){
                songlengthField = `${moment.duration(this.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format()}/${moment.duration(song.length, "seconds").format()}`;
            }else{
                songlengthField = `0:00/${moment.duration(song.length, "seconds").format()}`;
            }
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
            if(this.player.queue.loop.song && this.player.queue.loop.list){
                loopmode = "🔂🔁";
            }else if(this.player.queue.loop.song){
                loopmode = "🔂";
            }else if(this.player.queue.loop.list){
                loopmode = "🔁";
            }else{
                loopmode = null;
            }
            console.log(this.page);
            let embed = new MessageEmbed()
            .setTitle("Queue")
            .setColor(666)
            .addField("Now Playing:", song.title, false)
            .addField("Channel:", song.author, true)
            .addField("Songlength:", songlengthField, true)
            .addField("Queued by:", this.guild.member(song.queuedBy).user.toString(), true);
            if(this.text.get(this.page)){
                embed.addField("Queue (Page: "+this.page, this.text.get(this.page), false);
            }
            embed.addField("Total pages:", this.text.size, true)
            .addField("Total songs:", this.player.queue.list.size, true)
            .addField("Total length:", moment.duration(this.player.queue.length, "seconds").format())
            .setFooter(footer.text, footer.icon)
            if(loopmode !== null){
                embed.addField("Loop mode:", loopmode, true);
            }
            embed.setTimestamp(new Date());
            return embed
        }catch(e){
            console.log(e);
        }
    }
    /**
     * 
     * @param {GuildMember} member
     */
    async update(page=1, member=null){
        if(!this.created) throw new Error("Use #Create() first!");
        this.page = page;
        if(message !== null){
            this.lastEditedFrom = message.member;
        }
        let embed = this.makeEmbed();
        await this.message.edit(embed);
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
            console.log(this.textChannel);
            this.message = await this.textChannel.send(this.makeEmbed());
        }catch(e){
            console.log(e);
        }
    }

    _update(){
        
    }
}
module.exports = QueueMessage;