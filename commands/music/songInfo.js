const commando = require("discord.js-commando");
const {Message, RichEmbed} = require("discord.js");
const moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format");
const Audioworker = require("../../audioworker");

class SongInfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "songinfo",
            aliases: ["si"],
            group: "music",
            memberName: "songinfo",
            description: "Gives detailed information about the current song or a song in queue.",
            guildOnly: true,
            args: [{
                key: "number",
                label: "songnumber",
                prompt: "",
                type: "integer",
                default: 0,
                infinite: false,
                min: 0
            }],
            argsPromptLimit: 0
        });
        this.queue = [];
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        /** 
         * @type {Audioworker}
         */
        var audioworker = this.client.Audioworker;
        if(!audioworker.queues.has(message.guild.id)){
           var queue = audioworker.add(message.guild);
        }
        else{
            var queue = audioworker.queues.get(message.guild.id);
        }
        if (args.number > queue.queue.length){
            message.reply("Index was to big!");
            return;
        }
        var seconds = 0;
        if (message.guild.voiceConnection && message.guild.voiceConnection.dispatcher){
            seconds += queue.nowPlaying.length-Math.floor((message.guild.voiceConnection.dispatcher.time/1000));
        }
        else seconds += queue.nowPlaying.length;
        queue.queue.some((song, index) => {
            if (index === args.number-1) {
                return true;
            }
            seconds+=song.length;
            return false;
        });
        var date = new Date();
        var newDate = new Date(date.setTime(date.getTime()+seconds*1000)).toString();
        if (!(args.number === 0)){
            var embed = new RichEmbed()
            .setAuthor(queue.queue[args.number-1].title, null, `https://www.youtube.com/watch?v=${queue.queue[args.number-1].ID}`)
            .setColor(666)
            .setThumbnail(queue.queue[args.number-1].thumbnailURL)
            .setTimestamp(new Date())
            .setImage(queue.queue[args.number-1].thumbnailURL)
            .addField("Channel", `[${queue.queue[args.number-1].author}](https://www.youtube.com/channel/${queue.queue[args.number-1].channelID})`, true)
            .addField("Length", moment.duration(queue.queue[args.number-1].length, "seconds").format(), true)
            .addField("Description", queue.queue[args.number-1].description.length > 1024 ? queue.queue[args.number-1].description.substring(0,1009) + "\n...<too long>" : queue.queue[args.number-1].description, true)
            .addField("Queued by", message.guild.member(queue.queue[args.number-1].queuedBy).user.toString(), true)
            .addField("Queued at", queue.queue[args.number-1].queuedAt, true)
            .addField("ETA", newDate).addField("Thumbnail", queue.queue[args.number-1].thumbnailURL);
        }
        else {
            var embed = new RichEmbed()
            .setAuthor(queue.nowPlaying.title, null, `https://www.youtube.com/watch?v=${queue.nowPlaying.ID}`)
            .setColor(666)
            .setThumbnail(queue.nowPlaying.thumbnailURL)
            .setTimestamp(new Date())
            .setImage(queue.nowPlaying.thumbnailURL)
            .addField("Channel", `[${queue.nowPlaying.author}](https://www.youtube.com/channel/${queue.nowPlaying.channelID})`, true)
            .addField("Length", moment.duration(queue.nowPlaying.length, "seconds").format(), true)
            .addField("Description", queue.nowPlaying.description.length > 1024 ? queue.nowPlaying.description.substring(0,1009) + "\n...<too long>" : queue.nowPlaying.description, true)
            .addField("Queued by", message.guild.member(queue.nowPlaying.queuedBy).user.toString(), true)
            .addField("Queued at", queue.nowPlaying.queuedAt, true)
            .addField("ETA", "Now playing").addField("Thumbnail", queue.nowPlaying.thumbnailURL);
        }
        message.channel.send({embed: embed});
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
module.exports = SongInfo;