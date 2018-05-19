const commando = require("discord.js-commando");
const {Message, Collection, MessageEmbed, Util, MessageCollector} = require("discord.js");
const LyricsAPI = require("../../lyricsAPI");
const Lyrics = require("../../lyrics");
const util = require("util");
const colors = require("colors");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class LyricsCommand extends commando.Command {
    constructor(client){
        super(client, {
            name: "lyrics",
            aliases: ["l"],
            group: "music",
            memberName: "lyrics",
            description: "Displays the lyrics of the currently played song",
            guildOnly: true,
            args: [{key: "q",
                label: "query",
                prompt: "what do you want to search for?",
                type: "string",
                default: 0
            }],
            argsSingleQuotes: true
        });
        /**
         * @type {LyricsAPI}
         */
        this.LyricsAPI = client.LyricsAPI;
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
        if(this.client.loggers.has(message.guild.id)){
            /**
             * @type {Logger}
             */
            var logger = this.client.loggers.get(message.guild.id);
        }else{
            var logger = new Logger(message.guild.id);
            this.client.loggers.set(message.guild.id, logger);
        }
        logger.log(message.author.username+"#"+message.author.discriminator, "("+message.author.id+")", "used", this.name, "command in channel:", message.channel.name, "("+message.channel.id+")\nArguments:", util.inspect(args));
        if(args.q === 0){
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
            /**
             * @type {Lyrics[]}
             */
            var lyrics = await this.client.LyricsAPI.searchYTID(queue.nowPlaying.ID);
        }
        else{
            /** 
             * @type {Lyrics[]}
             */
            var lyrics = this.client.LyricsAPI.searchTitle(args.q);
        }
        if(lyrics.length !== 0){
            var embed = new MessageEmbed({
                title: "Search result:"
            }).setTimestamp(new Date()).setDescription("Type the number of the lyrics you want to display")
            .setColor(666);
            lyrics.some((lyric, index)=>{
                embed.addField(`${index+1} ${lyric.title}`, `Titel: ${lyric.title}\nAuthor: ${lyric.author}`);
                if(index === 4) return true;
                return false;
            });
            /**
             * @type {Message}
             */
            var commandmsg = await message.channel.send({embed: embed});
            var collector = new MessageCollector(message.channel, replymsg=>{
                if (replymsg.author.id === message.author.id && replymsg.content.toLowerCase().trim() === "cancel") {
                    return true;
                }
                if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5 && Number.parseInt(replymsg.content) < lyrics.length+1){
                    return true;
                }
                else return false;
            }, {time: 30000, maxMatches: 1});
            collector.on("collect", async (msg, collector)=>{
                if(msg.content === "cancel"){
                    collector.emit("cancel", msg, collector);
                    return;
                }
                var num = Number.parseInt(msg.content);
                var split = Util.splitMessage(lyrics[num-1].lyrics, {maxLength: 2047, char: "\n"});
                if (util.isArray(split)){
                    split.forEach((text, index, array)=>{
                        let embed = new MessageEmbed().setColor(666).setTimestamp(new Date()).setTitle(`Lyrics: ${lyrics[num-1].title}`).setDescription(text).setFooter(`Requested by ${message.author.username} || Page ${index+1} of ${split.length}`, message.author.avatarURL);
                        if(lyrics[num-1].links.length !== 0){
                            embed.setURL(`https://www.youtube.com/watch?v=${lyrics[num-1].links[0]}`);
                        }
                        message.channel.send({embed: embed});
                    });
                    console.log(lyrics[num-1].id);
                }
                else {
                    let embed = new MessageEmbed().setColor(666).setTimestamp(new Date()).setTitle(`Lyrics: ${lyrics[num-1].title}`).setDescription(lyrics[num-1].lyrics).setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
                    if(lyrics[num-1].links.length !== 0){
                        embed.setURL(`https://www.youtube.com/watch?v=${lyrics[num-1].links[0]}`);
                    }
                    await message.channel.send({embed: embed});
                    console.log(lyrics[num-1].id);
                }
            });
            collector.once("end", async (collected, reason)=>{
                commandmsg.delete();
                console.debug("%s".debug,reason);
            });
            collector.on("cancel", async (msg, collector)=>{
                await msg.reply("canceled command");
            });
        }
        else{
            message.reply("I did not found any lyrics matching your query :frowning:");
        }
    }
    hasPermission(){
        return true;
    }
}
module.exports = LyricsCommand;