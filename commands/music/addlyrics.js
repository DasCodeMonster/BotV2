const {Command, Argument} = require("discord.js-commando");
const {Message, Collection} = require("discord.js");
const LyricsAPI = require("../../lyricsAPI");
const Lyrics = require("../../lyrics");
const YT = require("../../ytsong");
const Logger = require("../../logger");
const util = require("util");

class AddLyrics extends Command {
    constructor(client){
        super(client, {
            name: "addlyrics",
            aliases: ["al"],
            group: "music",
            memberName: "addlyrics",
            description: "add a lyrics",
            args: [{
                key: "author",
                label: "author",
                prompt: "Tell me the name of the song artist",
                type: "string",
                wait: 60
            }, {
                key: "title",
                label: "title",
                prompt: "name of the song",
                type: "string"
            }, {
                key: "links",
                label: "links",
                prompt: "YT links to the song",
                type: "string",
                default: "none"
            }, {
                key: "genre",
                label: "genre",
                prompt: "genry of the song",
                type: "string",
                default: "none"
            }, {
                key: "lyrics",
                label: "lyrics",
                prompt: "songtext of the song",
                type: "string",
                infinite: true
            }],
            argsSingleQuotes: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, Args){
        if(message.guild){
            if(this.client.loggers.has(message.guild.id)){
                /**
                 * @type {Logger}
                 */
                var logger = this.client.loggers.get(message.guild.id);
            }else{
                var logger = new Logger(message.guild.id);
                this.client.loggers.set(message.guild.id, logger);
            }
            logger.log(message.author.username+"#"+message.author.discriminator, "("+message.author.id+")", "used", this.name, "command in channel:", message.channel.name, "("+message.channel.id+")\nArguments:", util.inspect(Args));
        }
        var args = {
            /**
             * @type {String}
             */
            author: Args.author,
            /**
             * @type {String}
             */
            title: Args.title,
            /**
             * @type {String[]}
             */
            lyrics: Args.lyrics,
            /**
             * @type {String}
             */
            genre: Args.genre,
            /**
             * @type {String}
             */
            links: Args.links
        }
        /**
         * @type {String[]}
         */
        var ytlinks = [];
        if (args.links !== "none"){
            args.links.trim().split(",").forEach((link, index, array)=>{
                ytlinks.push(link.trim());
            });
        }
        var ids = [];
        for(var i=0;i<ytlinks.length;i++){
            let song = await YT.Single(ytlinks[i], message);
            ids.push(song.ID); 
        }
        if (args.genre === "none"){
            args.genre = null;
        }
        var songtext = "";
        args.lyrics.forEach((part, index, array)=>{
            songtext += part;
        });
        await this.client.LyricsAPI.add(args.author, args.title, songtext, args.genre, ids);
        await message.reply(":ok:");
    }
}
module.exports = AddLyrics;