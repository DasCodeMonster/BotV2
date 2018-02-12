const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require("googleapis");
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const {Message, RichEmbed} = require("discord.js");
const getYT = require("./ytsong");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");

class Search extends commando.Command {
    constructor(client) {
        super(client,{
            name: "search",
            aliases: ["s"],
            group: "music",
            memberName: "search",
            description: "Search for a Song on YouTube!",
            guildOnly: true,
            args: [{
                key: "query",
                label: "query",
                prompt: "Tell me for what I should search!",
                type: "string"
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        /**
         * @type {QueueConfig}
         */
        var queueConfig = await this.client.provider.get(message.guild, "queueConfig", new QueueConfig())
        var queue = new Queue(queueConfig);
        if (message.guild.voiceConnection) {
            this.addSingle(message, args, queue);
        }
        else {
            if (message.member.voiceChannel) {
                    message.member.voiceChannel.join();
                    this.addSingle(message, args, queue);
            }
            else {
                message.reply("you need to join a voicechannel first");
            }
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {Queue} queue 
     */
    async addSingle(message, args, queue){
        var songs = await getYT.search(message, args.query);
        var embed = new RichEmbed({
            title: "Search result:"
        }).setTimestamp(new Date()).setDescription("Type the number of the song you want to play **NOW** or copy the link, `cancel` the command, and add it to the queue manually")
        .setColor(666);
        songs.forEach((song, index)=>{
            embed.addField(`${index+1} ${song.title}`, `Titel: [${song.title}](https://www.youtube.com/watch?v=${song.ID})\nChannel: [${song.author}](https://www.youtube.com/channel/${song.channelID})\n`);
        });
        var commandmsg = await message.channel.send({embed: embed});
        var responses = await message.channel.awaitMessages(replymsg=>{
            if (replymsg.author.id === message.author.id && replymsg.content.toLowerCase().trim() === "cancel") {
                console.log("cancel");
                return true;
            }
            if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5){
                return true;
            }
            else return false;
        }, {maxMatches:1, time:30000, errors: ["time"]});
        if(responses.first().content.toLowerCase() === 'cancel') {
            commandmsg.delete();
            return null;
        }
        commandmsg.delete();
        // queue.addSingle(message, songs[Number.parseInt(responses.first().content)]);
        await queue.playNow(songs[Number.parseInt(responses.first().content)-1], message, this.client.provider);
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        else {
            return true;
        }
    }
}
/**
 * @param {*} command
 * @param {Message} message
 * @returns {boolean}
 */
function role(message, command) {
    var ret;
    message.member.roles.array().some((role, index, array) => {
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = Search;