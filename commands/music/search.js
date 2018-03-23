const commando = require("discord.js-commando");
const {Message, RichEmbed, MessageCollector} = require("discord.js");
const getYT = require("../../ytsong");
const Queue = require("../../myQueue");
const Audioworker = require("../../audioworker");

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
         * @type {Audioworker}
         */
        var audioworker = this.client.Audioworker;
        if(!audioworker.queues.has(message.guild.id)){
           var queue = audioworker.add(message.guild);
        }
        else{
            var queue = audioworker.queues.get(message.guild.id);
        }
        var songs = await getYT.search(message, args.query);
        var embed = new RichEmbed({
            title: "Search result:"
        }).setTimestamp(new Date()).setDescription("Type the number of the song you want to play **NOW** or copy the link, `cancel` the command, and add it to the queue manually")
        .setColor(666);
        songs.forEach((song, index)=>{
            embed.addField(`${index+1} ${song.title}`, `Titel: [${song.title}](https://www.youtube.com/watch?v=${song.ID})\nChannel: [${song.author}](https://www.youtube.com/channel/${song.channelID})\n`);
        });
        /**
         * @type {Message}
         */
        var commandmsg = await message.channel.send({embed: embed});
        var collector = new MessageCollector(message.channel, (replymsg)=>{
            if (replymsg.author.id === message.author.id && replymsg.content.toLowerCase().trim() === "cancel") {
                return true;
            }
            if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5){
                return true;
            }
            else return false;
        }, {time: 30000, maxMatches: 1});
        collector.on("collect", async (msg, collector)=>{
            if (msg.content === "cancel"){
                collector.emit("cancel", msg, collector);
                return;
            }
            await queue.tplay(message, songs[Number.parseInt(msg.content)-1]);
        });
        collector.on("end", async (collected, reason)=>{
            await commandmsg.delete();
            console.log(reason);
        });
        collector.on("cancel", async (msg, collector)=>{
            await msg.reply("canceled command");
        });


        // if (await queue.join(message) === null){
        //     message.reply("you need to join a voicechannel first");
        // }
        // else {
        //     this.addSingle(message, args, queue);
        // }
        // if (message.guild.voiceConnection) {
        // }
        // else {
        //     if (message.member.voiceChannel) {
        //         await this.addSingle(message, args, queue);
        //         message.member.voiceChannel.join();
        //     }
        //     else {
        //     }
        // }
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
        /**
         * @type {Message}
         */
        var commandmsg = await message.channel.send({embed: embed});
        var collector = new MessageCollector(message.channel, (replymsg)=>{
            if (replymsg.author.id === message.author.id && replymsg.content.toLowerCase().trim() === "cancel") {
                return true;
            }
            if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5){
                return true;
            }
            else return false;
        }, {time: 30000, maxMatches: 1});
        collector.on("collect", async (msg, collector)=>{
            if (msg.content === "cancel"){
                collector.emit("cancel", msg, collector);
                return;
            }
            await queue.playNow(songs[Number.parseInt(msg.content)-1], message);
        });
        collector.on("end", async (collected, reason)=>{
            await commandmsg.delete();
            console.log(reason);
        });
        collector.on("cancel", async (msg, collector)=>{
            await msg.reply("canceled command");
        });
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
        if(command.role.true.indexOf(role.id) >-1) {
            ret = true;
            return true;
        }
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = Search;