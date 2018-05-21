const {MessageEmbed, ReactionCollector, MessageReaction, Message, User, Guild, VoiceConnection} = require("discord.js");
const VoiceClient = require("./VoiceClient");
const Player = require("./Player");
const {EventEmitter} = require("events");
class SearchMessage extends EventEmitter {
    /**
     * 
     * @param {VoiceClient} client 
     * @param {Guild} guild
     * @param {Player} player
     * @param {VoiceConnection} voiceConnection
     */
    constructor(client, guild, player, voiceConnection){
        super();
        this.client = client;
        this.guild = guild;
        this.player = player;
        this.voiceConnection = voiceConnection;
        this.reactions = [];
        /**
         * @type {Message}
         */
        this.message = null;
    }
    /**
     * 
     * @param {Message} message 
     * @param {String} query 
     */
    async create(message, query){
        try {
            let result = await this.client.youtube.search(message, query);
            let embed = new MessageEmbed()
                .setColor(666)
                .setTitle("Search result")
                .setDescription("React with the number of the song you want to play **NOW**. To **ADD** it react with ↩ first. To cancel react with ❌");
            result.forEach((song, index)=>{
                embed.addField(`${index+1} ${song.title}`, `Titel: [${song.title}](https://www.youtube.com/watch?v=${song.ID})\nChannel: [${song.author}](https://www.youtube.com/channel/${song.channelID})\n`);
            });
            this.message = await message.channel.send(embed);
            this._handle(message, result);
            let reactions = [];
            if(result.length >= 1) reactions.push("1⃣");
            if(result.length >= 2) reactions.push("2⃣");
            if(result.length >= 3) reactions.push("3⃣");
            if(result.length >= 4) reactions.push("4⃣");
            if(result.length === 5) reactions.push("5⃣");
            reactions.push("↩");
            reactions.push("❌");
            this.reactions = reactions;
            await asyncForEach(reactions, async (name)=>{
                await this.message.react(name);
            });
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 
     * @param {Message} message 
     */
    _handle(message, result){
        try {
            this.Collector = new ReactionCollector(this.message,
                /**
                * @param {MessageReaction} reaction
                * @param {User} user
                * @param {Collection} collection
                */
                (reaction, user, collection)=>{
                    if(user.id === this.client.user.id) return false;
                    if(!this.reactions.includes(reaction.emoji.name) || user.id !== message.author.id) {
                        reaction.users.remove(user);
                        return false;
                    }
                    return true;
                }, {time: 30000});
            this.Collector.on("collect", (reaction, user)=>{
                if(reaction.emoji.name === "❌"){
                    this.Collector.stop("❌");
                }
                let ends = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣"];
                if(ends.includes(reaction.emoji.name)){
                    this.Collector.stop("User chose song");
                }
            });
            this.Collector.on("end", (collected, reason)=>{
                this.message.delete({reason: reason});
                if(reason === "❌"){
                    message.reply("cancelled the search");
                    return;
                }
                let song;
                if(collected.has("1⃣") && collected.get("1⃣").count > 1) song = result[0];
                if(collected.has("2⃣") && collected.get("2⃣").count > 1) song = result[1];
                if(collected.has("3⃣") && collected.get("3⃣").count > 1) song = result[2];
                if(collected.has("4⃣") && collected.get("4⃣").count > 1) song = result[3];
                if(collected.has("5⃣") && collected.get("5⃣").count > 1) song = result[4];
                if(collected.has("↩") && collected.get("↩").count > 1){
                    this.emit("add", song);
                }else {
                    this.emit("play", message, song);
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
}
module.exports = SearchMessage;

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