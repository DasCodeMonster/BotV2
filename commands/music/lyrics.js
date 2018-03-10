const commando = require("discord.js-commando");
const {Message, Collection, RichEmbed, Util} = require("discord.js");
const LyricsAPI = require("../../lyricsAPI");
const Lyrics = require("../../lyrics");
const util = require("util");
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
                type: "string"
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
        /** 
         * @type {Lyrics[]}
        */
        var lyrics = this.client.LyricsAPI.searchTitle(args.q);
        if(lyrics.length !== 0){
            var embed = new RichEmbed({
                title: "Search result:"
            }).setTimestamp(new Date()).setDescription("Type the number of the lyrics you want to display")
            .setColor(666);
            lyrics.some((lyric, index)=>{
                embed.addField(`${index+1} ${lyric.title}`, `Titel: ${lyric.title}\nAuthor: ${lyric.author}`);
                if(index === 4) return true;
                return false;
            });
            var commandmsg = await message.channel.send({embed: embed});
            var responses = await message.channel.awaitMessages(replymsg=>{
                if (replymsg.author.id === message.author.id && replymsg.content.toLowerCase().trim() === "cancel") {
                    return true;
                }
                if (replymsg.author.id === message.author.id && Number.parseInt(replymsg.content) && Number.parseInt(replymsg.content)>= 1 && Number.parseInt(replymsg.content)<= 5 && Number.parseInt(replymsg.content) < lyrics.length+1){
                    return true;
                }
                else return false;
            }, {maxMatches:1, time:30000, errors: ["time"]});
            if(responses.size === 0 || responses.first().content.toLowerCase() === 'cancel') {
                commandmsg.delete();
                return null;
            }
            commandmsg.delete();
            var split = Util.splitMessage(lyrics[Number.parseInt(responses.first().content)-1].lyrics, {maxLength: 2047, char: "\n"});
            if (util.isArray(split)){
                split.forEach((text, index, array)=>{
                    let embed = new RichEmbed().setColor(666).setTimestamp(new Date()).setTitle(`Lyrics: ${lyrics[Number.parseInt(responses.first().content)-1].title}`).setDescription(text).setFooter(`Requested by ${message.author.username} || Page ${index+1} of ${split.length}`, message.author.avatarURL);
                    message.channel.send({embed: embed});
                });
                console.log(lyrics[Number.parseInt(responses.first().content)-1].id);
            }
            else {
                let embed = new RichEmbed().setColor(666).setTimestamp(new Date()).setTitle(`Lyrics: ${lyrics[Number.parseInt(responses.first().content)-1].title}`).setDescription(lyrics[Number.parseInt(responses.first().content)-1].lyrics).setFooter(`Requested by ${message.author.username}`, message.author.avatarURL);
                await message.channel.send({embed: embed});
                console.log(lyrics[Number.parseInt(responses.first().content)-1].id);
            }
        }
        else{
            message.reply("I did not found any lyrics matching your query :(");
        }
    }
}
module.exports = LyricsCommand;