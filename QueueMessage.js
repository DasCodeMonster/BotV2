const {TextChannel, Guild, Message, MessageEmbed, MessageReaction, ReactionCollector} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const VoiceClient = require("./VoiceClient");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");

class QueueMessage {
    /**
     * 
     * @param {VoiceClient} client 
     * @param {Guild} guild 
     * @param {TextChannel} textChannel 
     */
    constructor(client, guild, textChannel, page=1){
        this.client = client;
        this.guild = guild,
        this.textChannel = textChannel;
        /**
         * @type {Message}
         */
        this.message;
        this.player = this.client.VoiceModules.get(guild.id).player;
        this.text = this.player.queue._queueMessage // add function
        /**
         * @type {Number}
         */
        this.page = page;
        this.requestedBy;
        this.lastEditedFrom;
    }
    makeEmbed(){
        if(this.page > this.text.size) this.page = this.text.size;
        if(this.text.size === 0){
            return new MessageEmbed().setTitle("Queue").setDescription("**The queue is empty!**").setTimestamp(new Date()).setColor(666).setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL);
        }
        if(this.page <= 0) return;
        let song = this.player.queue.get(0);
        let playField = `Now Playing: ${song.title}`;
        let channelField = `Channel ${song.author}`;
        let songlengthField;
        if(this.guild.voiceConnection && this.guild.voiceConnection.dispatcher){
            songlengthField = `Songlength: ${moment.duration(this.guild.voiceConnection.dispatcher.streamTime, "milliseconds").format()}/${moment.duration(song.length, "seconds").format()}`;
        }else{
            songlengthField = `Songlength: 0:00/${moment.duration(song.length, "seconds").format()}`;
        }
        let queuedByField = `Queued by: ${this.guild.member(song.queuedBy).user.toString()}`;
        let queueField;


        return


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
    async update(){
        let embed = this.makeEmbed();
        await this.message.edit(embed);
    }
}